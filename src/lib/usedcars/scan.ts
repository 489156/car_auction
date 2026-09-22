/**
 * Used-car scan server function — orchestrates the local-only Playwright
 * scrapers, applies the user filter, and returns a structured result for the
 * dashboard's "중고 매물" tab.
 *
 * On Vercel (no Playwright), both scrapers return `status: "skipped"` with
 * a clear Korean message, so the dashboard can render the empty state
 * gracefully instead of crashing.
 */
import { createServerFn } from "@tanstack/react-start";
import { DEFAULT_USED_CAR_CONFIG, type UsedCarConfig, type UsedCarListing, type UsedCarScanResult } from "./types.ts";
import { applyUsedCarFilters } from "./filter.ts";

const ScanInputSchema = {
  parse(input: unknown): { config?: Partial<UsedCarConfig> } {
    const data = (input ?? {}) as { config?: Partial<UsedCarConfig> };
    return {
      config: data.config
        ? { ...DEFAULT_USED_CAR_CONFIG, ...data.config }
        : undefined,
    };
  },
};

function defaultConfig(): UsedCarConfig {
  return { ...DEFAULT_USED_CAR_CONFIG };
}

function attachGrade(
  listings: UsedCarListing[],
  config: UsedCarConfig,
): UsedCarListing[] {
  return applyUsedCarFilters(listings, config);
}

export const runUsedCarScan = createServerFn({ method: "POST" })
  .validator(ScanInputSchema)
  .handler(async ({ data }): Promise<UsedCarScanResult> => {
    const started = Date.now();
    const config = data.config
      ? { ...defaultConfig(), ...data.config }
      : defaultConfig();

    const [{ scrapeKCar }, { scrapeKbchachacha }] = await Promise.all([
      import("./scrapers/kcar.ts"),
      import("./scrapers/kbchachacha.ts"),
    ]);

    const [kcarRes, kbcRes] = await Promise.all([
      scrapeKCar(config),
      scrapeKbchachacha(config),
    ]);

    const rawListings: UsedCarListing[] = [
      ...kcarRes.listings,
      ...kbcRes.listings,
    ];
    const filtered = attachGrade(rawListings, config);
    const matched = filtered.filter((l) => l.grade === "match");
    const rejected = filtered.filter((l) => l.grade === "rejected");

    return {
      scannedAt: new Date().toISOString(),
      durationMs: Date.now() - started,
      config,
      listings: filtered,
      totals: {
        fetched: rawListings.length,
        matched: matched.length,
        rejected: rejected.length,
        byPlatform: {
          kcar: kcarRes.listings.length,
          kbchachacha: kbcRes.listings.length,
        },
      },
      sources: [
        {
          platform: "kcar",
          label: "K Car",
          status: kcarRes.status,
          fetched: kcarRes.listings.length,
          message: kcarRes.message,
          localOnly: kcarRes.localOnly,
        },
        {
          platform: "kbchachacha",
          label: "KB차차차",
          status: kbcRes.status,
          fetched: kbcRes.listings.length,
          message: kbcRes.message,
          localOnly: kbcRes.localOnly,
        },
      ],
    };
  });
