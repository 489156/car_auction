import { createFileRoute } from "@tanstack/react-router";
import { useEffect, useMemo, useState } from "react";
import { Bell, CarFront, Crown, Radar, Sliders } from "lucide-react";
import { toast, Toaster } from "sonner";
import { DetailModal } from "@/components/radar/detail-modal";
import {
  EMPTY_FILTER,
  FilterBar,
  type FilterState,
} from "@/components/radar/filter-bar";
import { ListingsTable, listingsFilterPredicate } from "@/components/radar/listings-table";
import { MetricsCards } from "@/components/radar/metrics-cards";
import { NotificationDrawer } from "@/components/radar/notification-drawer";
import { ScanModal } from "@/components/radar/scan-modal";
import { SettingsModal } from "@/components/radar/settings-modal";
import { SpotlightBanner } from "@/components/radar/spotlight-banner";
import { runAuctionScan, sendTelegramAlerts } from "@/lib/radar/scan";
import { useRadarStore } from "@/lib/radar/store";
import type { ScanResult, StandardListing } from "@/lib/radar/types";
import { UsedCarsTable } from "@/components/usedcars/usedcars-table";
import { runUsedCarScan } from "@/lib/usedcars/scan";
import type { UsedCarScanResult } from "@/lib/usedcars/types";
import { cn } from "@/lib/utils";

export const Route = createFileRoute("/")({ component: Home });

