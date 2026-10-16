import { Link } from "@tanstack/react-router";
import { Logo } from "@/components/Logo";
import { featureGroups } from "@/lib/feature-pages";
import { freeToolList } from "@/lib/free-tools/tool-pages";

const featureLinks = featureGroups.flatMap((group) =>
  group.pages.map((page) => ({
    label: page.eyebrow,
    href: `/features/${page.slug}`,
  }))
);

export function SiteFooter({ className }: { className?: string }) {
  return (
    <div className={className}>
      <Link to="/" className="inline-flex items-center gap-2">
        <Logo size="md" />
        <span className="text-sm font-semibold text-neutral-900">Maryland Insights</span>
      </Link>

      <div className="mt-6 grid grid-cols-2 gap-8 md:grid-cols-[repeat(auto-fit,minmax(9rem,1fr))]">
        <div>
          <p className="font-semibold text-neutral-900">Features</p>
          <div className="mt-2 flex flex-col gap-1.5">
            {featureLinks.map((link) => (
              <a key={link.href} href={link.href}>
                {link.label}
              </a>
            ))}
            <Link to="/features">All features</Link>
          </div>
        </div>

        <div className="flex flex-col gap-8">
          <div>
            <p className="font-semibold text-neutral-900">AI agents</p>
            <div className="mt-2 flex flex-col gap-1.5">
              <Link to="/features/mcp">Maryland Insights MCP</Link>
              <Link to="/google-search-console-mcp">
                Google Search Console MCP
              </Link>
            </div>
          </div>

          <div>
            <p className="font-semibold text-neutral-900">Compare</p>
            <div className="mt-2 flex flex-col gap-1.5">
              <Link to="/seo-marylandinsights">SEO solution</Link>
            </div>
          </div>
        </div>

        <div>
          <p className="font-semibold text-neutral-900">Resources</p>
          <div className="mt-2 flex flex-col gap-1.5">
            <a href="/docs/mcp">MCP</a>
            <a href="/docs/skills">Skills</a>
            <Link to="/library">Strategy Library</Link>
            <Link to="/blogs">Blog</Link>
            <a href="/docs">Docs</a>
          </div>
        </div>

        <div>
          <p className="font-semibold text-neutral-900">Company</p>
          <div className="mt-2 flex flex-col gap-1.5">
            <Link to="/about">About</Link>
            <Link to="/support">Support</Link>
            <Link to="/roadmap">Roadmap</Link>
            <Link to="/pricing">Pricing</Link>
          </div>
        </div>
      </div>

      <div className="mt-8 flex flex-wrap items-center justify-between gap-x-8 gap-y-4">
        <p className="text-xs text-neutral-500">
          <a href="https://www.ycombinator.com/companies/marylandinsights" target="_blank" rel="noopener noreferrer">
            <img src="/y-combinator.svg" alt="" width={24} height={24} />
            Backed by Y Combinator
          </a>
        </p>
      </div>
    </div>
  );
}
