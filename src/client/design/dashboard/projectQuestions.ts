import { parseResearchTarget } from "@/shared/researchScope";
import type { ProjectMarket } from "@/client/features/projects/types";
import {
  PROJECT_CONTEXT_SECTION_LABELS,
  PROSE_MAX_CHARS,
  type ProjectContextSectionKey,
  type ProjectContextUpdate,
} from "@/types/schemas/projectContext";

export type ProjectAnswers = {
  website: string;
  market: ProjectMarket;
  competitors: string;
} & Record<ProjectContextSectionKey, string>;

type TextAnswer = Exclude<keyof ProjectAnswers, "market">;

type TextQuestion = {
  id: TextAnswer;
  kind: "line" | "prose";
  title: string;
  hint: string;
  placeholder: string;
  maxLength: number;
  keptIn: "Project settings" | "Context";
};

const prose = (
  id: ProjectContextSectionKey,
  hint: string,
  placeholder: string,
): TextQuestion => ({
  id,
  kind: "prose",
  title: PROJECT_CONTEXT_SECTION_LABELS[id],
  hint,
  placeholder,
  maxLength: PROSE_MAX_CHARS,
  keptIn: "Context",
});

/** In the order they are asked. The country always has a value, so is never asked. */
export const TEXT_QUESTIONS: TextQuestion[] = [
  {
    id: "website",
    kind: "line",
    title: "Website",
    hint: "The site this project is about.",
    placeholder: "example.com",
    maxLength: 255,
    keptIn: "Project settings",
  },
  prose(
    "business_overview",
    "What you sell, who buys it, and where.",
    "e.g. Booking software for independent restaurants in the US and Canada.",
  ),
  prose(
    "current_goal",
    "What you’re pushing for right now, and by when.",
    "e.g. Double organic signups by Q4.",
  ),
  {
    id: "competitors",
    kind: "line",
    title: "Competitors",
    hint: "The sites you measure yourself against.",
    placeholder: "competitor.com, another.com",
    maxLength: 4000,
    keptIn: "Context",
  },
  prose(
    "positioning",
    "Why someone picks you over the alternatives.",
    "e.g. The only booking tool that sets up in an afternoon.",
  ),
  prose(
    "writing_preferences",
    "Voice, words to avoid, topics that are off-limits.",
    "e.g. Plain and direct, no hype.",
  ),
];

function splitDomains(value: string) {
  return value.split(/[\s,]+/).filter(Boolean);
}

export function validateAnswer(id: TextAnswer, value: string) {
  if (id !== "website" && id !== "competitors") return undefined;
  const entries = id === "website" ? [value.trim()] : splitDomains(value);
  for (const entry of entries) {
    if (!entry) continue;
    const parsed = parseResearchTarget(entry);
    if (!parsed.ok) return parsed.message;
  }
  return undefined;
}

function competitorDomains(value: string) {
  return new Set(
    splitDomains(value).map((entry) => {
      const parsed = parseResearchTarget(entry);
      return parsed.ok ? parsed.target.hostname : entry;
    }),
  );
}

/**
 * Only what was edited, measured from the answers the edit started from, so
 * something an agent saved meanwhile is kept. A competitor is sent without its
 * name and notes, which the server then leaves as they are.
 */
export function contextChanges(
  from: ProjectAnswers,
  to: ProjectAnswers,
): ProjectContextUpdate[] {
  const updates: ProjectContextUpdate[] = [];
  for (const { id } of TEXT_QUESTIONS) {
    if (id === "website" || id === "competitors") continue;
    if (to[id].trim() !== from[id].trim()) {
      updates.push({ section: id, content: to[id].trim() });
    }
  }
  const before = competitorDomains(from.competitors);
  const after = competitorDomains(to.competitors);
  const removed = [...before].filter((domain) => !after.has(domain));
  const added = [...after].filter((domain) => !before.has(domain));
  if (removed.length > 0) updates.push({ removeCompetitors: removed });
  if (added.length > 0) {
    updates.push({ addCompetitors: added.map((domain) => ({ domain })) });
  }
  return updates;
}

export function settingsChanged(from: ProjectAnswers, to: ProjectAnswers) {
  return (
    from.website.trim() !== to.website.trim() ||
    from.market.locationCode !== to.market.locationCode ||
    from.market.languageCode !== to.market.languageCode
  );
}
