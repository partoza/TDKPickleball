using Microsoft.AspNetCore.Identity;

namespace TDK.Infrastructure.Identity;

public class ApplicationUser : IdentityUser
{
    public string FirstName { get; set; } = null!;
    public string LastName { get; set; } = null!;
    public bool IsActive { get; set; } = true;
    public bool MustChangePassword { get; set; }
    public string? ProfileImageUrl { get; set; }
    public string? ProfileImagePublicId { get; set; }
}
