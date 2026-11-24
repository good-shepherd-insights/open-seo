import { createFileRoute } from "@tanstack/react-router";
import { z } from "zod";
import { pageHead } from "@/client/lib/pageHead";
import { SamChat } from "@/client/features/sam/SamChat";

const samSearchSchema = z.object({
  // Active session id. Omitted until a session is selected/created.
  s: z.string().optional(),
});

export const Route = createFileRoute("/_app/p/$projectId/sam")({
  head: () => pageHead("SAM"),
  validateSearch: samSearchSchema,
  component: SamRoute,
});

function SamRoute() {
  const { projectId } = Route.useParams();
  const { s } = Route.useSearch();
  return <SamChat projectId={projectId} activeSessionId={s} />;
}