function Home() {
  const config = useRadarStore((s) => s.config);
  const telegram = useRadarStore((s) => s.telegram);
  const lastScan = useRadarStore((s) => s.lastScan);
  const lastScanAt = useRadarStore((s) => s.lastScanAt);
  const historyIds = useRadarStore((s) => s.historyIds);
  const favorites = useRadarStore((s) => s.favorites);
  const notifications = useRadarStore((s) => s.notifications);
  const webAlert = useRadarStore((s) => s.webAlert);
  const setWebAlert = useRadarStore((s) => s.setWebAlert);
  const rememberScan = useRadarStore((s) => s.rememberScan);
  const markNotified = useRadarStore((s) => s.markNotified);
  const toggleFavorite = useRadarStore((s) => s.toggleFavorite);
  const clearNotifications = useRadarStore((s) => s.clearNotifications);

  const [hydrated, setHydrated] = useState(false);
  const [scanning, setScanning] = useState(false);
  const [scanModalOpen, setScanModalOpen] = useState(false);
  const [detailId, setDetailId] = useState<string | null>(null);
  const [notifOpen, setNotifOpen] = useState(false);
  const [settingsOpen, setSettingsOpen] = useState(false);
  const [filter, setFilter] = useState<FilterState>(EMPTY_FILTER);
  const [view, setView] = useState<"auction" | "usedcar">("auction");
  const [usedCarScanning, setUsedCarScanning] = useState(false);
  const [usedCarResult, setUsedCarResult] = useState<UsedCarScanResult | null>(null);

  useEffect(() => {
    setHydrated(true);
  }, []);

  // Escape closes whichever overlay is on top — fixes accidental locks and
  // makes keyboard-only navigation behave like a normal SPA.
  useEffect(() => {
    if (!(scanModalOpen || settingsOpen || detailId || notifOpen)) return;
    function onKey(e: KeyboardEvent) {
      if (e.key !== "Escape") return;
      if (notifOpen) setNotifOpen(false);
      else if (scanModalOpen && !scanning) setScanModalOpen(false);
      else if (settingsOpen) setSettingsOpen(false);
      else if (detailId) setDetailId(null);
    }
    document.addEventListener("keydown", onKey);
    return () => document.removeEventListener("keydown", onKey);
  }, [scanModalOpen, settingsOpen, detailId, notifOpen, scanning]);

  const listings = hydrated ? (lastScan?.listings ?? []) : [];
  const scan: ScanResult | null = hydrated ? lastScan : null;

  // Spotlight: highest-scoring S-Tier, fall back to best A-grade.
  const spotlight = useMemo(() => {
    const eligible = listings.filter((row) => row.grade !== "rejected");
    if (eligible.length === 0) return null;
    const sTier = eligible.filter((row) => row.isSTier);
    if (sTier.length > 0) {
      return [...sTier].sort((a, b) => b.sTierScore - a.sTierScore)[0] ?? null;
    }
    const aGrade = eligible.filter((row) => row.grade === "a");
    return aGrade[0] ?? eligible[0] ?? null;
  }, [listings]);

  const filtered = useMemo(() => {
    const predicate = listingsFilterPredicate(filter);
    const visible = listings.filter(predicate);
    return filter.savedOnly ? visible.filter((row) => favorites.includes(row.id)) : visible;
  }, [filter, listings, favorites]);

  const detailListing: StandardListing | null = useMemo(() => {
    if (!detailId) return null;
    return listings.find((row) => row.id === detailId) ?? null;
  }, [detailId, listings]);

  async function handleScan() {
    if (scanning) return;
    setScanning(true);
    const toastId = toast.loading("3개 플랫폼을 수집하는 중입니다…");
    try {
      const result = await runAuctionScan({ data: { config, enrich: true } });
      const { freshIds } = rememberScan(result);
      const fresh = result.listings.filter(
        (row) => freshIds.includes(row.id) && row.grade === "a",
      );
      toast.success(
        `수집 ${result.totals.fetched} · 1차 ${result.totals.stage1} · A급 ${result.totals.gradeA} · S-Tier ${result.totals.sTier}`,
        { id: toastId },
      );
      if (
        telegram.enabled &&
        telegram.botToken &&
        telegram.chatId &&
        fresh.length
      ) {
        const telegramResult = await sendTelegramAlerts({
          data: { telegram, listings: fresh },
        });
        if (telegramResult.error) toast.error(telegramResult.error);
        else if (telegramResult.sent) {
          markNotified(fresh.map((row) => row.id));
          toast.success(`텔레그램 ${telegramResult.sent}건 전송`);
        }
      } else if (fresh.length) {
        markNotified(fresh.map((row) => row.id));
      }
    } catch (error) {
      toast.error(error instanceof Error ? error.message : "스캔 실패", {
        id: toastId,
      });
    } finally {
      setScanning(false);
    }
  }

  async function handleUsedCarScan() {
    if (usedCarScanning) return;
    setUsedCarScanning(true);
    const toastId = toast.loading("K Car + KB차차차를 헤드리스로 수집하는 중입니다…");
    try {
      const result = await runUsedCarScan({ data: {} });
      setUsedCarResult(result);
      const matched = result.totals.matched;
      const total = result.totals.fetched;
      toast.success(
        `중고 매물 ${total}건 · 필터 통과 ${matched}건 (${result.durationMs}ms)`,
        { id: toastId },
      );
    } catch (error) {
      toast.error(
        error instanceof Error ? error.message : "중고 매물 스캔 실패",
        { id: toastId },
      );
    } finally {
      setUsedCarScanning(false);
    }
  }

  return (
    <div className="min-h-dvh bg-bg text-fg">
      <Toaster theme="dark" position="top-center" richColors={false} />
      <Header
        scanning={scanning}
        lastScanAt={lastScanAt}
        notifications={notifications.length}
        onRunScanClick={() => setScanModalOpen(true)}
        onToggleNotif={() => setNotifOpen((v) => !v)}
        onOpenSettings={() => setSettingsOpen(true)}
      />
      <main className="mx-auto w-full max-w-7xl space-y-6 px-4 py-6 sm:px-6 lg:px-8">
        <ViewTabs view={view} onChange={setView} />
        {view === "auction" ? (
          <>
            <SpotlightBanner
              listing={spotlight}
              onInspect={(id) => setDetailId(id)}
            />
            <MetricsCards scan={scan} />
            <FilterBar
              value={filter}
              onChange={(patch) => setFilter((prev) => ({ ...prev, ...patch }))}
              onReset={() => setFilter(EMPTY_FILTER)}
            />
            {hydrated && scan ? (
              <ListingsTable
                listings={filtered}
                favorites={favorites}
                onInspect={(id) => setDetailId(id)}
                onToggleFavorite={toggleFavorite}
              />
            ) : (
              <EmptyState scanning={scanning} />
            )}
          </>
        ) : (
          <UsedCarsView
            scanning={usedCarScanning}
            result={usedCarResult}
            onScan={handleUsedCarScan}
          />
        )}
      </main>
      <NotificationDrawer
        open={notifOpen}
        notifications={notifications}
        onClose={() => setNotifOpen(false)}
        onClear={clearNotifications}
        onOpenSettings={() => setSettingsOpen(true)}
        onInspect={(id) => setDetailId(id)}
      />
      <DetailModal listing={detailListing} onClose={() => setDetailId(null)} />
      <SettingsModal
        open={settingsOpen}
        value={webAlert}
        onClose={() => setSettingsOpen(false)}
        onChange={(patch) => setWebAlert(patch)}
      />
      <ScanModal
        open={scanModalOpen}
        onClose={() => setScanModalOpen(false)}
        onCompleted={() => {
          /* simulation done — user can press Run */
        }}
        onRunScan={async () => {
          await handleScan();
        }}
        scanning={scanning}
      />
      <ClickOutsideCloser onAnyClick={() => setNotifOpen(false)} when={notifOpen} />
    </div>
  );
}

