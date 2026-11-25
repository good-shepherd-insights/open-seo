import { DataTableTabs } from "@/client/components/table/DataTableToolbar";
import { Card } from "@/client/components/ui/card";
import { TabsTrigger } from "@/client/components/ui/tabs";
import { BillingInvoices } from "@/client/features/billing/BillingInvoices";
import { BillingUsage } from "@/client/features/billing/BillingUsage";
import { BILLING_TABS, type BillingTab } from "@/shared/billing";

/**
 * Usage and, for owners, invoices in one card with a tab row. Members see
 * usage alone: invoices follow the billing permission.
 */
export function BillingTabs({
  tab,
  onTabChange,
  invoiceEmailsEnabled,
}: {
  tab: BillingTab;
  onTabChange: (tab: BillingTab) => void;
  /** Null hides the Invoices tab. */
  invoiceEmailsEnabled: boolean | null;
}) {
  const showInvoices = invoiceEmailsEnabled !== null && tab === "invoices";

  return (
    <Card size="lg" className="gap-0 py-0">
      {invoiceEmailsEnabled !== null ? (
        <DataTableTabs
          value={tab}
          onValueChange={(value) => {
            const next = BILLING_TABS.find((item) => item.value === value);
            if (next) onTabChange(next.value);
          }}
        >
          {BILLING_TABS.map((item) => (
            <TabsTrigger key={item.value} value={item.value} className="h-11">
              {item.label}
            </TabsTrigger>
          ))}
        </DataTableTabs>
      ) : null}
      <div className="p-4 md:p-6">
        {showInvoices ? (
          <BillingInvoices invoiceEmailsEnabled={invoiceEmailsEnabled} />
        ) : (
          <BillingUsage />
        )}
      </div>
    </Card>
  );
}
