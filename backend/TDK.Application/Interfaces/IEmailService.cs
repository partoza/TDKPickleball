using TDK.Domain.Entities;
using TDK.Application.DTOs.Bookings;

namespace TDK.Application.Interfaces;

public interface IEmailService
{
    bool IsConfigured { get; }
    Task SendBookingConfirmationAsync(Booking booking, string courtName, string? coachEmail = null, string? coachName = null, bool isRescheduled = false, CancellationToken cancellationToken = default);
    Task SendBookingReminderAsync(Booking booking, string courtName, CancellationToken cancellationToken = default);
    Task SendBookingRequestAsync(Booking booking, string courtName, byte[] receiptBytes, string receiptFileName, string receiptContentType, CancellationToken cancellationToken = default);
    Task SendPublicBookingRequestAsync(PublicBookingRequestEmailDto request, byte[] receiptBytes, string receiptFileName, string receiptContentType, CancellationToken cancellationToken = default);
    Task SendTemporaryPasswordAsync(string email, string firstName, string temporaryPassword, CancellationToken cancellationToken = default);
    Task SendInternalCoachWelcomeAsync(string email, string name, string profileType, CancellationToken cancellationToken = default);
    Task SendStorageCleanupSummaryAsync(string deletedByName, string deletedByEmail, DateOnly fromDate, DateOnly throughDate, int scheduleCount, int bookingCount, int receiptCount, CancellationToken cancellationToken = default);
}
