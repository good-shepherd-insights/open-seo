import { useState, type ReactNode } from "react";
import { useQuery } from "@tanstack/react-query";
import { X } from "lucide-react";
import { Button } from "@/client/components/ui/button";
import { organizationContextQueryOptions } from "@/client/features/team/organizationQueries";
import { AppBanner } from "@/client/layout/AppBanner";

function isDismissed(storage: () => Storage, key: string) {
  try {
    return storage().getItem(key) !== null;
  } catch {
    return false;
  }
}

/** An AppBanner with a close button. A closed `greeting` stays closed in this
 *  browser; a closed credit warning comes back in the next browser session. */
export function DismissibleBanner({
  id,
  variant,
  children,
}: {
  id: "greeting" | "paused" | "reloading" | "out" | "low";
  variant: "info" | "warning" | "destructive";
  children: ReactNode;
}) {
  const { data } = useQuery(organizationContextQueryOptions());
  const [closedKey, setClosedKey] = useState<string | null>(null);
  // Wait for the organization, so a closed banner never flashes first.
  if (!data) return null;

  const key = `mi:closedBanner:${data.organizationId}:${id}`;
  const storage = () =>
    id === "greeting" ? window.localStorage : window.sessionStorage;
  if (closedKey === key || isDismissed(storage, key)) return null;

  const close = () => {
    try {
      storage().setItem(key, "1");
    } catch {
      // Storage can be off; the banner then stays closed until a reload.
    }
    setClosedKey(key);
  };
  return (
    <AppBanner variant={variant}>
      <div className="flex items-center justify-between gap-3">
        <span>{children}</span>
        <Button
          variant="ghost"
          size="icon"
          className="-my-3 size-11 shrink-0 text-muted-foreground"
          aria-label="Close notification"
          onClick={close}
        >
          <X />
        </Button>
      </div>
    </AppBanner>
  );
}
