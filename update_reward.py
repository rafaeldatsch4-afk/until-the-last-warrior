import re

with open('game/battle/BattleReward.ts', 'r') as f:
    content = f.read()

# Replace AchievementSystem.addWin() with the conditional version
old_add_win = """        s.gameState.coins += coinsEarned;
        AchievementSystem.addWin();
        (window as any).UTLW.save();"""
new_add_win = """        s.gameState.coins += coinsEarned;
        if (s.gameState.gameMode !== "training") {
          AchievementSystem.addWin();
        }
        (window as any).UTLW.save();"""
content = content.replace(old_add_win, new_add_win)

# Replace the dispatchEvent condition
old_dispatch = """    if (s.gameState.gameMode !== "local_pvp") {
      window.dispatchEvent(
        new CustomEvent("battle-ended", {"""
new_dispatch = """    if (s.gameState.gameMode !== "local_pvp" && s.gameState.gameMode !== "training") {
      window.dispatchEvent(
        new CustomEvent("battle-ended", {"""
content = content.replace(old_dispatch, new_dispatch)

with open('game/battle/BattleReward.ts', 'w') as f:
    f.write(content)

print("Updated BattleReward.ts")
