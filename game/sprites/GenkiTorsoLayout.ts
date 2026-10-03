// Reviewed source anchors in each 512px cell: neck centre/top and garment hem.
// The complete torso (including shoulders and arms) is transformed as one piece.
import { GI_SEAM } from './CustomSeams';
export const GENKI_TORSOS: Record<string, { sheet: 'a' | 'b'; cell: number; neck: readonly [number, number]; hem: number }> = {
  goku: { sheet: 'a', cell: 0, neck: [267, 199], hem: 507 },
  spiderman: { sheet: 'a', cell: 1, neck: [254, 198], hem: 502 },
  jotaro: { sheet: 'a', cell: 2, neck: [254, 185], hem: 503 },
  vegeta: { sheet: 'a', cell: 3, neck: [267, 170], hem: 478 },
  saitama: { sheet: 'a', cell: 4, neck: [254, 163], hem: 474 },
  chapolim: { sheet: 'b', cell: 0, neck: [254, 197], hem: 469 },
  muscle: { sheet: 'b', cell: 1, neck: [254, 200], hem: 474 },
  naruto: { sheet: 'b', cell: 2, neck: [254, 186], hem: 477 },
  sasuke: { sheet: 'b', cell: 3, neck: [250, 190], hem: 448 },
  luffy: { sheet: 'b', cell: 4, neck: [250, 181], hem: 452 },
};

export function genkiTorsoRect(key: string, neckX: number) {
  const pose = GENKI_TORSOS[key] ?? GENKI_TORSOS.goku;
  const scale = key==='goku'
    ? (GI_SEAM.worldY-64)/(GI_SEAM.raisedBeltBottom-pose.neck[1])
    : 38 / (pose.hem - pose.neck[1]);
  return { x: neckX - pose.neck[0] * scale, y: 64 - pose.neck[1] * scale,
    width: 512 * scale, height: 512 * scale };
}