function Header({
  scanning,
  lastScanAt,
  notifications,
  onRunScanClick,
  onToggleNotif,
  onOpenSettings,
}: {
  scanning: boolean;
  lastScanAt: string | null;
  notifications: number;
  onRunScanClick: () => void;
  onToggleNotif: () => void;
  onOpenSettings: () => void;
}) {
  const lastScanLabel = useMemo(() => {
    if (!lastScanAt) return "마지막 스캔: —";
    const d = new Date(lastScanAt);
    const now = new Date();
    const sameDay =
      d.getFullYear() === now.getFullYear() &&
      d.getMonth() === now.getMonth() &&
      d.getDate() === now.getDate();
    const hh = d.toLocaleTimeString("ko-KR", { hour: "2-digit", minute: "2-digit" });
    return sameDay ? `오늘 ${hh}` : `${d.toLocaleDateString("ko-KR")} ${hh}`;
  }, [lastScanAt]);

  return (
    <header className="sticky top-0 z-30 border-b border-tile-800/80 bg-tile-900/90 backdrop-blur">
      <div className="mx-auto flex h-16 max-w-7xl items-center justify-between gap-3 px-4 sm:px-6 lg:px-8">
        <div className="flex items-center gap-3">
          <div className="flex size-10 items-center justify-center rounded-xl bg-gradient-to-tr from-stier-500 via-stier-400 to-stier-600 font-black text-tile-900 shadow-lg shadow-stier-500/20">
            <Crown className="size-5" aria-hidden />
          </div>
          <div>
            <div className="flex items-center gap-2">
              <h1 className="text-lg font-extrabold tracking-tight text-white">
                AuctionCarRadar
              </h1>
              <span className="rounded-full border border-stier-500/30 bg-stier-500/10 px-2 py-0.5 text-[10px] font-bold uppercase tracking-wider text-stier-400">
                S-Tier Precision Engine
              </span>
            </div>
            <p className="text-xs text-muted">
              Court Auction · Onbid · Madang · 실시간 웹 레이더
            </p>
          </div>
        </div>
        <div className="flex items-center gap-2.5">
          <div className="hidden items-center gap-2 rounded-xl border border-tile-800 bg-tile-900 px-3 py-1.5 text-xs text-muted md:flex">
            <span className="size-2 animate-pulse rounded-full bg-emerald-400" />
            <span>
              레이더 활성 ·{" "}
              <strong className="text-fg">{lastScanLabel}</strong>
            </span>
          </div>
          <div className="relative">
            <button
              type="button"
              onClick={onToggleNotif}
              className="relative rounded-xl border border-tile-800/60 bg-tile-800 p-2.5 text-muted transition hover:bg-tile-700 hover:text-white"
              aria-label="알림 열기"
            >
              <Bell className="h-4 w-4" aria-hidden />
              {notifications > 0 ? (
                <span className="absolute -right-1 -top-1 rounded-full bg-stier-500 px-1.5 py-0.5 text-[10px] font-bold text-tile-900 ring-2 ring-tile-900">
                  {notifications > 9 ? "9+" : notifications}
                </span>
              ) : null}
            </button>
          </div>
          <button
            type="button"
            onClick={onOpenSettings}
            className="hidden items-center gap-1.5 rounded-xl border border-tile-800/60 bg-tile-800 px-3 py-2 text-xs font-semibold text-muted transition hover:bg-tile-700 hover:text-white sm:flex"
          >
            <Sliders className="h-3.5 w-3.5" aria-hidden />
            <span>알림 규칙</span>
          </button>
          <button
            type="button"
            onClick={onRunScanClick}
            disabled={scanning}
            className={cn(
              "flex items-center gap-2 whitespace-nowrap rounded-xl bg-gradient-to-r from-stier-400 to-stier-500 px-4 py-2 text-xs font-bold text-tile-900 shadow-lg shadow-stier-500/20 transition hover:from-stier-300 hover:to-stier-400 active:scale-95 sm:text-sm",
              scanning && "opacity-60",
            )}
          >
            <Radar
              className={cn("h-3.5 w-3.5 shrink-0", scanning && "radar-sweep")}
              aria-hidden
            />
            <span className="hidden sm:inline">
              {scanning ? "스캔 중…" : "S-Tier 매칭 스캔"}
            </span>
            <span className="sm:hidden">{scanning ? "…" : "스캔"}</span>
          </button>
        </div>
      </div>
    </header>
  );
}

