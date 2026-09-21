using TDK.Domain.Entities;

namespace TDK.Application.Interfaces;

public interface IEmailService
{
    Task SendBookingConfirmationAsync(Booking booking, string courtName, CancellationToken cancellationToken = default);
    Task SendBookingReminderAsync(Booking booking, string courtName, CancellationToken cancellationToken = default);
    Task SendTemporaryPasswordAsync(string email, string firstName, string temporaryPassword, CancellationToken cancellationToken = default);
}
