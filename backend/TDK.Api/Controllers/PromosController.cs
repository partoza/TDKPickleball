using Microsoft.AspNetCore.Mvc;
using TDK.Application.DTOs.Promo;
using TDK.Application.Interfaces;
using Microsoft.AspNetCore.Authorization;

namespace TDK.Api.Controllers;

[ApiController]
[Route("api/[controller]")]
[Authorize]
public class PromosController : ControllerBase
{
    private readonly IPromoService _promoService;

    public PromosController(IPromoService promoService)
    {
        _promoService = promoService;
    }

    [HttpGet]
    public async Task<IActionResult> GetAll([FromQuery] bool includeInactive = false)
    {
        var result = await _promoService.GetAllAsync(includeInactive);
        return Ok(result);
    }

    [HttpGet("{id:int}")]
    public async Task<IActionResult> GetById(int id)
    {
        var result = await _promoService.GetByIdAsync(id);
        return result.Success ? Ok(result) : NotFound(result);
    }

    [HttpGet("code/{code}")]
    public async Task<IActionResult> GetByCode(string code)
    {
        var result = await _promoService.GetByCodeAsync(code);
        return result.Success ? Ok(result) : NotFound(result);
    }

    [HttpPost]
    public async Task<IActionResult> Create([FromBody] CreatePromoRequest request)
    {
        var result = await _promoService.CreateAsync(request);
        return result.Success ? CreatedAtAction(nameof(GetById), new { id = result.Data?.Id }, result) : BadRequest(result);
    }

    [HttpPut("{id:int}")]
    public async Task<IActionResult> Update(int id, [FromBody] UpdatePromoRequest request)
    {
        var result = await _promoService.UpdateAsync(id, request);
        return result.Success ? Ok(result) : BadRequest(result);
    }

    [HttpDelete("{id:int}")]
    public async Task<IActionResult> Delete(int id)
    {
        var result = await _promoService.DeleteAsync(id);
        return result.Success ? Ok(result) : BadRequest(result);
    }
}
