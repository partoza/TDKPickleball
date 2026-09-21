# The Dirty Kitchen Pickleball Court

## Schedule & Court Management System --- Full Implementation Plan

**Project type:** Pickleball court scheduling, booking, and
administration system\
**Brand:** The Dirty Kitchen Pickleball Court\
**Short name:** TDK\
**Frontend:** React + TypeScript + Vite + shadcn/ui + Tailwind CSS\ like a vercel inspired for the typography card design component
**Backend:** ASP.NET Core Web API + C#\
**Database:** SQL Server\
**ORM:** Entity Framework Core\
**Authentication:** ASP.NET Core Identity + JWT access tokens + secure
refresh-token flow\
**Primary admin route:** `/tdkadmin`

------------------------------------------------------------------------

# 1. Project Overview

The Dirty Kitchen Pickleball Court needs a web-based system to replace
or complement the current spreadsheet-based schedule.

The current schedule contains:

-   Multiple dates
-   Hourly time slots
-   Court availability
-   TRAINING slots
-   BOOKED slots
-   UNAVAILABLE slots
-   FREE PLAY slots
-   Empty/available slots
-   Different rental rates based on time
-   Two courts:
    -   Court 1
    -   Court 2

The new system will provide:

1.  A public schedule page.
2.  A public booking flow.
3.  A protected `/tdkadmin` administration area.
4.  Court management.
5.  Schedule management.
6.  Booking management.
7.  Rental-rate management.
8.  Audit logs.
9.  Authentication and authorization.
10. A database-backed schedule instead of manually maintaining the
    spreadsheet.

The system should be designed so that TDK can add more courts, more
administrators, different rates, and additional booking features later
without redesigning the entire application.

------------------------------------------------------------------------

# 2. Core Business Model

The core scheduling relationship is:

``` text
Court
  ↓
Date
  ↓
Time Slot
  ↓
Schedule Status
  ↓
Booking
```

For example:

``` text
Court 1
September 20, 2026
2:00 PM - 3:00 PM
BOOKED
Booking: TDK-20260920-001
```

Court 2 can independently have:

``` text
Court 2
September 20, 2026
2:00 PM - 3:00 PM
AVAILABLE
```

This means Court 1 and Court 2 must never share the same schedule
record.

------------------------------------------------------------------------

# 3. Brand Identity

The interface should follow the provided TDK branding.

## Brand

**The Dirty Kitchen Pickleball Court**

## Short name

**TDK**

## Visual identity

Primary visual characteristics:

-   Deep maroon / dark red
-   Charcoal / dark gray
-   Neon yellow-green
-   White
-   Bold sports-oriented typography
-   Pickleball visual elements
-   Strong geometric shapes
-   Modern but energetic appearance

## Color roles

Use the colors consistently:

``` text
Primary:
Deep Maroon

Secondary:
Charcoal

Accent:
Neon Yellow-Green

Background:
White / Light Neutral

Text:
Charcoal / White depending on background
```

The neon yellow-green should primarily be an accent color rather than
being used on every element.

------------------------------------------------------------------------

# 4. High-Level Architecture

``` text
                         INTERNET
                             |
                             v
                  +----------------------+
                  |    React Frontend    |
                  |----------------------|
                  | React                |
                  | TypeScript           |
                  | Vite                 |
                  | Tailwind CSS         |
                  | shadcn/ui            |
                  | TanStack Query       |
                  | React Hook Form      |
                  | Zod                  |
                  +----------+-----------+
                             |
                       HTTPS / JSON
                             |
                             v
                  +----------------------+
                  | ASP.NET Core Web API |
                  |----------------------|
                  | Controllers           |
                  | Services             |
                  | DTOs                 |
                  | Validation           |
                  | Authentication       |
                  | Authorization        |
                  | Audit Logging        |
                  +----------+-----------+
                             |
                      EF Core / SQL
                             |
                             v
                  +----------------------+
                  |      SQL Server      |
                  |----------------------|
                  | Admin Users           |
                  | Courts                |
                  | Time Slots            |
                  | Schedules             |
                  | Bookings              |
                  | Rates                 |
                  | Audit Logs            |
                  +----------------------+
```

------------------------------------------------------------------------

# 5. Application Areas

The React application will contain two major areas.

## Public

``` text
/
```

Public users can:

-   View the schedule
-   Select a court
-   View rental rates
-   Check availability
-   Create a booking
-   View booking information where appropriate

## Admin

``` text
/tdkadmin
```

Administrators can:

-   Log in
-   View dashboard
-   Manage Court 1
-   Manage Court 2
-   Add additional courts
-   Edit schedules
-   Perform bulk schedule updates
-   Copy schedules
-   Manage bookings
-   Manage rates
-   View audit logs
-   Manage administrators
-   Configure system settings

------------------------------------------------------------------------

# 6. Recommended Technology Stack

## Frontend

-   React
-   TypeScript
-   Vite
-   Tailwind CSS
-   shadcn/ui
-   TanStack Query
-   React Router
-   React Hook Form
-   Zod
-   date-fns
-   Lucide React

## Backend

-   ASP.NET Core Web API
-   C#
-   .NET
-   Entity Framework Core
-   SQL Server
-   ASP.NET Core Identity
-   JWT authentication
-   FluentValidation
-   Swagger / OpenAPI
-   Serilog

## Optional later

-   Dapper for reporting/optimized read queries
-   Email provider
-   SMS provider
-   Cloud storage
-   Payment gateway

------------------------------------------------------------------------

# 7. Frontend Project Structure

Recommended:

``` text
frontend/
├── public/
│
├── src/
│   ├── app/
│   │   ├── router.tsx
│   │   └── providers.tsx
│   │
│   ├── components/
│   │   ├── ui/
│   │   ├── layout/
│   │   └── shared/
│   │
│   ├── features/
│   │   ├── auth/
│   │   ├── courts/
│   │   ├── schedule/
│   │   ├── bookings/
│   │   ├── rates/
│   │   └── admins/
│   │
│   ├── pages/
│   │   ├── public/
│   │   │   ├── HomePage.tsx
│   │   │   ├── SchedulePage.tsx
│   │   │   └── BookingPage.tsx
│   │   │
│   │   └── admin/
│   │       ├── LoginPage.tsx
│   │       ├── DashboardPage.tsx
│   │       ├── SchedulePage.tsx
│   │       ├── BookingsPage.tsx
│   │       ├── RatesPage.tsx
│   │       ├── CourtsPage.tsx
│   │       ├── AdminsPage.tsx
│   │       └── AuditLogsPage.tsx
│   │
│   ├── services/
│   │   ├── api.ts
│   │   ├── auth.ts
│   │   ├── courts.ts
│   │   ├── schedules.ts
│   │   ├── bookings.ts
│   │   └── rates.ts
│   │
│   ├── hooks/
│   │
│   ├── types/
│   │
│   ├── lib/
│   │   ├── utils.ts
│   │   └── validation.ts
│   │
│   └── main.tsx
│
├── package.json
└── vite.config.ts
```

