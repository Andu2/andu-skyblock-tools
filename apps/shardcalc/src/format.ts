import type { Source } from "./data";

export function formatNumber(number: number): string {
  if (number < 1000) {
    return number.toFixed(2);
  } else if (number < 1_000_000) {
    return (number / 1000).toFixed(2) + "k";
  } else if (number < 1_000_000_000) {
    return (number / 1_000_000).toFixed(2) + "M";
  } else {
    return (number / 1_000_000_000).toFixed(2) + "G";
  }
}

export function capitalize(text: string): string {
  return text.charAt(0).toUpperCase() + text.slice(1);
}

export function formatEffect(description: string, max: number, max2: number = 0): string {
  const min = max / 10;
  const min2 = max2 / 10;
  const effect = `(${min} - ${max})`;
  const effect2 = `(${min2} - ${max2})`;
  return description.replace("{{effect}}", effect).replace("{{effect2}}", effect2);
}

export function formatSource(source: Source): string {
  const type = capitalize(source.sourceType);
  const desc = source.sourceDesc ? ` (${source.sourceDesc})` : "";
  return `${type}${desc}`;
}
