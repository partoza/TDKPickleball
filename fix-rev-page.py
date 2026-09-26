import sys
file_path = r'c:\Users\r3x\TheDirtyKitchen\frontend\src\pages\admin\RevenuePage.tsx'
with open(file_path, 'r', encoding='utf-8') as f:
    content = f.read()
content = content.replace('<div className="grid gap-4 lg:grid-cols-3">', '<div className="grid gap-4 sm:grid-cols-2 xl:grid-cols-4">')
old_line = '<SalesCard label="Paddle rentals" value={revenue.paddleRentalSales} color="bg-emerald-500" note={${revenue.paddleRentalCount} paddle rental} />'
new_line = old_line + '\n            <SalesCard label="Promo discounts" value={-revenue.promoDiscounts} color="bg-rose-500" note={${revenue.promosAppliedCount} promo applied} />'
content = content.replace(old_line, new_line)
with open(file_path, 'w', encoding='utf-8') as f:
    f.write(content)
print('Done!')