------------------------------------------------------------------------

# 8. Backend Project Structure

Use a clean separation between API, application logic, domain, and
infrastructure.

``` text
backend/
├── TDK.sln
│
├── TDK.Api/
│   ├── Controllers/
│   │   ├── AuthController.cs
│   │   ├── CourtController.cs
│   │   ├── ScheduleController.cs
│   │   ├── BookingController.cs
│   │   ├── RateController.cs
│   │   ├── AdminController.cs
│   │   └── AuditLogController.cs
│   │
│   ├── Middleware/
│   │   ├── ExceptionMiddleware.cs
│   │   └── RequestLoggingMiddleware.cs
│   │
│   ├── Extensions/
│   ├── Program.cs
│   └── appsettings.json
│
├── TDK.Application/
│   ├── DTOs/
│   │   ├── Auth/
│   │   ├── Courts/
│   │   ├── Schedules/
│   │   ├── Bookings/
│   │   └── Rates/
│   │
│   ├── Interfaces/
│   │   ├── IAuthService.cs
│   │   ├── ICourtService.cs
│   │   ├── IScheduleService.cs
│   │   ├── IBookingService.cs
│   │   └── IRateService.cs
│   │
│   ├── Services/
│   │   ├── AuthService.cs
│   │   ├── CourtService.cs
│   │   ├── ScheduleService.cs
│   │   ├── BookingService.cs
│   │   └── RateService.cs
│   │
│   └── Validators/
│
├── TDK.Domain/
│   ├── Entities/
│   │   ├── Court.cs
│   │   ├── TimeSlot.cs
│   │   ├── Schedule.cs
│   │   ├── Booking.cs
│   │   ├── Rate.cs
│   │   └── AuditLog.cs
│   │
│   ├── Enums/
│   │   ├── ScheduleStatus.cs
│   │   └── BookingStatus.cs
│   │
│   └── Interfaces/
│
└── TDK.Infrastructure/
    ├── Data/
    │   ├── TdkDbContext.cs
    │   ├── Configurations/
    │   └── Migrations/
    │
    ├── Identity/
    │   ├── ApplicationUser.cs
    │   └── IdentitySeeder.cs
    │
    ├── Repositories/
    └── Services/
```

------------------------------------------------------------------------

# 9. Database Design

The initial database should contain:

``` text
AspNetUsers
AspNetRoles
AspNetUserRoles

Courts
TimeSlots
Schedules
Bookings
Rates
AuditLogs
```

Later:

``` text
RefreshTokens
ScheduleTemplates
Notifications
```

------------------------------------------------------------------------

# 10. Courts Table

The system currently has two courts.

``` text
Courts
--------------------------------
Id
Name
DisplayName
IsActive
SortOrder
CreatedAt
UpdatedAt
```

Seed:

``` text
1 | Court 1 | COURT 1 | true | 1
2 | Court 2 | COURT 2 | true | 2
```

The design must support additional courts without code changes.

Example:

``` text
Court 3
Court 4
Court 5
```

------------------------------------------------------------------------

# 11. TimeSlots Table

The schedule uses hourly slots.

``` text
TimeSlots
--------------------------------
Id
StartTime
EndTime
DisplayName
SortOrder
IsActive
```

Seed:

``` text
1  | 07:00 | 08:00 | 7AM-8AM
2  | 08:00 | 09:00 | 8AM-9AM
3  | 09:00 | 10:00 | 9AM-10AM
4  | 10:00 | 11:00 | 10AM-11AM
5  | 11:00 | 12:00 | 11AM-12NN
6  | 12:00 | 13:00 | 12NN-1PM
7  | 13:00 | 14:00 | 1PM-2PM
8  | 14:00 | 15:00 | 2PM-3PM
9  | 15:00 | 16:00 | 3PM-4PM
10 | 16:00 | 17:00 | 4PM-5PM
11 | 17:00 | 18:00 | 5PM-6PM
12 | 18:00 | 19:00 | 6PM-7PM
13 | 19:00 | 20:00 | 7PM-8PM
14 | 20:00 | 21:00 | 8PM-9PM
15 | 21:00 | 22:00 | 9PM-10PM
16 | 22:00 | 23:00 | 10PM-11PM
17 | 23:00 | 00:00 | 11PM-12MN
```

Use actual time values in the database. Do not use display strings as
identifiers.

------------------------------------------------------------------------

# 12. Schedule Entity

``` csharp
public class Schedule
{
    public long Id { get; set; }

    public int CourtId { get; set; }

    public DateOnly ScheduleDate { get; set; }

    public int TimeSlotId { get; set; }

    public ScheduleStatus Status { get; set; }

    public long? BookingId { get; set; }

    public string? Notes { get; set; }

    public DateTime CreatedAt { get; set; }

    public DateTime UpdatedAt { get; set; }

    public string? UpdatedByUserId { get; set; }

    public Court Court { get; set; } = null!;

    public TimeSlot TimeSlot { get; set; } = null!;

    public Booking? Booking { get; set; }
}
```

------------------------------------------------------------------------

# 13. Schedule Status

Use a strongly typed enum:

``` csharp
public enum ScheduleStatus
{
    Available = 0,
    Training = 1,
    Booked = 2,
    Unavailable = 3,
    FreePlay = 4
}
```

Do not allow arbitrary status strings from the frontend.

------------------------------------------------------------------------

# 14. Schedule Rules

The following rules should be enforced by the backend.

1.  A schedule belongs to exactly one court.
2.  A schedule belongs to exactly one date.
3.  A schedule belongs to exactly one time slot.
4.  The same court/date/time slot cannot have duplicate schedule
    records.
5.  A booked slot must have a valid booking when booking integration is
    enabled.
6.  A cancelled booking must not remain displayed as BOOKED.
7.  The API must validate schedule changes.
8.  The frontend must never be trusted as the source of business rules.

------------------------------------------------------------------------

# 15. Unique Constraint

Create a unique index on:

``` text
CourtId
ScheduleDate
TimeSlotId
```

This prevents:

``` text
Court 1 + September 20 + 2PM-3PM
```

from being inserted twice.

But this remains valid:

``` text
Court 1 + September 20 + 2PM-3PM
Court 2 + September 20 + 2PM-3PM
```

------------------------------------------------------------------------

# 16. Booking Entity

``` csharp
public class Booking
{
    public long Id { get; set; }

    public string BookingReference { get; set; } = null!;

    public int CourtId { get; set; }

    public string CustomerName { get; set; } = null!;

    public string? Email { get; set; }

    public string? Phone { get; set; }

    public DateOnly BookingDate { get; set; }

    public TimeOnly StartTime { get; set; }

    public TimeOnly EndTime { get; set; }

    public decimal TotalAmount { get; set; }

    public BookingStatus Status { get; set; }

    public string? Notes { get; set; }

    public DateTime CreatedAt { get; set; }

    public DateTime? UpdatedAt { get; set; }

    public Court Court { get; set; } = null!;
}
```

