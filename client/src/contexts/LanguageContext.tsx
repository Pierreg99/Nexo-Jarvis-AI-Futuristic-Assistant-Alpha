import {
  createContext,
  useContext,
  useEffect,
  useMemo,
  type ReactNode,
} from "react";
import { usePreferences } from "@/hooks/usePreferences";
import {
  formatDate,
  formatSchedule,
  localeFor,
  translate,
  translateError,
  type TranslationValues,
} from "@shared/i18n";
import type { NotificationRecord, TimerRecord } from "@shared/nexo/types";

function useLanguageState() {
  const settings = usePreferences();
  const language = settings.preferences.uiLanguage;
  return useMemo(
    () => ({
      ...settings,
      language,
      locale: localeFor(language),
      t: (message: string, values?: TranslationValues) =>
        translate(language, message, values),
      errorText: (message: string) => translateError(language, message),
      date: (value: string | Date, options?: Intl.DateTimeFormatOptions) =>
        formatDate(language, value, options),
      schedule: (value: string) => formatSchedule(language, value),
      notificationText: (
        notification: NotificationRecord,
        timers: TimerRecord[]
      ) => {
        const timer = timers.find(item => item.id === notification.sourceId);
        return timer
          ? translate(language, "{title} is complete.", { title: timer.title })
          : notification.text;
      },
    }),
    [settings.preferences, settings.warning]
  );
}
const LanguageContext = createContext<ReturnType<
  typeof useLanguageState
> | null>(null);
export function LanguageProvider({ children }: { children: ReactNode }) {
  const state = useLanguageState();
  useEffect(() => {
    document.documentElement.lang = state.language;
    document.title = state.t("Nexo Jarvis — Command Environment");
  }, [state.language]);
  return (
    <LanguageContext.Provider value={state}>
      {children}
    </LanguageContext.Provider>
  );
}
export function useI18n() {
  const state = useContext(LanguageContext);
  if (!state) throw new Error("LanguageProvider is required");
  return state;
}
