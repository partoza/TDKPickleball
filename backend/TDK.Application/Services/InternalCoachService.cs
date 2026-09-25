using TDK.Application.DTOs.Common;
using TDK.Application.DTOs.Auth;
using TDK.Application.DTOs.InternalCoaches;
using TDK.Application.Interfaces;
using TDK.Domain.Entities;
using TDK.Domain.Enums;
using TDK.Domain.Interfaces;
using System.Net.Mail;

namespace TDK.Application.Services;

public class InternalCoachService : IInternalCoachService
{
    private const int MaximumProfilesPerType = 20;
    private static readonly SemaphoreSlim ProfileCreationLock = new(1, 1);
    private readonly IRepository<InternalCoachProfile> _repo;
    private readonly IProfileImageService _profileImages;
    private readonly IEmailService _emailService;

    public InternalCoachService(IRepository<InternalCoachProfile> repo, IProfileImageService profileImages, IEmailService emailService)
    {
        _repo = repo;
        _profileImages = profileImages;
        _emailService = emailService;
    }

    public async Task<ApiResponse<IEnumerable<InternalCoachProfileDto>>> GetAllAsync(InternalCoachType? type = null)
    {
        var profiles = await _repo.GetAllAsync();
        if (type.HasValue)
        {
            profiles = profiles.Where(p => p.Type == type.Value);
        }
        
        var dtos = profiles.OrderBy(p => p.Name).Select(p => new InternalCoachProfileDto(p.Id, p.Name, p.Email, p.Phone, p.Type, p.IsActive, p.ProfilePictureUrl));
        return ApiResponse<IEnumerable<InternalCoachProfileDto>>.Ok(dtos);
    }

    public async Task<ApiResponse<InternalCoachProfileDto>> GetByIdAsync(int id)
    {
        var p = await _repo.GetByIdAsync(id);
        if (p == null) return ApiResponse<InternalCoachProfileDto>.Fail("Internal or coach profile not found");
        return ApiResponse<InternalCoachProfileDto>.Ok(ToDto(p));
    }

    public async Task<ApiResponse<InternalCoachProfileDto>> CreateAsync(CreateInternalCoachProfileRequest request)
    {
        var validationError = Validate(request.Name, request.Email, request.Phone, request.Type);
        if (validationError != null) return ApiResponse<InternalCoachProfileDto>.Fail(validationError);

        await ProfileCreationLock.WaitAsync();
        try
        {
            var typeCount = (await _repo.GetAllAsync()).Count(profile => profile.Type == request.Type);
            if (typeCount >= MaximumProfilesPerType)
                return ApiResponse<InternalCoachProfileDto>.Fail($"The maximum of 20 {(request.Type == InternalCoachType.Internal ? "internal" : "coach")} profiles has been reached");

            var profile = new InternalCoachProfile
            {
                Name = request.Name.Trim(),
                Email = request.Email?.Trim(),
                Phone = request.Phone?.Trim(),
                Type = request.Type,
                IsActive = true,
                CreatedAt = DateTime.UtcNow,
                UpdatedAt = DateTime.UtcNow
            };

            await _repo.AddAsync(profile);
            await _repo.SaveChangesAsync();

            if (!string.IsNullOrWhiteSpace(profile.Email))
            {
                try
                {
                    await _emailService.SendInternalCoachWelcomeAsync(profile.Email, profile.Name, profile.Type.ToString());
                }
                catch
                {
                    _repo.Delete(profile);
                    await _repo.SaveChangesAsync();
                    return ApiResponse<InternalCoachProfileDto>.Fail("The welcome email could not be sent, so the profile was not created");
                }
            }

            return ApiResponse<InternalCoachProfileDto>.Ok(ToDto(profile), string.IsNullOrWhiteSpace(profile.Email) ? "Profile created" : "Profile created and welcome email sent");
        }
        finally
        {
            ProfileCreationLock.Release();
        }
    }

    public async Task<ApiResponse<InternalCoachProfileDto>> UpdateAsync(int id, UpdateInternalCoachProfileRequest request)
    {
        var p = await _repo.GetByIdAsync(id);
        if (p == null) return ApiResponse<InternalCoachProfileDto>.Fail("Internal or coach profile not found");
        var validationError = Validate(request.Name, request.Email, request.Phone, request.Type);
        if (validationError != null) return ApiResponse<InternalCoachProfileDto>.Fail(validationError);

        p.Name = request.Name.Trim();
        p.Email = request.Email?.Trim();
        p.Phone = request.Phone?.Trim();
        p.Type = request.Type;
        p.IsActive = request.IsActive;
        p.UpdatedAt = DateTime.UtcNow;

        _repo.Update(p);
        await _repo.SaveChangesAsync();

        return ApiResponse<InternalCoachProfileDto>.Ok(ToDto(p));
    }

