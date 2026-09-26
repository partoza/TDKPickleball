import sys
file_path = r'c:\Users\r3x\TheDirtyKitchen\frontend\src\pages\admin\BookingsPage.tsx'
with open(file_path, 'r', encoding='utf-8') as f:
    content = f.read()
content = content.replace('import { useAuth } from \'@/hooks/useAuth\';', 'import { useAuth } from \'@/hooks/useAuth\';\nimport { PaddleIcon } from \'@/components/ui/paddle-icon\';')
content = content.replace('Paddle Rental</label>', 'flex items-center gap-1.5"><PaddleIcon className="w-4 h-4" /> Paddle Rental</label>')
content = content.replace('<p className="text-sm font-semibold">Selkirk Paddle', '<p className="text-sm font-semibold flex items-center gap-1.5"><PaddleIcon className="w-4 h-4" /> Selkirk Paddle')
content = content.replace('k={Selkirk Paddle Rental', 'k={<div className="flex items-center gap-1.5"><PaddleIcon className="w-3.5 h-3.5" /> Selkirk Paddle Rental</div>}')
content = content.replace('<p className="font-semibold">Selkirk Paddle</p>', '<p className="font-semibold flex items-center gap-1.5"><PaddleIcon className="w-4 h-4" /> Selkirk Paddle</p>')
content = content.replace('<Plus className="mr-1 h-3.5 w-3.5" /> Paddle', '<PaddleIcon className="mr-1.5 h-3.5 w-3.5" forceLight /> Paddle')
with open(file_path, 'w', encoding='utf-8') as f:
    f.write(content)
print('Done!')
