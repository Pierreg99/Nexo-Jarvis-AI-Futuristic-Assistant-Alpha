import { describe, expect, it } from "vitest";
import { weatherLabel } from "./liveData";

describe("weatherLabel", () => {
  it("maps documented weather codes into dashboard labels", () => {
    expect(weatherLabel(0)).toBe("Clear sky");
    expect(weatherLabel(63)).toBe("Rain");
    expect(weatherLabel(95)).toBe("Thunderstorm");
  });

  it("keeps an unknown code safe for the UI", () => {
    expect(weatherLabel(999)).toBe("Conditions unavailable");
  });
});