    public async Task<ApiResponse<InternalCoachProfileDto>> UpdateProfileImageAsync(int id, Stream content, string fileName, string contentType, CancellationToken cancellationToken = default)
    {
        var profile = await _repo.GetByIdAsync(id);
        if (profile == null) return ApiResponse<InternalCoachProfileDto>.Fail("Internal or coach profile not found");

        var oldPublicId = GetCloudinaryPublicId(profile.ProfilePictureUrl);
        ProfileImageUploadResult uploaded;
        try
        {
            uploaded = await _profileImages.UploadAsync(content, fileName, contentType, cancellationToken);
        }
        catch (OperationCanceledException) when (cancellationToken.IsCancellationRequested)
        {
            throw;
        }
        catch (InvalidOperationException ex)
        {
            return ApiResponse<InternalCoachProfileDto>.Fail(ex.Message);
        }
        catch
        {
            return ApiResponse<InternalCoachProfileDto>.Fail("The profile image upload failed. Please try again");
        }

        profile.ProfilePictureUrl = uploaded.Url;
        profile.UpdatedAt = DateTime.UtcNow;
        _repo.Update(profile);
        try
        {
            await _repo.SaveChangesAsync();
        }
        catch
        {
            try { await _profileImages.DeleteAsync(uploaded.PublicId, cancellationToken); } catch { }
            return ApiResponse<InternalCoachProfileDto>.Fail("The profile image could not be saved");
        }

        if (!string.IsNullOrWhiteSpace(oldPublicId) && oldPublicId != uploaded.PublicId)
        {
            try { await _profileImages.DeleteAsync(oldPublicId, cancellationToken); } catch { }
        }

        return ApiResponse<InternalCoachProfileDto>.Ok(ToDto(profile), "Profile image updated");
    }

    public async Task<ApiResponse<bool>> RemoveProfileImageAsync(int id, CancellationToken cancellationToken = default)
    {
        var profile = await _repo.GetByIdAsync(id);
        if (profile == null) return ApiResponse<bool>.Fail("Internal or coach profile not found");

        var publicId = GetCloudinaryPublicId(profile.ProfilePictureUrl);
        profile.ProfilePictureUrl = null;
        profile.UpdatedAt = DateTime.UtcNow;
        _repo.Update(profile);
        await _repo.SaveChangesAsync();

        if (!string.IsNullOrWhiteSpace(publicId))
        {
            try { await _profileImages.DeleteAsync(publicId, cancellationToken); } catch { }
        }

        return ApiResponse<bool>.Ok(true, "Profile image removed");
    }

    public async Task<ApiResponse<bool>> DeleteAsync(int id, CancellationToken cancellationToken = default)
    {
        var p = await _repo.GetByIdAsync(id);
        if (p?.IsActive == true) return ApiResponse<bool>.Fail("Disable the profile before deleting it");
        if (p != null)
        {
            var publicId = GetCloudinaryPublicId(p.ProfilePictureUrl);
            _repo.Delete(p);
            await _repo.SaveChangesAsync();
            if (!string.IsNullOrWhiteSpace(publicId))
            {
                try { await _profileImages.DeleteAsync(publicId, cancellationToken); } catch { }
            }
        }
        return ApiResponse<bool>.Ok(true);
    }

    private static InternalCoachProfileDto ToDto(InternalCoachProfile profile) =>
        new(profile.Id, profile.Name, profile.Email, profile.Phone, profile.Type, profile.IsActive, profile.ProfilePictureUrl);

    private static string? Validate(string name, string? email, string? phone, InternalCoachType type)
    {
        if (string.IsNullOrWhiteSpace(name)) return "Name is required";
        if (name.Trim().Length > 150) return "Name must be 150 characters or fewer";
        if (!Enum.IsDefined(type)) return "Choose Internal or Coach";
        if (!string.IsNullOrWhiteSpace(email) && (email.Trim().Length > 254 || !MailAddress.TryCreate(email.Trim(), out _)))
            return "Enter a valid email address";
        if (phone?.Trim().Length > 30) return "Phone number must be 30 characters or fewer";
        return null;
    }

    private static string? GetCloudinaryPublicId(string? url)
    {
        if (!Uri.TryCreate(url, UriKind.Absolute, out var uri) || !uri.Host.EndsWith("cloudinary.com", StringComparison.OrdinalIgnoreCase))
            return null;

        var segments = uri.AbsolutePath.Split('/', StringSplitOptions.RemoveEmptyEntries);
        var uploadIndex = Array.FindIndex(segments, segment => segment.Equals("upload", StringComparison.OrdinalIgnoreCase));
        if (uploadIndex < 0) return null;

        var versionIndex = Array.FindIndex(segments, uploadIndex + 1, segment =>
            segment.Length > 1 && segment[0] == 'v' && segment[1..].All(char.IsDigit));
        var publicIdStart = versionIndex >= 0 ? versionIndex + 1 : uploadIndex + 1;
        if (publicIdStart >= segments.Length) return null;

        var publicId = string.Join('/', segments[publicIdStart..]);
        var extensionIndex = publicId.LastIndexOf('.');
        return extensionIndex > 0 ? publicId[..extensionIndex] : publicId;
    }
}
