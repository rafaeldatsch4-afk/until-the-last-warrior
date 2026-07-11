export type VibrationPattern = "light" | "medium" | "heavy" | "critical" | "clash" | "super" | "beam_charge" | "beam_fire";

const PATTERNS: Record<VibrationPattern, number | number[]> = {
  light: 20,
  medium: 50,
  heavy: 100,
  critical: [50, 30, 100],
  clash: [30, 40, 30],
  super: [100, 50, 100, 50, 200],
  beam_charge: [20, 20, 20, 20, 20],
  beam_fire: [150, 30, 150, 30, 300]
};

export function triggerVibration(pattern: VibrationPattern | number | number[]) {
  if (typeof window !== "undefined" && !!window.navigator && !!window.navigator.vibrate) {
    try {
      const p = typeof pattern === "string" ? PATTERNS[pattern] : pattern;
      window.navigator.vibrate(p);
    } catch (e) {
      console.warn("Vibration failed", e);
    }
  }
}
