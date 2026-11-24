import { useState } from "react";
import { Link } from "@tanstack/react-router";
import {
  Popover,
  PopoverContent,
  PopoverTrigger,
} from "@/client/components/ui/popover";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/client/components/ui/select";
import { type ThemePreference, useThemePreference } from "@/client/lib/theme";
import { BILLING_ROUTE } from "@/shared/billing";
import type { AccountMenuData } from "./useAccountMenu";

const THEMES: { value: ThemePreference; label: string }[] = [
  { value: "system", label: "System" },
  { value: "light", label: "Light" },
  { value: "dark", label: "Dark" },
];

const rowClass =
  "flex min-h-11 w-full cursor-pointer items-center rounded-lg px-3 text-left text-[15px] outline-none hover:bg-accent focus-visible:ring-3 focus-visible:ring-ring/50";

function Field({
  label,
  value,
  items,
  disabled,
  onChange,
}: {
  label: string;
  value: string;
  items: { value: string; label: string }[];
  disabled?: boolean;
  onChange: (value: string) => void;
}) {
  return (
    <div className="px-2.5 py-2">
      <div className="mb-1 text-[13px] text-muted-foreground">{label}</div>
      <Select
        items={items}
        value={value}
        disabled={disabled}
        onValueChange={(next) => {
          if (next) onChange(next);
        }}
      >
        <SelectTrigger aria-label={label} className="w-full">
          <SelectValue />
        </SelectTrigger>
        <SelectContent alignItemWithTrigger={false}>
          {items.map((item) => (
            <SelectItem key={item.value} value={item.value}>
              {item.label}
            </SelectItem>
          ))}
        </SelectContent>
      </Select>
    </div>
  );
}

export function AccountFields({ account }: { account: AccountMenuData }) {
  const { themePreference, setThemePreference } = useThemePreference();
  const active = account.organizations.find(({ active: on }) => on);
  return (
    <>
      {account.organizations.length > 1 ? (
        <Field
          label="Organization"
          value={active?.id ?? ""}
          disabled={account.isSwitching}
          items={account.organizations.map(({ id, name }) => ({
            value: id,
            label: name,
          }))}
          onChange={account.onSwitchOrganization}
        />
      ) : null}
      <Field
        label="Theme"
        value={themePreference}
        items={THEMES}
        onChange={(next) => {
          const theme = THEMES.find(({ value }) => value === next);
          if (theme) setThemePreference(theme.value);
        }}
      />
    </>
  );
}

export function AccountLinks({
  account,
  onNavigate,
}: {
  account: AccountMenuData;
  onNavigate: () => void;
}) {
  return (
    <>
      <Link to="/settings" className={rowClass} onClick={onNavigate}>
        Settings
      </Link>
      {account.hasAccount && account.hasBilling ? (
        <Link to={BILLING_ROUTE} className={rowClass} onClick={onNavigate}>
          Billing
        </Link>
      ) : null}
      <Link to="/support" className={rowClass} onClick={onNavigate}>
        Help &amp; Community
      </Link>
      {account.hasAccount ? (
        <button type="button" className={rowClass} onClick={account.onSignOut}>
          Sign out
        </button>
      ) : null}
    </>
  );
}

export function AccountMenu({ account }: { account: AccountMenuData }) {
  const [open, setOpen] = useState(false);
  return (
    <Popover open={open} onOpenChange={setOpen}>
      <PopoverTrigger
        aria-label="Open account menu"
        className="min-h-11 cursor-pointer text-[15px] text-muted-foreground outline-none hover:text-foreground focus-visible:rounded-sm focus-visible:ring-3 focus-visible:ring-ring/50"
      >
        Account
      </PopoverTrigger>
      <PopoverContent align="end" className="w-64 gap-0 p-1.5">
        {account.email ? (
          <p
            className="px-2.5 py-2 text-sm wrap-anywhere text-muted-foreground"
            data-ph-mask
          >
            {account.email}
          </p>
        ) : null}
        <AccountFields account={account} />
        <AccountLinks account={account} onNavigate={() => setOpen(false)} />
      </PopoverContent>
    </Popover>
  );
}
