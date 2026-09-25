using Microsoft.AspNetCore.Authorization;
using Microsoft.AspNetCore.Mvc;
using TDK.Application.DTOs.Bookings;
using TDK.Application.Interfaces;
using Microsoft.AspNetCore.RateLimiting;
using TDK.Domain.Enums;
using System.Security.Claims;
using System.Text.Json;

namespace TDK.Api.Controllers;

[ApiController]
public class BookingController : ControllerBase
{
    private readonly IBookingService _bookingService;
    private readonly IWebHostEnvironment _environment;

    public BookingController(IBookingService bookingService, IWebHostEnvironment environment)
    {
        _bookingService = bookingService;
        _environment = environment;
    }

    [HttpGet("api/bookings/availability")]
    [EnableRateLimiting("PublicRead")]
    public async Task<IActionResult> GetAvailability([FromQuery] DateOnly date, [FromQuery] int courtId) => Ok(await _bookingService.GetAvailabilityAsync(date, courtId));

    [HttpPost("api/bookings")]
    [EnableRateLimiting("Email")]
    [Authorize(Roles = "Admin,Staff")]
    public async Task<IActionResult> Create(CreateBookingRequest request)
    {
        return Ok(await _bookingService.CreateAsync(request));
    }

    [HttpPost("api/bookings/with-receipt")]
    [EnableRateLimiting("Email")]
    [Authorize(Roles = "Admin,Staff")]
    [RequestSizeLimit(5_500_000)]
    public async Task<IActionResult> CreateWithReceipt([FromForm] CreateBookingWithReceiptForm request, CancellationToken cancellationToken)
    {
        if (string.IsNullOrWhiteSpace(request.CustomerName) || request.CustomerName.Length > 150) return BadRequest(new { success = false, message = "Booked by is required" });
        if (!string.IsNullOrWhiteSpace(request.Email) && (!System.Net.Mail.MailAddress.TryCreate(request.Email, out _) || request.Email.Length > 254)) return BadRequest(new { success = false, message = "Enter a valid email address" });
        if (request.Phone?.Length > 30) return BadRequest(new { success = false, message = "Phone number is too long" });
        if (request.Receipt is null || request.Receipt.Length == 0) return BadRequest(new { success = false, message = "Payment receipt is required" });
        if (request.Receipt.Length > 5 * 1024 * 1024) return BadRequest(new { success = false, message = "Receipt must be 5 MB or smaller" });
        var detected = await DetectReceiptTypeAsync(request.Receipt);
        if (detected is null) return BadRequest(new { success = false, message = "Receipt must be a valid JPG, PNG, or WebP image" });

        var directory = GetReceiptDirectory();
        Directory.CreateDirectory(directory);
        var fileName = $"{Guid.NewGuid():N}{detected.Value.Extension}";
        var fullPath = Path.Combine(directory, fileName);
        await using (var target = System.IO.File.Create(fullPath)) await request.Receipt.CopyToAsync(target);

        var result = await _bookingService.CreateAsync(new(request.CourtId, request.BookingDate, request.StartTime, request.EndTime, request.CustomerName, request.Email, request.Phone, request.Notes, request.AmountPaid, request.RateType, PaddleRentalQuantity: request.PaddleRentalQuantity), sendConfirmation: false);
        if (!result.Success || result.Data is null)
        {
            System.IO.File.Delete(fullPath);
            return BadRequest(result);
        }
        var attached = await _bookingService.AttachReceiptAsync(result.Data.Id, fileName, detected.Value.ContentType);
        if (!attached.Success) { System.IO.File.Delete(fullPath); return StatusCode(500, attached); }
        var receiptBytes = await System.IO.File.ReadAllBytesAsync(fullPath, cancellationToken);
        var emailed = await _bookingService.SendReceiptConfirmationAsync(
            result.Data.Id,
            receiptBytes,
            $"payment-receipt{detected.Value.Extension}",
            detected.Value.ContentType,
            cancellationToken);
        if (!emailed.Success) result.Message = emailed.Message;
        return Ok(result);
    }

