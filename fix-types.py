import sys
file_path = r'c:\Users\r3x\TheDirtyKitchen\frontend\src\types\index.ts'
with open(file_path, 'r', encoding='utf-8') as f:
    content = f.read()
content = content.replace('paddleRentalSales: number;', 'paddleRentalSales: number;\n  promoDiscounts: number;\n  promosAppliedCount: number;')
with open(file_path, 'w', encoding='utf-8') as f:
    f.write(content)
print('Done!')
