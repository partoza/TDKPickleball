using Microsoft.AspNetCore.Authorization;
using Microsoft.AspNetCore.Mvc;
using Microsoft.AspNetCore.RateLimiting;
using System.Security.Claims;
using TDK.Application.DTOs.Customers;
using TDK.Application.Interfaces;

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
        var result = await _customers.CreateAsync(request);
        return result.Success ? CreatedAtAction(nameof(GetById), new { id = result.Data!.Id }, result) : BadRequest(result);
    }

    [HttpPut("api/admin/customers/{id:long}")]
    [Authorize(Roles = "Admin")]
    public async Task<IActionResult> Update(long id, UpdateCustomerRequest request)
    {
        var result = await _customers.UpdateAsync(id, request);
        return result.Success ? Ok(result) : BadRequest(result);
    }

    [HttpPost("api/admin/customers/{id:long}/activate")]
    [Authorize(Roles = "Admin")]
    public async Task<IActionResult> Activate(long id) => Result(await _customers.SetActiveAsync(id, true));

    [HttpPost("api/admin/customers/{id:long}/deactivate")]
    [Authorize(Roles = "Admin")]
    public async Task<IActionResult> Deactivate(long id) => Result(await _customers.SetActiveAsync(id, false));

    [HttpPost("api/admin/customers/{id:long}/nfc/issue")]
    [Authorize(Roles = "Admin")]
    public async Task<IActionResult> Issue(long id) => Result(await _customers.IssueNfcAsync(id, FrontendBaseUrl()));

    [HttpPost("api/admin/customers/{id:long}/nfc/replace")]
    [Authorize(Roles = "Admin")]
    public async Task<IActionResult> Replace(long id) => Result(await _customers.IssueNfcAsync(id, FrontendBaseUrl()));

    [HttpGet("api/customer/card/{username}/{token}")]
    [Authorize(Roles = "Customer")]
    [EnableRateLimiting("NfcValidation")]
    public async Task<IActionResult> Card(string username, string token)
    {
        Response.Headers.CacheControl = "no-store, no-cache, max-age=0";
        Response.Headers.Pragma = "no-cache";
        Response.Headers["Referrer-Policy"] = "no-referrer";
        Response.Headers["X-Robots-Tag"] = "noindex, nofollow, noarchive";
        var email = User.FindFirstValue(ClaimTypes.Email) ?? "";
        var result = await _customers.ValidateCardAsync(username, token, email);
        return result.Success ? Ok(result) : NotFound(result);
    }

    private IActionResult Result<T>(TDK.Application.DTOs.Common.ApiResponse<T> result) => result.Success ? Ok(result) : BadRequest(result);
    private string FrontendBaseUrl() => _configuration["Frontend:BaseUrl"]?.Trim() is { Length: > 0 } value ? value : "http://localhost:5173";
}
