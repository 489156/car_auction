import { createFileRoute } from "@tanstack/react-router";
import {
  Activity,
  Filter,
  Radar,
  RefreshCw,
  ShieldAlert,
  Sparkles,
} from "lucide-react";
import { useEffect, useMemo, useState, type ReactNode } from "react";
import { toast, Toaster } from "sonner";
import { ListingCard } from "@/components/radar/listing-card";
import { SettingsPanel } from "@/components/radar/settings-panel";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { runAuctionScan, sendTelegramAlerts } from "@/lib/radar/scan";
import { useRadarStore } from "@/lib/radar/store";
import type { ListingGrade, SourceStatus, StandardListing } from "@/lib/radar/types";
import { cn } from "@/lib/utils";

export const Route = createFileRoute("/")({ component: Home });

type Tab = "a" | "candidate" | "all" | "settings";

function Home() {
  const config = useRadarStore((s) => s.config);
  const telegram = useRadarStore((s) => s.telegram);
  const lastScan = useRadarStore((s) => s.lastScan);
  const historyIds = useRadarStore((s) => s.historyIds);
  const rememberScan = useRadarStore((s) => s.rememberScan);
  const markNotified = useRadarStore((s) => s.markNotified);

  const [tab, setTab] = useState<Tab>("a");
  const [scanning, setScanning] = useState(false);
  const [hydrated, setHydrated] = useState(false);

  useEffect(() => {
    setHydrated(true);
  }, []);

  const listings = hydrated ? (lastScan?.listings ?? []) : [];
  const scan = hydrated ? lastScan : null;
  const visible = useMemo(() => {
    if (tab === "a") return listings.filter((row) => row.grade === "a");
    if (tab === "candidate") return listings.filter((row) => row.grade === "candidate");
    return listings;
  }, [listings, tab]);

  async function handleScan() {
    setScanning(true);
    const toastId = toast.loading("3개 플랫폼을 수집하는 중입니다…");
    try {
      const scan = await runAuctionScan({ data: { config, enrich: true } });
      const freshIds = rememberScan(scan);
      const fresh = scan.listings.filter((row) => freshIds.includes(row.id) && row.grade === "a");

      toast.success(
        `수집 ${scan.totals.fetched} · 1차 ${scan.totals.stage1} · A급 ${scan.totals.gradeA}`,
        { id: toastId },
      );

      if (telegram.enabled && telegram.botToken && telegram.chatId && fresh.length) {
        const result = await sendTelegramAlerts({
          data: { telegram, listings: fresh },
        });
        if (result.error) toast.error(result.error);
        else if (result.sent) {
          markNotified(fresh.map((row) => row.id));
          toast.success(`텔레그램 ${result.sent}건 전송`);
        }
      } else if (fresh.length) {
        markNotified(fresh.map((row) => row.id));
      }

      if (scan.totals.gradeA === 0) setTab(scan.totals.candidates ? "candidate" : "all");
      else setTab("a");
    } catch (error) {
      toast.error(error instanceof Error ? error.message : "스캔 실패", { id: toastId });
    } finally {
      setScanning(false);
    }
  }

  return (
    <main className="mx-auto min-h-dvh max-w-6xl px-4 pb-24 pt-6 sm:px-6 sm:pt-10">
      <Toaster theme="dark" position="top-center" richColors={false} />
      <Header scanning={scanning} onScan={handleScan} />
      <Pipeline />
      <Stats scan={scan} scanning={scanning} />
      <Sources sources={scan?.sources} />

      <div className="mt-8 flex flex-wrap gap-2">
        <TabBtn active={tab === "a"} onClick={() => setTab("a")} count={countGrade(listings, "a")}>
          A급 알짜
        </TabBtn>
        <TabBtn
          active={tab === "candidate"}
          onClick={() => setTab("candidate")}
          count={countGrade(listings, "candidate")}
        >
          1차 통과
        </TabBtn>
        <TabBtn active={tab === "all"} onClick={() => setTab("all")} count={listings.length}>
          전체
        </TabBtn>
        <TabBtn active={tab === "settings"} onClick={() => setTab("settings")}>
          설정
        </TabBtn>
      </div>

      {tab === "settings" ? (
        <div className="mt-6">
          <SettingsPanel />
        </div>
      ) : (
        <ListingGrid
          tab={tab}
          listings={visible}
          historyIds={historyIds}
          scanned={Boolean(scan)}
          scanning={scanning}
        />
      )}
    </main>
  );
}

