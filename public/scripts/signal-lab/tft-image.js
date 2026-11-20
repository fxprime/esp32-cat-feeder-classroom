// A tiny RGB565 landscape streamed in display order, from top left to bottom right.
const width = 16;
const height = 10;
const sky = 0x6D9F;
const cloud = 0xEFFF;
const sun = 0xF988;
const mountain = 0x5477;
const sunnySlope = 0x5D59;
const meadow = 0x5E45;
const shadow = 0x34E4;
const river = 0x2DBF;

const ridge = [6, 6, 5, 5, 6, 6, 7, 6, 5, 4, 4, 3, 4, 5, 6, 6];
const foothills = [8, 8, 7, 7, 7, 8, 8, 9, 8, 7, 7, 8, 7, 7, 6, 7];

function colorAt(x, y) {
  if (y >= 8 && x >= 7 - (y - 8) && x <= 8) return river;
  if (y >= foothills[x]) return (x + y * 2) % 4 === 0 ? shadow : meadow;
  if (y >= ridge[x]) return (x + y) % 3 === 0 ? sunnySlope : mountain;
  if ((x - 3) ** 2 + (y - 2) ** 2 <= 2) return sun;
  if ((y === 1 && x >= 8 && x <= 11) || (y === 2 && x >= 7 && x <= 10)) return cloud;
  return sky;
}

const colors = Array.from({ length: width * height }, (_, index) =>
  colorAt(index % width, Math.floor(index / width)),
);

export const tftImage = { width, height, colors };

function rgbCss(word) {
  const red = Math.round((word >> 11) * 255 / 31);
  const green = Math.round(((word >> 5) & 63) * 255 / 63);
  const blue = Math.round((word & 31) * 255 / 31);
  return `rgb(${red},${green},${blue})`;
}

export function tftImageMarkup() {
  const paths = new Map();
  for (const [index, color] of colors.entries()) {
    const cell = `M${index % width} ${Math.floor(index / width)}h1v1h-1Z`;
    paths.set(color, (paths.get(color) ?? "") + cell);
  }
  return [...paths].map(([color, path]) => `<path d="${path}" fill="${rgbCss(color)}"/>`).join("");
}

export function tftRevealPath(painted) {
  const rows = Math.floor(painted / width);
  const remainder = painted % width;
  return `M0 0h${width}v${rows}H0Z M0 ${rows}h${remainder}v1H0Z`;
}
