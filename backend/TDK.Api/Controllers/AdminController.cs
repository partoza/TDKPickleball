using Microsoft.AspNetCore.Authorization;
using Microsoft.AspNetCore.Mvc;
using TDK.Application.DTOs.Auth;
using TDK.Application.Interfaces;

namespace TDK.Api.Controllers;

[ApiController]
[Route("api/[controller]")]
[Authorize(Roles = "Admin")]
public class AdminController : ControllerBase
{
    private readonly IAuthService _authService;

    public AdminController(IAuthService authService) => _authService = authService;

    [HttpGet("users")]
    public async Task<IActionResult> GetUsers() => Ok(await _authService.GetUsersAsync());

    [HttpPost("users")]
    public async Task<IActionResult> CreateUser(CreateUserRequest request)
    {
        var result = await _authService.CreateUserAsync(request);
        return result.Success ? Ok(result) : BadRequest(result);
    }
}
