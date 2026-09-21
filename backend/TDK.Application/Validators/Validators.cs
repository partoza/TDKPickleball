using FluentValidation;
using TDK.Application.DTOs.Auth;
using TDK.Application.DTOs.Bookings;
using TDK.Application.DTOs.Schedules;
using TDK.Application.DTOs.Rates;

namespace TDK.Application.Validators;

public class LoginRequestValidator : AbstractValidator<LoginRequest>
{
    public LoginRequestValidator()
    {
        RuleFor(x => x.Email).NotEmpty().EmailAddress();
        RuleFor(x => x.Password).NotEmpty();
    }
}

public class CreateBookingValidator : AbstractValidator<CreateBookingRequest>
{
    public CreateBookingValidator()
    {
        RuleFor(x => x.CustomerName).NotEmpty().MaximumLength(150);
        RuleFor(x => x.Email).EmailAddress().MaximumLength(254).When(x => !string.IsNullOrWhiteSpace(x.Email));
        RuleFor(x => x.Phone).MaximumLength(30);
        RuleFor(x => x.CourtId).GreaterThan(0);
        RuleFor(x => x.BookingDate).GreaterThanOrEqualTo(DateOnly.FromDateTime(DateTime.Today));
        RuleFor(x => x).Must(x => x.EndTime == TimeOnly.MinValue ? x.StartTime != TimeOnly.MinValue : x.StartTime < x.EndTime).WithMessage("End time must be after start time");
        RuleFor(x => x.AmountPaid).GreaterThanOrEqualTo(0);
    }
}

public class UpdateScheduleValidator : AbstractValidator<UpdateScheduleRequest>
{
    public UpdateScheduleValidator()
    {
        RuleFor(x => x.Status).IsInEnum();
        RuleFor(x => x.BookedBy).NotEmpty().MaximumLength(150).When(x => x.Status is TDK.Domain.Enums.ScheduleStatus.Booked or TDK.Domain.Enums.ScheduleStatus.Training);
        RuleFor(x => x.Email).EmailAddress().MaximumLength(254).When(x => !string.IsNullOrWhiteSpace(x.Email));
        RuleFor(x => x.Phone).MaximumLength(30);
        RuleFor(x => x.PaymentStatus).Must(x => x is TDK.Domain.Enums.BookingStatus.Paid or TDK.Domain.Enums.BookingStatus.Reserved);
        RuleFor(x => x.AmountPaid).GreaterThanOrEqualTo(0);
    }
}

public class CreateUserRequestValidator : AbstractValidator<CreateUserRequest>
{
    public CreateUserRequestValidator()
    {
        RuleFor(x => x.Email).NotEmpty().EmailAddress().MaximumLength(254);
        RuleFor(x => x.FirstName).NotEmpty().MaximumLength(80);
        RuleFor(x => x.LastName).NotEmpty().MaximumLength(80);
        RuleFor(x => x.Role).Must(x => x is "Admin" or "Staff").WithMessage("Role must be Admin or Staff");
    }
}

public class ChangePasswordRequestValidator : AbstractValidator<ChangePasswordRequest>
{
    public ChangePasswordRequestValidator()
    {
        RuleFor(x => x.NewPassword).NotEmpty().MinimumLength(8).MaximumLength(128);
        RuleFor(x => x.ConfirmPassword).Equal(x => x.NewPassword).WithMessage("Passwords do not match");
    }
}

public class BulkUpdateValidator : AbstractValidator<BulkUpdateRequest>
{
    public BulkUpdateValidator()
    {
        RuleFor(x => x.CourtId).GreaterThan(0);
        RuleFor(x => x).Must(x => x.EndTime == TimeOnly.MinValue ? x.StartTime != TimeOnly.MinValue : x.StartTime < x.EndTime).WithMessage("End time must be after start time");
        RuleFor(x => x.Status).IsInEnum();
        RuleFor(x => x.BookedBy).NotEmpty().MaximumLength(150).When(x => x.Status is TDK.Domain.Enums.ScheduleStatus.Booked or TDK.Domain.Enums.ScheduleStatus.Training);
        RuleFor(x => x.Email).EmailAddress().MaximumLength(254).When(x => !string.IsNullOrWhiteSpace(x.Email));
        RuleFor(x => x.Phone).MaximumLength(30);
        RuleFor(x => x.PaymentStatus).Must(x => x is TDK.Domain.Enums.BookingStatus.Paid or TDK.Domain.Enums.BookingStatus.Reserved);
        RuleFor(x => x.AmountPaid).GreaterThanOrEqualTo(0);
    }
}

public class UpdateBookingValidator : AbstractValidator<UpdateBookingRequest>
{
    public UpdateBookingValidator()
    {
        RuleFor(x => x.CourtId).GreaterThan(0);
        RuleFor(x => x.CustomerName).NotEmpty().MaximumLength(150);
        RuleFor(x => x.Email).EmailAddress().MaximumLength(254).When(x => !string.IsNullOrWhiteSpace(x.Email));
        RuleFor(x => x).Must(x => x.EndTime == TimeOnly.MinValue ? x.StartTime != TimeOnly.MinValue : x.StartTime < x.EndTime).WithMessage("End time must be after start time");
        RuleFor(x => x.AmountPaid).GreaterThanOrEqualTo(0);
        RuleFor(x => x.Status).IsInEnum();
    }
}

public class CreateRateValidator : AbstractValidator<CreateRateRequest>
{
    public CreateRateValidator()
    {
        RuleFor(x => x.RateType).IsInEnum();
        RuleFor(x => x.PricePerHour).GreaterThan(0);
        RuleFor(x => x).Must(x => x.EndTime == TimeOnly.MinValue ? x.StartTime != TimeOnly.MinValue : x.StartTime < x.EndTime).WithMessage("End time must be after start time");
    }
}

public class UpdateRateValidator : AbstractValidator<UpdateRateRequest>
{
    public UpdateRateValidator()
    {
        RuleFor(x => x.RateType).IsInEnum();
        RuleFor(x => x.PricePerHour).GreaterThan(0);
        RuleFor(x => x).Must(x => x.EndTime == TimeOnly.MinValue ? x.StartTime != TimeOnly.MinValue : x.StartTime < x.EndTime).WithMessage("End time must be after start time");
    }
}
