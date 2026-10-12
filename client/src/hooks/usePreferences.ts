import { useState } from "react";
import { z } from "zod";

const schema = z.object({
  name: z.string().max(60).default("Commander"),
  voiceEnabled: z.boolean().default(false),
  language: z.enum(["en-GB", "de-DE"]).default("en-GB"),
  uiLanguage: z
    .enum(["en", "de"])
    .default(() =>
      typeof navigator !== "undefined" &&
      navigator.language.toLowerCase().startsWith("de")
        ? "de"
        : "en"
    ),
  voice: z.string().max(200).default(""),
  rate: z.number().min(0.5).max(1.5).default(1),
  readOnly: z.boolean().default(false),
  coordinates: z
    .object({
      latitude: z.number().min(-90).max(90),
      longitude: z.number().min(-180).max(180),
    })
    .nullable()
    .default(null),
});
export type Preferences = z.infer<typeof schema>;
const key = "nexo.preferences.v1";

function parsePreferences(value: unknown): Preferences {
  const saved =
    value !== null && typeof value === "object" && !Array.isArray(value)
      ? (value as Record<string, unknown>)
      : {};
  const parsed = schema.parse(saved);
  if (!Object.hasOwn(saved, "uiLanguage") && saved.language === "de-DE")
    parsed.uiLanguage = "de";
  if (!Object.hasOwn(saved, "language"))
    parsed.language = parsed.uiLanguage === "de" ? "de-DE" : "en-GB";
  return parsed;
}

export function usePreferences() {
  const [preferences, set] = useState<Preferences>(() => {
    try {
      return parsePreferences(JSON.parse(localStorage.getItem(key) ?? "{}"));
    } catch {
      return parsePreferences({});
    }
  });
  const [warning, setWarning] = useState<string>();
  const update = (change: Partial<Preferences>) => {
    const next = schema.parse({ ...preferences, ...change });
    try {
      localStorage.setItem(key, JSON.stringify(next));
      setWarning(undefined);
    } catch {
      setWarning(
        "Preferences apply to this session; browser storage is unavailable."
      );
    }
    set(next);
  };
  return { preferences, update, warning };
}