function Header({ scanning, onScan }: { scanning: boolean; onScan: () => void }) {
  return (
    <header className="flex flex-col gap-5 sm:flex-row sm:items-end sm:justify-between">
      <div className="stagger-in">
        <p className="flex items-center gap-2 text-xs font-medium uppercase tracking-widest text-accent">
          <Radar className={cn("size-3.5", scanning && "radar-sweep")} />
          AuctionCarRadar
        </p>
        <h1 className="mt-2 font-display text-4xl leading-tight tracking-tight sm:text-5xl">
          A급 친환경 경매차를
          <br />
          세 플랫폼에서 걸러냅니다
        </h1>
        <p className="mt-3 max-w-xl text-sm text-muted">
          대법원 경매 · 온비드 공매 · 경매마당을 한 번에 수집하고, 2022년식 이후 · 5만 km 이하 ·
          하이브리드/전기 · 차키 · 사고 키워드를 AND로 통과한 매물만 남깁니다.
        </p>
      </div>
      <Button size="lg" onClick={onScan} disabled={scanning} className="w-full sm:w-auto">
        <RefreshCw className={cn("size-4", scanning && "animate-spin")} />
        {scanning ? "수집 중" : "지금 탐색"}
      </Button>
    </header>
  );
}

function Pipeline() {
  const steps = [
    { icon: Activity, label: "멀티 수집" },
    { icon: Filter, label: "연식·주행·연료" },
    { icon: ShieldAlert, label: "키·위험 키워드" },
    { icon: Sparkles, label: "중복 제거·알림" },
  ];
  return (
    <ol className="mt-8 grid grid-cols-2 gap-2 sm:grid-cols-4">
      {steps.map((step, i) => (
        <li
          key={step.label}
          className="flex items-center gap-2 rounded-xl bg-surface px-3 py-3 text-sm shadow-[var(--shadow-border)]"
        >
          <span className="flex size-8 items-center justify-center rounded-lg bg-raised text-accent">
            <step.icon className="size-4" />
          </span>
          <span>
            <span className="block text-xs text-subtle">0{i + 1}</span>
            {step.label}
          </span>
        </li>
      ))}
    </ol>
  );
}

function Stats({
  scan,
  scanning,
}: {
  scan: ReturnType<typeof useRadarStore.getState>["lastScan"];
  scanning: boolean;
}) {
  const items = [
    { label: "수집", value: scan?.totals.fetched ?? 0 },
    { label: "1차 통과", value: scan?.totals.stage1 ?? 0 },
    { label: "A급", value: scan?.totals.gradeA ?? 0 },
    { label: "소요(초)", value: scan ? Math.max(1, Math.round(scan.durationMs / 1000)) : 0 },
  ];
  return (
    <section className="mt-6 grid grid-cols-2 gap-2 sm:grid-cols-4">
      {items.map((item) => (
        <div key={item.label} className="rounded-2xl bg-surface px-4 py-4 shadow-[var(--shadow-border)]">
          <p className="text-xs text-subtle">{item.label}</p>
          <p className={cn("mt-1 font-mono text-2xl tabular-nums", scanning && "opacity-50")}>
            {item.value}
          </p>
        </div>
      ))}
    </section>
  );
}

