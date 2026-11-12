# Set Up and Verify PLaywright MCP

This prompt should check if MCP has been already installed and installed it if not. 


```
Set up the Playwright MCP server in Claude Code for me — do not make me edit any
config by hand — then verify it works. Work step by step and tell me what you do.

1. Check whether a "playwright" MCP server is already configured by running
   claude mcp list . If it is already there and connected, tell me and skip
   to step 5.
2. Add an MCP server named "playwright" that runs the official Playwright MCP
   server, at local scope so it is private to me and only available in this
   project. Use the claude mcp add command (do not edit any JSON by hand and
   do not remove any servers that are already configured):
       claude mcp add --scope local playwright -- npx @playwright/mcp@latest
   Show me the exact command you ran and the config file it wrote to.
3. Make sure the browser is installed: run  npx playwright install chromium
4. Run claude mcp list again and confirm "playwright" shows as connected.
   Then tell me clearly whether I need to start a new Claude Code session (or
   reload the VS Code window) before the new tools show up. If I do, tell me to
   do it now and to check it with /mcp, then wait for me to confirm.
5. Once the Playwright MCP browser tools are available, verify the connection:
   open a browser to https://example.com and report the page title back to me.

If any step fails, stop and tell me exactly what failed and what to try next.


```