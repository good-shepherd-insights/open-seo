import { useState } from "react";
import { useQuery } from "@tanstack/react-query";
import { toast } from "sonner";
import { everyAppAccountQueryOptions } from "@/client/features/every-app/everyAppAccountQueries";
import { organizationContextQueryOptions } from "@/client/features/team/organizationQueries";
import { clearLastProjectId } from "@/client/lib/active-project";
import { getStandardErrorMessage } from "@/client/lib/error-messages";
import { signOutAndRedirect, useSession } from "@/lib/auth-client";
import {
  isEveryAppClientAuthMode,
  isHostedClientAuthMode,
} from "@/lib/auth-mode";
import { switchOrganization } from "@/serverFunctions/organization";

/** The account menu's data and actions, as upstream's sidebar footer has them. */
export function useAccountMenu() {
  const everyApp = isEveryAppClientAuthMode();
  const { data: session } = useSession();
  const everyAppAccount = useQuery({
    ...everyAppAccountQueryOptions(),
    enabled: everyApp,
  });
  const email = everyApp ? everyAppAccount.data?.email : session?.user?.email;
  const context = useQuery({
    ...organizationContextQueryOptions(),
    enabled: Boolean(email) && !everyApp,
  });
  const [isSwitching, setIsSwitching] = useState(false);
  const activeOrganizationId = context.data?.organizationId;

  const switchTo = async (organizationId: string) => {
    if (isSwitching || organizationId === activeOrganizationId) return;
    setIsSwitching(true);
    try {
      await switchOrganization({ data: { organizationId } });
      // The remembered project belongs to the old workspace.
      clearLastProjectId();
      window.location.assign("/");
    } catch (error) {
      toast.error(getStandardErrorMessage(error));
      setIsSwitching(false);
    }
  };

  return {
    email,
    organizations: everyApp
      ? []
      : (context.data?.organizations ?? []).map((organization) => ({
          id: organization.organizationId,
          name: organization.organizationName,
          active: organization.organizationId === activeOrganizationId,
        })),
    isSwitching,
    onSwitchOrganization: (id: string) => void switchTo(id),
    // A gateway owns sign-in and billing, and local no-auth has no account.
    hasAccount: Boolean(email) && !everyApp,
    hasBilling: isHostedClientAuthMode(),
    gatewayUrl: everyApp ? (everyAppAccount.data?.gatewayUrl ?? null) : null,
    onSignOut: () => signOutAndRedirect(),
  };
}

export type AccountMenuData = ReturnType<typeof useAccountMenu>;