------------------------------------------------------------------------

# 17. Booking Status

``` csharp
public enum BookingStatus
{
    Pending = 0,
    Confirmed = 1,
    Cancelled = 2,
    Completed = 3
}
```

------------------------------------------------------------------------

# 18. Rates

Current branding/rate material shows:

``` text
7:00 AM - 4:00 PM
₱320/hour

5:00 PM - 12:00 MN
₱400/hour
```

Do not hard-code these values into React.

Use:

``` csharp
public class Rate
{
    public int Id { get; set; }

    public TimeOnly StartTime { get; set; }

    public TimeOnly EndTime { get; set; }

    public decimal PricePerHour { get; set; }

    public bool IsActive { get; set; }

    public DateTime CreatedAt { get; set; }

    public DateTime UpdatedAt { get; set; }
}
```

------------------------------------------------------------------------

# 19. Important Rate Gap

The schedule contains:

``` text
4PM-5PM
```

while the provided rate design shows:

``` text
7AM-4PM → ₱320/hour
5PM-12MN → ₱400/hour
```

This leaves 4PM-5PM unspecified.

Do not automatically assume its price.

The Rates administration screen should allow this period to be
configured explicitly.

For example:

``` text
7:00 AM - 4:00 PM    ₱320
4:00 PM - 5:00 PM    Configure
5:00 PM - 12:00 MN   ₱400
```

------------------------------------------------------------------------

# 20. Audit Logs

Every important administrative change should be recorded.

``` csharp
public class AuditLog
{
    public long Id { get; set; }

    public string UserId { get; set; } = null!;

    public string Action { get; set; } = null!;

    public string EntityName { get; set; } = null!;

    public string EntityId { get; set; } = null!;

    public string? OldValue { get; set; }

    public string? NewValue { get; set; }

    public string? IpAddress { get; set; }

    public DateTime CreatedAt { get; set; }
}
```

Example:

``` text
Admin: admin@tdk.com
Action: UPDATE_SCHEDULE

Court: Court 1
Date: September 20, 2026
Time: 2PM-3PM

OLD: AVAILABLE
NEW: TRAINING
```

------------------------------------------------------------------------

# 21. Authentication

The `/tdkadmin` route must be protected.

Recommended authentication architecture:

``` text
React
  |
  | POST /api/auth/login
  v
ASP.NET Core API
  |
  | Validate credentials
  |
  +--> Short-lived Access Token
  |
  +--> Secure HttpOnly Refresh Token
```

Recommended:

-   Short-lived access token
-   Secure HttpOnly refresh cookie
-   HTTPS only in production
-   Secure cookie
-   Appropriate SameSite configuration
-   Role-based authorization
-   Logout/revocation
-   Failed-login protection

Avoid storing long-lived authentication credentials in `localStorage`.

------------------------------------------------------------------------

# 22. Roles

Start with:

``` text
Admin
```

Design the system so it can later support:

``` text
SuperAdmin
Admin
Staff
```

Possible permissions:

``` text
Schedule.Read
Schedule.Write
Booking.Read
Booking.Write
Rates.Read
Rates.Write
Court.Read
Court.Write
Admin.Read
Admin.Write
AuditLog.Read
```

------------------------------------------------------------------------

# 23. API Endpoints

## Authentication

``` http
POST /api/auth/login
POST /api/auth/refresh
POST /api/auth/logout
GET  /api/auth/me
```

------------------------------------------------------------------------

## Courts

``` http
GET    /api/courts
GET    /api/courts/{id}
POST   /api/admin/courts
PUT    /api/admin/courts/{id}
DELETE /api/admin/courts/{id}
```

------------------------------------------------------------------------

## Time Slots

``` http
GET /api/time-slots
```

Time slots normally do not need frequent admin CRUD operations.

------------------------------------------------------------------------

## Public Schedule

``` http
GET /api/schedules
```

Example:

``` text
GET /api/schedules?courtId=1&from=2026-09-20&to=2026-09-26
```

------------------------------------------------------------------------

## Admin Schedule

``` http
GET    /api/admin/schedules
GET    /api/admin/schedules/{id}
POST   /api/admin/schedules
PUT    /api/admin/schedules/{id}
DELETE /api/admin/schedules/{id}
```

------------------------------------------------------------------------

## Bulk Schedule

``` http
POST /api/admin/schedules/bulk-update
```

Example:

``` json
{
  "courtId": 1,
  "date": "2026-09-21",
  "startTime": "07:00",
  "endTime": "12:00",
  "status": "Unavailable",
  "notes": "Private event"
}
```

------------------------------------------------------------------------

## Copy Schedule

``` http
POST /api/admin/schedules/copy
```

Example:

``` json
{
  "sourceDate": "2026-09-21",
  "targetDate": "2026-09-28",
  "courtId": 1
}
```

Later support:

``` json
{
  "sourceFrom": "2026-09-21",
  "sourceTo": "2026-09-27",
  "targetFrom": "2026-09-28",
  "courtId": 1
}
```

------------------------------------------------------------------------

## Rates

``` http
GET    /api/rates
POST   /api/admin/rates
PUT    /api/admin/rates/{id}
DELETE /api/admin/rates/{id}
```

------------------------------------------------------------------------

## Bookings

Public:

``` http
GET  /api/bookings/availability
POST /api/bookings
```

Admin:

``` http
GET  /api/admin/bookings
GET  /api/admin/bookings/{id}
PUT  /api/admin/bookings/{id}
POST /api/admin/bookings/{id}/confirm
POST /api/admin/bookings/{id}/cancel
POST /api/admin/bookings/{id}/complete
```

------------------------------------------------------------------------

## Audit Logs

``` http
GET /api/admin/audit-logs
GET /api/admin/audit-logs/{id}
```

------------------------------------------------------------------------

# 24. Recommended Schedule Board Endpoint

For the public schedule, consider a combined endpoint:

``` http
GET /api/schedule-board?from=2026-09-20&to=2026-09-26
```

Response:

``` json
{
  "courts": [
    {
      "id": 1,
      "name": "Court 1",
      "schedule": []
    },
    {
      "id": 2,
      "name": "Court 2",
      "schedule": []
    }
  ],
  "timeSlots": [],
  "rates": []
}
```

This gives the React public page everything it needs.

------------------------------------------------------------------------

# 25. DTO Design

Do not expose EF entities directly from controllers.

Use DTOs.

Example:

``` csharp
public record ScheduleDto(
    long Id,
    int CourtId,
    string CourtName,
    DateOnly Date,
    int TimeSlotId,
    string StartTime,
    string EndTime,
    ScheduleStatus Status,
    string? Notes
);
```

