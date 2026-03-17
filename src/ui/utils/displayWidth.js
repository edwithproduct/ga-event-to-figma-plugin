const DISPLAY_MAX_W = 400;

export function getDisplayWidth(frameWidth) {
  return Math.min(frameWidth, DISPLAY_MAX_W);
}
