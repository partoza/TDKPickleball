using Microsoft.AspNetCore.Authorization;
using Microsoft.AspNetCore.Mvc;
using Microsoft.AspNetCore.RateLimiting;
using TDK.Application.DTOs.Customers;
using TDK.Application.Interfaces;
using TDK.Api.Validation;

namespace TDK.Api.Controllers;

[ApiController]
public sealed class CustomersController : ControllerBase
{
    private readonly ICustomerService _customers;
    private readonly IConfiguration _configuration;

    public CustomersController(ICustomerService customers, IConfiguration configuration)
    {
        _customers = customers;
        _configuration = configuration;
    }

    [HttpGet("api/admin/customers")]
    [Authorize(Roles = "Admin")]
    public async Task<IActionResult> GetAll([FromQuery] string? q, [FromQuery] bool includeInactive = false) =>
        Ok(await _customers.GetAllAsync(q, includeInactive));

    [HttpGet("api/admin/customers/search")]
    [Authorize(Roles = "Admin")]
    public async Task<IActionResult> Search([FromQuery] string? q) => Ok(await _customers.SearchAsync(q));

    [HttpGet("api/admin/customers/{id:long}")]
    [Authorize(Roles = "Admin")]
    public async Task<IActionResult> GetById(long id)
    {
        var result = await _customers.GetByIdAsync(id);
        return result.Success ? Ok(result) : NotFound(result);
    }

    [HttpPost("api/admin/customers")]
    [Authorize(Roles = "Admin")]
    public async Task<IActionResult> Create(CreateCustomerRequest request)
    {
        var result = await _customers.CreateAsync(request, FrontendBaseUrl());
        return result.Success ? CreatedAtAction(nameof(GetById), new { id = result.Data!.Customer.Id }, result) : BadRequest(result);
    }

    [HttpPut("api/admin/customers/{id:long}")]
    [Authorize(Roles = "Admin")]
    public async Task<IActionResult> Update(long id, UpdateCustomerRequest request)
    {
        var result = await _customers.UpdateAsync(id, request);
        return result.Success ? Ok(result) : BadRequest(result);
    }

    [HttpPost("api/admin/customers/{id:long}/profile-image")]
    [Authorize(Roles = "Admin")]
    [Consumes("multipart/form-data")]
    [RequestSizeLimit(ProfileImageValidator.MaximumRequestBytes)]
    public async Task<IActionResult> UpdateProfileImage(long id, [FromForm] IFormFile? image, CancellationToken cancellationToken)
    {
        var validation = await ProfileImageValidator.ValidateAsync(image, cancellationToken);
        if (!validation.IsValid) return BadRequest(new { success = false, message = validation.Error });
        await using var content = image!.OpenReadStream();
        var result = await _customers.UpdateProfileImageAsync(id, content, validation.FileName, validation.ContentType, cancellationToken);
        return result.Success ? Ok(result) : BadRequest(result);
    }

    [HttpDelete("api/admin/customers/{id:long}/profile-image")]
    [Authorize(Roles = "Admin")]
    public async Task<IActionResult> RemoveProfileImage(long id, CancellationToken cancellationToken) =>
        Result(await _customers.RemoveProfileImageAsync(id, cancellationToken));

    [HttpPost("api/admin/customers/{id:long}/activate")]
    [Authorize(Roles = "Admin")]
    public async Task<IActionResult> Activate(long id) => Result(await _customers.SetActiveAsync(id, true));

    [HttpPost("api/admin/customers/{id:long}/deactivate")]
    [Authorize(Roles = "Admin")]
    public async Task<IActionResult> Deactivate(long id) => Result(await _customers.SetActiveAsync(id, false));

    [HttpPost("api/admin/customers/{id:long}/renew")]
    [Authorize(Roles = "Admin")]
    public async Task<IActionResult> Renew(long id) => Result(await _customers.RenewAsync(id));

    [HttpGet("api/admin/customers/{id:long}/nfc")]
    [Authorize(Roles = "Admin")]
    public async Task<IActionResult> GetNfc(long id) => Result(await _customers.GetNfcAsync(id, FrontendBaseUrl()));

    [HttpDelete("api/admin/customers/{id:long}")]
    [Authorize(Roles = "Admin")]
    public async Task<IActionResult> Delete(long id) => Result(await _customers.DeleteAsync(id));

    [HttpGet("api/customer/card/{username}/{token}")]
    [AllowAnonymous]
    [EnableRateLimiting("NfcValidation")]
    public async Task<IActionResult> Card(string username, string token)
    {
        Response.Headers.CacheControl = "no-store, no-cache, max-age=0";
        Response.Headers.Pragma = "no-cache";
        Response.Headers["Referrer-Policy"] = "no-referrer";
        Response.Headers["X-Robots-Tag"] = "noindex, nofollow, noarchive";
        var result = await _customers.ValidateCardAsync(username, token);
        return result.Success ? Ok(result) : NotFound(result);
    }

    private IActionResult Result<T>(TDK.Application.DTOs.Common.ApiResponse<T> result) => result.Success ? Ok(result) : BadRequest(result);
    private string FrontendBaseUrl() => _configuration["Frontend:BaseUrl"]?.Trim() is { Length: > 0 } value ? value : "http://localhost:5173";
}