Update request:

``` csharp
public class UpdateScheduleRequest
{
    public ScheduleStatus Status { get; set; }

    public string? Notes { get; set; }
}
```

------------------------------------------------------------------------

# 26. Service Layer

Business logic should live in services.

## ScheduleService

Responsibilities:

``` text
GetSchedule()
GetScheduleByCourt()
CreateSchedule()
UpdateSchedule()
DeleteSchedule()
BulkUpdate()
CopySchedule()
CheckAvailability()
```

## BookingService

Responsibilities:

``` text
CreateBooking()
ConfirmBooking()
CancelBooking()
CompleteBooking()
CheckAvailability()
CalculateTotal()
```

## RateService

Responsibilities:

``` text
GetRates()
CreateRate()
UpdateRate()
DeleteRate()
CalculateRate()
```

------------------------------------------------------------------------

# 27. Controller Rule

Controllers should remain thin.

Preferred:

``` csharp
[HttpPut("{id}")]
public async Task<IActionResult> Update(
    long id,
    UpdateScheduleRequest request)
{
    var result =
        await _scheduleService.UpdateAsync(id, request);

    return Ok(result);
}
```

Avoid putting large amounts of business logic inside controllers.

------------------------------------------------------------------------

# 28. Validation

Frontend validation:

``` text
React Hook Form
+
Zod
```

Backend validation:

``` text
FluentValidation
```

Example frontend:

``` typescript
const scheduleSchema = z.object({
  status: z.enum([
    "Available",
    "Training",
    "Booked",
    "Unavailable",
    "FreePlay"
  ]),
  notes: z.string().max(500).optional()
});
```

The backend must independently validate all requests.

------------------------------------------------------------------------

# 29. Concurrency

Multiple administrators may edit the schedule simultaneously.

Example:

``` text
Admin A
Court 1
2PM-3PM
→ BOOKED

Admin B
Court 1
2PM-3PM
→ TRAINING
```

Use EF Core concurrency protection so one administrator does not
silently overwrite another administrator's changes.

A row-version/concurrency token is recommended.

------------------------------------------------------------------------

# 30. Booking Conflict Prevention

The API/database must prevent two users from booking the same court and
time.

Never trust:

``` text
React says AVAILABLE
```

The server must check again when the booking is created.

The backend should verify:

``` text
Court exists
Date is valid
Time range is valid
Slot is available
No conflicting booking exists
Rate exists
```

before creating a booking.

------------------------------------------------------------------------

# 31. React Routing

Recommended routes:

``` text
/
    Public Home

/schedule
    Public Schedule

/booking
    Public Booking

/tdkadmin
    Admin Login

/tdkadmin/dashboard
    Dashboard

/tdkadmin/schedule
    Schedule Management

/tdkadmin/bookings
    Booking Management

/tdkadmin/rates
    Rate Management

/tdkadmin/courts
    Court Management

/tdkadmin/admins
    Administrator Management

/tdkadmin/audit-logs
    Audit Logs

/tdkadmin/settings
    Settings
```

------------------------------------------------------------------------

# 32. Admin Layout

Use shadcn/ui's Sidebar.

``` text
+-------------------------------------------------------+
| TDK ADMIN                                             |
+------------------+------------------------------------+
|                  |                                    |
| Dashboard        |                                    |
|                  |            PAGE CONTENT             |
| Schedule         |                                    |
|                  |                                    |
| Bookings         |                                    |
|                  |                                    |
| Rates            |                                    |
|                  |                                    |
| Courts           |                                    |
|                  |                                    |
| Audit Logs       |                                    |
|                  |                                    |
| ---------------- |                                    |
| Settings         |                                    |
| Logout           |                                    |
+------------------+------------------------------------+
```

------------------------------------------------------------------------

# 33. Admin Login Page

Route:

``` text
/tdkadmin
```

Design:

``` text
+--------------------------------+
|                                |
|             TDK                |
|      ADMINISTRATION             |
|                                |
| Email                          |
| [________________________]     |
|                                |
| Password                       |
| [________________________]     |
|                                |
|          [ SIGN IN ]           |
|                                |
+--------------------------------+
```

Use:

-   shadcn Card
-   Input
-   Button
-   Label
-   Password input
-   Form validation
-   Loading state
-   Error message

------------------------------------------------------------------------

# 34. Admin Dashboard

Show useful information instead of unnecessary charts.

Example:

``` text
+----------------+ +----------------+ +----------------+
| COURT 1        | | COURT 2        | | TODAY'S        |
|                | |                | | BOOKINGS       |
|  8 booked      | |  6 booked      | | 14             |
+----------------+ +----------------+ +----------------+

+------------------------------------------------------+
| Today's Schedule                                    |
+------------------------------------------------------+
| Time       Court 1              Court 2              |
| 7-8 AM    AVAILABLE             TRAINING             |
| 8-9 AM    BOOKED                AVAILABLE            |
| 9-10 AM   AVAILABLE             BOOKED               |
| ...                                                |
+------------------------------------------------------+
```

------------------------------------------------------------------------

# 35. Main Admin Schedule Page

The main schedule management screen should include:

``` text
Schedule Management

[ Court 1 ▼ ]

< Previous Week    September 20-26    Next Week >

[ Today ]
[ Bulk Update ]
[ Copy Schedule ]
```

Grid:

``` text
+---------+----------+----------+----------+----------+
| TIME    | MON      | TUE      | WED      | THU      |
+---------+----------+----------+----------+----------+
| 7-8 AM  | TRAINING | OPEN     | OPEN     | BOOKED   |
| 8-9 AM  | TRAINING | OPEN     | BOOKED   | OPEN     |
| 9-10 AM | OPEN     | BOOKED   | OPEN     | OPEN     |
| 10-11   | OPEN     | OPEN     | OPEN     | OPEN     |
+---------+----------+----------+----------+----------+
```

------------------------------------------------------------------------

# 36. Court Selector

Use:

``` text
[ Court 1 ▼ ]
```

or tabs:

``` text
[ COURT 1 ] [ COURT 2 ]
```

Desktop can show both when appropriate.

Mobile should use a selector/tabs so the schedule remains readable.

------------------------------------------------------------------------

# 37. Schedule Cell Component

Create:

``` text
ScheduleCell.tsx
```

Props:

``` typescript
interface ScheduleCellProps {
  date: string;
  timeSlot: TimeSlot;
  schedule?: Schedule;
  onClick: () => void;
}
```

The component should:

-   Display status
-   Display appropriate badge
-   Handle click
-   Show hover state
-   Be keyboard accessible
-   Work on mobile where applicable

------------------------------------------------------------------------

# 38. Schedule Editor Dialog

Clicking a cell opens:

