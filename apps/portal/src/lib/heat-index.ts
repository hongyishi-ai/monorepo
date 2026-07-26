export function calculateHeatIndexCelsius(
  temperature: number,
  humidity: number,
) {
  const tempF = temperature * (9 / 5) + 32;
  let heatIndexF =
    -42.379 +
    2.04901523 * tempF +
    10.14333127 * humidity -
    0.22475541 * tempF * humidity -
    0.00683783 * tempF * tempF -
    0.05481717 * humidity * humidity +
    0.00122874 * tempF * tempF * humidity +
    0.00085282 * tempF * humidity * humidity -
    0.00000199 * tempF * tempF * humidity * humidity;

  if (tempF < 80) {
    heatIndexF = 0.5 * (tempF + 61 + (tempF - 68) * 1.2 + humidity * 0.094);
  }

  return (heatIndexF - 32) * (5 / 9);
}

export function getHeatIndexLabel(heatIndex: number) {
  if (heatIndex < 27) return "舒适";
  if (heatIndex < 32) return "注意";
  if (heatIndex < 41) return "警惕";
  if (heatIndex < 54) return "危险";
  return "极度危险";
}
