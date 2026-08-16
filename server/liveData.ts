/**
 * Nexo Jarvis live data gateway.
 * Fetches public weather and news sources on the server so source URLs and error handling
 * remain centralized. No third-party credentials are exposed to the browser.
 */

export type WeatherSnapshot = {
  temperature: number;
  apparentTemperature: number;
  windSpeed: number;
  condition: string;
  isDay: boolean;
  timezone: string;
  observedAt: string;
};

export type NewsHeadline = {
  title: string;
  url: string;
  domain: string;
  publishedAt: string | null;
};

type OpenMeteoResponse = {
  timezone?: string;
  current?: {
    time?: string;
    temperature_2m?: number;
    apparent_temperature?: number;
    weather_code?: number;
    wind_speed_10m?: number;
    is_day?: number;
  };
};

type GdeltResponse = {
  articles?: Array<{
    title?: string;
    url?: string;
    domain?: string;
    seendate?: string;
  }>;
};

const weatherCodeLabels: Record<number, string> = {
  0: "Clear sky",
  1: "Mostly clear",
  2: "Partly cloudy",
  3: "Overcast",
  45: "Fog",
  48: "Rime fog",
  51: "Light drizzle",
  53: "Drizzle",
  55: "Heavy drizzle",
  56: "Freezing drizzle",
  57: "Heavy freezing drizzle",
  61: "Light rain",
  63: "Rain",
  65: "Heavy rain",
  66: "Freezing rain",
  67: "Heavy freezing rain",
  71: "Light snow",
  73: "Snow",
  75: "Heavy snow",
  77: "Snow grains",
  80: "Rain showers",
  81: "Heavy rain showers",
  82: "Violent rain showers",
  85: "Snow showers",
  86: "Heavy snow showers",
  95: "Thunderstorm",
  96: "Thunderstorm with hail",
  99: "Severe thunderstorm with hail",
};

export function weatherLabel(code: number | undefined) {
  return weatherCodeLabels[code ?? -1] ?? "Conditions unavailable";
}

async function fetchJson<T>(url: URL): Promise<T> {
  const response = await fetch(url, {
    headers: { Accept: "application/json", "User-Agent": "Nexo-Jarvis/1.0" },
    signal: AbortSignal.timeout(10_000),
  });

  if (!response.ok) {
    throw new Error(`Upstream request failed with ${response.status}`);
  }

  return response.json() as Promise<T>;
}

export async function getCurrentWeather(latitude: number, longitude: number): Promise<WeatherSnapshot> {
  const endpoint = new URL("https://api.open-meteo.com/v1/forecast");
  endpoint.searchParams.set("latitude", latitude.toFixed(4));
  endpoint.searchParams.set("longitude", longitude.toFixed(4));
  endpoint.searchParams.set("current", "temperature_2m,apparent_temperature,weather_code,wind_speed_10m,is_day");
  endpoint.searchParams.set("timezone", "auto");

  const payload = await fetchJson<OpenMeteoResponse>(endpoint);
  const current = payload.current;
  if (!current || typeof current.temperature_2m !== "number") {
    throw new Error("Weather source returned no current conditions");
  }

  return {
    temperature: current.temperature_2m,
    apparentTemperature: current.apparent_temperature ?? current.temperature_2m,
    windSpeed: current.wind_speed_10m ?? 0,
    condition: weatherLabel(current.weather_code),
    isDay: current.is_day !== 0,
    timezone: payload.timezone ?? "UTC",
    observedAt: current.time ?? new Date().toISOString(),
  };
}

export async function getLatestHeadlines(): Promise<NewsHeadline[]> {
  const endpoint = new URL("https://api.gdeltproject.org/api/v2/doc/doc");
  endpoint.searchParams.set("query", "language:german");
  endpoint.searchParams.set("mode", "artlist");
  endpoint.searchParams.set("maxrecords", "6");
  endpoint.searchParams.set("format", "json");
  endpoint.searchParams.set("sort", "hybridrel");

  const payload = await fetchJson<GdeltResponse>(endpoint);
  const seen = new Set<string>();

  return (payload.articles ?? [])
    .filter((article) => Boolean(article.title && article.url))
    .map((article) => ({
      title: article.title!.trim(),
      url: article.url!,
      domain: article.domain ?? new URL(article.url!).hostname.replace(/^www\./, ""),
      publishedAt: article.seendate ?? null,
    }))
    .filter((article) => {
      if (seen.has(article.url)) return false;
      seen.add(article.url);
      return true;
    })
    .slice(0, 5);
}
