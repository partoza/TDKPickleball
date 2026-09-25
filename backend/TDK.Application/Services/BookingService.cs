using System.Security.Cryptography;
using TDK.Application.DTOs.Bookings;
using TDK.Application.DTOs.Common;
using TDK.Application.DTOs.Schedules;
using TDK.Application.Interfaces;
using TDK.Domain.Entities;
using TDK.Domain.Enums;
using TDK.Domain.Interfaces;

namespace TDK.Application.Services;

public class BookingService : IBookingService
{
    private const decimal PaddleRentalPrice = 100m;
    private const int MaximumPaddleRentalQuantity = 50;
    private readonly IRepository<Booking> _bookings;
    private readonly IRepository<Schedule> _schedules;
    private readonly IRepository<TimeSlot> _timeSlots;
    private readonly IRepository<Court> _courts;
    private readonly IRepository<Notification> _notifications;
    private readonly IRepository<Promo> _promos;
    private readonly IRepository<InternalCoachProfile> _internalCoaches;
    private readonly IRateService _rates;
    private readonly IEmailService _email;
    private readonly IBusinessClock _clock;
    private readonly IPayMongoService _payMongo;

    public BookingService(IRepository<Booking> bookings, IRepository<Schedule> schedules, IRepository<TimeSlot> timeSlots, IRepository<Court> courts, IRepository<Notification> notifications, IRepository<Promo> promos, IRepository<InternalCoachProfile> internalCoaches, IRateService rates, IEmailService email, IBusinessClock clock, IPayMongoService payMongo)
    {
        _bookings = bookings; _schedules = schedules; _timeSlots = timeSlots; _courts = courts;
        _notifications = notifications; _promos = promos; _internalCoaches = internalCoaches; _rates = rates; _email = email; _clock = clock; _payMongo = payMongo;
    }

    public async Task<ApiResponse<BookingAvailabilityDto>> GetAvailabilityAsync(DateOnly date, int courtId)
    {
        var court = await _courts.GetByIdAsync(courtId);
        if (court is null || !court.IsActive) return ApiResponse<BookingAvailabilityDto>.Fail("Court is not available");
        var slots = await _timeSlots.GetAllAsync();
        var schedules = await _schedules.FindAsync(s => s.ScheduleDate == date && s.CourtId == courtId);
        var operatingSlots = slots.Where(s => s.IsActive && IsWithinCourtHours(s, court)).OrderBy(s => s.SortOrder).ToList();
        var occupiedSlotIds = schedules.Where(s => s.Status != ScheduleStatus.Available).Select(s => s.TimeSlotId).ToHashSet();
        var available = operatingSlots.Where(s => !occupiedSlotIds.Contains(s.Id))
            .Select(s => new TimeSlotDto(s.Id, s.StartTime, s.EndTime, s.DisplayName)).ToList();
        var occupied = operatingSlots.Where(s => occupiedSlotIds.Contains(s.Id))
            .Select(s => new TimeSlotDto(s.Id, s.StartTime, s.EndTime, s.DisplayName)).ToList();
        return ApiResponse<BookingAvailabilityDto>.Ok(new(date, courtId, available, occupied));
    }

