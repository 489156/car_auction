import type { ReactNode } from "react";
import { ExternalLink, Fuel, Gauge, KeyRound, Landmark } from "lucide-react";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import type { StandardListing } from "@/lib/radar/types";
import { formatKm, formatWon } from "@/lib/utils";

const GRADE_LABEL = {
  a: "A급 알짜",
  candidate: "1차 통과",
  rejected: "제외",
} as const;

export function ListingCard({
  listing,
  isNew,
}: {
  listing: StandardListing;
  isNew?: boolean;
}) {
  return (
    <article className="flex flex-col gap-4 rounded-2xl bg-surface p-4 shadow-[var(--shadow-border)] transition-opacity duration-150 hover:opacity-95">
      <div className="flex items-start justify-between gap-3">
        <div className="min-w-0">
          <div className="flex flex-wrap items-center gap-2">
            <Badge variant={listing.grade === "a" ? "accent" : listing.grade === "candidate" ? "warn" : "outline"}>
              {GRADE_LABEL[listing.grade]}
            </Badge>
            <Badge variant="outline">{listing.platformName}</Badge>
            {isNew ? <Badge variant="accent">신규</Badge> : null}
          </div>
          <h3 className="mt-2 truncate font-medium leading-snug text-fg">{listing.carName}</h3>
          <p className="mt-1 font-mono text-xs text-subtle">{listing.caseNo}</p>
        </div>
        <div className="text-right">
          <p className="font-mono text-sm tabular-nums text-fg">{formatWon(listing.minPrice)}</p>
          <p className="text-xs text-subtle">
            감정 {formatWon(listing.appraisalPrice)}
            {listing.discountRate != null ? ` · ${listing.discountRate}%` : ""}
          </p>
        </div>
      </div>

      <dl className="grid grid-cols-2 gap-2 text-sm sm:grid-cols-4">
        <Spec icon={<Landmark className="size-3.5" />} label="담당" value={listing.courtOrDept} />
        <Spec icon={<Gauge className="size-3.5" />} label="연식" value={listing.year ? `${listing.year}년식` : "미확인"} />
        <Spec icon={<Gauge className="size-3.5" />} label="주행" value={formatKm(listing.mileage)} />
        <Spec icon={<Fuel className="size-3.5" />} label="연료" value={listing.fuel} />
      </dl>

      <div className="flex items-start gap-2 rounded-lg bg-raised px-3 py-2 text-xs text-muted">
        <KeyRound className="mt-0.5 size-3.5 shrink-0" />
        <div className="min-w-0">
          <p>차키 {listing.keyStatus}</p>
          {listing.rejectReasons.length > 0 ? (
            <p className="mt-1 text-subtle">{listing.rejectReasons.join(" · ")}</p>
          ) : null}
        </div>
      </div>

      <div className="flex items-center justify-between gap-3">
        <p className="text-xs text-subtle">기일 {listing.auctionDate || "—"}</p>
        <Button asChild variant="outline" size="sm">
          <a href={listing.detailUrl} target="_blank" rel="noreferrer">
            원문
            <ExternalLink className="size-3.5" />
          </a>
        </Button>
      </div>
    </article>
  );
}

function Spec({
  icon,
  label,
  value,
}: {
  icon: ReactNode;
  label: string;
  value: string;
}) {
  return (
    <div className="rounded-lg bg-raised px-3 py-2">
      <dt className="flex items-center gap-1 text-xs text-subtle">
        {icon}
        {label}
      </dt>
      <dd className="mt-0.5 truncate text-sm text-fg">{value}</dd>
    </div>
  );
}
