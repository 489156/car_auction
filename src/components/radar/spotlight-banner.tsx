import { ArrowRight, Crown } from "lucide-react";
import type { StandardListing } from "@/lib/radar/types";
import { formatWon } from "@/lib/utils";

export function SpotlightBanner({
  listing,
  onInspect,
}: {
  listing: StandardListing | null;
  onInspect: (id: string) => void;
}) {
  if (!listing) return null;

  const mileage = listing.mileage?.toLocaleString("ko-KR") ?? "—";
  const discount = listing.discountRate != null ? `${listing.discountRate}%` : "—";
  const reasonSnippet = listing.sTierBreakdown.reasons.slice(0, 3).join(" · ");

  return (
    <section className="relative overflow-hidden rounded-2xl border border-stier-500/30 bg-gradient-to-r from-stier-700/30 via-tile-900 to-tile-900 p-4 shadow-xl sm:p-5">
      <div
        className="pointer-events-none absolute -bottom-10 -right-10 h-48 w-48 rounded-full bg-stier-500/10 blur-3xl"
        aria-hidden
      />
      <div className="relative z-10 flex flex-col gap-4 lg:flex-row lg:items-center lg:justify-between">
        <div className="space-y-1.5">
          <div className="flex flex-wrap items-center gap-2">
            <span className="flex items-center gap-1 rounded-md bg-stier-500 px-2.5 py-0.5 text-xs font-extrabold uppercase tracking-wider text-tile-900">
              <Crown className="h-3 w-3" aria-hidden /> S-Tier 매칭
            </span>
            <span className="rounded border border-stier-500/30 bg-stier-500/10 px-2 py-0.5 font-mono text-xs text-stier-300">
              {listing.caseNo}
            </span>
            <span className="rounded border border-emerald-500/20 bg-emerald-500/10 px-2 py-0.5 text-xs font-semibold text-emerald-400">
              Score {listing.sTierScore}/100
            </span>
          </div>
          <h2 className="flex flex-wrap items-center gap-2 text-lg font-bold text-white sm:text-xl">
            <span>{listing.carName}</span>
            <span className="text-xs font-normal text-muted underline">
              {listing.courtOrDept}
            </span>
          </h2>
          <p className="max-w-3xl text-xs leading-relaxed text-tile-700/80">
            <strong className="text-stier-300">S-Tier 검증:</strong>{" "}
            {reasonSnippet || "5-Rule Precision 통과"}
            {" · "}
            {mileage} km · {discount} 할인
          </p>
        </div>
        <div className="flex shrink-0 items-center gap-3">
          <div className="text-right">
            <div className="text-xs text-muted line-through">
              {formatWon(listing.appraisalPrice)}
            </div>
            <div className="text-lg font-black text-stier-400">
              {formatWon(listing.minPrice)}
            </div>
            <div className="text-[10px] font-semibold text-emerald-400">
              {discount} 직행 감가
            </div>
          </div>
          <button
            type="button"
            onClick={() => onInspect(listing.id)}
            className="flex items-center gap-1.5 rounded-xl bg-stier-500 px-4 py-2.5 text-xs font-bold text-tile-900 shadow-lg shadow-stier-500/20 transition hover:bg-stier-400 active:scale-[0.97]"
          >
            <span>상세 평가 보기</span>
            <ArrowRight className="h-3 w-3" aria-hidden />
          </button>
        </div>
      </div>
    </section>
  );
}