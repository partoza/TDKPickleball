import sys
file_path = r'c:\Users\r3x\TheDirtyKitchen\frontend\src\pages\admin\SchedulePage.tsx'
with open(file_path, 'r', encoding='utf-8') as f:
    content = f.read()
content = content.replace('import { useAuth } from \'@/hooks/useAuth\';', 'import { useAuth } from \'@/hooks/useAuth\';\nimport { PaddleIcon } from \'@/components/ui/paddle-icon\';')
content = content.replace('Paddle Rental</label>', 'flex items-center gap-1.5"><PaddleIcon className="w-4 h-4" /> Paddle Rental</label>')
content = content.replace('<p className="text-sm font-semibold">Selkirk Paddle', '<p className="text-sm font-semibold flex items-center gap-1.5"><PaddleIcon className="w-4 h-4" /> Selkirk Paddle')
with open(file_path, 'w', encoding='utf-8') as f:
    f.write(content)
print('Done!')
