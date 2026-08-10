import re

with open('game/types.ts', 'r') as f:
    content = f.read()

old_str = """  name: string;
  price: number;"""

new_str = """  name: string;
  description?: string;
  price: number;"""

content = content.replace(old_str, new_str)

with open('game/types.ts', 'w') as f:
    f.write(content)
print("Updated types.ts")
