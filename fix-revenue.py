import sys
file_path = r'c:\Users\r3x\TheDirtyKitchen\backend\TDK.Application\Services\BookingService.cs'
with open(file_path, 'r', encoding='utf-8') as f:
    content = f.read()
content = content.replace('group.Sum(booking => booking.PaddleRentalFee),', 'group.Sum(booking => booking.PaddleRentalFee),\n                group.Sum(booking => booking.DiscountAmount),\n                group.Count(booking => booking.PromoId.HasValue),')
content = content.replace('bookings.Sum(booking => booking.PaddleRentalFee),', 'bookings.Sum(booking => booking.PaddleRentalFee),\n            bookings.Sum(booking => booking.DiscountAmount),\n            bookings.Count(booking => booking.PromoId.HasValue),')
with open(file_path, 'w', encoding='utf-8') as f:
    f.write(content)
print('Done!')