function Sources({
  sources,
}: {
  sources: ReturnType<typeof useRadarStore.getState>["lastScan"] extends infer T
    ? T extends { sources: infer S }
      ? S
      : undefined
    : undefined;
}) {
  const fallback = [
    { platform: "court", label: "대법원 법원경매", status: "blocked" as SourceStatus, fetched: 0, message: "탐색 전" },
    { platform: "onbid", label: "캠코 온비드", status: "empty" as SourceStatus, fetched: 0, message: "탐색 전" },
    { platform: "madang", label: "경매마당", status: "empty" as SourceStatus, fetched: 0, message: "탐색 전" },
  ];
  const rows = sources?.length ? sources : fallback;
  return (
    <section className="mt-4 grid gap-2 md:grid-cols-3">
      {rows.map((row) => (
        <div key={row.platform} className="rounded-xl bg-surface p-4 shadow-[var(--shadow-border)]">
          <div className="flex items-center justify-between gap-2">
            <p className="text-sm font-medium">{row.label}</p>
            <Badge variant={statusVariant(row.status)}>{statusLabel(row.status)}</Badge>
          </div>
          <p className="mt-2 text-xs leading-relaxed text-muted">{row.message}</p>
          <p className="mt-2 font-mono text-xs tabular-nums text-subtle">{row.fetched}건</p>
        </div>
      ))}
    </section>
  );
}

function ListingGrid({
  tab,
  listings,
  historyIds,
  scanned,
  scanning,
}: {
  tab: Tab;
  listings: StandardListing[];
  historyIds: string[];
  scanned: boolean;
  scanning: boolean;
}) {
  if (!scanned && !scanning) {
    return (
      <Empty
        title="아직 스캔하지 않았습니다"
        body="지금 탐색을 누르면 온비드와 경매마당을 실제 수집하고, 대법원 공식 사이트는 연결 가능 여부를 보고합니다."
      />
    );
  }
  if (scanning && listings.length === 0) {
    return (
      <Empty title="수집 중" body="플랫폼 응답을 기다리는 동안 필터 엔진은 이미 대기 상태입니다." />
    );
  }
  if (listings.length === 0) {
    return (
      <Empty
        title={tab === "a" ? "이번 스캔에서 A급이 없습니다" : "표시할 매물이 없습니다"}
        body={
          tab === "a"
            ? "차키 키워드가 상세 텍스트에 없으면 A급에서 제외됩니다. 1차 통과 탭이나 설정에서 키 필수 조건을 완화해 보세요."
            : "필터를 완화하거나 다시 탐색해 보세요."
        }
      />
    );
  }
  return (
    <div className="mt-6 grid gap-3 lg:grid-cols-2">
      {listings.map((listing) => (
        <ListingCard
          key={listing.id}
          listing={listing}
          isNew={!historyIds.includes(listing.id) && listing.grade === "a"}
        />
      ))}
    </div>
  );
}

function Empty({ title, body }: { title: string; body: string }) {
  return (
    <div className="mt-6 rounded-2xl bg-surface px-6 py-16 text-center shadow-[var(--shadow-border)]">
      <p className="font-display text-2xl">{title}</p>
      <p className="mx-auto mt-2 max-w-md text-sm text-muted">{body}</p>
    </div>
  );
}

function TabBtn({
  active,
  onClick,
  count,
  children,
}: {
  active: boolean;
  onClick: () => void;
  count?: number;
  children: ReactNode;
}) {
  return (
    <button
      type="button"
      onClick={onClick}
      className={cn(
        "inline-flex h-11 items-center gap-2 rounded-full px-4 text-sm transition-[background-color,color] duration-150",
        active ? "bg-accent text-accent-fg" : "bg-surface text-muted shadow-[var(--shadow-border)]",
      )}
    >
      {children}
      {typeof count === "number" ? (
        <span className="font-mono text-xs tabular-nums">{count}</span>
      ) : null}
    </button>
  );
}

function countGrade(listings: StandardListing[], grade: ListingGrade) {
  return listings.filter((row) => row.grade === grade).length;
}

function statusLabel(status: SourceStatus) {
  if (status === "live") return "실시간";
  if (status === "blocked") return "차단";
  if (status === "error") return "오류";
  return "대기";
}

function statusVariant(status: SourceStatus) {
  if (status === "live") return "accent" as const;
  if (status === "blocked" || status === "error") return "danger" as const;
  return "outline" as const;
}
