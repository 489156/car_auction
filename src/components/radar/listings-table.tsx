import {
  Bookmark,
  CalendarCheck2,
  ExternalLink,
  SearchX,
  ShieldCheck,
  Warehouse,
} from "lucide-react";
import type { StandardListing } from "@/lib/radar/types";
import { cn, formatWon } from "@/lib/utils";
import type { FilterState } from "./filter-bar.tsx";

const PLATFORM_LABEL: Record<string, string> = {
  Court: "대법원",
  Onbid: "온비드",
  Madang: "경매마당",
};

const PLATFORM_BADGE: Record<string, string> = {
  Court: "bg-blue-500/10 text-blue-400 border-blue-500/20",
  Onbid: "bg-stier-500/10 text-stier-400 border-stier-500/20",
  Madang: "bg-purple-500/10 text-purple-400 border-purple-500/20",
};

export function listingsFilterPredicate(
  state: FilterState,
): (listing: StandardListing) => boolean {
  const search = state.search.trim().toLowerCase();
  return (listing) => {
    if (search) {
      const haystack = `${listing.carName} ${listing.caseNo} ${listing.courtOrDept} ${listing.storageSite ?? ""}`.toLowerCase();
      if (!haystack.includes(search)) return false;
    }
    if (state.tier === "S_TIER" && !listing.isSTier) return false;
    if (state.tier === "A_GRADE" && listing.isSTier) return false;
    if (state.platform !== "ALL") {
      const want = state.platform === "Court" ? "court" : state.platform === "Onbid" ? "onbid" : "madang";
      if (listing.platform !== want) return false;
    }
    if (state.storage === "OFFICIAL" && !listing.sTierBreakdown.officialStorage) {
      return false;
    }
    if (state.fuel !== "ALL" && listing.fuel !== state.fuel) {
      return false;
    }
    return true;
  };
}

