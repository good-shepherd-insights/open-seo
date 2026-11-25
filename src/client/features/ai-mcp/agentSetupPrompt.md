Set up {{PRODUCT_NAME}} in this agent. Do what you can, and guide me through anything that needs me.

1. Work out which agent this is. If {{PRODUCT_NAME}} is already connected, keep that connection and do not add a second one.
2. Add the remote MCP server `{{ORIGIN}}/mcp`, using this agent's own documented steps. It signs in with OAuth: let me approve it in my browser. Never ask me to paste a password or key into the chat. If this is a chat app that cannot add connectors itself, give me the exact clicks to add it as a custom connector, then stop.
3. If this agent supports skills, install the SEO skills listed at `{{ORIGIN}}/skills/index.md` for this agent only. If it does not, skip this step; the connection works without them.
4. Reload only if the new tools need it. Then run `whoami` and `list_projects`, which are free, to check the connection. If there are no projects, ask for my website and create one with `create_project`. Do not run paid research during setup.
5. Finish in 100 words or fewer: what worked, anything left for me to do, and one thing to try first, such as an SEO audit of my site.
