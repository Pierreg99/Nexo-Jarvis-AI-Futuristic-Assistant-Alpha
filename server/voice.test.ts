import { afterEach, describe, expect, it, vi } from "vitest";
import { appRouter } from "./routers";
import type { TrpcContext } from "./_core/context";
import {
  consumeSpeechQuota,
  speechInput,
  synthesizeSpeech,
  voiceCapabilities,
} from "./voice";
afterEach(() => {
  vi.unstubAllGlobals();
  vi.unstubAllEnvs();
});
const input = {
  provider: "openai" as const,
  voice: "coral",
  text: "Guten Morgen.",
  language: "de-DE" as const,
  rate: 1,
};
describe("natural voice provider boundaries", () => {
  it("requires authentication before spending a provider key", async () => {
    vi.stubEnv("NEXO_VOICE_ALLOW_GUESTS", "false");
    vi.stubEnv("OPENAI_API_KEY", "must-stay-server-side");
    const fetch = vi.fn();
    vi.stubGlobal("fetch", fetch);
    const caller = appRouter.createCaller({
      user: null,
      workspaceId: "guest",
    } as TrpcContext);
    await expect(caller.voice.synthesize(input)).rejects.toThrow("Sign in");
    expect(fetch).not.toHaveBeenCalled();
    expect(JSON.stringify(await caller.voice.capabilities())).not.toContain(
      "must-stay-server-side"
    );
  });
  it("sends German instructions, selected voice, and a server-only key to OpenAI", async () => {
    vi.stubEnv("OPENAI_TTS_API_KEY", "tts-secret");
    const fetch = vi.fn(
      async () =>
        new Response(new Uint8Array([1, 2, 3]), {
          headers: { "Content-Type": "audio/mpeg" },
        })
    );
    vi.stubGlobal("fetch", fetch);
    const result = await synthesizeSpeech(input);
    expect(result.audio).toBe("AQID");
    const request = fetch.mock.calls[0] as unknown as [string, RequestInit];
    expect(request[0]).toBe("https://api.openai.com/v1/audio/speech");
    expect(JSON.parse(String(request[1].body))).toMatchObject({
      voice: "coral",
      instructions: "Sprich natürlich und klar auf Deutsch.",
    });
    expect(request[1].headers).toMatchObject({
      Authorization: "Bearer tts-secret",
    });
  });
  it("uses only the configured ElevenLabs voice and bounds provider speed", async () => {
    vi.stubEnv("ELEVENLABS_API_KEY", "eleven-key");
    vi.stubEnv("ELEVENLABS_VOICE_ID", "configured-voice");
    const fetch = vi.fn(
      async () =>
        new Response(new Uint8Array([1]), {
          headers: { "Content-Type": "audio/mpeg" },
        })
    );
    vi.stubGlobal("fetch", fetch);
    await expect(
      synthesizeSpeech({ ...input, provider: "elevenlabs", voice: "arbitrary" })
    ).rejects.toThrow("not configured");
    expect(fetch).not.toHaveBeenCalled();
    await synthesizeSpeech({
      ...input,
      provider: "elevenlabs",
      voice: "configured-voice",
      rate: 1.5,
    });
    const request = fetch.mock.calls[0] as unknown as [string, RequestInit];
    expect(request[0]).toMatch(/\/configured-voice$/);
    expect(JSON.parse(String(request[1].body)).voice_settings.speed).toBe(1.2);
    expect(JSON.stringify(voiceCapabilities(true))).not.toContain("eleven-key");
  });
  it("rejects invalid audio, long text, and malformed provider responses", async () => {
    vi.stubEnv("OPENAI_TTS_API_KEY", "tts-secret");
    vi.stubGlobal(
      "fetch",
      vi.fn(
        async () =>
          new Response("{}", {
            headers: { "Content-Type": "application/json" },
          })
      )
    );
    await expect(synthesizeSpeech(input)).rejects.toThrow("invalid audio");
    expect(
      speechInput.safeParse({ ...input, text: "x".repeat(1501) }).success
    ).toBe(false);
  });
  it("limits repeated speech synthesis and resets the allowance", () => {
    for (let i = 0; i < 8; i++) consumeSpeechQuota("voice-test-rate", 1000);
    expect(() => consumeSpeechQuota("voice-test-rate", 1001)).toThrow(
      "Voice limit reached"
    );
    expect(() => consumeSpeechQuota("voice-test-rate", 62000)).not.toThrow();
  });
});
