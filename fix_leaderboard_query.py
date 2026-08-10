import re

with open('game/scenes/LeaderboardScene.ts', 'r') as f:
    content = f.read()

content = content.replace(
    'import { collection, onSnapshot } from "firebase/firestore";',
    'import { collection, onSnapshot, query, orderBy, limit } from "firebase/firestore";'
)

old_load = """  loadLeaderboardLive() {
    const usersRef = collection(db, "leaderboard_public");
    
    // Live update onSnapshot
    this.unsubscribe = onSnapshot(usersRef, (snapshot) => {
       this.players = [];
       snapshot.forEach(doc => {
           this.players.push(doc.data());
       });
       this.renderList();
    }, (error) => {
       console.error("Erro no Leaderboard:", error);
       if (this.loadingText) this.loadingText.setText("Erro ao carregar ranking.");
    });
  }"""

new_load = """  loadLeaderboardLive() {
    const usersRef = collection(db, "leaderboard_public");
    const topPlayersQuery = query(usersRef, orderBy("wins", "desc"), limit(10));
    
    // Live update onSnapshot
    this.unsubscribe = onSnapshot(topPlayersQuery, (snapshot) => {
       this.players = [];
       snapshot.forEach(doc => {
           this.players.push(doc.data());
       });
       this.renderList();
    }, (error) => {
       console.error("Erro no Leaderboard:", error);
       if (this.loadingText) this.loadingText.setText("Erro ao carregar ranking.");
    });
  }"""

content = content.replace(old_load, new_load)

with open('game/scenes/LeaderboardScene.ts', 'w') as f:
    f.write(content)

print("Updated LeaderboardScene")
