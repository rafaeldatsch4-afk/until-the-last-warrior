import re
import os
import glob

# For all characters, if attackType == 'melee' or 'ki', we return false, or we just remove the implementation if we can?
# Wait, if we return false, BattleScene handles it!
# But we still want custom specials.