    public async Task<ApiResponse<PublicBookingRequestReceiptDto>> SubmitPublicRequestAsync(
        PublicBookingRequestSubmissionDto request,
        byte[] receiptBytes,
        string receiptFileName,
        string receiptContentType,
        CancellationToken cancellationToken = default)
    {
        if (request.Schedules.Count is < 1 or > 20)
            return ApiResponse<PublicBookingRequestReceiptDto>.Fail("Select between 1 and 20 booking schedules");
        if (request.PaddleRentalQuantity is < 0 or > MaximumPaddleRentalQuantity)
            return ApiResponse<PublicBookingRequestReceiptDto>.Fail($"Paddle rental quantity must be between 0 and {MaximumPaddleRentalQuantity}");

        for (var leftIndex = 0; leftIndex < request.Schedules.Count; leftIndex++)
        {
            var left = request.Schedules[leftIndex];
            for (var rightIndex = leftIndex + 1; rightIndex < request.Schedules.Count; rightIndex++)
            {
                var right = request.Schedules[rightIndex];
                if (left.CourtId == right.CourtId && left.BookingDate == right.BookingDate &&
                    Minutes(left.StartTime, false) < Minutes(right.EndTime, true) &&
                    Minutes(right.StartTime, false) < Minutes(left.EndTime, true))
                    return ApiResponse<PublicBookingRequestReceiptDto>.Fail("Requested schedules cannot overlap on the same court");
            }
        }

        var requestedSchedules = new List<PublicBookingRequestScheduleDto>(request.Schedules.Count);
        decimal courtTotal = 0;
        foreach (var schedule in request.Schedules)
        {
            var conflict = await ValidateSlotAsync(schedule.CourtId, schedule.BookingDate, schedule.StartTime, schedule.EndTime);
            if (conflict is not null) return ApiResponse<PublicBookingRequestReceiptDto>.Fail(conflict);

            var court = await _courts.GetByIdAsync(schedule.CourtId);
            if (court is null || !court.IsActive)
                return ApiResponse<PublicBookingRequestReceiptDto>.Fail("Court is not available");

            var amount = await _rates.CalculateRateAsync(schedule.StartTime, schedule.EndTime, RateType.Booking);
            if (amount <= 0)
                return ApiResponse<PublicBookingRequestReceiptDto>.Fail("No active rate covers one or more selected schedules");

            courtTotal += amount;
            requestedSchedules.Add(new(schedule.CourtId, court.Name, schedule.BookingDate, schedule.StartTime, schedule.EndTime, amount));
        }

        var submittedAt = _clock.UtcNow.UtcDateTime;
        var requestReference = $"REQ-{submittedAt:yyyyMMdd}-{RandomNumberGenerator.GetInt32(0, 1_000_000):D6}";
        var paddleRentalFee = request.PaddleRentalQuantity * PaddleRentalPrice;
        var emailRequest = new PublicBookingRequestEmailDto(
            requestReference,
            request.CustomerName.Trim(),
            request.Email.Trim(),
            request.Phone?.Trim(),
            request.Notes?.Trim(),
            requestedSchedules,
            request.PaddleRentalQuantity,
            paddleRentalFee,
            courtTotal + paddleRentalFee,
            submittedAt);

        try
        {
            await _email.SendPublicBookingRequestAsync(emailRequest, receiptBytes, receiptFileName, receiptContentType, cancellationToken);
        }
        catch
        {
            return ApiResponse<PublicBookingRequestReceiptDto>.Fail("The request could not be delivered to the store. No booking was created; please try again.");
        }

        return ApiResponse<PublicBookingRequestReceiptDto>.Ok(
            new(requestReference, submittedAt),
            "Booking request sent for manual receipt verification. No booking has been created yet.");
    }

    public async Task<ApiResponse<PublicPayMongoRequestResponseDto>> SubmitPayMongoRequestAsync(
        PublicBookingRequestSubmissionDto request,
        CancellationToken cancellationToken = default)
    {
        if (request.Schedules.Count is < 1 or > 20)
            return ApiResponse<PublicPayMongoRequestResponseDto>.Fail("Select between 1 and 20 booking schedules");
        if (request.PaddleRentalQuantity is < 0 or > MaximumPaddleRentalQuantity)
            return ApiResponse<PublicPayMongoRequestResponseDto>.Fail($"Paddle rental quantity must be between 0 and {MaximumPaddleRentalQuantity}");

        for (var leftIndex = 0; leftIndex < request.Schedules.Count; leftIndex++)
        {
            var left = request.Schedules[leftIndex];
            for (var rightIndex = leftIndex + 1; rightIndex < request.Schedules.Count; rightIndex++)
            {
                var right = request.Schedules[rightIndex];
                if (left.CourtId == right.CourtId && left.BookingDate == right.BookingDate &&
                    Minutes(left.StartTime, false) < Minutes(right.EndTime, true) &&
                    Minutes(right.StartTime, false) < Minutes(left.EndTime, true))
                    return ApiResponse<PublicPayMongoRequestResponseDto>.Fail("Requested schedules cannot overlap on the same court");
            }
        }

        decimal checkoutTotal = 0;
        foreach (var schedule in request.Schedules)
        {
            var conflict = await ValidateSlotAsync(schedule.CourtId, schedule.BookingDate, schedule.StartTime, schedule.EndTime);
            if (conflict is not null) return ApiResponse<PublicPayMongoRequestResponseDto>.Fail(conflict);
            var court = await _courts.GetByIdAsync(schedule.CourtId);
            if (court is null || !court.IsActive) return ApiResponse<PublicPayMongoRequestResponseDto>.Fail("Court is not available");
            var amount = await _rates.CalculateRateAsync(schedule.StartTime, schedule.EndTime, RateType.Booking);
            if (amount <= 0) return ApiResponse<PublicPayMongoRequestResponseDto>.Fail("No active rate covers one or more selected schedules");
            checkoutTotal += amount;
        }

        checkoutTotal += request.PaddleRentalQuantity * PaddleRentalPrice;

        var submittedAt = _clock.UtcNow.UtcDateTime;
        var requestReference = $"PM-{submittedAt:yyyyMMdd}-{RandomNumberGenerator.GetInt32(0, 1_000_000):D6}";
        
        string checkoutUrl;
        try
        {
            checkoutUrl = await _payMongo.CreateLinkAsync(checkoutTotal, "Court Booking - The Dirty Kitchen", requestReference, cancellationToken);
        }
        catch (Exception ex)
        {
            return ApiResponse<PublicPayMongoRequestResponseDto>.Fail("Failed to initialize payment: " + ex.Message);
        }

        var createdRefs = new List<string>();
        foreach (var schedule in request.Schedules)
        {
            var createReq = new CreateBookingRequest(
                schedule.CourtId,
                schedule.BookingDate,
                schedule.StartTime,
                schedule.EndTime,
                request.CustomerName,
                request.Email,
                request.Phone,
                $"[PayMongoRequest:{requestReference}] {request.Notes}".Trim(),
                0,
                RateType.Booking,
                null,
                null,
                request.PaddleRentalQuantity
            );
            var res = await CreateAsync(createReq, false); 
            if (res.Success && res.Data != null) {
                createdRefs.Add(res.Data.BookingReference);
            }
        }

        return ApiResponse<PublicPayMongoRequestResponseDto>.Ok(new(requestReference, checkoutUrl, submittedAt, createdRefs));
    }

