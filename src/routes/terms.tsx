import { createFileRoute } from "@tanstack/react-router";
import text from "@/client/features/legal/terms.md?raw";
import { LegalPage } from "@/client/features/legal/LegalPage";
import { pageHead } from "@/client/lib/pageHead";

export const Route = createFileRoute("/terms")({
  head: () => pageHead("Terms"),
  component: () => <LegalPage title="Terms" text={text} />,
});
