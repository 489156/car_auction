import { Bell, Bolt, Crown } from "lucide-react";
import type { NotificationItem } from "@/lib/radar/store";

export function NotificationDrawer({
  open,
  notifications,
  onClose,
  onClear,
  onOpenSettings,
  onInspect,
}: {
  open: boolean;
  notifications: NotificationItem[];
  onClose: () => void;
  onClear: () => void;
  onOpenSettings: () => void;
  onInspect: (listingId: string) => void;
}) {
  if (!open) return null;
  const hasItems = notifications.length > 0;
  return (
    <div
      data-notif-drawer
      className="absolute right-0 top-12 z-50 mt-2 w-80 overflow-hidden rounded-2xl border border-tile-800 bg-tile-900 shadow-2xl sm:w-96"
      role="dialog"
    >
      <header className="flex items-center justify-between border-b border-tile-800 bg-tile-900 p-3.5">
        <div className="flex items-center gap-2">
          <Bolt className="h-3.5 w-3.5 text-stier-400" aria-hidden />
          <h3 className="text-xs font-bold uppercase tracking-wider text-white">
            웹 알림 피드
          </h3>
        </div>
        <button
          type="button"
          onClick={onClear}
          className="text-[11px] text-muted hover:text-fg"
        >
          전체 삭제
        </button>
      </header>
      <div className="scrollbar-thin max-h-80 divide-y divide-tile-800/60 overflow-y-auto text-xs">
        {hasItems ? (
          notifications.map((n) => (
            <button
              type="button"
              key={n.id}
              onClick={() => {
                onInspect(n.listingId);
                onClose();
              }}
              className="block w-full cursor-pointer space-y-1 p-3 text-left transition hover:bg-tile-800/60"
            >
              <div className="flex items-center justify-between text-[11px]">
                <span className="flex items-center gap-1 font-bold text-stier-400">
                  {n.tier === "S_TIER" ? (
                    <Crown className="h-3 w-3" aria-hidden />
                  ) : (
                    <Bell className="h-3 w-3" aria-hidden />
                  )}
                  {n.title}
                </span>
                <span className="text-muted">{n.time}</span>
              </div>
              <p className="text-fg">{n.desc}</p>
            </button>
          ))
        ) : (
          <p className="p-6 text-center text-muted">새 알림이 없습니다.</p>
        )}
      </div>
      <footer className="border-t border-tile-800 bg-tile-900/80 p-2.5 text-center">
        <button
          type="button"
          onClick={() => {
            onOpenSettings();
            onClose();
          }}
          className="mx-auto flex items-center justify-center gap-1.5 text-xs text-stier-400 hover:underline"
        >
          <span>웹 알림 규칙 설정</span>
        </button>
      </footer>
    </div>
  );
}