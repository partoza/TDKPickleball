using TDK.Application.DTOs.Common;
using TDK.Application.DTOs.Notifications;

namespace TDK.Application.Interfaces;

public interface INotificationService
{
    Task<ApiResponse<IReadOnlyList<NotificationDto>>> GetActiveAsync();
}
