import { z } from "zod";
import { TRPCError } from "@trpc/server";

export const openAIVoices = [
  "alloy",
  "ash",
  "coral",
  "echo",
  "fable",
  "nova",
  "onyx",
  "sage",
  "shimmer",
] as const;
export const speechInput = z.object({
  provider: z.enum(["openai", "elevenlabs"]),
  voice: z.string().min(1).max(100),
  text: z.string().trim().min(1).max(1500),
  language: z.enum(["en-GB", "de-DE"]),
  rate: z.number().min(0.5).max(1.5),
});
export function voiceCapabilities(authenticated: boolean) {
  return {
    allowed: authenticated || process.env.NEXO_VOICE_ALLOW_GUESTS === "true",
    providers: [
      {
        id: "openai" as const,
        configured: Boolean(
          process.env.OPENAI_TTS_API_KEY || process.env.OPENAI_API_KEY
        ),
        voices: openAIVoices.map(id => ({ id, name: id })),
      },
      {
        id: "elevenlabs" as const,
        configured: Boolean(
          process.env.ELEVENLABS_API_KEY && process.env.ELEVENLABS_VOICE_ID
        ),
        voices: process.env.ELEVENLABS_VOICE_ID
          ? [
              {
                id: process.env.ELEVENLABS_VOICE_ID,
                name: process.env.ELEVENLABS_VOICE_NAME || "ElevenLabs",
              },
            ]
          : [],
      },
    ],
  };
}
const limits = new Map<string, { until: number; count: number }>();
export function consumeSpeechQuota(actor: string, now = Date.now()) {
  for (const [key, value] of limits) if (value.until <= now) limits.delete(key);
  let entry = limits.get(actor);
  if (!entry) {
    if (limits.size >= 1000)
      throw new TRPCError({
        code: "TOO_MANY_REQUESTS",
        message: "Voice service is busy. Try again shortly.",
      });
    entry = { until: now + 60000, count: 0 };
    limits.set(actor, entry);
  }
  if (entry.count >= 8)
    throw new TRPCError({
      code: "TOO_MANY_REQUESTS",
      message: "Voice limit reached. Try again in a minute.",
    });
  entry.count++;
}
export async function synthesizeSpeech(input: z.infer<typeof speechInput>) {
  const selected = voiceCapabilities(true).providers.find(
    p => p.id === input.provider
  )!;
  if (!selected.configured || !selected.voices.some(v => v.id === input.voice))
    throw new TRPCError({
      code: "BAD_REQUEST",
      message: "Voice provider or voice is not configured.",
    });
  const openAI = input.provider === "openai";
  const base = (
    process.env.OPENAI_TTS_BASE_URL || "https://api.openai.com/v1"
  ).replace(/\/$/, "");
  const model = process.env.NEXO_TTS_MODEL || "gpt-4o-mini-tts";
  const response = await fetch(
    openAI
      ? `${base}/audio/speech`
      : `https://api.elevenlabs.io/v1/text-to-speech/${encodeURIComponent(input.voice)}`,
    {
      method: "POST",
      signal: AbortSignal.timeout(20000),
      headers: openAI
        ? {
            "Content-Type": "application/json",
            Authorization: `Bearer ${process.env.OPENAI_TTS_API_KEY || process.env.OPENAI_API_KEY}`,
          }
        : {
            "Content-Type": "application/json",
            "xi-api-key": process.env.ELEVENLABS_API_KEY!,
          },
      body: JSON.stringify(
        openAI
          ? {
              model,
              input: input.text,
              voice: input.voice,
              speed: input.rate,
              response_format: "mp3",
              ...(model.includes("gpt-4o")
                ? {
                    instructions:
                      input.language === "de-DE"
                        ? "Sprich natürlich und klar auf Deutsch."
                        : "Speak naturally and clearly in English.",
                  }
                : {}),
            }
          : {
              text: input.text,
              model_id:
                process.env.ELEVENLABS_MODEL || "eleven_multilingual_v2",
              voice_settings: {
                stability: 0.5,
                similarity_boost: 0.75,
                speed: Math.max(0.7, Math.min(1.2, input.rate)),
              },
            }
      ),
    }
  );
  if (!response.ok)
    throw new TRPCError({
      code: "BAD_GATEWAY",
      message: `Voice provider unavailable (HTTP ${response.status}).`,
    });
  if (!response.headers.get("content-type")?.startsWith("audio/"))
    throw new TRPCError({
      code: "BAD_GATEWAY",
      message: "Voice provider returned invalid audio.",
    });
  const bytes = Buffer.from(await response.arrayBuffer());
  if (!bytes.length || bytes.length > 5 * 1024 * 1024)
    throw new TRPCError({
      code: "BAD_GATEWAY",
      message: "Voice response was empty or too large.",
    });
  return { audio: bytes.toString("base64"), mime: "audio/mpeg" };
}