    [HttpPost("api/booking-requests/with-receipt")]
    [EnableRateLimiting("Email")]
    [Authorize(Roles = "Customer")]
    [RequestSizeLimit(5_500_000)]
    public async Task<IActionResult> SubmitPublicRequest([FromForm] PublicBookingRequestWithReceiptForm request, CancellationToken cancellationToken)
    {
        var verifiedEmail = User.FindFirstValue(ClaimTypes.Email);
        if (string.IsNullOrWhiteSpace(verifiedEmail) || !System.Net.Mail.MailAddress.TryCreate(verifiedEmail, out _))
            return Unauthorized(new { success = false, message = "A verified customer email is required" });
        if (string.IsNullOrWhiteSpace(request.CustomerName) || request.CustomerName.Trim().Length > 150)
            return BadRequest(new { success = false, message = "Full name is required and must be 150 characters or fewer" });
        if (request.Phone?.Length > 30)
            return BadRequest(new { success = false, message = "Phone number is too long" });
        if (request.Notes?.Length > 2_000)
            return BadRequest(new { success = false, message = "Notes must be 2,000 characters or fewer" });
        if (request.PaddleRentalQuantity is < 0 or > 50)
            return BadRequest(new { success = false, message = "Paddle rental quantity must be between 0 and 50" });
        if (request.Receipt is null || request.Receipt.Length == 0)
            return BadRequest(new { success = false, message = "Payment receipt is required" });
        if (request.Receipt.Length > 5 * 1024 * 1024)
            return BadRequest(new { success = false, message = "Receipt must be 5 MB or smaller" });

        List<PublicBookingRequestBlockDto>? schedules;
        try
        {
            schedules = JsonSerializer.Deserialize<List<PublicBookingRequestBlockDto>>(request.SchedulesJson, new JsonSerializerOptions
            {
                PropertyNameCaseInsensitive = true
            });
        }
        catch (JsonException)
        {
            return BadRequest(new { success = false, message = "Booking schedules are invalid" });
        }
        if (schedules is null || schedules.Count is < 1 or > 20)
            return BadRequest(new { success = false, message = "Select between 1 and 20 booking schedules" });

        var detected = await DetectReceiptTypeAsync(request.Receipt);
        if (detected is null)
            return BadRequest(new { success = false, message = "Receipt must be a valid JPG, PNG, or WebP image" });

        await using var receiptStream = new MemoryStream();
        await request.Receipt.CopyToAsync(receiptStream, cancellationToken);
        var result = await _bookingService.SubmitPublicRequestAsync(
            new(request.CustomerName, verifiedEmail, request.Phone, request.Notes, request.PaddleRentalQuantity, schedules),
            receiptStream.ToArray(),
            $"payment-receipt{detected.Value.Extension}",
            detected.Value.ContentType,
            cancellationToken);

        return result.Success ? Ok(result) : BadRequest(result);
    }

    [HttpPost("api/booking-requests/paymongo")]
    [Authorize(Roles = "Customer,Admin,Staff")]
    [EnableRateLimiting("PublicRead")]
    public async Task<IActionResult> SubmitPayMongoRequest([FromBody] PublicPayMongoBookingRequestForm request, CancellationToken cancellationToken)
    {
        var verifiedEmail = User.FindFirstValue(ClaimTypes.Email);
        if (string.IsNullOrWhiteSpace(verifiedEmail) || !System.Net.Mail.MailAddress.TryCreate(verifiedEmail, out _))
            return Unauthorized(new { success = false, message = "A verified customer email is required" });
        if (string.IsNullOrWhiteSpace(request.CustomerName) || request.CustomerName.Trim().Length > 150)
            return BadRequest(new { success = false, message = "Full name is required and must be 150 characters or fewer" });
        if (request.Phone?.Length > 30)
            return BadRequest(new { success = false, message = "Phone number is too long" });
        if (request.Notes?.Length > 2_000)
            return BadRequest(new { success = false, message = "Notes must be 2,000 characters or fewer" });
        if (request.PaddleRentalQuantity is < 0 or > 50)
            return BadRequest(new { success = false, message = "Paddle rental quantity must be between 0 and 50" });

        List<PublicBookingRequestBlockDto>? schedules;
        try
        {
            schedules = JsonSerializer.Deserialize<List<PublicBookingRequestBlockDto>>(request.SchedulesJson, new JsonSerializerOptions
            {
                PropertyNameCaseInsensitive = true
            });
        }
        catch (JsonException)
        {
            return BadRequest(new { success = false, message = "Booking schedules are invalid" });
        }
        if (schedules is null || schedules.Count is < 1 or > 20)
            return BadRequest(new { success = false, message = "Select between 1 and 20 booking schedules" });

        var result = await _bookingService.SubmitPayMongoRequestAsync(
            new(request.CustomerName, verifiedEmail, request.Phone, request.Notes, request.PaddleRentalQuantity, schedules),
            cancellationToken);

        return result.Success ? Ok(result) : BadRequest(result);
    }

    [HttpPost("api/bookings/verify")]
    [EnableRateLimiting("PublicRead")]
    public async Task<IActionResult> Verify(VerifyBookingRequest request) => Ok(await _bookingService.VerifyAsync(request.BookingReference));

    [HttpGet("api/admin/bookings")]
    [Authorize(Roles = "Admin,Staff")]
    public async Task<IActionResult> GetAll() => Ok(await _bookingService.GetAllAsync());

    [HttpGet("api/admin/revenue")]
    [Authorize(Roles = "Admin")]
    public async Task<IActionResult> GetRevenue([FromQuery] DateOnly fromDate, [FromQuery] DateOnly throughDate)
    {
        var result = await _bookingService.GetRevenueAsync(fromDate, throughDate);
        return result.Success ? Ok(result) : BadRequest(result);
    }

    [HttpGet("api/admin/bookings/{id}")]
    [Authorize(Roles = "Admin,Staff")]
    public async Task<IActionResult> GetById(long id) => Ok(await _bookingService.GetByIdAsync(id));

