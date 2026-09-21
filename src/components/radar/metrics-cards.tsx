import { CheckCircle2, Crown, Gem, Layers, Percent } from "lucide-react";
import type { ScanResult } from "@/lib/radar/types";
import { cn } from "@/lib/utils";

export function MetricsCards({ scan }: { scan: ScanResult | null }) {
  const totals = scan?.totals;
  const items: Array<{
    label: string;
    value: string;
    hint: string;
    accent?: "amber" | "emerald" | "purple";
    Icon: React.ComponentType<{ className?: string }>;
  }> = [
    {
      label: "총 스캔",
      value: String(totals?.fetched ?? 0),
      hint: "Court · Onbid · Madang",
      Icon: Layers,
    },
    {
      label: "S-Tier 매칭",
      value: String(totals?.sTier ?? 0),
      hint: "5-Rule Precision 통과",
      accent: "amber",
      Icon: Gem,
    },
    {
      label: "A-Grade 표준",
      value: String(totals?.gradeA ?? 0),
      hint: "1차 통과 + 차키",
      accent: "emerald",
      Icon: CheckCircle2,
    },
    {
      label: "평균 스윗 할인",
      value: `${totals?.sweetDiscountPct ?? 0}%`,
      hint: "1-2회 유찰 직행",
      accent: "purple",
      Icon: Percent,
    },
  ];

  return (
    <section className="grid grid-cols-1 gap-4 sm:grid-cols-2 lg:grid-cols-4">
      {items.map((item) => (
        <div
          key={item.label}
          className={cn(
            "flex items-center justify-between rounded-2xl border bg-tile-900 p-4 shadow-sm",
            item.accent === "amber"
              ? "border-stier-500/30 s-tier-card-glow"
              : "border-tile-800",
          )}
        >
          <div>
            <p
              className={cn(
                "flex items-center gap-1 text-[11px] font-bold uppercase tracking-wider",
                item.accent === "amber" ? "text-stier-400" : "text-muted",
              )}
            >
              {item.accent === "amber" ? (
                <Crown className="h-3 w-3" aria-hidden />
              ) : null}
              {item.label}
            </p>
            <h3
              className={cn(
                "mt-1 text-2xl font-bold",
                item.accent === "amber"
                  ? "text-stier-300"
                  : item.accent === "emerald"
                    ? "text-emerald-400"
                    : item.accent === "purple"
                      ? "text-purple-400"
                      : "text-white",
              )}
            >
              {item.value}
            </h3>
            <p
              className={cn(
                "mt-0.5 text-xs",
                item.accent === "amber" ? "text-stier-500/80" : "text-muted",
              )}
            >
              {item.hint}
            </p>
          </div>
          <div
            className={cn(
              "flex size-12 items-center justify-center rounded-xl border text-lg",
              item.accent === "amber"
                ? "border-stier-500/30 bg-stier-500/10 text-stier-400"
                : item.accent === "emerald"
                  ? "border-emerald-500/20 bg-emerald-500/10 text-emerald-400"
                  : item.accent === "purple"
                    ? "border-purple-500/20 bg-purple-500/10 text-purple-400"
                    : "bg-tile-800 text-muted",
            )}
          >
            <item.Icon className="h-5 w-5" aria-hidden />
          </div>
        </div>
      ))}
    </section>
  );
}