import { Sliders, X } from "lucide-react";
import { useEffect, useState } from "react";
import type { WebAlertSettings } from "@/lib/radar/types";

export function SettingsModal({
  open,
  value,
  onClose,
  onChange,
}: {
  open: boolean;
  value: WebAlertSettings;
  onClose: () => void;
  onChange: (next: Partial<WebAlertSettings>) => void;
}) {
  const [local, setLocal] = useState(value);
  useEffect(() => {
    if (open) setLocal(value);
  }, [open, value]);

  if (!open) return null;

  return (
    <div
      className="fixed inset-0 z-50 flex items-center justify-center bg-tile-900/85 p-4 backdrop-blur-sm"
      role="dialog"
      aria-modal="true"
    >
      <div className="w-full max-w-md space-y-5 rounded-2xl border border-tile-800 bg-tile-900 p-6 shadow-2xl">
        <header className="flex items-center justify-between border-b border-tile-800 pb-3">
          <div className="flex items-center gap-2 text-stier-400">
            <Sliders className="h-4 w-4" aria-hidden />
            <h3 className="text-base font-bold text-white">웹 알림 규칙</h3>
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

        <div className="space-y-4 text-xs">
          <div className="space-y-2 rounded-xl border border-tile-800 bg-tile-900 p-3">
            <label className="block font-semibold text-fg">브라우저 푸시 알림</label>
            <div className="flex items-center justify-between">
              <span className="text-muted">S-Tier 매칭 시 데스크탑 알림</span>
              <input
                type="checkbox"
                checked={local.enabled}
                onChange={(e) => setLocal({ ...local, enabled: e.target.checked })}
                className="size-4 rounded accent-stier-500"
              />
            </div>
          </div>

          <div className="space-y-2 rounded-xl border border-tile-800 bg-tile-900 p-3">
            <label className="block font-semibold text-fg">S-Tier 점수 임계값</label>
            <div className="flex items-center justify-between gap-3">
              <input
                type="range"
                min={70}
                max={95}
                value={local.threshold}
                onChange={(e) => setLocal({ ...local, threshold: Number(e.target.value) })}
                className="w-full accent-stier-500"
              />
              <span className="font-mono text-sm font-bold text-stier-400">
                {local.threshold}
              </span>
            </div>
            <p className="text-[10px] text-muted">
              이 점수 이상의 S-Tier 매칭만 즉시 웹 알림을 보냅니다.
            </p>
          </div>

          <div className="space-y-2 rounded-xl border border-tile-800 bg-tile-900 p-3">
            <label className="block font-semibold text-fg">자동 스캔 주기</label>
            <select
              value={local.interval}
              onChange={(e) =>
                setLocal({
                  ...local,
                  interval: e.target.value as WebAlertSettings["interval"],
                })
              }
              className="w-full rounded-lg border border-tile-800 bg-tile-900 p-2 text-fg focus:outline-none"
            >
              <option value="6h">6시간마다 (권장)</option>
              <option value="12h">12시간마다</option>
              <option value="realtime">실시간 인터셉트</option>
            </select>
          </div>
        </div>

        <div className="flex justify-end gap-2 border-t border-tile-800 pt-2">
          <button
            type="button"
            onClick={() => {
              onChange(local);
              onClose();
            }}
            className="rounded-xl bg-tile-800 px-4 py-2 text-xs font-semibold text-fg transition hover:bg-tile-700"
          >
            규칙 저장
          </button>
        </div>
      </div>
    </div>
  );
}