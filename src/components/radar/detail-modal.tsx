import {
  ArrowUpRightFromSquare,
  CheckCircle2,
  FileText,
  Warehouse,
  X,
} from "lucide-react";
import type { StandardListing } from "@/lib/radar/types";
import { cn, formatWon } from "@/lib/utils";

const PLATFORM_LABEL: Record<string, string> = {
  Court: "Court",
  Onbid: "Onbid",
  Madang: "Madang",
};

const PLATFORM_BADGE: Record<string, string> = {
  Court: "bg-blue-500/20 text-blue-400",
  Onbid: "bg-stier-500/20 text-stier-400",
  Madang: "bg-purple-500/20 text-purple-400",
};

export function DetailModal({
  listing,
  onClose,
}: {
  listing: StandardListing | null;
  onClose: () => void;
}) {
  if (!listing) return null;

  const b = listing.sTierBreakdown;
  const tierLabel = listing.isSTier ? "👑 S-TIER" : "A-GRADE";
  const tierClass = listing.isSTier
    ? "bg-stier-500 text-tile-900"
    : "border border-emerald-500/20 bg-emerald-500/10 text-emerald-400";

  const rules: Array<{ label: string; ok: boolean }> = [
    { label: "초단거리 주행거리 (≤ 15,000 km)", ok: b.shortMileage },
    { label: "제조사 무상보증 유효 (연식 ≥ 2024)", ok: b.warrantyValid },
    { label: "스윗 할인 (≥ 30% 직행 감가)", ok: b.sweetDiscount },
    { label: "공인 전문보관소 입고", ok: b.officialStorage },
    { label: "사고이력·키 상태 교차검증", ok: b.crossValidated },
  ];

  return (
    <div
      className="fixed inset-0 z-50 flex items-center justify-center bg-tile-900/85 p-4 backdrop-blur-sm"
      onClick={onClose}
      role="dialog"
      aria-modal="true"
    >
      <div
        className="scrollbar-thin max-h-[90vh] w-full max-w-2xl space-y-6 overflow-y-auto rounded-2xl border border-tile-800 bg-tile-900 p-6 shadow-2xl"
        onClick={(e) => e.stopPropagation()}
      >
        <header className="flex items-start justify-between border-b border-tile-800 pb-4">
          <div>
            <div className="mb-1 flex flex-wrap items-center gap-2">
              <span
                className={cn("rounded px-2 py-0.5 text-xs font-black", tierClass)}
              >
                {tierLabel}
              </span>
              <span
                className={cn(
                  "rounded px-2 py-0.5 text-xs font-semibold",
                  PLATFORM_BADGE[listing.platformName] ?? "bg-tile-800 text-muted",
                )}
              >
                {PLATFORM_LABEL[listing.platformName] ?? listing.platformName}
              </span>
              <span className="font-mono text-xs text-muted">{listing.caseNo}</span>
            </div>
            <h2 className="text-xl font-bold text-white">{listing.carName}</h2>
            <p className="mt-0.5 text-xs text-muted">{listing.courtOrDept}</p>
          </div>
          <button
            type="button"
            onClick={onClose}
            className="rounded-xl bg-tile-800 p-2 text-muted transition hover:text-white"
            aria-label="닫기"
          >
            <X className="h-4 w-4" aria-hidden />
          </button>
        </header>

        <section className="space-y-3 rounded-xl border border-stier-500/30 bg-tile-900 p-4">
          <div className="flex items-center justify-between">
            <div className="flex items-center gap-2">
              <CheckCircle2 className="h-5 w-5 text-stier-400" aria-hidden />
              <h3 className="text-sm font-bold text-stier-300">S-Tier Precision Score</h3>
            </div>
            <div className="text-right">
              <span className="text-2xl font-black text-stier-400">{listing.sTierScore}</span>
              <span className="text-xs text-muted"> / 100</span>
            </div>
          </div>
          <div className="h-2.5 w-full overflow-hidden rounded-full bg-tile-800">
            <div
              className="h-2.5 rounded-full bg-gradient-to-r from-stier-500 to-stier-300"
              style={{ width: `${listing.sTierScore}%` }}
            />
          </div>
          <div className="grid grid-cols-1 gap-2 pt-1 text-xs sm:grid-cols-2">
            {rules.map((rule) => (
              <div
                key={rule.label}
                className={cn(
                  "flex items-center gap-1.5 rounded-md px-2 py-1",
                  rule.ok ? "text-stier-300" : "text-muted line-through opacity-60",
                )}
              >
                <CheckCircle2
                  className={cn("h-3.5 w-3.5", rule.ok ? "text-stier-400" : "text-tile-700")}
                  aria-hidden
                />
                <span>{rule.label}</span>
              </div>
            ))}
          </div>
        </section>

        <section className="grid grid-cols-3 gap-3">
          <Spec label="연식" value={listing.year ? `${listing.year}년식` : "미확인"} />
          <Spec
            label="주행거리"
            value={`${listing.mileage?.toLocaleString("ko-KR") ?? "—"} km`}
            tone={b.shortMileage ? "amber" : "default"}
          />
          <Spec
            label="보관소"
            value={listing.storageSite ?? "미확인"}
            tone={b.officialStorage ? "amber" : "default"}
            icon
          />
        </section>

        <section className="space-y-2 rounded-xl border border-tile-800 bg-tile-900/80 p-4">
          <Row label="감정평가액 (감정가)" value={formatWon(listing.appraisalPrice)} />
          <div className="flex items-center justify-between border-t border-tile-800 pt-2 text-sm font-bold text-white">
            <span className="text-stier-400">최저매각가</span>
            <span className="text-stier-400">{formatWon(listing.minPrice)}</span>
          </div>
          <div className="text-right text-xs text-muted">
            할인율:{" "}
            <span className="font-bold text-emerald-400">
              {listing.discountRate != null ? `-${listing.discountRate}% (직행 감가)` : "—"}
            </span>
          </div>
        </section>

        <section className="space-y-2">
          <h3 className="flex items-center gap-2 text-xs font-bold uppercase tracking-wider text-fg">
            <FileText className="h-3.5 w-3.5 text-blue-400" aria-hidden />
            감정·교차검증 노트
          </h3>
          <div className="space-y-2 rounded-xl border border-tile-800 bg-tile-900 p-3 text-xs leading-relaxed">
            <div className="flex items-center gap-2 font-semibold text-emerald-400">
              <CheckCircle2 className="h-3.5 w-3.5" aria-hidden />
              <span>
                차키·보관소 검증:{" "}
                {listing.matchedKeyKeywords.length > 0
                  ? listing.matchedKeyKeywords.join(", ")
                  : listing.keyStatus}
              </span>
            </div>
            {listing.rawText ? (
              <p className="rounded-lg border border-tile-800/60 bg-tile-900/60 p-2.5 italic text-muted">
                “{listing.rawText.slice(0, 320)}”
              </p>
            ) : null}
          </div>
        </section>

        <footer className="flex items-center justify-between border-t border-tile-800 pt-3">
          <span className="text-xs text-muted">AuctionCarRadar Core 자동 검증</span>
          <a
            href={listing.detailUrl}
            target="_blank"
            rel="noreferrer"
            className="flex items-center gap-2 rounded-xl bg-stier-500 px-4 py-2 text-xs font-bold text-tile-900 transition hover:bg-stier-400"
          >
            <span>공식 페이지 열기</span>
            <ArrowUpRightFromSquare className="h-3 w-3" aria-hidden />
          </a>
        </footer>
      </div>
    </div>
  );
}

function Spec({
  label,
  value,
  tone = "default",
  icon,
}: {
  label: string;
  value: string;
  tone?: "default" | "amber";
  icon?: boolean;
}) {
  return (
    <div className="rounded-xl border border-tile-800 bg-tile-900 p-3">
      <span className="block text-[11px] text-muted">{label}</span>
      <span
        className={cn(
          "flex items-center gap-1 text-sm font-bold",
          tone === "amber" ? "text-stier-400" : "text-fg",
        )}
      >
        {icon ? <Warehouse className="h-3.5 w-3.5" aria-hidden /> : null}
        {value}
      </span>
    </div>
  );
}

function Row({ label, value }: { label: string; value: string }) {
  return (
    <div className="flex items-center justify-between text-xs text-muted">
      <span>{label}</span>
      <span className="font-semibold text-fg">{value}</span>
    </div>
  );
}