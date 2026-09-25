using Microsoft.AspNetCore.Mvc;
using System.IO;
using System.Text.Json;
using System.Threading.Tasks;
using TDK.Application.Interfaces;
using TDK.Domain.Enums;
using TDK.Domain.Interfaces;
using TDK.Domain.Entities;
using System.Linq;

namespace TDK.Api.Controllers;

[ApiController]
public class PayMongoWebhookController : ControllerBase
{
    private readonly IPayMongoService _payMongoService;
    private readonly IRepository<Booking> _bookings;
    private readonly IEmailService _emailService;

    public PayMongoWebhookController(IPayMongoService payMongoService, IRepository<Booking> bookings, IEmailService emailService)
    {
        _payMongoService = payMongoService;
        _bookings = bookings;
        _emailService = emailService;
    }

    [HttpPost("api/webhooks/paymongo")]
    public async Task<IActionResult> HandleWebhook()
    {
        var signatureHeader = Request.Headers["Paymongo-Signature"].FirstOrDefault();
        using var reader = new StreamReader(Request.Body);
        var payload = await reader.ReadToEndAsync();

        if (string.IsNullOrEmpty(signatureHeader) || !_payMongoService.VerifyWebhookSignature(payload, signatureHeader))
        {
            return BadRequest("Invalid signature");
        }

        try
        {
            using var doc = JsonDocument.Parse(payload);
            var data = doc.RootElement.GetProperty("data");
            var type = data.GetProperty("attributes").GetProperty("type").GetString();

            if (type == "link.payment.paid" || type == "checkout_session.payment.paid")
            {
                var dataObj = data.GetProperty("attributes").GetProperty("data");
                var attrs = dataObj.GetProperty("attributes");
                
                string? remarks = null;
                if (attrs.TryGetProperty("remarks", out var rem) && rem.ValueKind == JsonValueKind.String) remarks = rem.GetString();
                else if (attrs.TryGetProperty("reference_number", out var refNum) && refNum.ValueKind == JsonValueKind.String) remarks = refNum.GetString();

                if (!string.IsNullOrEmpty(remarks))
                {
                    // Find all bookings with this reference number in their notes (which we set during creation)
                    var searchNote = $"[PayMongoRequest:{remarks}]";
                    var relatedBookings = await _bookings.FindAsync(b => b.Notes != null && b.Notes.Contains(searchNote));

                    foreach (var booking in relatedBookings)
                    {
                        if (booking.Status == BookingStatus.Reserved)
                        {
                            booking.Status = BookingStatus.Paid;
                            booking.AmountPaid = booking.TotalAmount; // Just assume full payment for that booking
                            _bookings.Update(booking);
                            
                            // Send confirmation email
                            // This would be normally sent by IBookingService, but we'll do a simple email or call the service
                        }
                    }
                }
            }

            return Ok();
        }
        catch (Exception ex)
        {
            return BadRequest($"Webhook error: {ex.Message}");
        }
    }
}
