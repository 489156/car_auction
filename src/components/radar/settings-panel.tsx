import type { ReactNode } from "react";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Switch } from "@/components/ui/switch";
import { useRadarStore } from "@/lib/radar/store";

export function SettingsPanel() {
  const config = useRadarStore((s) => s.config);
  const telegram = useRadarStore((s) => s.telegram);
  const setConfig = useRadarStore((s) => s.setConfig);
  const setTelegram = useRadarStore((s) => s.setTelegram);
  const resetConfig = useRadarStore((s) => s.resetConfig);

  return (
    <div className="grid gap-6 lg:grid-cols-2">
      <section className="rounded-2xl bg-surface p-5 shadow-[var(--shadow-border)]">
        <h2 className="font-display text-xl text-fg">필터 조건</h2>
        <p className="mt-1 text-sm text-muted">명세서 기본값: 2022년식↑, 5만 km↓, 하이브리드·전기, AND 조건.</p>

        <div className="mt-5 grid gap-4 sm:grid-cols-2">
          <Field label="최소 연식">
            <Input
              type="number"
              min={2015}
              max={2030}
              value={config.minYear}
              onChange={(e) => setConfig({ minYear: Number(e.target.value) || 2022 })}
            />
          </Field>
          <Field label="최대 주행거리 (km)">
            <Input
              type="number"
              min={1000}
              step={1000}
              value={config.maxMileage}
              onChange={(e) => setConfig({ maxMileage: Number(e.target.value) || 50000 })}
            />
          </Field>
        </div>

        <Field className="mt-4" label="허용 연료 (쉼표 구분)">
          <Input
            value={config.fuelTypes.join(", ")}
            onChange={(e) =>
              setConfig({
                fuelTypes: e.target.value.split(",").map((s) => s.trim()).filter(Boolean),
              })
            }
          />
        </Field>
        <Field className="mt-4" label="필수 키워드 (차키, OR)">
          <Input
            value={config.keywordsMustHave.join(", ")}
            onChange={(e) =>
              setConfig({
                keywordsMustHave: e.target.value.split(",").map((s) => s.trim()).filter(Boolean),
              })
            }
          />
        </Field>
        <Field className="mt-4" label="금지 키워드">
          <Input
            value={config.keywordsExclude.join(", ")}
            onChange={(e) =>
              setConfig({
                keywordsExclude: e.target.value.split(",").map((s) => s.trim()).filter(Boolean),
              })
            }
          />
        </Field>

        <div className="mt-5 flex items-center justify-between gap-3 rounded-lg bg-raised px-3 py-3">
          <div>
            <p className="text-sm font-medium">차키 키워드 필수</p>
            <p className="text-xs text-subtle">끄면 연식·주행·연료만 통과한 매물도 A급으로 봅니다.</p>
          </div>
          <Switch
            checked={config.requireKeyKeyword}
            onCheckedChange={(checked) => setConfig({ requireKeyKeyword: checked })}
          />
        </div>

        <Button variant="ghost" className="mt-4" onClick={resetConfig}>
          기본값으로 되돌리기
        </Button>
      </section>

      <section className="rounded-2xl bg-surface p-5 shadow-[var(--shadow-border)]">
        <h2 className="font-display text-xl text-fg">텔레그램 알림</h2>
        <p className="mt-1 text-sm text-muted">
          BotFather에서 봇을 만들고, 봇에게 말을 건 뒤 채팅 ID를 넣으세요. 토큰은 이 기기에만 저장됩니다.
        </p>

        <div className="mt-5 flex items-center justify-between gap-3 rounded-lg bg-raised px-3 py-3">
          <p className="text-sm font-medium">스캔 후 신규 A급 전송</p>
          <Switch
            checked={telegram.enabled}
            onCheckedChange={(checked) => setTelegram({ enabled: checked })}
          />
        </div>

        <Field className="mt-4" label="봇 토큰">
          <Input
            type="password"
            autoComplete="off"
            placeholder="123456:ABC..."
            value={telegram.botToken}
            onChange={(e) => setTelegram({ botToken: e.target.value.trim() })}
          />
        </Field>
        <Field className="mt-4" label="채팅 ID">
          <Input
            placeholder="123456789"
            value={telegram.chatId}
            onChange={(e) => setTelegram({ chatId: e.target.value.trim() })}
          />
        </Field>
      </section>
    </div>
  );
}

function Field({
  label,
  className,
  children,
}: {
  label: string;
  className?: string;
  children: ReactNode;
}) {
  return (
    <label className={className}>
      <Label className="mb-1.5 block">{label}</Label>
      {children}
    </label>
  );
}
