/** Shared pixel-art head for base Itachi and the smaller figure inside Susanoo.
 * Half-unit strokes become one texture pixel at the existing sprite scale (2).
 * Coordinates stay anchored to the original neck at x=16, y=13.
 */
export function drawItachiFace(
  rect: (x: number, y: number, w: number, h: number, color: number) => void,
  expression: 'calm' | 'attack' | 'defend',
) {
  const ink = 0x17171d;
  const hair = 0x171820;
  const hairLight = 0x30313c;
  const skin = 0xefcfbb;
  const light = 0xf8dfca;
  const shade = 0xc39b8b;
  const crease = 0x997c79;
  const p = (x: number, y: number, color: number) => rect(x, y, 0.5, 0.5, color);

  // Rounded crown and long, close-fitting black hair behind the cheeks.
  rect(13, 1, 6, 0.5, ink);
  rect(11.5, 1.5, 9, 1, hair);
  rect(10.5, 2.5, 11, 3, hair);
  rect(10, 4, 2, 8, hair);
  rect(20, 4, 2, 8, hair);
  rect(10.5, 11, 1, 3, hair);
  rect(20.5, 11, 1, 3, hair);

  // Long face with a stepped, tapered jaw instead of a rectangular skin block.
  rect(12, 5, 8, 5.5, skin);
  rect(12.5, 10.5, 7, 1, skin);
  rect(13, 11.5, 6, 1, skin);
  rect(14, 12.5, 4, 0.5, shade);
  rect(14.5, 13, 3, 0.5, skin);
  rect(15, 13.5, 2, 0.5, shade);
  rect(12, 6, 0.5, 4.5, shade);
  rect(19.5, 6, 0.5, 4.5, shade);
  rect(13, 5.5, 6, 1, light);
  rect(15.5, 7, 1, 3, light);

  // Muted steel protector: fine leaf mark and the horizontal renegade scratch.
  rect(11, 3.5, 10, 2, 0x242530);
  rect(12.5, 3.5, 7, 2, 0x7e8794);
  rect(13, 3.5, 6, 0.5, 0xbec6cc);
  rect(13, 4, 6, 1, 0xa4aeba);
  p(12.5, 4, ink); p(19, 4, ink);
  p(15.5, 4, 0x434a56); p(16, 3.5, 0x434a56);
  p(16.5, 4.5, 0x434a56);
  rect(13.5, 4.5, 5, 0.5, 0x343640);

  // Fine brows, dark upper lids and narrow almond eyes. Red is confined to the iris.
  rect(12.5, 6.5, 2, 0.5, hair);
  p(14.5, 7, hair);
  rect(17.5, 6.5, 2, 0.5, hair);
  p(17, 7, hair);
  rect(12.5, 7.5, 2.5, 0.5, ink);
  rect(17, 7.5, 2.5, 0.5, ink);
  rect(13, 8, 2, 0.5, 0xe1d6cf);
  rect(17, 8, 2, 0.5, 0xe1d6cf);
  rect(14, 8, 1, 0.5, 0xac2934);
  rect(17, 8, 1, 0.5, 0xac2934);
  p(14.5, 8, 0x391c27); p(17, 8, 0x391c27);
  p(13, 8.5, shade); p(18.5, 8.5, shade);

  // The two characteristic diagonal creases start at the inner eye corners.
  p(14.5, 9, crease); p(14, 9.5, crease); p(13.5, 10, crease);
  p(17, 9, crease); p(17.5, 9.5, crease); p(18, 10, crease);
  p(15.5, 10, shade); p(16, 10.5, shade);
  rect(15, 11.5, 2, 0.5, expression === 'attack' ? 0x704846 : 0x886761);
  if (expression === 'attack') rect(15.5, 12, 1, 0.5, 0x4a3035);
  if (expression === 'defend') rect(15.5, 11.5, 1, 0.5, 0xd9c4b7);

  // Centre-parted bangs cross the plate edges and taper beside the jaw.
  rect(12, 2, 3.5, 1, hair);
  rect(16.5, 2, 3.5, 1, hair);
  rect(11.5, 3, 1.5, 3, hair);
  rect(19, 3, 1.5, 3, hair);
  rect(11.5, 5, 1, 5.5, hair);
  rect(19.5, 5, 1, 5.5, hair);
  rect(12, 10, 0.5, 2.5, hair);
  rect(19.5, 10, 0.5, 2.5, hair);
  p(12.5, 12.5, hair); p(19, 12.5, hair);
  rect(12.5, 2.5, 1.5, 0.5, hairLight);
  rect(18, 2.5, 1.5, 0.5, hairLight);
  rect(11.5, 6, 0.5, 3, hairLight);
  rect(20, 5.5, 0.5, 3, hairLight);
}
