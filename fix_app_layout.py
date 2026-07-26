import re

with open('App.tsx', 'r') as f:
    content = f.read()

# Fix the main wrapper
content = content.replace('<main className="flex-1 flex items-center justify-center w-full p-0 relative overflow-hidden">', '<main className="flex-1 w-full p-0 relative overflow-hidden">')

# Fix the div wrapping GameCanvas
content = content.replace('<div className="relative overflow-hidden bg-[#071026] flex items-center justify-center w-full h-full">', '<div className="relative overflow-hidden bg-[#071026] w-full h-full">')

with open('App.tsx', 'w') as f:
    f.write(content)

with open('components/GameCanvas.tsx', 'r') as f:
    content = f.read()

# Fix game-container
content = content.replace('className="w-full h-full bg-[#071026] overflow-hidden flex items-center justify-center touch-none overscroll-none"', 'className="w-full h-full bg-[#071026] overflow-hidden touch-none overscroll-none"')

with open('components/GameCanvas.tsx', 'w') as f:
    f.write(content)

print("Updated App.tsx and GameCanvas.tsx")