``` text
+---------------------------------------+
| Edit Schedule                         |
+---------------------------------------+
| Court                                 |
| [ Court 1 ]                            |
|                                       |
| Date                                  |
| September 20, 2026                    |
|                                       |
| Time                                  |
| 2:00 PM - 3:00 PM                     |
|                                       |
| Status                                |
| [ BOOKED ▼ ]                          |
|                                       |
| Notes                                 |
| [_______________________________]     |
|                                       |
|        [ Cancel ] [ Save Changes ]    |
+---------------------------------------+
```

If BOOKED, display associated booking information.

------------------------------------------------------------------------

# 39. Bulk Schedule Update

The admin should not have to click 20 cells individually.

Provide:

``` text
Bulk Schedule Update
```

Form:

``` text
Court
[ Court 1 ]

Date
[ September 21, 2026 ]

From
[ 7:00 AM ]

To
[ 12:00 PM ]

Status
[ UNAVAILABLE ]

Notes
[ Private event ]

[ Apply Update ]
```

This updates all affected slots.

------------------------------------------------------------------------

# 40. Copy Schedule

Provide:

``` text
Copy Schedule
```

Example:

``` text
Source:
September 21

Target:
September 28

Court:
Court 1

[ Copy Schedule ]
```

Later support copying a whole week.

------------------------------------------------------------------------

# 41. Public Schedule

The public schedule should be visually branded for customers.

Example:

``` text
                 [ TDK LOGO ]

        THE DIRTY KITCHEN
           PICKLEBALL COURT

                 SCHEDULE

       < Previous    Today    Next >

        [ COURT 1 ] [ COURT 2 ]

+---------+----------+----------+----------+
| TIME    | MON      | TUE      | WED      |
+---------+----------+----------+----------+
| 7-8 AM  | TRAINING | OPEN     | OPEN     |
| 8-9 AM  | BOOKED   | OPEN     | OPEN     |
| 9-10 AM | OPEN     | BOOKED   | OPEN     |
+---------+----------+----------+----------+
```

------------------------------------------------------------------------

# 42. Public Schedule Information

Public users should see:

``` text
AVAILABLE
BOOKED
TRAINING
UNAVAILABLE
FREE PLAY
```

But should not see internal information such as:

-   Customer phone number
-   Customer email
-   Internal admin notes
-   IP address
-   Administrator information

------------------------------------------------------------------------

# 43. Public Mobile Schedule

Do not force a desktop-style 7-column spreadsheet onto mobile.

Mobile should display one day at a time:

``` text
TDK SCHEDULE

[ COURT 1 ▼ ]

September 20

+-----------------------------+
| 7:00 - 8:00                 |
| AVAILABLE                   |
|                       BOOK  |
+-----------------------------+
| 8:00 - 9:00                 |
| TRAINING                    |
+-----------------------------+
| 9:00 - 10:00                |
| BOOKED                      |
+-----------------------------+
```

Desktop can use the weekly grid.

------------------------------------------------------------------------

# 44. Booking Flow

Future public booking:

``` text
Select Date
     ↓
Select Court
     ↓
Select Time
     ↓
Enter Customer Information
     ↓
Review
     ↓
Confirm
     ↓
Booking Created
```

Example:

``` text
Date:
September 20

Court:
Court 1

Time:
2PM - 4PM

Rate:
₱320/hour

Estimated Total:
₱640
```

The final amount must always be calculated by the backend.

------------------------------------------------------------------------

# 45. Booking Calculation

Do not calculate the final price only in React.

Frontend can show an estimate.

Backend must calculate:

``` text
duration × applicable hourly rate
```

Example:

``` text
2 hours × ₱320
= ₱640
```

If the booking crosses rate periods, the backend should calculate each
portion separately.

------------------------------------------------------------------------

# 46. Booking Management

Admin page:

``` text
/tdkadmin/bookings
```

Use a shadcn data table.

Columns:

``` text
Reference
Customer
Court
Date
Time
Amount
Status
Created
Actions
```

Actions:

``` text
View
Confirm
Cancel
Complete
```

------------------------------------------------------------------------

# 47. Rates Administration

Route:

``` text
/tdkadmin/rates
```

Table:

``` text
+------------------+------------------+-------------+
| START            | END              | RATE        |
+------------------+------------------+-------------+
| 7:00 AM          | 4:00 PM          | ₱320/hour   |
| 5:00 PM          | 12:00 MN         | ₱400/hour   |
+------------------+------------------+-------------+

[ + Add Rate ]
```

------------------------------------------------------------------------

# 48. Court Administration

Route:

``` text
/tdkadmin/courts
```

Example:

``` text
+----------+----------+---------+
| COURT    | STATUS   | ACTIONS |
+----------+----------+---------+
| Court 1  | Active   | ...     |
| Court 2  | Active   | ...     |
+----------+----------+---------+

[ + Add Court ]
```

------------------------------------------------------------------------

# 49. Audit Log Administration

Route:

``` text
/tdkadmin/audit-logs
```

Display:

``` text
Date
Admin
Action
Entity
Entity ID
Description
```

Filters:

``` text
Date range
Admin
Action
Entity
```

------------------------------------------------------------------------

# 50. React API Layer

Create:

``` text
src/services/api.ts
```

Then:

``` text
auth.ts
courts.ts
schedules.ts
bookings.ts
rates.ts
```

Example:

``` typescript
export async function getSchedules(
  courtId: number,
  from: string,
  to: string
) {
  return api.get("/api/admin/schedules", {
    params: {
      courtId,
      from,
      to
    }
  });
}
```

------------------------------------------------------------------------

# 51. TanStack Query

Use TanStack Query for server state.

Example:

``` typescript
useQuery({
  queryKey: ["schedules", courtId, from, to],
  queryFn: () => getSchedules(courtId, from, to)
});
```

When saving:

``` typescript
useMutation({
  mutationFn: updateSchedule,
  onSuccess: () => {
    queryClient.invalidateQueries({
      queryKey: ["schedules"]
    });
  }
});
```

This ensures the schedule automatically refreshes after changes.

------------------------------------------------------------------------

# 52. React Query Keys

Use predictable keys:

``` text
["courts"]

["timeSlots"]

["schedules", courtId, from, to]

["bookings", filters]

["rates"]

["auditLogs", filters]

["currentUser"]
```

------------------------------------------------------------------------

# 53. shadcn/ui Components

Use shadcn for:

``` text
Button
Card
Input
Label
Textarea
Select
DropdownMenu
Dialog
AlertDialog
Popover
Calendar
Tabs
Badge
Table
Sheet
Sidebar
Separator
Tooltip
Avatar
Skeleton
Sonner
```

Do not reinvent common UI components unnecessarily.

------------------------------------------------------------------------

# 54. Status UI

Statuses should use both text and visual treatment.

``` text
AVAILABLE
TRAINING
BOOKED
UNAVAILABLE
FREE PLAY
```

Do not rely only on colors.

This makes the schedule more accessible and understandable.

