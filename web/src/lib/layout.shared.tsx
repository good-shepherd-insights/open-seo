import type { BaseLayoutProps } from "fumadocs-ui/layouts/shared";
import { Logo } from "@/components/Logo";

export function baseOptions(): BaseLayoutProps {
  return {
    nav: {
      title: (
        <span className="inline-flex items-center gap-2 font-semibold">
          <Logo size="sm" />
          <span className="text-sm">Maryland Insights</span>
        </span>
      ),
    },
    searchToggle: {
      enabled: false,
    },
    links: [
      {
        text: "Resources",
        url: "/blogs",
        items: [
          {
            text: "Blog",
            description: "SEO articles and guides.",
            url: "/blogs",
          },
          {
            text: "MCP",
            description: "Connect OpenSEO to AI clients.",
            url: "/docs/mcp",
          },
          {
            text: "Skills",
            description: "Focused OpenSEO workflows.",
            url: "/docs/skills",
          },
        ],
      },
    ],
  };
}