    [HttpPut("api/admin/bookings/{id}")]
    [Authorize(Roles = "Admin,Staff")]
    public async Task<IActionResult> Update(long id, UpdateBookingRequest request) => Ok(await _bookingService.UpdateAsync(id, request));

    [HttpPost("api/admin/bookings/{id}/reschedule")]
    [Authorize(Roles = "Admin,Staff")]
    public async Task<IActionResult> Reschedule(long id, RescheduleBookingRequest request)
    {
        var result = await _bookingService.RescheduleAsync(id, request);
        return result.Success ? Ok(result) : BadRequest(result);
    }

    [HttpPost("api/admin/bookings/{id}/paddle-rentals")]
    [Authorize(Roles = "Admin,Staff")]
    public async Task<IActionResult> AddPaddleRental(long id, AddPaddleRentalRequest request)
    {
        var result = await _bookingService.AddPaddleRentalAsync(id, request.Quantity);
        return result.Success ? Ok(result) : BadRequest(result);
    }

    [HttpPost("api/admin/bookings/{id}/confirm")]
    [Authorize(Roles = "Admin,Staff")]
    public async Task<IActionResult> Confirm(long id) => Ok(await _bookingService.ConfirmAsync(id));

    [HttpPost("api/admin/bookings/{id}/cancel")]
    [Authorize(Roles = "Admin,Staff")]
    public async Task<IActionResult> Cancel(long id) => Ok(await _bookingService.CancelAsync(id));

    [HttpPost("api/admin/bookings/{id}/complete")]
    [Authorize(Roles = "Admin,Staff")]
    public async Task<IActionResult> Complete(long id) => Ok(await _bookingService.CompleteAsync(id));

    [HttpGet("api/admin/bookings/{id}/receipt")]
    [Authorize(Roles = "Admin,Staff")]
    public async Task<IActionResult> GetReceipt(long id)
    {
        var result = await _bookingService.GetReceiptInfoAsync(id);
        if (!result.Success || result.Data is null) return NotFound(result);
        var fileName = Path.GetFileName(result.Data.FileName);
        var path = Path.Combine(GetReceiptDirectory(), fileName);
        return System.IO.File.Exists(path) ? PhysicalFile(path, result.Data.ContentType) : NotFound();
    }

    [HttpDelete("api/admin/bookings/{id}")]
    [Authorize(Roles = "Admin,Staff")]
    public async Task<IActionResult> Delete(long id)
    {
        var receipt = await _bookingService.GetReceiptInfoAsync(id);
        var result = await _bookingService.DeleteAsync(id);
        if (result.Success && receipt.Success && receipt.Data is not null)
        {
            var path = Path.Combine(GetReceiptDirectory(), Path.GetFileName(receipt.Data.FileName));
            if (System.IO.File.Exists(path)) System.IO.File.Delete(path);
        }
        return Ok(result);
    }

    private string GetReceiptDirectory() => Path.Combine(_environment.ContentRootPath, "App_Data", "receipts");

    private static async Task<(string Extension, string ContentType)?> DetectReceiptTypeAsync(IFormFile file)
    {
        var header = new byte[12];
        await using var stream = file.OpenReadStream();
        var read = await stream.ReadAsync(header.AsMemory(0, header.Length));
        if (read >= 8 && header[0] == 0x89 && header[1] == 0x50 && header[2] == 0x4E && header[3] == 0x47) return (".png", "image/png");
        if (read >= 3 && header[0] == 0xFF && header[1] == 0xD8 && header[2] == 0xFF) return (".jpg", "image/jpeg");
        if (read >= 12 && System.Text.Encoding.ASCII.GetString(header, 0, 4) == "RIFF" && System.Text.Encoding.ASCII.GetString(header, 8, 4) == "WEBP") return (".webp", "image/webp");
        return null;
    }
}

public sealed class CreateBookingWithReceiptForm
{
    public int CourtId { get; set; }
    public DateOnly BookingDate { get; set; }
    public TimeOnly StartTime { get; set; }
    public TimeOnly EndTime { get; set; }
    public string CustomerName { get; set; } = "";
    public string? Email { get; set; }
    public string? Phone { get; set; }
    public string? Notes { get; set; }
    public decimal AmountPaid { get; set; }
    public RateType RateType { get; set; } = RateType.Booking;
    [System.ComponentModel.DataAnnotations.Range(0, 50)]
    public int PaddleRentalQuantity { get; set; }
    public IFormFile? Receipt { get; set; }
}

public sealed class PublicBookingRequestWithReceiptForm
{
    public string CustomerName { get; set; } = "";
    public string? Phone { get; set; }
    public string? Notes { get; set; }
    public int PaddleRentalQuantity { get; set; }
    public string SchedulesJson { get; set; } = "[]";
    public IFormFile? Receipt { get; set; }
}

public sealed class PublicPayMongoBookingRequestForm
{
    public string CustomerName { get; set; } = "";
    public string? Phone { get; set; }
    public string? Notes { get; set; }
    public int PaddleRentalQuantity { get; set; }
    public string SchedulesJson { get; set; } = "[]";
}
