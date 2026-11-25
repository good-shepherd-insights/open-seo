import { createFileRoute } from "@tanstack/react-router";
import text from "@/client/features/legal/privacy.md?raw";
import { LegalPage } from "@/client/features/legal/LegalPage";
import { pageHead } from "@/client/lib/pageHead";

export const Route = createFileRoute("/privacy")({
  head: () => pageHead("Privacy Policy"),
  component: () => <LegalPage title="Privacy Policy" text={text} />,
});
