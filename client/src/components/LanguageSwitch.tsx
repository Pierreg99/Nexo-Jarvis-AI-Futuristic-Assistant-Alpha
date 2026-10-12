import { useI18n } from "@/contexts/LanguageContext";

export default function LanguageSwitch({
  compact = false,
}: {
  compact?: boolean;
}) {
  const { language, update, t } = useI18n();
  return (
    <select
      aria-label={t("Interface language")}
      className={
        compact ? "language-switch language-switch-compact" : "language-switch"
      }
      value={language}
      onChange={event => {
        const next = event.target.value === "de" ? "de" : "en";
        update({
          uiLanguage: next,
          language: next === "de" ? "de-DE" : "en-GB",
        });
      }}
    >
      <option value="en">{compact ? "EN" : "English"}</option>
      <option value="de">{compact ? "DE" : "Deutsch"}</option>
    </select>
  );
}
