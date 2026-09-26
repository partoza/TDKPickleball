import sys
file_path = r'c:\Users\r3x\TheDirtyKitchen\frontend\src\pages\admin\RevenuePage.tsx'
with open(file_path, 'r', encoding='utf-8') as f:
    content = f.read()
content = content.replace('<TableHead>Paddles</TableHead>', '<TableHead>Paddles</TableHead><TableHead>Discounts</TableHead>')
content = content.replace('<TableCell>{money(day.paddleRentalSales)}</TableCell>', '<TableCell>{money(day.paddleRentalSales)}</TableCell><TableCell className="text-rose-600">{money(-day.promoDiscounts)}</TableCell>')
with open(file_path, 'w', encoding='utf-8') as f:
    f.write(content)
print('Done!')
