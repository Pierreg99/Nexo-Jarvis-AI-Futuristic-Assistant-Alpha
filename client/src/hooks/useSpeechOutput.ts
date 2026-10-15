import { useCallback } from "react";
import { trpc } from "@/lib/trpc";
import type { Preferences } from "./usePreferences";

let generation = 0;
let controller: AbortController | undefined;
let player: HTMLAudioElement | undefined;
let audioURL: string | undefined;
let finish: (() => void) | undefined;
export function stopSpeech() {
  generation++;
  controller?.abort();
  player?.pause();
  if (audioURL) URL.revokeObjectURL(audioURL);
  audioURL = undefined;
  player = undefined;
  window.speechSynthesis?.cancel();
  finish?.();
  finish = undefined;
}
export function useSpeechOutput(preferences: Preferences) {
  const client = trpc.useUtils().client;
  const speak = useCallback(
    async (text: string, onStart?: () => void, onEnd?: () => void) => {
      stopSpeech();
      const current = generation;
      try {
        if (preferences.voiceProvider === "browser") {
          if (!("speechSynthesis" in window))
            throw new Error("Speech output is unavailable in this browser.");
          await new Promise<void>((resolve, reject) => {
            finish = resolve;
            const utterance = new SpeechSynthesisUtterance(text);
            utterance.lang = preferences.language;
            utterance.rate = preferences.rate;
            const voices = window.speechSynthesis.getVoices();
            utterance.voice =
              voices.find(v => v.voiceURI === preferences.voice) ||
              voices.find(
                v =>
                  v.lang.toLowerCase() === preferences.language.toLowerCase() &&
                  !v.localService
              ) ||
              voices.find(v =>
                v.lang.startsWith(preferences.language.slice(0, 2))
              ) ||
              null;
            utterance.onstart = () => {
              if (generation === current) onStart?.();
            };
            utterance.onend = () => resolve();
            utterance.onerror = event =>
              event.error === "canceled" || event.error === "interrupted"
                ? resolve()
                : reject(new Error("Speech playback failed."));
            window.speechSynthesis.speak(utterance);
          });
        } else {
          controller = new AbortController();
          const audio = await client.voice.synthesize.mutate(
            {
              provider: preferences.voiceProvider,
              voice: preferences.cloudVoice,
              text: text.slice(0, 1500),
              language: preferences.language,
              rate: preferences.rate,
            },
            { signal: controller.signal }
          );
          if (generation !== current) return;
          audioURL = URL.createObjectURL(
            new Blob(
              [Uint8Array.from(atob(audio.audio), c => c.charCodeAt(0))],
              { type: audio.mime }
            )
          );
          player = new Audio(audioURL);
          const currentPlayer = player;
          await new Promise<void>((resolve, reject) => {
            finish = resolve;
            currentPlayer.onplaying = () => {
              if (generation === current) onStart?.();
            };
            currentPlayer.onended = () => resolve();
            currentPlayer.onerror = () =>
              reject(new Error("Speech playback failed."));
            void currentPlayer.play().catch(reject);
          });
        }
      } catch (error) {
        if (generation === current) throw error;
      } finally {
        if (generation === current) {
          stopSpeech();
          onEnd?.();
        }
      }
    },
    [
      client,
      preferences.voiceProvider,
      preferences.cloudVoice,
      preferences.voice,
      preferences.language,
      preferences.rate,
    ]
  );
  return { speak, cancel: stopSpeech };
}