    public async Task<ApiResponse<BookingDto>> CreateAsync(CreateBookingRequest request, bool sendConfirmation = true)
    {
        var conflict = await ValidateSlotAsync(request.CourtId, request.BookingDate, request.StartTime, request.EndTime);
        if (conflict is not null) return ApiResponse<BookingDto>.Fail(conflict);
        var court = await _courts.GetByIdAsync(request.CourtId);
        if (court is null) return ApiResponse<BookingDto>.Fail("Court not found");
        var subtotal = await _rates.CalculateRateAsync(request.StartTime, request.EndTime, request.RateType);
        if (subtotal <= 0 && request.RateType != RateType.Internal) return ApiResponse<BookingDto>.Fail("No active rate covers the selected time");
        if (request.RateType == RateType.Internal) subtotal = 0;
        if (request.PaddleRentalQuantity is < 0 or > MaximumPaddleRentalQuantity) return ApiResponse<BookingDto>.Fail($"Paddle rental quantity must be between 0 and {MaximumPaddleRentalQuantity}");

        decimal discount = 0;
        if (request.PromoId.HasValue)
        {
            var promo = await _promos.GetByIdAsync(request.PromoId.Value);
            if (promo == null || !promo.IsActive) return ApiResponse<BookingDto>.Fail("Invalid or inactive promo");
            if (promo.MaxUses.HasValue && promo.CurrentUses >= promo.MaxUses.Value) return ApiResponse<BookingDto>.Fail("Promo usage limit reached");
            var promoError = ValidatePromoAvailability(promo, request.RateType);
            if (promoError is not null) return ApiResponse<BookingDto>.Fail(promoError);
            
            discount = promo.Type == DiscountType.Percentage ? (subtotal * (promo.Value / 100)) : promo.Value;
            if (discount > subtotal) discount = subtotal;
            promo.CurrentUses++;
            _promos.Update(promo);
        }

        var paddleRentalFee = request.PaddleRentalQuantity * PaddleRentalPrice;
        var total = subtotal - discount + paddleRentalFee;
        var effectiveAmountPaid = request.AmountPaid == subtotal && total <= subtotal ? total : request.AmountPaid;
        if (effectiveAmountPaid < 0) return ApiResponse<BookingDto>.Fail("Amount paid cannot be negative");
        if (effectiveAmountPaid > total) return ApiResponse<BookingDto>.Fail($"Amount paid cannot exceed the total amount of ₱{total:N2}");
        var paid = effectiveAmountPaid;
        var booking = new Booking {
            BookingReference = await GenerateReferenceAsync(), CourtId = request.CourtId,
            CustomerName = request.CustomerName.Trim(), Email = request.Email?.Trim() ?? "", Phone = request.Phone?.Trim(),
            BookingDate = request.BookingDate, StartTime = request.StartTime, EndTime = request.EndTime,
            Subtotal = subtotal, DiscountAmount = discount, PaddleRentalQuantity = request.PaddleRentalQuantity, PaddleRentalFee = paddleRentalFee,
            TotalAmount = total, AmountPaid = paid, Status = paid >= total ? BookingStatus.Paid : BookingStatus.Reserved,
            Notes = request.Notes?.Trim(), CreatedAt = _clock.UtcNow.UtcDateTime, InternalCoachProfileId = request.InternalCoachProfileId, PromoId = request.PromoId
        };
        await _bookings.AddAsync(booking); await _bookings.SaveChangesAsync();
        await AssignScheduleAsync(booking, request.RateType);
        if (sendConfirmation) await TrySendConfirmationAsync(booking, court.Name, request.RateType);
        return ApiResponse<BookingDto>.Ok(ToDto(booking, court.Name, request.RateType), "Booking created");
    }

    public async Task<ApiResponse<IEnumerable<BookingDto>>> GetAllAsync()
    {
        var courts = (await _courts.GetAllAsync()).ToDictionary(x => x.Id, x => x.Name);
        var bookingList = (await _bookings.GetAllAsync()).OrderByDescending(x => x.CreatedAt).ToList();
        var bookingIds = bookingList.Select(x => x.Id).ToHashSet();
        var trainingIds = (await _schedules.GetAllAsync()).Where(x => x.BookingId.HasValue && bookingIds.Contains(x.BookingId.Value) && x.Status == ScheduleStatus.Training).Select(x => x.BookingId!.Value).ToHashSet();
        var values = bookingList.Select(x => ToDto(x, courts.GetValueOrDefault(x.CourtId, "Court"), trainingIds.Contains(x.Id) ? RateType.Training : RateType.Booking));
        return ApiResponse<IEnumerable<BookingDto>>.Ok(values);
    }

