using FluentValidation;
using Microsoft.Extensions.DependencyInjection;
using TDK.Application.Interfaces;
using TDK.Application.Services;
using TDK.Domain.Interfaces;
using TDK.Infrastructure.Repositories;
using TDK.Infrastructure.Services;
using TDK.Application.Validators;

namespace TDK.Api.Extensions;

public static class ServiceCollectionExtensions
{
    public static IServiceCollection AddApplicationServices(this IServiceCollection services)
    {
        services.AddScoped(typeof(IRepository<>), typeof(GenericRepository<>));
        services.AddScoped<IAuthService, AuthService>();
        services.AddScoped<ICourtService, CourtService>();
        services.AddScoped<IScheduleService, ScheduleService>();
        services.AddScoped<IBookingService, BookingService>();
        services.AddScoped<IRateService, RateService>();
        services.AddScoped<IStaffService, StaffService>();
        services.AddScoped<IPromoService, PromoService>();
        services.AddScoped<IStorageManagementService, StorageManagementService>();
        services.AddScoped<IEmailService, SmtpEmailService>();
        services.AddSingleton<IProfileImageService, CloudinaryProfileImageService>();
        services.AddSingleton<IBusinessClock, ManilaBusinessClock>();
        services.AddHostedService<MaintenanceHostedService>();

        services.AddValidatorsFromAssemblyContaining<LoginRequestValidator>();

        return services;
    }
}
