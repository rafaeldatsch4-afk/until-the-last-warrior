import type Phaser from 'phaser';

const loaders: Record<string, () => Promise<{ default: new () => Phaser.Scene }>> = {
  ModeSelectScene: () => import('../scenes/ModeSelectScene'),
  CharacterSelectScene: () => import('../scenes/CharacterSelectScene'),
  TournamentScene: () => import('../scenes/TournamentScene'),
  BattleScene: () => import('../scenes/BattleScene'),
  StoreScene: () => import('../scenes/StoreScene'),
  MultiplayerLobbyScene: () => import('../scenes/MultiplayerLobbyScene'),
  CharacterCreatorScene: () => import('../scenes/CharacterCreatorScene'),
  LeaderboardScene: () => import('../scenes/LeaderboardScene'),
  StoryHubScene: () => import('../scenes/StoryHubScene'),
  ProfileScene: () => import('../scenes/ProfileScene'),
};

// Imports deduplicate across transitions; failed loads can be retried.
const pending = new Map<string, Promise<{ default: new () => Phaser.Scene }>>();
export async function ensureScene(scene: Phaser.Scene, key: string): Promise<void> {
  if (scene.scene.manager.keys[key]) return;
  const loader = loaders[key];
  if (!loader) throw new Error(`Unknown scene: ${key}`);
  let request = pending.get(key);
  if (!request) {
    request = loader().catch(error => { pending.delete(key); throw error; });
    pending.set(key, request);
  }
  const module = await request;
  if (!scene.scene.manager.keys[key]) scene.scene.add(key, module.default, false);
}
