import type { ReactNode } from "react";
import { useQuery } from "@tanstack/react-query";
import { Link, useLocation } from "@tanstack/react-router";
import { ChevronLeft } from "lucide-react";
import { BrandWordmark } from "@/client/components/BrandIdentity";
import { Sidebar } from "@/client/components/Sidebar";
import { Button } from "@/client/components/ui/button";
import {
  SidebarInset,
  SidebarProvider,
  useSidebar,
} from "@/client/components/ui/sidebar";
import { GscReEngagementModal } from "@/client/features/gsc/GscReEngagementModal";
import { projectsQueryOptions } from "@/client/features/projects/projectQueries";
import { ProjectSwitcher } from "@/client/features/projects/ProjectSwitcher";
import {
  SamChatListSkeleton,
  SamSidebarPanel,
} from "@/client/features/sam/SamSidebarPanel";
import { getLastProjectId } from "@/client/lib/active-project";
import { AccountMenu } from "./AccountMenu";
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
  const { isMobile, setOpenMobile } = useSidebar();
  const brand = (
    <Link to="/" className="shrink-0 font-semibold text-foreground">
      <BrandWordmark />
    </Link>
  );
  if (isMobile) {
    return (
      <header className="flex shrink-0 items-center justify-between gap-3 border-b border-border px-5 py-2.5">
        {brand}
        <Button variant="outline" onClick={() => setOpenMobile(true)}>
          Menu
        </Button>
        <Sidebar {...project} />
      </header>
    );
  }
  return <DesktopHeader brand={brand} {...project} />;
}

function DesktopHeader({
  brand,
  projectId,
  projectPending,
  ready,
}: ShellProject & { brand: ReactNode }) {
  const account = useAccountMenu();
  return (
    <header className="shrink-0 border-b border-border">
      <div className="mx-auto max-w-[1240px] px-5 pt-3">
        {account.gatewayUrl ? (
          <a
            href={account.gatewayUrl}
            aria-label="Back to Every App"
            className="mb-1 inline-flex min-h-8 items-center gap-0.5 text-sm text-muted-foreground hover:text-foreground"
          >
            <ChevronLeft className="size-4" aria-hidden />
            Every App
          </a>
        ) : null}
        <div className="flex items-center gap-5">
          {brand}
          <div className="w-68 min-w-0">
            <ProjectSwitcher activeProjectId={projectId} ready={ready} />
          </div>
          <div className="ml-auto min-w-0">
            <AccountMenu account={account} />
          </div>
        </div>
        <div className="mt-2 -mb-px">
          <TopNav
            projectId={projectId}
            placeholder={projectId === null && projectPending}
          />
        </div>
      </div>
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
  // phone menu still does.
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