------------------------------------------------------------------------

# 55. Loading States

Every API-driven page should support:

``` text
Loading
Success
Empty
Error
```

For example:

``` text
Loading schedule...
```

Use shadcn Skeleton for the schedule grid.

------------------------------------------------------------------------

# 56. Error Handling

API errors should be shown through:

-   Form messages
-   Sonner/toast
-   Alert components
-   Inline validation

Do not expose raw server exceptions to users.

------------------------------------------------------------------------

# 57. Backend Error Response

Use a consistent format:

``` json
{
  "success": false,
  "message": "Validation failed",
  "errors": {
    "status": [
      "Invalid schedule status."
    ]
  }
}
```

HTTP status codes should remain meaningful:

``` text
200 OK
201 Created
400 Bad Request
401 Unauthorized
403 Forbidden
404 Not Found
409 Conflict
422 Unprocessable Entity
500 Internal Server Error
```

Use `409 Conflict` for cases such as booking/schedule conflicts where
appropriate.

------------------------------------------------------------------------

# 58. CORS

Development:

``` text
http://localhost:5173
```

Production:

``` text
https://yourdomain.com
```

Do not use unrestricted CORS in production.

------------------------------------------------------------------------

# 59. Environment Variables

Frontend:

``` env
VITE_API_URL=https://api.yourdomain.com
```

Development:

``` env
VITE_API_URL=https://localhost:xxxx
```

Backend configuration:

``` json
{
  "ConnectionStrings": {
    "DefaultConnection": "..."
  },
  "Jwt": {
    "Issuer": "...",
    "Audience": "...",
    "Secret": "...",
    "AccessTokenMinutes": 10
  }
}
```

Never commit production secrets to Git.

------------------------------------------------------------------------

# 60. SQL Server Migration Strategy

Use EF Core migrations.

Initial:

``` bash
dotnet ef migrations add InitialCreate
dotnet ef database update
```

Future:

``` bash
dotnet ef migrations add AddBookingFields
dotnet ef database update
```

Always review migrations before production deployment.

------------------------------------------------------------------------

# 61. Seed Data

Initial seed should create:

## Courts

``` text
Court 1
Court 2
```

## Time Slots

``` text
7AM-8AM
8AM-9AM
...
11PM-12MN
```

## Rates

``` text
7AM-4PM
₱320/hour

5PM-12MN
₱400/hour
```

The 4PM-5PM period should remain configurable rather than being silently
assigned a rate.

## Admin

Create the first admin securely during deployment/setup rather than
hard-coding credentials into source code.

------------------------------------------------------------------------

# 62. Schedule Generation Strategy

There are two reasonable approaches.

## Option A --- Store only exceptions

An empty slot means available.

Only store:

``` text
TRAINING
BOOKED
UNAVAILABLE
FREE PLAY
```

This keeps the database small.

## Option B --- Generate all schedule cells

Create a schedule row for every:

``` text
Court × Date × TimeSlot
```

This makes querying simple.

For the first version, either can work. If using Option A, the API
should normalize missing records into `AVAILABLE` when building the
schedule board.

Recommended approach:

**Store explicit schedule records for non-default states and treat
missing records as AVAILABLE**, unless a future business rule requires
every slot to exist physically.

------------------------------------------------------------------------

# 63. Schedule Generation

The API can generate a requested date range:

``` text
Court 1
+
September 20-26
+
17 time slots
```

If there are no schedule records for a cell:

``` text
AVAILABLE
```

If there is a record:

``` text
Use stored status
```

This is efficient and keeps the database clean.

------------------------------------------------------------------------

# 64. Weekly Schedule

The main admin workflow should be weekly.

Example:

``` text
September 20 - September 26
```

Controls:

``` text
< Previous Week
Today
Next Week >
```

Optional view controls:

``` text
Day
Week
2 Weeks
Month
```

The MVP only needs Week.

------------------------------------------------------------------------

# 65. Monthly Calendar

Later, add a monthly overview:

``` text
September 2026

Sun Mon Tue Wed Thu Fri Sat
          1   2   3   4   5
6   7   8   9  10  11  12
13 14  15  16  17  18  19
20 21  22  23  24  25  26
27 28  29  30
```

Clicking a date opens its schedule.

------------------------------------------------------------------------

# 66. Copying Schedules

Useful because pickleball schedules can repeat.

Support:

``` text
Copy one day
Copy one week
Copy Court 1 to Court 2
Copy previous week to next week
```

Do not overwrite existing BOOKED records without explicit confirmation.

Example warning:

``` text
This will overwrite 8 existing schedule entries.

[ Cancel ] [ Continue ]
```

------------------------------------------------------------------------

# 67. Bulk Operations Safety

Bulk updates should always display a confirmation summary.

Example:

``` text
You are about to update:

Court 1
September 21
7AM-12PM

5 schedule slots

New status:
UNAVAILABLE

[ Cancel ] [ Apply Update ]
```

------------------------------------------------------------------------

# 68. Booking Safety

When confirming a booking:

``` text
Check current schedule
Check existing booking
Check court
Check time
Calculate price
Create booking
Update schedule
Create audit record
```

These operations should be handled transactionally.

------------------------------------------------------------------------

# 69. Database Transaction

A booking confirmation can involve:

``` text
Booking
Schedule
AuditLog
```

Use a database transaction so the system does not end up with:

``` text
Booking created
but
Schedule still AVAILABLE
```

or:

``` text
Schedule BOOKED
but
Booking failed
```

------------------------------------------------------------------------

# 70. Audit Events

Recommended events:

``` text
LOGIN_SUCCESS
LOGIN_FAILED
LOGOUT

CREATE_SCHEDULE
UPDATE_SCHEDULE
DELETE_SCHEDULE
BULK_UPDATE_SCHEDULE
COPY_SCHEDULE

CREATE_BOOKING
CONFIRM_BOOKING
CANCEL_BOOKING
COMPLETE_BOOKING

CREATE_RATE
UPDATE_RATE
DELETE_RATE

CREATE_COURT
UPDATE_COURT
DELETE_COURT

CREATE_ADMIN
UPDATE_ADMIN
DISABLE_ADMIN
```

------------------------------------------------------------------------

# 71. Security Checklist

Backend:

-   HTTPS
-   ASP.NET Core Identity
-   Strong password hashing
-   JWT validation
-   Secure refresh tokens
-   Role-based authorization
-   Rate limiting on authentication endpoints
-   Request validation
-   SQL parameterization through EF Core
-   Global exception handling
-   Audit logging
-   CORS restriction
-   Secure cookies
-   Security headers where appropriate

Frontend:

-   Protected admin routes
-   No secrets in frontend
-   No customer-sensitive data in public API
-   Proper error handling
-   Avoid dangerous HTML rendering
-   Token/session handling that minimizes credential exposure

------------------------------------------------------------------------

# 72. Logging

