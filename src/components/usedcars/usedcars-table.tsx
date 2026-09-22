import { ExternalLink } from "lucide-react";
import type { UsedCarListing } from "@/lib/usedcars/types";
import { formatWon } from "@/lib/utils";

const PLATFORM_BADGE: Record<string, string> = {
  kcar: "bg-stier-500/10 text-stier-400 border-stier-500/20",
  kbchachacha: "bg-purple-500/10 text-purple-400 border-purple-500/20",
};

const FUEL_BADGE: Record<string, string> = {
  전기: "bg-emerald-500/10 text-emerald-400 border-emerald-500/20",
  하이브리드: "bg-emerald-500/10 text-emerald-400 border-emerald-500/20",
  가솔린: "bg-tile-800 text-muted border-tile-700",
  디젤: "bg-tile-800 text-muted border-tile-700",
  LPG: "bg-tile-800 text-muted border-tile-700",
  기타: "bg-tile-800 text-muted border-tile-700",
};

export function UsedCarsTable({
  listings,
}: {
  listings: UsedCarListing[];
}) {
  if (listings.length === 0) return null;
  return (
    <div className="overflow-hidden rounded-2xl border border-tile-800 bg-tile-900">
      <table className="min-w-full divide-y divide-tile-800 text-sm">
        <thead className="bg-tile-900/60 text-xs uppercase tracking-wider text-muted">
          <tr>
            <th className="px-4 py-3 text-left">차량 정보</th>
            <th className="hidden px-4 py-3 text-left sm:table-cell">연료</th>
            <th className="px-4 py-3 text-right">연식 · 주행</th>
            <th className="px-4 py-3 text-right">판매가</th>
            <th className="px-4 py-3 text-left">판매자</th>
            <th className="px-4 py-3 text-right">동작</th>
          </tr>
        </thead>
        <tbody className="divide-y divide-tile-800">
          {listings.map((l) => {
            const isMatch = (l.grade ?? "match") === "match";
            return (
              <tr
                key={l.id}
                className={`transition hover:bg-tile-800/40 ${isMatch ? "" : "opacity-50"}`}
              >
                <td className="px-4 py-3">
                  <div className="flex flex-col gap-1">
                    <div className="flex items-center gap-2">
                      <span
                        className={`inline-flex items-center rounded-md border px-1.5 py-0.5 text-[10px] font-bold ${PLATFORM_BADGE[l.platform] ?? "bg-tile-800 text-muted border-tile-700"}`}
                      >
                        {l.platformName}
                      </span>
                      {!isMatch && (
                        <span className="inline-flex items-center rounded-md border border-red-500/20 bg-red-500/10 px-1.5 py-0.5 text-[10px] font-bold text-red-400">
                          필터 제외
                        </span>
                      )}
                    </div>
                    <p className="font-semibold text-fg">{l.carName}</p>
                    {l.rejectReasons && l.rejectReasons.length > 0 && (
                      <p className="text-[11px] text-red-300/80">
                        {l.rejectReasons.join(" · ")}
                      </p>
                    )}
                  </div>
                </td>
                <td className="hidden px-4 py-3 sm:table-cell">
                  <span
                    className={`inline-flex items-center rounded-md border px-2 py-0.5 text-[11px] font-semibold ${FUEL_BADGE[l.fuel]}`}
                  >
                    {l.fuel}
                  </span>
                </td>
                <td className="px-4 py-3 text-right">
                  <div className="font-mono text-fg">
                    {l.year != null ? `${l.year}년` : "?"}
                  </div>
                  <div className="font-mono text-xs text-muted">
                    {l.mileage != null
                      ? `${l.mileage.toLocaleString("ko-KR")} km`
                      : "주행거리 미확인"}
                  </div>
                </td>
                <td className="px-4 py-3 text-right">
                  <div className="font-mono text-base font-bold text-fg">
                    {l.listingPrice != null ? formatWon(l.listingPrice) : "가격문의"}
                  </div>
                </td>
                <td className="px-4 py-3">
                  <span className="text-xs text-muted">{l.seller}</span>
                </td>
                <td className="px-4 py-3 text-right">
                  <a
                    href={l.detailUrl}
                    target="_blank"
                    rel="noopener noreferrer"
                    className="inline-flex items-center gap-1 rounded-md border border-tile-700 px-2 py-1 text-xs font-semibold text-muted transition hover:bg-tile-800 hover:text-white"
                  >
                    상세
                    <ExternalLink className="h-3 w-3" aria-hidden />
                  </a>
                </td>
              </tr>
            );
          })}
        </tbody>
      </table>
    </div>
  );
}