    public async Task<ApiResponse<RevenueSummaryDto>> GetRevenueAsync(DateOnly fromDate, DateOnly throughDate)
    {
        if (fromDate > throughDate)
            return ApiResponse<RevenueSummaryDto>.Fail("From date cannot be after through date");
        if (throughDate.DayNumber - fromDate.DayNumber > 366 * 5)
            return ApiResponse<RevenueSummaryDto>.Fail("Revenue reports are limited to a five-year date range");

        var bookings = (await _bookings.FindAsync(booking =>
                booking.BookingDate >= fromDate &&
                booking.BookingDate <= throughDate &&
                booking.Status != BookingStatus.Cancelled))
            .ToList();

        var bookingIds = bookings.Select(booking => booking.Id).ToHashSet();
        var trainingIds = bookingIds.Count == 0
            ? new HashSet<long>()
            : (await _schedules.FindAsync(schedule =>
                    schedule.BookingId.HasValue &&
                    bookingIds.Contains(schedule.BookingId.Value) &&
                    schedule.Status == ScheduleStatus.Training))
                .Select(schedule => schedule.BookingId!.Value)
                .ToHashSet();

        static decimal BaseSale(Booking booking) => Math.Max(0, booking.TotalAmount - booking.PaddleRentalFee);
        static decimal Outstanding(Booking booking) => Math.Max(0, booking.TotalAmount - booking.AmountPaid);

        var daily = bookings
            .GroupBy(booking => booking.BookingDate)
            .OrderBy(group => group.Key)
            .Select(group => new RevenueDailyDto(
                group.Key,
                group.Where(booking => !trainingIds.Contains(booking.Id)).Sum(BaseSale),
                group.Where(booking => trainingIds.Contains(booking.Id)).Sum(BaseSale),
                group.Sum(booking => booking.PaddleRentalFee),
                group.Sum(booking => booking.TotalAmount),
                group.Sum(booking => booking.AmountPaid),
                group.Sum(Outstanding),
                group.Count()))
            .ToList();

        var summary = new RevenueSummaryDto(
            fromDate,
            throughDate,
            bookings.Sum(booking => booking.AmountPaid),
            bookings.Sum(booking => booking.TotalAmount),
            bookings.Sum(Outstanding),
            bookings.Where(booking => !trainingIds.Contains(booking.Id)).Sum(BaseSale),
            bookings.Where(booking => trainingIds.Contains(booking.Id)).Sum(BaseSale),
            bookings.Sum(booking => booking.PaddleRentalFee),
            bookings.Sum(booking => booking.PaddleRentalQuantity),
            bookings.Count,
            bookings.Count(booking => booking.Status == BookingStatus.Paid),
            bookings.Count(booking => booking.Status == BookingStatus.Reserved),
            bookings.Count(booking => booking.Status == BookingStatus.Completed),
            daily);

        return ApiResponse<RevenueSummaryDto>.Ok(summary);
    }

    public async Task<ApiResponse<BookingDto>> GetByIdAsync(long id)
    {
        var b = await _bookings.GetByIdAsync(id);
        if (b is null) return ApiResponse<BookingDto>.Fail("Booking not found");
        return ApiResponse<BookingDto>.Ok(ToDto(b, (await _courts.GetByIdAsync(b.CourtId))?.Name ?? "Court", await GetRateTypeAsync(id)));
    }

    public async Task<ApiResponse<BookingDto>> VerifyAsync(string bookingReference)
    {
        var normalized = bookingReference.Trim().ToUpperInvariant();
        var b = (await _bookings.FindAsync(x => x.BookingReference == normalized)).FirstOrDefault();
        if (b is null || b.Status == BookingStatus.Cancelled) return ApiResponse<BookingDto>.Fail("Booking reference is invalid or cancelled");
        return ApiResponse<BookingDto>.Ok(ToDto(b, (await _courts.GetByIdAsync(b.CourtId))?.Name ?? "Court", await GetRateTypeAsync(b.Id)), "Valid booking");
    }

