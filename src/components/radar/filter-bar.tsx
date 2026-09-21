import { Bookmark, Filter, Search } from "lucide-react";
import { cn } from "@/lib/utils";

export type FilterState = {
  search: string;
  tier: "ALL" | "S_TIER" | "A_GRADE";
  platform: "ALL" | "Court" | "Onbid" | "Madang";
  storage: "ALL" | "OFFICIAL";
  fuel: "ALL" | "하이브리드" | "전기";
  savedOnly: boolean;
};

export const EMPTY_FILTER: FilterState = {
  search: "",
  tier: "ALL",
  platform: "ALL",
  storage: "ALL",
  fuel: "ALL",
  savedOnly: false,
};

export function FilterBar({
  value,
  onChange,
  onReset,
}: {
  value: FilterState;
  onChange: (next: Partial<FilterState>) => void;
  onReset: () => void;
}) {
  return (
    <section className="space-y-3.5 rounded-2xl border border-tile-800 bg-tile-900 p-4">
      <div className="flex flex-col gap-3 md:flex-row md:items-center md:justify-between">
        <div className="relative flex-1">
          <Search className="pointer-events-none absolute left-3.5 top-1/2 size-3.5 -translate-y-1/2 text-muted" />
          {/*
            React 19 dev mode occasionally emits a benign controlled-input
            hydration mismatch on the empty-string `value` form. The runtime
            state stays correct (the controlled value is reconciled on the
            first effect tick); we silence only this attribute warning.
          */}
          <input
            type="text"
            value={value.search}
            onChange={(e) => onChange({ search: e.target.value })}
            placeholder="모델명 (예: RAV4, IONIQ, EV6), 사건번호, 법원, 보관소…"
            className="w-full rounded-xl border border-tile-800 bg-tile-900 py-2 pl-9 pr-4 text-xs text-fg placeholder:text-muted focus:border-stier-500 focus:outline-none"
            suppressHydrationWarning
          />
        </div>
        <div className="flex flex-wrap items-center gap-2">
          <select
            value={value.tier}
            onChange={(e) => onChange({ tier: e.target.value as FilterState["tier"] })}
            className="rounded-xl border border-stier-500/30 bg-tile-900 px-3 py-2 text-xs font-semibold text-stier-300 focus:border-stier-400 focus:outline-none"
          >
            <option value="ALL">전체 티어</option>
            <option value="S_TIER">👑 S-Tier 매칭만</option>
            <option value="A_GRADE">A-Grade 표준만</option>
          </select>
          <select
            value={value.platform}
            onChange={(e) =>
              onChange({ platform: e.target.value as FilterState["platform"] })
            }
            className="rounded-xl border border-tile-800 bg-tile-900 px-3 py-2 text-xs text-muted focus:border-stier-500 focus:outline-none"
          >
            <option value="ALL">전체 플랫폼</option>
            <option value="Court">대법원 법원경매</option>
            <option value="Onbid">캠코 온비드</option>
            <option value="Madang">경매마당</option>
          </select>
          <select
            value={value.storage}
            onChange={(e) =>
              onChange({ storage: e.target.value as FilterState["storage"] })
            }
            className="rounded-xl border border-tile-800 bg-tile-900 px-3 py-2 text-xs text-muted focus:border-stier-500 focus:outline-none"
          >
            <option value="ALL">보관소: 전체</option>
            <option value="OFFICIAL">공인 전문보관소 (오토마트 등)</option>
          </select>
          <select
            value={value.fuel}
            onChange={(e) => onChange({ fuel: e.target.value as FilterState["fuel"] })}
            className="rounded-xl border border-tile-800 bg-tile-900 px-3 py-2 text-xs text-muted focus:border-stier-500 focus:outline-none"
          >
            <option value="ALL">전체 연료</option>
            <option value="하이브리드">하이브리드 (Hybrid)</option>
            <option value="전기">전기 / 수소 (EV)</option>
          </select>
          <button
            type="button"
            onClick={() => onChange({ savedOnly: !value.savedOnly })}
            className={cn(
              "flex items-center gap-1.5 rounded-xl border px-3 py-2 text-xs font-semibold transition",
              value.savedOnly
                ? "border-stier-500/30 bg-stier-500/20 text-stier-300"
                : "border-tile-800 bg-tile-900 text-muted hover:text-stier-300",
            )}
          >
            <Bookmark className="h-3.5 w-3.5" aria-hidden />
            <span>저장됨</span>
          </button>
        </div>
      </div>
      <div className="flex flex-wrap items-center gap-2 border-t border-tile-800/80 pt-2 text-[11px] text-muted">
        <span className="flex items-center gap-1 font-bold text-stier-400">
          <Filter className="h-3 w-3" aria-hidden /> S-Tier Precision Rules:
        </span>
        <span className="rounded-md border border-stier-500/20 bg-stier-500/10 px-2 py-0.5 text-stier-300">
          ① 주행거리 ≤ 15,000 km
        </span>
        <span className="rounded-md border border-stier-500/20 bg-stier-500/10 px-2 py-0.5 text-stier-300">
          ② 보증 유효 (연식 ≥ 2024)
        </span>
        <span className="rounded-md border border-stier-500/20 bg-stier-500/10 px-2 py-0.5 text-stier-300">
          ③ 할인 ≥ 30%
        </span>
        <span className="rounded-md border border-stier-500/20 bg-stier-500/10 px-2 py-0.5 text-stier-300">
          ④ 공인 보관소 (오토마트 등)
        </span>
        <span className="rounded-md border border-stier-500/20 bg-stier-500/10 px-2 py-0.5 text-stier-300">
          ⑤ 사고·주행 교차검증
        </span>
        <button
          type="button"
          onClick={onReset}
          className="ml-auto text-[11px] text-muted underline-offset-2 hover:text-stier-300 hover:underline"
        >
          필터 초기화
        </button>
      </div>
    </section>
  );
}