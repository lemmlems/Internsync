export const sectionColorNames = ["indigo", "blue", "rose", "yellow", "orange", "red"] as const;

export type SectionColor = (typeof sectionColorNames)[number];

export const sectionColorThemes: Record<SectionColor, {
  label: string;
  swatch: string;
  header: string;
  badge: string;
  progress: string;
  banner: string;
  foreground: string;
}> = {
  indigo: {
    label: "Indigo",
    swatch: "#151b82",
    header: "bg-gradient-to-r from-[#080d71] to-[#242c9c] text-white",
    badge: "bg-white/15 text-white",
    progress: "#0a185b",
    banner: "linear-gradient(110deg, #080d71 0%, #242c9c 100%)",
    foreground: "#ffffff",
  },
  blue: {
    label: "Blue",
    swatch: "#b8ceff",
    header: "bg-gradient-to-r from-[#d9e5ff] to-[#b8ceff] text-[#12204d]",
    badge: "bg-white/45 text-[#12204d]",
    progress: "#6da7e1",
    banner: "linear-gradient(110deg, #d9e5ff 0%, #b8ceff 100%)",
    foreground: "#12204d",
  },
  rose: {
    label: "Rose",
    swatch: "#d51b45",
    header: "bg-gradient-to-r from-[#b20b3b] to-[#ed1748] text-white",
    badge: "bg-white/20 text-white",
    progress: "#d51b37",
    banner: "linear-gradient(110deg, #b20b3b 0%, #ed1748 100%)",
    foreground: "#ffffff",
  },
  yellow: {
    label: "Yellow",
    swatch: "#ffd12a",
    header: "bg-gradient-to-r from-[#f6c400] to-[#ffd348] text-[#172044]",
    badge: "bg-white/45 text-[#172044]",
    progress: "#ddb700",
    banner: "linear-gradient(110deg, #f6c400 0%, #ffd348 100%)",
    foreground: "#172044",
  },
  orange: {
    label: "Orange",
    swatch: "#f7a523",
    header: "bg-gradient-to-r from-[#e98600] to-[#ffbd43] text-[#172044]",
    badge: "bg-white/40 text-[#172044]",
    progress: "#eda900",
    banner: "linear-gradient(110deg, #e98600 0%, #ffbd43 100%)",
    foreground: "#172044",
  },
  red: {
    label: "Red",
    swatch: "#e52e35",
    header: "bg-gradient-to-r from-[#d91e21] to-[#f24848] text-white",
    badge: "bg-white/20 text-white",
    progress: "#d91e21",
    banner: "linear-gradient(110deg, #d91e21 0%, #f24848 100%)",
    foreground: "#ffffff",
  },
};

export function isSectionColor(value: unknown): value is SectionColor {
  return typeof value === "string" && sectionColorNames.includes(value as SectionColor);
}

export function defaultSectionColor(index: number): SectionColor {
  return sectionColorNames[index % sectionColorNames.length];
}