    public async Task<ApiResponse<BookingDto>> UpdateAsync(long id, UpdateBookingRequest request)
    {
        var b = await _bookings.GetByIdAsync(id);
        if (b is null) return ApiResponse<BookingDto>.Fail("Booking not found");
        var rateType = await GetRateTypeAsync(id);
        var subtotal = await _rates.CalculateRateAsync(request.StartTime, request.EndTime, rateType);
        if (subtotal <= 0) return ApiResponse<BookingDto>.Fail("No active rate covers the selected time");

        decimal discount = 0;
        if (request.PromoId.HasValue)
        {
            var promo = await _promos.GetByIdAsync(request.PromoId.Value);
            if (promo == null || !promo.IsActive) return ApiResponse<BookingDto>.Fail("Invalid or inactive promo");
            
            if (b.PromoId != request.PromoId.Value) 
            {
                if (promo.MaxUses.HasValue && promo.CurrentUses >= promo.MaxUses.Value) return ApiResponse<BookingDto>.Fail("Promo usage limit reached");
                var promoError = ValidatePromoAvailability(promo, rateType);
                if (promoError is not null) return ApiResponse<BookingDto>.Fail(promoError);
                
                promo.CurrentUses++;
                _promos.Update(promo);
            }
            
            discount = promo.Type == DiscountType.Percentage ? (subtotal * (promo.Value / 100)) : promo.Value;
            if (discount > subtotal) discount = subtotal;
        } 
        else if (b.PromoId.HasValue) 
        {
            var oldPromo = await _promos.GetByIdAsync(b.PromoId.Value);
            if (oldPromo != null) {
                oldPromo.CurrentUses = Math.Max(0, oldPromo.CurrentUses - 1);
                _promos.Update(oldPromo);
            }
        }

        var paddleRentalQuantity = request.PaddleRentalQuantity ?? b.PaddleRentalQuantity;
        if (paddleRentalQuantity is < 0 or > MaximumPaddleRentalQuantity) return ApiResponse<BookingDto>.Fail($"Paddle rental quantity must be between 0 and {MaximumPaddleRentalQuantity}");
        var paddleRentalFee = paddleRentalQuantity * PaddleRentalPrice;
        var newTotal = subtotal - discount + paddleRentalFee;
        var effectiveAmountPaid = request.AmountPaid == subtotal && newTotal <= subtotal ? newTotal : request.AmountPaid;
        if (effectiveAmountPaid < 0) return ApiResponse<BookingDto>.Fail("Amount paid cannot be negative");
        if (effectiveAmountPaid > newTotal) return ApiResponse<BookingDto>.Fail($"Amount paid cannot exceed the total amount of ₱{newTotal:N2}");
        var moved = b.CourtId != request.CourtId || b.BookingDate != request.BookingDate || b.StartTime != request.StartTime || b.EndTime != request.EndTime;
        if (moved) {
            if (b.Status is not (BookingStatus.Paid or BookingStatus.Reserved)) return ApiResponse<BookingDto>.Fail("Only paid and reservation bookings can be rescheduled");
            if (b.RescheduledAt.HasValue) return ApiResponse<BookingDto>.Fail("A booking can only be rescheduled once");
            if (!CanReschedule(b)) return ApiResponse<BookingDto>.Fail("Rescheduling is available only within 24 hours after the booking was created");
            var conflict = await ValidateSlotAsync(request.CourtId, request.BookingDate, request.StartTime, request.EndTime, id);
            if (conflict is not null) return ApiResponse<BookingDto>.Fail(conflict);
            await ReleaseScheduleAsync(id);
        }
        var utcNow = _clock.UtcNow.UtcDateTime;
        b.CourtId = request.CourtId; b.BookingDate = request.BookingDate; b.StartTime = request.StartTime; b.EndTime = request.EndTime;
        b.CustomerName = request.CustomerName.Trim(); b.Email = request.Email?.Trim() ?? ""; b.Phone = request.Phone?.Trim(); b.Notes = request.Notes?.Trim();
        b.Subtotal = subtotal; b.DiscountAmount = discount; b.PaddleRentalQuantity = paddleRentalQuantity; b.PaddleRentalFee = paddleRentalFee;
        b.TotalAmount = newTotal; b.AmountPaid = effectiveAmountPaid; b.PromoId = request.PromoId;
        b.Status = request.Status; b.InternalCoachProfileId = request.InternalCoachProfileId; b.UpdatedAt = utcNow; if (moved) b.RescheduledAt = utcNow; _bookings.Update(b); await _bookings.SaveChangesAsync();
        if (moved)
        {
            await AssignScheduleAsync(b, rateType);
            await TrySendConfirmationAsync(b, (await _courts.GetByIdAsync(b.CourtId))?.Name ?? "Court", rateType, true);
        }
        return ApiResponse<BookingDto>.Ok(ToDto(b, (await _courts.GetByIdAsync(b.CourtId))?.Name ?? "Court", rateType), "Booking updated");
    }

