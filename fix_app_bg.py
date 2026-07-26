import re

with open('App.tsx', 'r') as f:
    content = f.read()

content = content.replace('bg-transparent', 'bg-[#071026]')

with open('App.tsx', 'w') as f:
    f.write(content)

with open('components/GameCanvas.tsx', 'r') as f:
    content = f.read()

content = content.replace('bg-transparent', 'bg-[#071026]')

with open('components/GameCanvas.tsx', 'w') as f:
    f.write(content)

print("Updated App.tsx and GameCanvas.tsx")