function EmptyState({ scanning }: { scanning: boolean }) {
  return (
    <section className="rounded-2xl border border-tile-800 bg-tile-900 p-10 text-center text-muted">
      <p className="text-sm font-semibold text-fg">
        {scanning ? "스캔 진행 중…" : "아직 스캔하지 않았습니다"}
      </p>
      <p className="mx-auto mt-2 max-w-md text-xs">
        {scanning
          ? "플랫폼 응답을 기다리는 동안 필터 엔진은 이미 대기 상태입니다."
          : "우측 상단의 “S-Tier 매칭 스캔” 버튼을 눌러 3개 플랫폼을 동시에 수집하세요."}
      </p>
    </section>
  );
}

/**
 * Top-of-page tab switcher between the auction lane (경매/공매, the original
 * product) and the used-car lane (중고 매물, Playwright local-only).
 */
function ViewTabs({
  view,
  onChange,
}: {
  view: "auction" | "usedcar";
  onChange: (v: "auction" | "usedcar") => void;
}) {
  return (
    <div className="inline-flex rounded-2xl border border-tile-800 bg-tile-900 p-1 text-sm">
      <button
        type="button"
        onClick={() => onChange("auction")}
        className={cn(
          "flex items-center gap-2 rounded-xl px-4 py-2 text-xs font-semibold transition sm:text-sm",
          view === "auction"
            ? "bg-stier-500/20 text-stier-300 shadow-inner"
            : "text-muted hover:bg-tile-800 hover:text-white",
        )}
      >
        <Radar className="h-3.5 w-3.5" aria-hidden />
        경매 / 공매
      </button>
      <button
        type="button"
        onClick={() => onChange("usedcar")}
        className={cn(
          "flex items-center gap-2 rounded-xl px-4 py-2 text-xs font-semibold transition sm:text-sm",
          view === "usedcar"
            ? "bg-stier-500/20 text-stier-300 shadow-inner"
            : "text-muted hover:bg-tile-800 hover:text-white",
        )}
      >
        <CarFront className="h-3.5 w-3.5" aria-hidden />
        중고 매물 (로컬)
      </button>
    </div>
  );
}

/**
 * Used-cars lane view — scan button, status summary, listings table.
 * The scraper is local-only (Playwright); on Vercel it returns an empty
 * result with a clear Korean message, so the empty state explains why.
 */