    public async Task<ApiResponse<BookingDto>> RescheduleAsync(long id, RescheduleBookingRequest request)
    {
        var b = await _bookings.GetByIdAsync(id);
        if (b is null) return ApiResponse<BookingDto>.Fail("Booking not found");
        if (b.Status is not (BookingStatus.Paid or BookingStatus.Reserved)) return ApiResponse<BookingDto>.Fail("Only paid and reservation bookings can be rescheduled");
        if (b.RescheduledAt.HasValue) return ApiResponse<BookingDto>.Fail("A booking can only be rescheduled once");
        if (!CanReschedule(b)) return ApiResponse<BookingDto>.Fail("Rescheduling is available only within 24 hours after the booking was created");
        var rateType = await GetRateTypeAsync(id);
        var conflict = await ValidateSlotAsync(request.CourtId, request.BookingDate, request.StartTime, request.EndTime, id);
        if (conflict is not null) return ApiResponse<BookingDto>.Fail(conflict);
        var newSubtotal = await _rates.CalculateRateAsync(request.StartTime, request.EndTime, rateType);
        if (newSubtotal <= 0 && rateType != RateType.Internal) return ApiResponse<BookingDto>.Fail("No active rate covers the selected time");
        if (rateType == RateType.Internal) newSubtotal = 0;
        var adjustedDiscount = Math.Min(b.DiscountAmount, newSubtotal);
        var newTotal = newSubtotal - adjustedDiscount + b.PaddleRentalFee;
        if (b.AmountPaid > newTotal) return ApiResponse<BookingDto>.Fail($"The existing amount paid cannot exceed the new total amount of ₱{newTotal:N2}");
        await ReleaseScheduleAsync(id);
        var utcNow = _clock.UtcNow.UtcDateTime;
        b.CourtId = request.CourtId; b.BookingDate = request.BookingDate; b.StartTime = request.StartTime; b.EndTime = request.EndTime;
        b.Subtotal = newSubtotal; b.DiscountAmount = adjustedDiscount; b.TotalAmount = newTotal; b.UpdatedAt = utcNow; b.RescheduledAt = utcNow; b.ReminderSentAt = null;
        b.Status = b.AmountPaid >= b.TotalAmount ? BookingStatus.Paid : BookingStatus.Reserved;
        _bookings.Update(b); await _bookings.SaveChangesAsync(); await AssignScheduleAsync(b, rateType);
        var courtName = (await _courts.GetByIdAsync(b.CourtId))?.Name ?? "Court";
        await TrySendConfirmationAsync(b, courtName, rateType, true);
        return ApiResponse<BookingDto>.Ok(ToDto(b, courtName, rateType), "Booking rescheduled");
    }

    public async Task<ApiResponse<BookingDto>> AddPaddleRentalAsync(long id, int quantity)
    {
        if (quantity is < 1 or > MaximumPaddleRentalQuantity)
            return ApiResponse<BookingDto>.Fail($"Paddle rental quantity must be between 1 and {MaximumPaddleRentalQuantity}");

        var booking = await _bookings.GetByIdAsync(id);
        if (booking is null) return ApiResponse<BookingDto>.Fail("Booking not found");
        if (booking.Status is not (BookingStatus.Paid or BookingStatus.Reserved))
            return ApiResponse<BookingDto>.Fail("Paddle rentals can only be added to active paid or reservation bookings");
        if (booking.PaddleRentalQuantity + quantity > MaximumPaddleRentalQuantity)
            return ApiResponse<BookingDto>.Fail($"A booking can have at most {MaximumPaddleRentalQuantity} paddle rentals");

        var additionalFee = quantity * PaddleRentalPrice;
        booking.PaddleRentalQuantity += quantity;
        booking.PaddleRentalFee = booking.PaddleRentalQuantity * PaddleRentalPrice;
        booking.TotalAmount = booking.Subtotal - booking.DiscountAmount + booking.PaddleRentalFee;
        booking.AmountPaid += additionalFee;
        booking.Status = booking.AmountPaid >= booking.TotalAmount ? BookingStatus.Paid : BookingStatus.Reserved;
        booking.UpdatedAt = _clock.UtcNow.UtcDateTime;
        _bookings.Update(booking);
        await _bookings.SaveChangesAsync();

        var courtName = (await _courts.GetByIdAsync(booking.CourtId))?.Name ?? "Court";
        return ApiResponse<BookingDto>.Ok(ToDto(booking, courtName, await GetRateTypeAsync(booking.Id)), $"{quantity} paid paddle rental{(quantity == 1 ? "" : "s")} added");
    }

    public async Task<ApiResponse<bool>> ConfirmAsync(long id)
    {
        var booking = await _bookings.GetByIdAsync(id);
        if (booking is null) return ApiResponse<bool>.Fail("Booking not found");
        if (booking.Status != BookingStatus.Reserved) return ApiResponse<bool>.Fail("Only reservations can be marked as paid");
        return await SetStatusAsync(id, BookingStatus.Paid);
    }
    public Task<ApiResponse<bool>> CompleteAsync(long id) => SetStatusAsync(id, BookingStatus.Completed);

    public async Task<ApiResponse<bool>> CancelAsync(long id)
    {
        var booking = await _bookings.GetByIdAsync(id);
        if (booking is null) return ApiResponse<bool>.Fail("Booking not found");
        if (booking.Status != BookingStatus.Reserved) return ApiResponse<bool>.Fail("Only reservations can be cancelled");
        var result = await SetStatusAsync(id, BookingStatus.Cancelled);
        if (result.Success) await ReleaseScheduleAsync(id);
        return result;
    }

