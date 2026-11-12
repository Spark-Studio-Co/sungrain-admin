// Keep the Excel names on each row; these keys are only for the cargo filter.
const normalize = (name: string) => {
  const normalized = name.normalize("NFKC").toLocaleLowerCase("ru-RU").replace(/ё/g, "е")
    .replace(/[^\p{L}\p{N}]+/gu, " ").trim().replace(/\s+/g, " ");
  const words = normalized.split(" ");
  if (words[0] === "масло" && words[1]?.length >= 4 &&
      ["подсолнечное", "подсолнечника"].some((word) => word.startsWith(words[1]))) {
    words[1] = "подсолнечное";
    for (let i = 2; i < words.length; i++) {
      if (words[i].length >= 3 && "рафинированное".startsWith(words[i])) words[i] = "рафинированное";
      else if (words[i].length >= 5 && "нерафинированное".startsWith(words[i])) words[i] = "нерафинированное";
    }
  }
  return words.join(" ");
};

const sunflowerOil = (name: string) => {
  const words = name.split(" ");
  if (name === "sunflower oil" || name === "подсолнечное масло") return true;
  if (words.length !== 2 || words[0] !== "масло" || words[1].length < 4) return false;
  return ["подсолнечное", "подсолнечника"].some((word) => word.startsWith(words[1]));
};

type Candidate = { normalized: string; label: string } | null;

const extendsWords = (longer: string, shorter: string) => {
  const full = longer.split(" ");
  const prefix = shorter.split(" ");
  return full.length === prefix.length && full.every((word, index) => word.startsWith(prefix[index]));
};

export function buildApproachCargoFilter(names: Array<string | null>) {
  const originals = Array.from(new Set(names.filter((name): name is string => Boolean(name?.trim()))));
  const byNormalized = new Map<string, string>();
  for (const original of originals) {
    const normalized = normalize(original);
    if (!normalized) continue;
    const trimmed = normalized.startsWith("масло подсолнечное ")
      ? `Масло подсолнечное ${normalized.slice("масло подсолнечное ".length)}`
      : original.trim();
    const previous = byNormalized.get(normalized);
    if (!previous || trimmed.localeCompare(previous, "ru") < 0) byNormalized.set(normalized, trimmed);
  }

  // A shortened word is combined only when it has one unambiguous completion
  // among names present in this dashboard. Extra words stay distinct.
  const prefixes = new Map<string, Candidate>();
  for (const [normalized, label] of byNormalized) {
    // Spreadsheet cells can be very long; do not build quadratic prefix keys for them.
    if (normalized.length > 500) continue;
    const words = normalized.split(" ");
    if (words.length < 2) continue;
    for (let index = 0; index < words.length; index++) {
      const word = words[index];
      if (word.length > 100 || !/^\p{L}+$/u.test(word)) continue;
      for (let length = 4; length <= word.length; length++) {
        const key = words.map((part, i) => i === index ? part.slice(0, length) : part).join(" ");
        if (!prefixes.has(key)) {
          prefixes.set(key, { normalized, label });
          continue;
        }
        const previous = prefixes.get(key);
        if (!previous) continue;
        if (extendsWords(normalized, previous.normalized)) prefixes.set(key, { normalized, label });
        else if (!extendsWords(previous.normalized, normalized)) prefixes.set(key, null);
      }
    }
  }

  const labels = new Map<string, string>();
  for (const original of originals) {
    const key = normalize(original);
    const candidate = prefixes.get(key);
    labels.set(original, sunflowerOil(key) ? "Масло подсолнечное" : candidate?.label ?? byNormalized.get(key) ?? original.trim());
  }
  return {
    labels,
    options: Array.from(new Set(labels.values())).sort((a, b) => a.localeCompare(b, "ru")),
  };
}