Use Serilog.

Log:

``` text
Application errors
API requests
Authentication events
Schedule changes
Booking events
Database failures
```

Do not log:

``` text
Passwords
JWT tokens
Refresh tokens
Sensitive customer data unnecessarily
```

------------------------------------------------------------------------

# 73. Testing Strategy

## Backend Unit Tests

Test:

``` text
Rate calculation
Schedule updates
Schedule conflicts
Booking conflicts
Status transitions
Authorization rules
```

## Integration Tests

Test:

``` text
Login
Schedule API
Booking API
Database constraints
Authentication
```

## Frontend Tests

Test:

``` text
Login form
Schedule rendering
Schedule editor
Booking form
Rate form
Protected routes
```

------------------------------------------------------------------------

# 74. Manual Acceptance Tests

Before production, verify:

## Authentication

-   Admin can log in.
-   Wrong password is rejected.
-   Unauthorized user cannot access `/tdkadmin/dashboard`.
-   Logout works.
-   Expired session is handled.

## Schedule

-   Court 1 works.
-   Court 2 works.
-   Dates change correctly.
-   Time slots render correctly.
-   Status changes save.
-   Refresh preserves changes.
-   Two courts can have different statuses for the same time.

## Bulk update

-   Correct cells update.
-   Incorrect dates are rejected.
-   Existing bookings are protected.

## Bookings

-   Available slot can be booked.
-   Already booked slot cannot be booked.
-   Cancelled booking releases the slot according to business rules.
-   Total amount is calculated correctly.

## Rates

-   Rates can be edited.
-   New rates affect future calculations.
-   4PM-5PM behavior is explicitly configured.

------------------------------------------------------------------------

# 75. Development Phases

## Phase 1 --- Project Setup

Backend:

-   Create solution
-   Create projects
-   Configure SQL Server
-   Configure EF Core
-   Configure Identity
-   Configure JWT
-   Configure Swagger
-   Configure CORS
-   Configure Serilog

Frontend:

-   Create Vite React TypeScript app
-   Configure Tailwind
-   Install shadcn/ui
-   Configure React Router
-   Configure TanStack Query
-   Configure React Hook Form
-   Configure Zod
-   Configure date-fns

------------------------------------------------------------------------

# 76. Phase 2 --- Database

Create:

``` text
Users
Roles
Courts
TimeSlots
Schedules
Bookings
Rates
AuditLogs
```

Add:

-   Relationships
-   Indexes
-   Unique constraints
-   Concurrency token
-   Seed data

Run initial migration.

------------------------------------------------------------------------

# 77. Phase 3 --- Authentication

Backend:

``` text
POST /api/auth/login
POST /api/auth/refresh
POST /api/auth/logout
GET /api/auth/me
```

Frontend:

``` text
Admin Login
ProtectedRoute
Auth Provider
Session Handling
Logout
```

------------------------------------------------------------------------

# 78. Phase 4 --- Courts and Time Slots

Implement:

``` text
Court API
Time Slot API
Court selector
Time slot loading
```

Seed Court 1 and Court 2.

------------------------------------------------------------------------

# 79. Phase 5 --- Schedule API

Implement:

``` text
Get schedule
Create schedule
Update schedule
Delete schedule
Bulk update
Copy schedule
Availability
```

Test through Swagger before implementing the complete frontend.

------------------------------------------------------------------------

# 80. Phase 6 --- Admin Schedule UI

Implement:

``` text
Admin Layout
Schedule Page
Court Selector
Week Navigation
Schedule Grid
Schedule Cell
Schedule Editor
Bulk Update
Copy Schedule
```

This is the most important frontend phase.

------------------------------------------------------------------------

# 81. Phase 7 --- Rates

Implement:

``` text
Rate API
Rate Management Page
Rate Editor
Rate Calculation Service
```

------------------------------------------------------------------------

# 82. Phase 8 --- Bookings

Implement:

``` text
Availability API
Booking API
Booking Form
Booking Table
Confirm
Cancel
Complete
Price calculation
Conflict prevention
```

------------------------------------------------------------------------

# 83. Phase 9 --- Audit Logs

Implement:

``` text
AuditLogService
AuditLog API
AuditLog Page
Filters
```

------------------------------------------------------------------------

# 84. Phase 10 --- Public Website

Implement:

``` text
Home
Public Schedule
Court Selector
Rates
Booking
Responsive mobile layout
```

------------------------------------------------------------------------

# 85. Phase 11 --- Testing

Run:

``` text
Unit tests
Integration tests
Frontend tests
Manual acceptance tests
Security testing
Mobile testing
Desktop testing
```

------------------------------------------------------------------------

# 86. Phase 12 --- Deployment

Recommended architecture:

``` text
                         DOMAIN
                            |
              +-------------+-------------+
              |                           |
              v                           v
       React Frontend                API Subdomain
       yourdomain.com               api.yourdomain.com
              |                           |
              |                           |
              +-------------+-------------+
                            |
                            v
                        SQL Server
```

Possible hosting:

``` text
Frontend:
Vercel

API:
ASP.NET-compatible hosting / VPS / cloud platform

Database:
SQL Server hosting
```

The exact provider can be selected later based on cost, reliability, and
.NET/SQL Server support.

------------------------------------------------------------------------

# 87. Environment Configuration

Development:

``` text
React:
http://localhost:5173

API:
https://localhost:xxxx

SQL Server:
Local SQL Server
```

Production:

``` text
React:
https://yourdomain.com

API:
https://api.yourdomain.com

SQL Server:
Production database
```

------------------------------------------------------------------------

# 88. Git Structure

Recommended branches:

``` text
main
develop
feature/auth
feature/schedule
feature/bookings
feature/rates
feature/admin
```

Use pull requests for major features.

Commit examples:

``` text
feat: add schedule management API
feat: add admin authentication
feat: add court selector
feat: add schedule grid
fix: prevent duplicate bookings
fix: correct rate calculation
```

------------------------------------------------------------------------

# 89. MVP Scope

The first production-capable version should contain:

## Public

-   TDK branding
-   Schedule
-   Court 1
-   Court 2
-   Date navigation
-   Availability
-   Rates

## Admin

-   `/tdkadmin`
-   Login
-   Dashboard
-   Schedule management
-   Court selection
-   Status editing
-   Bulk updates
-   Copy schedule
-   Rates management
-   Logout

## Backend

-   Authentication
-   Courts
-   Time slots
-   Schedules
-   Rates
-   Audit logs
-   SQL Server
-   API validation

------------------------------------------------------------------------

# 90. Version 2

After MVP:

-   Public booking
-   Booking confirmations
-   Booking cancellation
-   Customer records
-   Email notifications
-   SMS notifications
-   Booking references
-   Better reporting
-   Calendar view
-   Schedule templates

------------------------------------------------------------------------

# 91. Version 3

Potential future features:

