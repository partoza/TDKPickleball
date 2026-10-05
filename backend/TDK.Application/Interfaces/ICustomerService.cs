using TDK.Application.DTOs.Common;
using TDK.Application.DTOs.Customers;

namespace TDK.Application.Interfaces;

public interface ICustomerService
{
    Task<ApiResponse<IEnumerable<CustomerSummaryDto>>> GetAllAsync(string? query, bool includeInactive);
    Task<ApiResponse<IEnumerable<CustomerSummaryDto>>> SearchAsync(string? query);
    Task<ApiResponse<CustomerDetailsDto>> GetByIdAsync(long id);
    Task<ApiResponse<CreateCustomerDto>> CreateAsync(CreateCustomerRequest request, string frontendBaseUrl);
    Task<ApiResponse<CustomerSummaryDto>> UpdateAsync(long id, UpdateCustomerRequest request);
    Task<ApiResponse<CustomerSummaryDto>> SetActiveAsync(long id, bool active);
    Task<ApiResponse<NfcIssueDto>> GetNfcAsync(long id, string frontendBaseUrl);
    Task<ApiResponse<bool>> DeleteAsync(long id);
    Task<ApiResponse<CustomerCardDto>> ValidateCardAsync(string username, string token);
}
