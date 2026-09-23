using Microsoft.AspNetCore.Authorization;
using Microsoft.AspNetCore.Mvc;
using System.Security.Claims;
using TDK.Application.DTOs.Storage;
using TDK.Application.Interfaces;

namespace TDK.Api.Controllers;

[ApiController]
[Route("api/admin/storage")]
[Authorize(Roles = "Admin")]
public sealed class StorageController : ControllerBase
{
    private readonly IStorageManagementService _storage;
    private readonly IWebHostEnvironment _environment;
    private readonly ILogger<StorageController> _logger;

    public StorageController(IStorageManagementService storage, IWebHostEnvironment environment, ILogger<StorageController> logger)
    {
        _storage = storage;
        _environment = environment;
        _logger = logger;
    }

    [HttpGet("status")]
    public async Task<IActionResult> GetStatus(CancellationToken cancellationToken) =>
        Ok(await _storage.GetStatusAsync(cancellationToken));

    [HttpGet("cleanup-preview")]
    public async Task<IActionResult> GetCleanupPreview([FromQuery] DateOnly fromDate, [FromQuery] DateOnly throughDate, CancellationToken cancellationToken)
    {
        var result = await _storage.GetCleanupPreviewAsync(fromDate, throughDate, cancellationToken);
        return result.Success ? Ok(result) : BadRequest(result);
    }

    [HttpGet("cleanup-history")]
    public async Task<IActionResult> GetCleanupHistory(CancellationToken cancellationToken) =>
        Ok(await _storage.GetCleanupHistoryAsync(cancellationToken));

    [HttpPost("cleanup")]
    public async Task<IActionResult> Cleanup(BookingCleanupRequest request, CancellationToken cancellationToken)
    {
        var result = await _storage.DeleteCompletedBookingsAsync(
            request,
            User.FindFirstValue(ClaimTypes.NameIdentifier) ?? "",
            User.FindFirstValue(ClaimTypes.Name) ?? "",
            User.FindFirstValue(ClaimTypes.Email) ?? "",
            cancellationToken);
        if (!result.Success || result.Data is null) return BadRequest(result);

        var receiptDirectory = Path.Combine(_environment.ContentRootPath, "App_Data", "receipts");
        foreach (var storedName in result.Data.ReceiptFileNames)
        {
            try
            {
                var safeName = Path.GetFileName(storedName);
                if (string.IsNullOrWhiteSpace(safeName)) continue;
                var path = Path.Combine(receiptDirectory, safeName);
                if (System.IO.File.Exists(path)) System.IO.File.Delete(path);
            }
            catch (Exception exception)
            {
                _logger.LogWarning(exception, "Could not remove a receipt file during booking cleanup");
            }
        }

        return Ok(result);
    }
}
