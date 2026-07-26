import re

with open('game/scenes/StoryHubScene.ts', 'r') as f:
    content = f.read()

# Let's replace the whole create() method with a better one.
# It might be easier to rewrite the file completely since there are only ~200 lines.
