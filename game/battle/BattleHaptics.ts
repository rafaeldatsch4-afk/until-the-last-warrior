export class BattleHaptics {
  private static isSupported(): boolean {
    return typeof window !== "undefined" && !!window.navigator && !!window.navigator.vibrate;
  }

  static block(): void {
    if (!this.isSupported()) return;
    try { window.navigator.vibrate(20); } catch (e) {}
  }

  static clash(): void {
    if (!this.isSupported()) return;
    try { window.navigator.vibrate([30, 40, 30]); } catch (e) {}
  }

  static hit(isCritical: boolean): void {
    if (!this.isSupported()) return;
    try { window.navigator.vibrate(isCritical ? 100 : 50); } catch (e) {}
  }
}