function UsedCarsView({
  scanning,
  result,
  onScan,
}: {
  scanning: boolean;
  result: UsedCarScanResult | null;
  onScan: () => void;
}) {
  return (
    <div className="space-y-4">
      <section className="rounded-2xl border border-tile-800 bg-tile-900 p-5">
        <div className="flex flex-wrap items-center justify-between gap-3">
          <div>
            <p className="text-sm font-semibold text-fg">중고 매물 헤드리스 스캔</p>
            <p className="mt-1 text-xs text-muted">
              K Car + KB차차차를 Playwright 로 렌더링해 매물을 추출합니다. Vercel 서버리스에서는 동작하지
              않으므로 로컬 PC 에서만 사용 가능합니다.
            </p>
          </div>
          <button
            type="button"
            onClick={onScan}
            disabled={scanning}
            className={cn(
              "flex items-center gap-2 whitespace-nowrap rounded-xl bg-gradient-to-r from-stier-400 to-stier-500 px-4 py-2 text-xs font-bold text-tile-900 shadow-lg shadow-stier-500/20 transition hover:from-stier-300 hover:to-stier-400 active:scale-95 sm:text-sm",
              scanning && "opacity-60",
            )}
          >
            <CarFront
              className={cn("h-3.5 w-3.5 shrink-0", scanning && "radar-sweep")}
              aria-hidden
            />
            <span>{scanning ? "수집 중…" : "중고 매물 스캔"}</span>
          </button>
        </div>
        {result && (
          <div className="mt-4 grid grid-cols-2 gap-2 text-xs sm:grid-cols-4">
            <SummaryStat label="수집" value={`${result.totals.fetched}건`} />
            <SummaryStat
              label="필터 통과"
              value={`${result.totals.matched}건`}
              tone="positive"
            />
            <SummaryStat label="제외" value={`${result.totals.rejected}건`} />
            <SummaryStat label="소요" value={`${result.durationMs}ms`} />
          </div>
        )}
        {result?.sources.map((s) => (
          <div
            key={s.platform}
            className="mt-2 flex items-center justify-between rounded-lg border border-tile-800 bg-tile-900/50 px-3 py-2 text-xs text-muted"
          >
            <span className="font-semibold text-fg">{s.label}</span>
            <span className="text-right text-[11px]">{s.message}</span>
          </div>
        ))}
      </section>
      {result && result.listings.length > 0 ? (
        <UsedCarsTable listings={result.listings} />
      ) : (
        <section className="rounded-2xl border border-tile-800 bg-tile-900 p-10 text-center text-muted">
          <p className="text-sm font-semibold text-fg">
            {scanning
              ? "수집 중…"
              : result
                ? "표시할 매물이 없습니다."
                : "아직 스캔하지 않았습니다"}
          </p>
          <p className="mx-auto mt-2 max-w-md text-xs">
            {scanning
              ? "헤드리스 브라우저가 페이지를 여는 동안 잠시 기다려 주세요."
              : result
                ? "필터 또는 사이트 응답 문제로 매물을 가져오지 못했습니다. 위 메시지를 확인하세요."
                : "위 “중고 매물 스캔” 버튼을 눌러 2개 매물 사이트에서 매물을 추출하세요."}
          </p>
        </section>
      )}
    </div>
  );
}

function SummaryStat({
  label,
  value,
  tone = "neutral",
}: {
  label: string;
  value: string;
  tone?: "neutral" | "positive";
}) {
  return (
    <div className="rounded-lg border border-tile-800 bg-tile-900/50 px-3 py-2">
      <p className="text-[10px] uppercase tracking-wider text-muted">{label}</p>
      <p
        className={cn(
          "mt-0.5 font-mono text-sm font-bold",
          tone === "positive" ? "text-emerald-400" : "text-fg",
        )}
      >
        {value}
      </p>
    </div>
  );
}

function ClickOutsideCloser({
  when,
  onAnyClick,
}: {
  when: boolean;
  onAnyClick: () => void;
}) {
  useEffect(() => {
    if (!when) return;
    const handler = (e: MouseEvent) => {
      const target = e.target as HTMLElement | null;
      if (!target) return;
      if (target.closest("[data-notif-drawer]")) return;
      onAnyClick();
    };
    document.addEventListener("click", handler);
    return () => document.removeEventListener("click", handler);
  }, [when, onAnyClick]);
  return null;
}