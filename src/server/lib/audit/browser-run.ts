import { getOptionalEnvValue } from "@/server/lib/runtime-env";
import type { ContentBrowser } from "./rendered-page";

/** Browser Run over its REST API, for deployments without the binding
 *  (Docker). Undefined when its account and token are not set. */
export async function getBrowserRunApi(): Promise<ContentBrowser | undefined> {
  const accountId = await getOptionalEnvValue("BROWSER_RUN_ACCOUNT_ID");
  const token = await getOptionalEnvValue("BROWSER_RUN_API_TOKEN");
  if (!accountId || !token) return undefined;
  return {
    quickAction: (action, { cacheTTL, ...body }) =>
      fetch(
        `https://api.cloudflare.com/client/v4/accounts/${encodeURIComponent(accountId)}/browser-run/${action}?cacheTTL=${cacheTTL}`,
        {
          method: "POST",
          headers: {
            Authorization: `Bearer ${token}`,
            "Content-Type": "application/json",
          },
          body: JSON.stringify(body),
          signal: AbortSignal.timeout(body.gotoOptions.timeout + 15_000),
        },
      ),
  };
}
