import { useEffect, useRef, useState } from "react";
import { toast } from "sonner";
import { useI18n } from "@/contexts/LanguageContext";

type Place = {
  id: number;
  name: string;
  country?: string;
  admin1?: string;
  latitude: number;
  longitude: number;
};
export default function LocationControls({
  onSelect,
}: {
  onSelect: (
    coordinates: { latitude: number; longitude: number },
    name?: string
  ) => void;
}) {
  const { t, language } = useI18n();
  const [query, setQuery] = useState("");
  const [places, setPlaces] = useState<Place[]>([]);
  const [busy, setBusy] = useState(false);
  const [gps, setGPS] = useState(false);
  const abort = useRef<AbortController | null>(null);
  const mounted = useRef(true);
  useEffect(() => {
    mounted.current = true;
    return () => {
      mounted.current = false;
      abort.current?.abort();
    };
  }, []);
  const search = async () => {
    abort.current?.abort();
    const request = new AbortController();
    abort.current = request;
    const timeout = window.setTimeout(() => {
      request.abort();
      if (mounted.current) {
        setBusy(false);
        toast.error(
          t("Location search is unavailable. Try coordinates or GPS.")
        );
      }
    }, 10000);
    setBusy(true);
    setPlaces([]);
    try {
      const url = new URL("https://geocoding-api.open-meteo.com/v1/search");
      url.search = new URLSearchParams({
        name: query.trim(),
        count: "5",
        language,
        format: "json",
      }).toString();
      const response = await fetch(url, { signal: request.signal });
      if (!response.ok) throw new Error();
      const data = (await response.json()) as { results?: Place[] };
      if (request.signal.aborted) return;
      const results = (data.results || [])
        .filter(
          p =>
            Number.isFinite(p.latitude) &&
            Number.isFinite(p.longitude) &&
            Math.abs(p.latitude) <= 90 &&
            Math.abs(p.longitude) <= 180
        )
        .slice(0, 5);
      setPlaces(results);
      if (!results.length) toast(t("No matching locations found."));
    } catch {
      if (!request.signal.aborted)
        toast.error(
          t("Location search is unavailable. Try coordinates or GPS.")
        );
    } finally {
      window.clearTimeout(timeout);
      if (!request.signal.aborted) setBusy(false);
    }
  };
  return (
    <div className="space-y-3">
      <form
        className="flex gap-2"
        onSubmit={event => {
          event.preventDefault();
          void search();
        }}
      >
        <input
          className="integration-input min-w-0 flex-1"
          value={query}
          onChange={e => setQuery(e.target.value)}
          minLength={2}
          maxLength={100}
          required
          placeholder={t("Search city or postcode")}
          aria-label={t("Search city or postcode")}
        />
        <button
          className="integration-button"
          disabled={busy || query.trim().length < 2}
        >
          {busy ? t("Searching…") : t("Search")}
        </button>
      </form>
      {places.length > 0 && (
        <ul className="space-y-2">
          {places.map(p => (
            <li key={p.id}>
              <button
                type="button"
                className="integration-button w-full text-left"
                onClick={() => {
                  onSelect(
                    { latitude: p.latitude, longitude: p.longitude },
                    p.name
                  );
                  setPlaces([]);
                  setQuery(p.name);
                  toast.success(t("Weather location updated"));
                }}
              >
                {[p.name, p.admin1, p.country].filter(Boolean).join(", ")}
              </button>
            </li>
          ))}
        </ul>
      )}
      <button
        type="button"
        className="integration-button"
        disabled={gps}
        onClick={() => {
          if (!navigator.geolocation) {
            toast.error(
              t("Location is unavailable on this device. Use city search.")
            );
            return;
          }
          setGPS(true);
          navigator.geolocation.getCurrentPosition(
            position => {
              if (!mounted.current) return;
              setGPS(false);
              onSelect({
                latitude: position.coords.latitude,
                longitude: position.coords.longitude,
              });
              toast.success(t("Weather location updated"));
            },
            () => {
              if (!mounted.current) return;
              setGPS(false);
              toast.error(
                t("Location access was denied or timed out. Use city search.")
              );
            },
            { enableHighAccuracy: false, timeout: 10000, maximumAge: 300000 }
          );
        }}
      >
        {gps ? t("Locating…") : t("Use my location")}
      </button>
      <p className="text-xs leading-relaxed text-cyan-100/55">
        {t(
          "City search uses Open-Meteo. GPS access starts only when you choose it."
        )}
      </p>
    </div>
  );
}
