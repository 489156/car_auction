import { create } from "zustand";
import { persist } from "zustand/middleware";
import { DEFAULT_SEARCH_CONFIG, DEFAULT_TELEGRAM } from "./config.ts";
import type {
  ScanResult,
  SearchConfig,
  TelegramSettings,
  WebAlertSettings,
} from "./types.ts";

export const DEFAULT_WEB_ALERT: WebAlertSettings = {
  enabled: true,
  threshold: 80,
  interval: "6h",
};

export type NotificationItem = {
  id: string;
  time: string;
  title: string;
  desc: string;
  tier: "S_TIER" | "A_GRADE";
  listingId: string;
};

type RadarState = {
  config: SearchConfig;
  telegram: TelegramSettings;
  webAlert: WebAlertSettings;
  historyIds: string[];
  lastScan: ScanResult | null;
  lastScanAt: string | null;
  favorites: string[];
  notifications: NotificationItem[];
  setConfig: (patch: Partial<SearchConfig>) => void;
  setTelegram: (patch: Partial<TelegramSettings>) => void;
  setWebAlert: (patch: Partial<WebAlertSettings>) => void;
  rememberScan: (scan: ScanResult) => { freshIds: string[]; newNotifications: NotificationItem[] };
  markNotified: (ids: string[]) => void;
  clearNotifications: () => void;
  toggleFavorite: (id: string) => void;
  resetConfig: () => void;
};

export const useRadarStore = create<RadarState>()(
  persist(
    (set, get) => ({
      config: DEFAULT_SEARCH_CONFIG,
      telegram: DEFAULT_TELEGRAM,
      webAlert: DEFAULT_WEB_ALERT,
      historyIds: [],
      lastScan: null,
      lastScanAt: null,
      favorites: [],
      notifications: [],
      setConfig: (patch) => set({ config: { ...get().config, ...patch } }),
      setTelegram: (patch) => set({ telegram: { ...get().telegram, ...patch } }),
      setWebAlert: (patch) => set({ webAlert: { ...get().webAlert, ...patch } }),
      rememberScan: (scan) => {
        const known = new Set(get().historyIds);
        const fresh = scan.listings
          .filter((row) => row.grade === "a" && !known.has(row.id))
          .map((row) => row.id);
        const scannedAt = scan.scannedAt;
        const newNotifications: NotificationItem[] = [];
        const seen = new Set(get().notifications.map((n) => n.listingId));
        for (const row of scan.listings) {
          if (!row.isSTier) continue;
          if (row.sTierScore < get().webAlert.threshold) continue;
          if (seen.has(row.id)) continue;
          newNotifications.push({
            id: `n-${row.id}`,
            time: "방금",
            title: "👑 S-Tier 매칭!",
            desc: `${row.carName} (${row.year ?? ""}년식, ${row.mileage?.toLocaleString("ko-KR") ?? "?"}km) · ${row.discountRate ?? "?"}% 할인`,
            tier: "S_TIER",
            listingId: row.id,
          });
          if (newNotifications.length >= 5) break;
        }
        const existing = get().notifications;
        set({
          lastScan: scan,
          lastScanAt: scannedAt,
          notifications: [...newNotifications, ...existing].slice(0, 25),
        });
        return { freshIds: fresh, newNotifications };
      },
      markNotified: (ids) =>
        set({ historyIds: [...new Set([...get().historyIds, ...ids])] }),
      clearNotifications: () => set({ notifications: [] }),
      toggleFavorite: (id) => {
        const set_ = new Set(get().favorites);
        if (set_.has(id)) set_.delete(id);
        else set_.add(id);
        set({ favorites: [...set_] });
      },
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
        webAlert: state.webAlert,
        historyIds: state.historyIds,
        lastScan: state.lastScan,
        lastScanAt: state.lastScanAt,
        favorites: state.favorites,
        notifications: state.notifications.slice(0, 5), // most recent 5
      }),
    },
  ),
);