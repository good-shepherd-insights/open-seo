import { Link } from "@tanstack/react-router";
import { Check, ChevronDown } from "lucide-react";
import { ThemePreferenceRadio } from "@/client/components/ThemePreferenceMenuItems";
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuGroup,
  DropdownMenuItem,
  DropdownMenuLabel,
  DropdownMenuSeparator,
  DropdownMenuTrigger,
} from "@/client/components/ui/dropdown-menu";
import { BILLING_ROUTE } from "@/shared/billing";
import type { AccountMenuData } from "./useAccountMenu";

export function AccountMenu({ account }: { account: AccountMenuData }) {
  return (
    <DropdownMenu>
      <DropdownMenuTrigger
        aria-label="Open account menu"
        className="flex min-h-11 min-w-0 cursor-pointer items-center gap-2 rounded-lg px-2 text-sm text-muted-foreground outline-none hover:text-foreground focus-visible:ring-3 focus-visible:ring-ring/50"
      >
        <span className="max-w-56 truncate" data-ph-mask>
          {account.email ?? "Account"}
        </span>
        <ChevronDown className="size-3.5 shrink-0" aria-hidden />
      </DropdownMenuTrigger>
      <DropdownMenuContent align="end" className="w-64 p-1.5">
        {account.organizations.length > 1 ? (
          <>
            <DropdownMenuGroup>
              <DropdownMenuLabel>Organization</DropdownMenuLabel>
              {account.organizations.map((organization) => (
                <DropdownMenuItem
                  key={organization.id}
                  disabled={account.isSwitching}
                  onClick={() => account.onSwitchOrganization(organization.id)}
                >
                  <span className="truncate">{organization.name}</span>
                  {organization.active ? (
                    <Check className="ml-auto size-4 text-primary" />
                  ) : null}
                </DropdownMenuItem>
              ))}
            </DropdownMenuGroup>
            <DropdownMenuSeparator />
          </>
        ) : null}
        <DropdownMenuItem render={<Link to="/settings" />}>
          Settings
        </DropdownMenuItem>
        {account.hasAccount && account.hasBilling ? (
          <DropdownMenuItem render={<Link to={BILLING_ROUTE} />}>
            Billing
          </DropdownMenuItem>
        ) : null}
        <DropdownMenuItem render={<Link to="/support" />}>
          Help &amp; Community
        </DropdownMenuItem>
        {account.hasAccount ? (
          <>
            <DropdownMenuGroup>
              <DropdownMenuLabel>Theme</DropdownMenuLabel>
              <div className="px-1 pb-1">
                <ThemePreferenceRadio />
              </div>
            </DropdownMenuGroup>
            <DropdownMenuSeparator />
            <DropdownMenuItem variant="destructive" onClick={account.onSignOut}>
              Sign out
            </DropdownMenuItem>
          </>
        ) : null}
      </DropdownMenuContent>
    </DropdownMenu>
  );
}