    public async Task<ApiResponse<bool>> DeleteAsync(long id)
    {
        var booking = await _bookings.GetByIdAsync(id);
        if (booking is null) return ApiResponse<bool>.Fail("Booking not found");
        if (booking.Status != BookingStatus.Cancelled) return ApiResponse<bool>.Fail("Only cancelled bookings can be deleted");
        await ReleaseScheduleAsync(id);
        foreach (var notification in await _notifications.FindAsync(x => x.BookingId == id)) _notifications.Delete(notification);
        await _notifications.SaveChangesAsync();
        _bookings.Delete(booking);
        await _bookings.SaveChangesAsync();
        return ApiResponse<bool>.Ok(true, "Booking permanently deleted");
    }

    public async Task<ApiResponse<bool>> AttachReceiptAsync(long id, string fileName, string contentType)
    {
        var booking = await _bookings.GetByIdAsync(id);
        if (booking is null) return ApiResponse<bool>.Fail("Booking not found");
        booking.ReceiptFileName = fileName;
        booking.ReceiptContentType = contentType;
        booking.UpdatedAt = _clock.UtcNow.UtcDateTime;
        _bookings.Update(booking);
        await _bookings.SaveChangesAsync();
        return ApiResponse<bool>.Ok(true);
    }

    public async Task<ApiResponse<bool>> SendReceiptConfirmationAsync(long id, byte[] receiptBytes, string receiptFileName, string receiptContentType, CancellationToken cancellationToken = default)
    {
        var booking = await _bookings.GetByIdAsync(id);
        if (booking is null) return ApiResponse<bool>.Fail("Booking not found");
        var courtName = (await _courts.GetByIdAsync(booking.CourtId))?.Name ?? "Court";
        try
        {
            await _email.SendBookingRequestAsync(booking, courtName, receiptBytes, receiptFileName, receiptContentType, cancellationToken);
            return ApiResponse<bool>.Ok(true, "Booking and payment receipt emails sent");
        }
        catch
        {
            return ApiResponse<bool>.Fail("The booking was saved, but the confirmation email could not be sent");
        }
    }

    public async Task<ApiResponse<ReceiptInfoDto>> GetReceiptInfoAsync(long id)
    {
        var booking = await _bookings.GetByIdAsync(id);
        if (booking is null || string.IsNullOrWhiteSpace(booking.ReceiptFileName)) return ApiResponse<ReceiptInfoDto>.Fail("Receipt not found");
        return ApiResponse<ReceiptInfoDto>.Ok(new(booking.ReceiptFileName, booking.ReceiptContentType ?? "application/octet-stream"));
    }

    private async Task<ApiResponse<bool>> SetStatusAsync(long id, BookingStatus status)
    {
        var b = await _bookings.GetByIdAsync(id);
        if (b is null) return ApiResponse<bool>.Fail("Booking not found");
        b.Status = status; if (status == BookingStatus.Paid) b.AmountPaid = b.TotalAmount;
        b.UpdatedAt = _clock.UtcNow.UtcDateTime; _bookings.Update(b); await _bookings.SaveChangesAsync(); return ApiResponse<bool>.Ok(true);
    }

    private async Task<string?> ValidateSlotAsync(int courtId, DateOnly date, TimeOnly start, TimeOnly end, long? excludedBookingId = null)
    {
        if (date < _clock.ManilaToday) return "Booking date cannot be in the past";
        var manilaNow = _clock.ToManilaTime(_clock.UtcNow);
        if (date == DateOnly.FromDateTime(manilaNow.DateTime) && start <= TimeOnly.FromDateTime(manilaNow.DateTime))
            return "Start time has already passed in Manila";
        if (start == end || Minutes(end, true) - Minutes(start, false) < 60) return "End time must be at least 1 hour after start time";
        var court = await _courts.GetByIdAsync(courtId);
        if (court is null || !court.IsActive) return "Court is not active";
        var startMinutes = Minutes(start, false); var endMinutes = Minutes(end, true);
        var slots = (await _timeSlots.GetAllAsync()).Where(t => t.IsActive && Minutes(t.StartTime, false) >= startMinutes && Minutes(t.EndTime, true) <= endMinutes).OrderBy(t => t.SortOrder).ToList();
        if (slots.Count == 0 || slots.First().StartTime != start || slots.Last().EndTime != end) return "Select complete configured time slots";
        if (slots.Any(s => !IsWithinCourtHours(s, court))) return "Selected time is outside the court schedule";
        var ids = slots.Select(x => x.Id).ToHashSet();
        var occupied = await _schedules.FindAsync(s => s.CourtId == courtId && s.ScheduleDate == date && ids.Contains(s.TimeSlotId) && s.Status != ScheduleStatus.Available && (!excludedBookingId.HasValue || s.BookingId != excludedBookingId));
        return occupied.Any() ? "One or more selected time slots are no longer available" : null;
    }

