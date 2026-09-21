import { clsx, type ClassValue } from "clsx";
import { twMerge } from "tailwind-merge";

export function cn(...inputs: ClassValue[]) {
  return twMerge(clsx(inputs));
}

export function formatWon(value: number | null | undefined): string {
  if (value == null || !Number.isFinite(value) || value <= 0) return "—";
  if (value >= 100_000_000) {
    const eok = value / 100_000_000;
    return `${eok.toFixed(eok >= 10 ? 0 : 1)}억`;
  }
  if (value >= 10_000) {
    const man = Math.round(value / 10_000);
    return `${man.toLocaleString("ko-KR")}만`;
  }
  return `${value.toLocaleString("ko-KR")}원`;
}

export function formatKm(value: number | null | undefined): string {
  if (value == null || !Number.isFinite(value)) return "미확인";
  return `${value.toLocaleString("ko-KR")} km`;
}

export function uniqueId(platform: string, caseNo: string): string {
  return `${platform}:${caseNo}`;
}
