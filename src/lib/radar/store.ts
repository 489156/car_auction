import { create } from "zustand";
import { persist } from "zustand/middleware";
import { DEFAULT_SEARCH_CONFIG, DEFAULT_TELEGRAM } from "./config.ts";
import type { ScanResult, SearchConfig, TelegramSettings } from "./types.ts";

type RadarState = {
  config: SearchConfig;
  telegram: TelegramSettings;
  historyIds: string[];
  lastScan: ScanResult | null;
  setConfig: (patch: Partial<SearchConfig>) => void;
  setTelegram: (patch: Partial<TelegramSettings>) => void;
  rememberScan: (scan: ScanResult) => string[];
  markNotified: (ids: string[]) => void;
  resetConfig: () => void;
};

export const useRadarStore = create<RadarState>()(
  persist(
    (set, get) => ({
      config: DEFAULT_SEARCH_CONFIG,
      telegram: DEFAULT_TELEGRAM,
      historyIds: [],
      lastScan: null,
      setConfig: (patch) => set({ config: { ...get().config, ...patch } }),
      setTelegram: (patch) => set({ telegram: { ...get().telegram, ...patch } }),
      rememberScan: (scan) => {
        const known = new Set(get().historyIds);
        const fresh = scan.listings
          .filter((row) => row.grade === "a" && !known.has(row.id))
          .map((row) => row.id);
        set({ lastScan: scan });
        return fresh;
      },
      markNotified: (ids) =>
        set({ historyIds: [...new Set([...get().historyIds, ...ids])] }),
      resetConfig: () => set({ config: DEFAULT_SEARCH_CONFIG }),
    }),
    {
      name: "auction-car-radar",
      partialize: (state) => ({
        config: state.config,
        // Never persist the bot token in localStorage — prefer TELEGRAM_BOT_TOKEN.
        telegram: {
          enabled: state.telegram.enabled,
          chatId: state.telegram.chatId,
          botToken: "",
        },
        historyIds: state.historyIds,
        lastScan: state.lastScan,
      }),
    },
  ),
);
