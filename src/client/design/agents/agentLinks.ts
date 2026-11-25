import type { listMcpConnections } from "@/serverFunctions/mcp-connections";
import { PRODUCT_NAME } from "@/shared/branding";

type Connection = Awaited<ReturnType<typeof listMcpConnections>>[number];

/**
 * How one agent adds our MCP server. "link" opens the agent's own install
 * screen filled in, "command" is run in a terminal, "steps" are followed in
 * the agent's settings.
 */
export type Agent = {
  name: string;
  note: string;
  isConnected: (connection: Connection) => boolean;
  /** What to copy when adding it by hand. */
  code: string;
} & (
  | { kind: "link"; href: string }
  | { kind: "command" }
  | { kind: "steps"; href: string; steps: string[] }
);

/** Agents name themselves when they register. */
const named = (pattern: RegExp) => (connection: Connection) =>
  pattern.test(connection.clientName);

const base64 = (value: object) => btoa(JSON.stringify(value));

export function getAgents(mcpUrl: string): Agent[] {
  const id = PRODUCT_NAME.toLowerCase().replaceAll(" ", "-");
  return [
    {
      name: "Claude",
      note: "Opens Claude. On a team plan, an owner adds it.",
      kind: "link",
      href: `https://claude.ai/customize/connectors?modal=add-custom-connector&connectorName=${encodeURIComponent(PRODUCT_NAME)}&connectorUrl=${encodeURIComponent(mcpUrl)}`,
      code: mcpUrl,
      isConnected: ({ webChat }) => webChat === "claude",
    },
    {
      name: "Hermes",
      note: "Opens the Hermes desktop app.",
      kind: "link",
      href: `hermes://mcp/install?name=${id}&config=${base64({
        url: mcpUrl,
        auth: "oauth",
      })
        .replaceAll("+", "-")
        .replaceAll("/", "_")
        .replaceAll("=", "")}`,
      code: `hermes mcp add ${id} --url ${mcpUrl} --auth oauth`,
      isConnected: named(/hermes/i),
    },
    {
      name: "Cursor",
      note: "Opens Cursor.",
      kind: "link",
      href: `cursor://anysphere.cursor-deeplink/mcp/install?name=${id}&config=${encodeURIComponent(base64({ url: mcpUrl }))}`,
      code: mcpUrl,
      isConnected: named(/cursor/i),
    },
    {
      name: "VS Code",
      note: "Opens VS Code.",
      kind: "link",
      href: `vscode:mcp/install?${encodeURIComponent(
        JSON.stringify({ name: id, type: "http", url: mcpUrl }),
      )}`,
      code: mcpUrl,
      isConnected: named(/visual studio code|vs ?code/i),
    },
    {
      name: "Claude Code",
      note: "Run one command in your terminal.",
      kind: "command",
      code: `claude mcp add --transport http --scope user ${id} ${mcpUrl}`,
      isConnected: named(/claude code/i),
    },
    {
      name: "Codex",
      note: "Run one command in your terminal.",
      kind: "command",
      code: `codex mcp add ${id} --url ${mcpUrl}`,
      isConnected: named(/codex/i),
    },
    {
      name: "ChatGPT",
      note: "Paste our address. Needs a ChatGPT plan that allows custom servers.",
      kind: "steps",
      href: "https://chatgpt.com/plugins",
      steps: [
        "Open Plugins, press + and choose Add custom MCP server.",
        "Paste the address and choose OAuth.",
        "Create it, press Install, then sign in.",
      ],
      code: mcpUrl,
      isConnected: ({ webChat }) => webChat === "chatgpt",
    },
    {
      name: "Gemini",
      note: "Paste our address. US personal accounts, 18 and over.",
      kind: "steps",
      href: "https://gemini.google.com",
      steps: [
        "Open Settings, Connected Apps, Custom apps.",
        "Paste the address and sign in.",
      ],
      code: mcpUrl,
      isConnected: named(/gemini/i),
    },
    {
      name: "Grok",
      note: "Paste our address.",
      kind: "steps",
      href: "https://grok.com/connectors",
      steps: [
        "Press New Connector, then Custom.",
        "Paste the address and sign in.",
      ],
      code: mcpUrl,
      isConnected: named(/grok/i),
    },
    {
      name: "Perplexity",
      note: "Paste our address.",
      kind: "steps",
      href: "https://www.perplexity.ai",
      steps: [
        "Open Plugins, Add custom, Add MCP connector, Remote.",
        "Paste the address and sign in.",
      ],
      code: mcpUrl,
      isConnected: named(/perplexity/i),
    },
  ];
}