export function ListingsTable({
  listings,
  favorites,
  onInspect,
  onToggleFavorite,
}: {
  listings: StandardListing[];
  favorites: string[];
  onInspect: (id: string) => void;
  onToggleFavorite: (id: string) => void;
}) {
  if (listings.length === 0) {
    return (
      <div className="space-y-3 rounded-2xl border border-tile-800 bg-tile-900 p-12 text-center">
        <div className="mx-auto flex size-12 items-center justify-center rounded-full bg-tile-800 text-lg text-muted">
          <SearchX className="h-5 w-5" aria-hidden />
        </div>
        <p className="text-sm text-muted">
          현재 S-Tier 기준에 매칭되는 매물이 없습니다. 필터를 완화하거나 새로 탐색해 보세요.
        </p>
      </div>
    );
  }
  return (
    <section className="overflow-hidden rounded-2xl border border-tile-800 bg-tile-900 shadow-xl">
      <div className="overflow-x-auto">
        <table className="w-full border-collapse text-left text-sm">
          <thead>
            <tr className="border-b border-tile-800 bg-tile-900/80 text-[11px] font-bold uppercase tracking-wider text-muted">
              <th className="px-4 py-3.5">차량 정보</th>
              <th className="px-4 py-3.5">스펙 · 보관소</th>
              <th className="px-4 py-3.5">금액 · 할인</th>
              <th className="px-4 py-3.5">S-Tier Score</th>
              <th className="px-4 py-3.5">경매 기일</th>
              <th className="px-4 py-3.5 text-right">동작</th>
            </tr>
          </thead>
          <tbody className="divide-y divide-tile-800/60 text-sm">
            {listings.map((listing) => {
              const platformName = PLATFORM_LABEL[listing.platformName] ?? listing.platformName;
              const badgeClass = PLATFORM_BADGE[listing.platformName] ?? "bg-tile-800 text-muted border-tile-800";
              const favorited = favorites.includes(listing.id);
              return (
                <tr
                  key={listing.id}
                  className={cn(
                    "border-b border-tile-800/60 transition hover:bg-tile-800/40",
                    listing.isSTier && "bg-stier-700/10",
                  )}
                >
                  <td className="px-4 py-3.5">
                    <div className="flex items-start gap-2.5">
                      <button
                        type="button"
                        onClick={() => onToggleFavorite(listing.id)}
                        className="mt-0.5 text-muted transition hover:text-stier-300"
                        aria-label={favorited ? "즐겨찾기 해제" : "즐겨찾기 추가"}
                      >
                        <Bookmark
                          className={cn(
                            "h-3.5 w-3.5",
                            favorited ? "fill-stier-400 text-stier-400" : "text-muted",
                          )}
                          aria-hidden
                        />
                      </button>
                      <div>
                        <div className="mb-1 flex flex-wrap items-center gap-1.5">
                          {listing.isSTier ? (
                            <span className="flex items-center gap-1 rounded bg-stier-500 px-2 py-0.5 text-[10px] font-black text-tile-900">
                              <ShieldCheck className="h-2.5 w-2.5" aria-hidden /> S-TIER
                            </span>
                          ) : (
                            <span className="rounded border border-emerald-500/20 bg-emerald-500/10 px-2 py-0.5 text-[10px] font-bold text-emerald-400">
                              A-GRADE
                            </span>
                          )}
                          <span
                            className={cn(
                              "rounded border px-2 py-0.5 text-[10px] font-semibold",
                              badgeClass,
                            )}
                          >
                            {platformName}
                          </span>
                          <span className="font-mono text-xs text-muted">{listing.caseNo}</span>
                        </div>
                        <button
                          type="button"
                          onClick={() => onInspect(listing.id)}
                          className="cursor-pointer text-sm font-bold text-white transition hover:text-stier-300"
                        >
                          {listing.carName}
                        </button>
                        <div className="mt-0.5 text-xs text-muted">{listing.courtOrDept}</div>
                      </div>
                    </div>
                  </td>
                  <td className="whitespace-nowrap px-4 py-3.5">
                    <div className="text-xs font-bold text-fg">
                      {listing.year ?? "?"}년식 · {listing.fuel}
                    </div>
                    <div
                      className={cn(
                        "mt-0.5 text-xs font-extrabold",
                        listing.mileage != null && listing.mileage <= 15_000
                          ? "text-stier-400"
                          : "text-emerald-400",
                      )}
                    >
                      {listing.mileage?.toLocaleString("ko-KR") ?? "—"} km
                    </div>
                    <div className="mt-1 flex items-center gap-1 text-[11px] text-muted">
                      <Warehouse className="h-3 w-3 text-muted" aria-hidden />
                      <span>{listing.storageSite ?? "보관소 미확인"}</span>
                    </div>
                  </td>
                  <td className="whitespace-nowrap px-4 py-3.5">
                    <div className="text-xs text-muted line-through">
                      {formatWon(listing.appraisalPrice)}
                    </div>
                    <div className="mt-0.5 text-sm font-black text-stier-400">
                      {formatWon(listing.minPrice)}
                    </div>
                    {listing.discountRate != null ? (
                      <div className="mt-1 inline-block rounded border border-stier-500/20 bg-stier-500/10 px-1.5 py-0.5 text-[10px] font-bold text-stier-400">
                        {listing.discountRate}% 스윗 할인
                      </div>
                    ) : null}
                  </td>
                  <td className="whitespace-nowrap px-4 py-3.5">
                    <div className="flex items-center gap-2">
                      <div className="h-2 w-12 rounded-full bg-tile-800">
                        <div
                          className={cn(
                            "h-2 rounded-full",
                            listing.sTierScore >= 80
                              ? "bg-gradient-to-r from-stier-500 to-stier-300"
                              : "bg-gradient-to-r from-emerald-500 to-emerald-300",
                          )}
                          style={{ width: `${listing.sTierScore}%` }}
                        />
                      </div>
                      <span
                        className={cn(
                          "text-xs font-black",
                          listing.sTierScore >= 80 ? "text-stier-400" : "text-emerald-400",
                        )}
                      >
                        {listing.sTierScore}pt
                      </span>
                    </div>
                    <div className="mt-1 text-[10px] text-muted">
                      {listing.sTierBreakdown.warrantyValid
                        ? "✓ 제조사 보증 유효"
                        : listing.matchedKeyKeywords.length > 0
                          ? "✓ 차키 확인"
                          : "— 차키 미확인"}
                    </div>
                  </td>
                  <td className="whitespace-nowrap px-4 py-3.5 text-xs text-fg">
                    <CalendarCheck2
                      className="mr-1 inline h-3 w-3 text-muted"
                      aria-hidden
                    />
                    {listing.auctionDate || "—"}
                  </td>
                  <td className="whitespace-nowrap px-4 py-3.5 text-right">
                    <button
                      type="button"
                      onClick={() => onInspect(listing.id)}
                      className="me-1 rounded-xl bg-tile-800 px-3 py-1.5 text-xs font-bold text-fg transition hover:bg-tile-700"
                    >
                      상세
                    </button>
                    <a
                      href={listing.detailUrl}
                      target="_blank"
                      rel="noreferrer"
                      className="inline-block rounded-xl bg-stier-500/10 px-2.5 py-1.5 text-xs font-bold text-stier-400 transition hover:bg-stier-500/20"
                    >
                      <ExternalLink className="h-3 w-3" aria-hidden />
                    </a>
                  </td>
                </tr>
              );
            })}
          </tbody>
        </table>
      </div>
    </section>
  );
}