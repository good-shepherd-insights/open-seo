import { useState, type ReactNode } from "react";
import { useQuery } from "@tanstack/react-query";
import { Link, useLocation } from "@tanstack/react-router";
import { ChevronLeft } from "lucide-react";
import { BrandIcon } from "@/client/components/BrandIdentity";
import {
  SidebarInset,
  SidebarProvider,
  useSidebar,
} from "@/client/components/ui/sidebar";
import { GscReEngagementModal } from "@/client/features/gsc/GscReEngagementModal";
import { projectsQueryOptions } from "@/client/features/projects/projectQueries";
import {
  SamChatListSkeleton,
  SamSidebarPanel,
} from "@/client/features/sam/SamSidebarPanel";
import { getLastProjectId } from "@/client/lib/active-project";
import { PRODUCT_NAME } from "@/shared/branding";
import { AccountMenu } from "./AccountMenu";
import { PhoneMenu } from "./PhoneMenu";
import { ProjectMenu } from "./ProjectMenu";
import { TopNav } from "./TopNav";
import { useAccountMenu } from "./useAccountMenu";

type ShellProject = {
  projectId: string | null;
  projectPending: boolean;
  ready: boolean;
};

/** Same props as upstream's layout/AppShell, so the route swaps one import. */
export function AuthenticatedAppLayout({
  children,
  projectId,
  ready,
  banner,
}: {
  children: ReactNode;
  projectId?: string;
  ready: boolean;
  banner?: ReactNode;
}) {
  // Pages without a project in the URL use the last visited one, else the
  // most recent. Read on every render: the shell stays mounted as it changes.
  const projectsQuery = useQuery({
    ...projectsQueryOptions(),
    enabled: ready && !projectId,
  });
  const remembered = getLastProjectId();
  const projects = projectsQuery.data ?? [];
  const fallback =
    projects.find((project) => project.id === remembered)?.id ??
    projects[0]?.id ??
    null;
  const shown = projectId ?? fallback ?? remembered;
  const project: ShellProject = {
    projectId: shown,
    projectPending: shown === null && projectsQuery.isPending,
    ready,
  };

  return (
    <SidebarProvider className="h-[100dvh] min-h-0 overflow-hidden">
      <SidebarInset className="min-h-0 overflow-hidden">
        <ShellHeader {...project} />
        {banner}
        <ShellBody {...project}>{children}</ShellBody>
      </SidebarInset>
      {ready ? (
        <GscReEngagementModal projectId={shown} suppressed={false} />
      ) : null}
    </SidebarProvider>
  );
}

function ShellHeader(project: ShellProject) {
  const { projectId, projectPending, ready } = project;
  const { isMobile } = useSidebar();
  const account = useAccountMenu();
  const [menuOpen, setMenuOpen] = useState(false);
  const close = () => setMenuOpen(false);
  const logo = (
    <Link
      to="/"
      aria-label={`${PRODUCT_NAME}, home`}
      className="flex size-9 items-center justify-center rounded-[9px] bg-white p-1"
      onClick={close}
    >
      <BrandIcon className="size-7 object-contain" />
    </Link>
  );
  if (isMobile) {
    return (
      <header
        className="relative z-30 flex shrink-0 items-center justify-between border-b border-border px-5 pt-2"
        onKeyDown={(event) => {
          if (
            event.key === "Escape" &&
            event.target instanceof Node &&
            event.currentTarget.contains(event.target)
          ) {
            close();
          }
        }}
      >
        <div className="flex min-h-13 items-center">{logo}</div>
        <button
          type="button"
          aria-expanded={menuOpen}
          aria-controls="phone-menu"
          className="min-h-11 cursor-pointer text-[15px] text-muted-foreground"
          onClick={() => setMenuOpen(!menuOpen)}
        >
          {menuOpen ? "Close" : "Menu"}
        </button>
        {menuOpen ? (
          <PhoneMenu {...project} account={account} onClose={close} />
        ) : null}
      </header>
    );
  }
  return (
    <header className="shrink-0 border-b border-border px-5 pt-2">
      <div className="grid min-h-11 grid-cols-[1fr_auto_1fr] items-center">
        <div className="flex min-w-0 items-center gap-5">
          {account.gatewayUrl ? (
            <a
              href={account.gatewayUrl}
              aria-label="Back to Every App"
              className="inline-flex min-h-11 items-center gap-0.5 text-sm whitespace-nowrap text-muted-foreground hover:text-foreground"
            >
              <ChevronLeft className="size-4" aria-hidden />
              Every App
            </a>
          ) : null}
          <div className="max-w-65 min-w-0">
            <ProjectMenu projectId={projectId} ready={ready} />
          </div>
        </div>
        {logo}
        <div className="flex justify-end">
          <AccountMenu account={account} />
        </div>
      </div>
      <TopNav
        projectId={projectId}
        placeholder={projectId === null && projectPending}
      />
    </header>
  );
}

function ShellBody({
  projectId,
  ready,
  children,
}: ShellProject & { children: ReactNode }) {
  const { isMobile } = useSidebar();
  const { pathname } = useLocation();
  // Upstream swaps its sidebar for the chat list on this URL-only page; the
  // phone menu does the same.
  const showChats = !isMobile && projectId && pathname.includes("/sam");
  return (
    <div className="flex min-h-0 flex-1">
      {showChats ? (
        <aside className="w-64 shrink-0 overflow-auto border-r border-border py-2">
          {ready ? (
            <SamSidebarPanel
              projectId={projectId}
              onNavigate={() => undefined}
            />
          ) : (
            <SamChatListSkeleton />
          )}
        </aside>
      ) : null}
      <div className="min-h-0 min-w-0 flex-1 overflow-auto">{children}</div>
    </div>
  );
}
