import { createFileRoute } from "@tanstack/react-router";
import { runScheduledRadar } from "@/lib/radar/scan";

async function handle({ request }: { request: Request }) {
  const url = new URL(request.url);
  const headerSecret = request.headers.get("authorization")?.replace(/^Bearer\s+/i, "");
  const secret = headerSecret || url.searchParams.get("secret") || undefined;
  const result = await runScheduledRadar({ data: { secret } });
  const status = result.ok ? 200 : result.error === "unauthorized" ? 401 : 500;
  return Response.json(result, { status });
}

export const Route = createFileRoute("/api/cron/radar")({
  server: {
    handlers: {
      GET: handle,
      POST: handle,
    },
  },
});