    private async Task AssignScheduleAsync(Booking b, RateType rateType = RateType.Booking)
    {
        var scheduleStatus = rateType == RateType.Training ? ScheduleStatus.Training : ScheduleStatus.Booked;
        var startMinutes = Minutes(b.StartTime, false); var endMinutes = Minutes(b.EndTime, true);
        var slots = (await _timeSlots.GetAllAsync()).Where(t => Minutes(t.StartTime, false) >= startMinutes && Minutes(t.EndTime, true) <= endMinutes).ToList();
        foreach (var slot in slots) {
            var s = (await _schedules.FindAsync(x => x.CourtId == b.CourtId && x.ScheduleDate == b.BookingDate && x.TimeSlotId == slot.Id)).FirstOrDefault();
            var utcNow = _clock.UtcNow.UtcDateTime;
            if (s is null) await _schedules.AddAsync(new Schedule { CourtId = b.CourtId, ScheduleDate = b.BookingDate, TimeSlotId = slot.Id, Status = scheduleStatus, BookingId = b.Id, Notes = b.Notes, CreatedAt = utcNow, UpdatedAt = utcNow });
            else { s.Status = scheduleStatus; s.BookingId = b.Id; s.Notes = b.Notes; s.UpdatedAt = utcNow; _schedules.Update(s); }
        }
        await _schedules.SaveChangesAsync();
    }

    private async Task ReleaseScheduleAsync(long bookingId)
    {
        foreach (var s in await _schedules.FindAsync(x => x.BookingId == bookingId)) _schedules.Delete(s);
        await _schedules.SaveChangesAsync();
    }

    private async Task<string> GenerateReferenceAsync()
    {
        for (var attempt = 0; attempt < 20; attempt++) { var value = $"TDK-{RandomNumberGenerator.GetInt32(0, 10_000_000):D7}"; if (!(await _bookings.FindAsync(x => x.BookingReference == value)).Any()) return value; }
        throw new InvalidOperationException("Unable to allocate a unique booking reference");
    }

    private async Task<RateType> GetRateTypeAsync(long bookingId) =>
        (await _schedules.FindAsync(x => x.BookingId == bookingId)).Any(x => x.Status == ScheduleStatus.Training)
            ? RateType.Training
            : RateType.Booking;

    private async Task TrySendConfirmationAsync(Booking booking, string courtName, RateType rateType, bool isRescheduled = false)
    {
        string? coachEmail = null;
        string? coachName = null;
        if (rateType == RateType.Training && booking.InternalCoachProfileId.HasValue)
        {
            var coach = await _internalCoaches.GetByIdAsync(booking.InternalCoachProfileId.Value);
            if (coach?.IsActive == true && coach.Type == InternalCoachType.Coach)
            {
                coachEmail = coach.Email;
                coachName = coach.Name;
            }
        }

        try { await _email.SendBookingConfirmationAsync(booking, courtName, coachEmail, coachName, isRescheduled); }
        catch { }
    }
    private bool CanReschedule(Booking booking)
    {
        // SQL Server may materialize a UTC DateTime with Kind=Unspecified, so restore
        // the storage contract before comparing it with the current UTC instant.
        var createdAtUtc = booking.CreatedAt.Kind == DateTimeKind.Utc
            ? booking.CreatedAt
            : DateTime.SpecifyKind(booking.CreatedAt, DateTimeKind.Utc);
        var nowUtc = _clock.UtcNow.UtcDateTime;

        return !booking.RescheduledAt.HasValue && nowUtc >= createdAtUtc && nowUtc <= createdAtUtc.AddHours(24);
    }
    private static bool IsWithinCourtHours(TimeSlot slot, Court court) => slot.StartTime >= court.OpenTime && (court.CloseTime == TimeOnly.MinValue || slot.EndTime <= court.CloseTime);
    private static int Minutes(TimeOnly value, bool midnightAsEnd) => value == TimeOnly.MinValue && midnightAsEnd ? 1440 : value.Hour * 60 + value.Minute;
    private static BookingDto ToDto(Booking b, string court, RateType bookingType = RateType.Booking) => new(b.Id, b.BookingReference, b.CourtId, court, b.CustomerName, b.Email, b.Phone, b.BookingDate, b.StartTime, b.EndTime, b.Subtotal, b.DiscountAmount, b.TotalAmount, b.AmountPaid, b.Status == BookingStatus.Cancelled ? 0 : Math.Max(0, b.TotalAmount - b.AmountPaid), b.Status, b.Notes, b.CreatedAt, bookingType, !string.IsNullOrWhiteSpace(b.ReceiptFileName), b.RescheduledAt, b.InternalCoachProfileId, b.PromoId, b.PaddleRentalQuantity, b.PaddleRentalFee);

    private string? ValidatePromoAvailability(Promo promo, RateType rateType)
    {
        var today = DateOnly.FromDateTime(_clock.ToManilaTime(_clock.UtcNow).DateTime);
        if (promo.StartDate.HasValue && DateOnly.FromDateTime(promo.StartDate.Value) > today) return "Promo is not yet valid";
        if (promo.EndDate.HasValue && DateOnly.FromDateTime(promo.EndDate.Value) < today) return "Promo has expired";
        if (promo.AppliesTo.HasValue && promo.AppliesTo.Value != rateType) return $"Promo is not available for {rateType} bookings";
        return null;
    }
}
