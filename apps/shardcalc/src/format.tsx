import type { JSXElement } from "solid-js";
import type { Source } from "./data";

export function formatNumber(number: number): string {
  if (number < 0) {
    return "-" + formatNumber(-number);
  }
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

export function formatEffect(description: string, max: number, max2: number = 0): JSXElement {
  const min = max / 10;
  const min2 = max2 / 10;
  const effectRange1 = `[${min} – ${max}]`;
  const effectRange2 = `[${min2} – ${max2}]`;
  const parts = description.split(/\{\{|\}\}/);
  return (
    <>
      {parts.map((part) => {
        if (part === "effect") {
          return <span class="effect-number">{effectRange1}</span>;
        } else if (part === "effect2") {
          return <span class="effect-number">{effectRange2}</span>;
        } else {
          return part;
        }
      })}
    </>
  );
}

export function formatSource(source: Source): string {
  const type = capitalize(source.sourceType);
  const desc = source.sourceDesc ? ` (${source.sourceDesc})` : "";
  return `${type}${desc}`;
}

export function getFusionTypeIcon(fusionType: string) {
  if (fusionType === "chameleon") {
    return "🦎";
  }
  if (fusionType === "special") {
    return "⭐";
  }
  return "";
}
