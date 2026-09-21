import { useEffect, useRef, useState } from "react";
import { Radar, X } from "lucide-react";
import { cn } from "@/lib/utils";

const STEPS = [
  {
    p: 20,
    msg: "[CourtScraper] courtauction.go.kr 에 EV/Hybrid 목록 질의 중…",
  },
  {
    p: 40,
    msg: "[OnbidScraper] 캠코 공매 차량 AJAX 검색 추출 중…",
  },
  {
    p: 60,
    msg: "[MadangScraper] 경매마당 자동차 API 검색 피드 가로채는 중…",
  },
  {
    p: 80,
    msg: "[STierEvaluator] 5-Rule Precision 검증 (주행 ≤ 15k · 보증 · 오토마트 · 교차검증)…",
  },
  {
    p: 100,
    msg: "[WebAlertEngine] 완료! 신차급 RAV4 Hybrid 등 S-Tier 매칭 점수 산출.",
  },
];

export function ScanModal({
  open,
  onClose,
  onCompleted,
  onRunScan,
  scanning,
}: {
  open: boolean;
  onClose: () => void;
  onCompleted?: () => void;
  onRunScan?: () => void | Promise<void>;
  scanning?: boolean;
}) {
  const [logs, setLogs] = useState<string[]>(["[System] S-Tier Precision Scraper 엔진 초기화…"]);
  const [progress, setProgress] = useState(0);
  const [done, setDone] = useState(false);
  const containerRef = useRef<HTMLDivElement | null>(null);

  useEffect(() => {
    if (!open) {
      setLogs(["[System] S-Tier Precision Scraper 엔진 초기화…"]);
      setProgress(0);
      setDone(false);
      return;
    }
    let cancelled = false;
    setLogs(["[System] S-Tier Precision Scraper 엔진 초기화…"]);
    setProgress(0);
    setDone(false);
    let idx = 0;
    const advance = () => {
      if (cancelled) return;
      if (idx >= STEPS.length) {
        setDone(true);
        onCompleted?.();
        return;
      }
      const step = STEPS[idx++];
      setProgress(step.p);
      setLogs((prev) => [...prev, step.msg]);
      // Auto-scroll
      queueMicrotask(() => {
        const node = containerRef.current;
        if (node) node.scrollTop = node.scrollHeight;
      });
      setTimeout(advance, 650);
    };
    advance();
    return () => {
      cancelled = true;
    };
  }, [open, onCompleted]);

  if (!open) return null;

  return (
    <div
      className="fixed inset-0 z-50 flex items-center justify-center bg-tile-900/85 p-4 backdrop-blur-sm"
      role="dialog"
      aria-modal="true"
    >
      <div className="w-full max-w-lg space-y-5 rounded-2xl border border-tile-800 bg-tile-900 p-6 shadow-2xl">
        <header className="flex items-center justify-between border-b border-tile-800 pb-3">
          <div className="flex items-center gap-2">
            <span className="s-tier-pulse block size-2.5 rounded-full bg-stier-400" />
            <h3 className="text-base font-bold text-white">
              AuctionCarRadar S-Tier 스캔
            </h3>
            <Radar className="size-3.5 text-stier-300 radar-sweep" aria-hidden />
          </div>
          <button
            type="button"
            onClick={onClose}
            className="text-muted transition hover:text-white"
            aria-label="닫기"
          >
            <X className="h-4 w-4" aria-hidden />
          </button>
        </header>
        <div
          ref={containerRef}
          className="scan-line h-48 space-y-1 overflow-y-auto rounded-xl border border-tile-800 bg-tile-900 p-3 font-mono text-xs text-fg"
        >
          {logs.map((line, i) => (
            <p
              key={`${i}-${line.slice(0, 8)}`}
              className={cn(
                i === 0
                  ? "text-muted"
                  : line.startsWith("[System]")
                    ? "text-muted"
                    : "text-stier-400",
              )}
            >
              {line}
            </p>
          ))}
        </div>
        <div className="space-y-1">
          <div className="flex justify-between text-xs text-muted">
            <span>S-Tier Precision 평가 진행률</span>
            <span className="font-mono text-stier-400">{progress}%</span>
          </div>
          <div className="h-2 w-full overflow-hidden rounded-full bg-tile-800">
            <div
              className="h-2 rounded-full bg-stier-400 transition-all duration-300"
              style={{ width: `${progress}%` }}
            />
          </div>
        </div>
        <div className="flex justify-end gap-2 pt-2">
          {done && onRunScan ? (
            <button
              type="button"
              onClick={async () => {
                await onRunScan();
                onClose();
              }}
              disabled={scanning}
              className={cn(
                "rounded-xl bg-stier-500 px-4 py-2 text-xs font-bold text-tile-900 shadow-lg shadow-stier-500/20 transition hover:bg-stier-400",
                scanning && "opacity-60",
              )}
            >
              {scanning ? "스캔 실행 중…" : "실제 스캔 실행"}
            </button>
          ) : null}
          <button
            type="button"
            onClick={onClose}
            disabled={!done}
            className={cn(
              "rounded-xl px-4 py-2 text-xs font-semibold transition",
              done
                ? "bg-tile-800 text-fg hover:bg-tile-700"
                : "cursor-not-allowed bg-tile-800 text-muted opacity-50",
            )}
          >
            {done ? "닫기" : "스캔 중…"}
          </button>
        </div>
      </div>
    </div>
  );
}