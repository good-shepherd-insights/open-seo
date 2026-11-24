import { Link, useLocation } from "@tanstack/react-router";
import { cn } from "cn";
import {
  SamChatListSkeleton,
  SamSidebarPanel,
} from "@/client/features/sam/SamSidebarPanel";
import { AccountFields, AccountLinks } from "./AccountMenu";
import { ProjectMenu } from "./ProjectMenu";
import type { AccountMenuData } from "./useAccountMenu";
import { useNavGroups } from "./useNavGroups";

const headingClass = "px-3 pt-4 text-[13px] text-muted-foreground";
const rowClass = "flex min-h-11 items-center rounded-lg px-3 text-[15px]";

export function PhoneMenu({
  account,
  projectId,
  projectPending,
  ready,
  onClose,
}: {
  account: AccountMenuData;
  projectId: string | null;
  projectPending: boolean;
  ready: boolean;
  onClose: () => void;
}) {
  const placeholder = projectId === null && projectPending;
  const groups = useNavGroups(projectId, placeholder);
  const { pathname } = useLocation();
  const showChats = projectId && pathname.includes("/sam");
  return (
    <div
      id="phone-menu"
      className="absolute inset-x-0 top-full z-40 h-[calc(100dvh-100%)] overflow-auto bg-background px-5 pt-3 pb-safe"
    >
      {account.gatewayUrl ? (
        <a href={account.gatewayUrl} className={cn(rowClass, "mb-2")}>
          Back to Every App
        </a>
      ) : null}
      <ProjectMenu
        projectId={projectId}
        ready={ready}
        boxed
        onNavigate={onClose}
      />
      <div className="-mx-2.5 mt-2">
        <AccountFields account={account} />
      </div>
      <nav
        aria-label="Main navigation"
        aria-busy={placeholder || undefined}
        className="-mx-3"
      >
        {showChats ? (
          <div className="pt-4">
            {ready ? (
              <SamSidebarPanel projectId={projectId} onNavigate={onClose} />
            ) : (
              <SamChatListSkeleton />
            )}
          </div>
        ) : (
          groups.map((group) => (
            <div key={group.label}>
              <div className={headingClass}>{group.label}</div>
              {group.items.map((item) =>
                placeholder ? (
                  <span key={item.name} aria-disabled className={rowClass}>
                    {item.name}
                  </span>
                ) : (
                  <Link
                    key={item.name}
                    {...item.link}
                    aria-current={item.active ? "page" : undefined}
                    className={cn(rowClass, item.active && "text-primary")}
                    onClick={onClose}
                  >
                    {item.name}
                  </Link>
                ),
              )}
            </div>
          ))
        )}
        <div className={cn(headingClass, "truncate")} data-ph-mask>
          {account.email ?? "Account"}
        </div>
        <AccountLinks account={account} onNavigate={onClose} />
      </nav>
    </div>
  );
}