-   Online payment
-   QR booking confirmation
-   Customer accounts
-   Booking history
-   Promo codes
-   Memberships
-   Peak/off-peak pricing
-   Holiday pricing
-   Automatic reminders
-   Revenue reports
-   Staff accounts
-   Multiple locations
-   Multiple pickleball facilities

------------------------------------------------------------------------

# 92. Recommended Final Architecture

``` text
                         THE DIRTY KITCHEN
                          PICKLEBALL COURT
                                  |
                    +-------------+-------------+
                    |                           |
                    v                           v
              PUBLIC SITE                  /tdkadmin
                    |                           |
              +-----+------+              +-----+------+
              |            |              |            |
          Schedule      Booking       Dashboard    Schedule
              |            |              |            |
              |            |              |       +----+----+
              |            |              |       |         |
              |            |              |     Court 1   Court 2
              |            |              |
              |            |              +---- Bookings
              |            |              |
              |            |              +---- Rates
              |            |              |
              |            |              +---- Courts
              |            |              |
              |            |              +---- Audit Logs
              |            |
              +------------+
                    |
                    v
            ASP.NET CORE WEB API
                    |
       +------------+------------+
       |            |            |
       v            v            v
    Auth        Schedule      Bookings
       |            |            |
       +------------+------------+
                    |
                    v
                SQL SERVER
                    |
       +------------+------------+
       |            |            |
     Courts     TimeSlots    Schedules
                                |
                         +------+------+
                         |             |
                      Bookings       Rates
                         |
                      AuditLogs
```

------------------------------------------------------------------------

# 93. Critical Design Decisions

The following decisions should remain part of the implementation:

### 1. Courts are first-class entities

Do not hard-code Court 1 and Court 2 into React.

Use the `Courts` table.

### 2. Schedule is court-specific

The unique combination is:

``` text
Court + Date + TimeSlot
```

### 3. Rates are database-driven

Do not hard-code ₱320 and ₱400 in the frontend.

### 4. Booking prices are calculated server-side

React may display estimates, but the API determines the final amount.

### 5. Public and admin data are different

Never expose internal customer/admin information through the public
schedule endpoint.

### 6. Authentication is mandatory for `/tdkadmin`

The route itself is not security. The API must also enforce
authorization.

### 7. Schedule changes are auditable

Important administrative changes should create audit records.

### 8. Bulk operations require confirmation

Avoid accidental mass schedule changes.

### 9. Mobile must have a different schedule presentation

Do not force the desktop spreadsheet layout onto a phone.

### 10. The backend owns business rules

React is the UI. ASP.NET Core is the authority for schedule, booking,
pricing, and security rules.

------------------------------------------------------------------------

# 94. Final User Flow

## Customer

``` text
Open TDK website
       ↓
View TDK branding
       ↓
View rental rates
       ↓
View schedule
       ↓
Select Court 1 / Court 2
       ↓
Select date
       ↓
View available time
       ↓
Book
       ↓
Receive booking reference
```

## Admin

``` text
Open /tdkadmin
       ↓
Login
       ↓
Dashboard
       ↓
Schedule
       ↓
Select Court 1 / Court 2
       ↓
Select week
       ↓
Click schedule cell
       ↓
Change status
       ↓
Save
       ↓
API validates
       ↓
Database updated
       ↓
Audit log created
       ↓
Public schedule updates
```

------------------------------------------------------------------------

# 95. Final Recommended Build Order

Build in exactly this sequence:

``` text
1.  Create backend solution
2.  Create React frontend
3.  Configure SQL Server
4.  Configure EF Core
5.  Create database entities
6.  Create migrations
7.  Seed courts
8.  Seed time slots
9.  Seed initial rates
10. Configure Identity
11. Configure JWT authentication
12. Build login API
13. Build React admin login
14. Build protected /tdkadmin routes
15. Build Courts API
16. Build TimeSlots API
17. Build Schedule API
18. Build ScheduleService
19. Build admin schedule page
20. Build schedule grid
21. Build schedule editor
22. Build bulk update
23. Build copy schedule
24. Build Rates API
25. Build Rates admin page
26. Build Booking API
27. Build public availability
28. Build booking UI
29. Build admin booking UI
30. Add transaction handling
31. Add audit logging
32. Build public schedule
33. Build responsive mobile UI
34. Add tests
35. Security review
36. Production configuration
37. Deploy API
38. Deploy React
39. Configure SQL Server
40. Configure domain
41. Final acceptance testing
```

------------------------------------------------------------------------

# 96. Definition of Done

The project should not be considered complete until:

-   [ ] TDK branding is applied
-   [ ] React frontend works on desktop
-   [ ] React frontend works on mobile
-   [ ] `/tdkadmin` is protected
-   [ ] Admin authentication works
-   [ ] Court 1 exists
-   [ ] Court 2 exists
-   [ ] Additional courts can be added
-   [ ] Time slots are seeded
-   [ ] Weekly schedule works
-   [ ] Schedule cells can be edited
-   [ ] TRAINING works
-   [ ] BOOKED works
-   [ ] UNAVAILABLE works
-   [ ] FREE PLAY works
-   [ ] AVAILABLE works
-   [ ] Bulk schedule updates work
-   [ ] Schedule copying works
-   [ ] Rates are database-driven
-   [ ] 4PM-5PM pricing is explicitly configured
-   [ ] Booking conflicts are prevented
-   [ ] Booking prices are calculated by the backend
-   [ ] Audit logs are generated
-   [ ] Public schedule hides private information
-   [ ] API validation is implemented
-   [ ] Authorization is implemented
-   [ ] SQL constraints are implemented
-   [ ] Concurrency handling is implemented
-   [ ] Error handling is implemented
-   [ ] Swagger documentation is available
-   [ ] Production CORS is configured
-   [ ] Production secrets are protected
-   [ ] HTTPS is enabled
-   [ ] Database backups are configured
-   [ ] Frontend production build works
-   [ ] API production build works
-   [ ] End-to-end booking/schedule flow is tested

------------------------------------------------------------------------

# 97. Project Goal

The final system should transform the current spreadsheet into a proper
web application:

``` text
CURRENT

Excel / Spreadsheet
       |
       v
Manually update cells
       |
       v
Users view schedule


TARGET

                    TDK WEBSITE
                         |
              +----------+----------+
              |                     |
              v                     v
          PUBLIC                 /tdkadmin
              |                     |
          Schedule              Dashboard
              |                     |
          Booking               Schedule
              |                     |
              |              Courts / Rates
              |                     |
              +----------+----------+
                         |
                         v
                 ASP.NET CORE API
                         |
                         v
                    SQL SERVER
```

The key objective is to make **The Dirty Kitchen Pickleball Court's
schedule a centralized, database-backed system** where administrators
can manage both courts from `/tdkadmin`, customers can see current
availability, and future booking functionality can be added without
rebuilding the application.
