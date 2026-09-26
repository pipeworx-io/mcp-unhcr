# mcp-unhcr

UNHCR Refugee Data Finder MCP (keyless).

Part of [Pipeworx](https://pipeworx.io) — an MCP gateway connecting AI agents to 1684+ live data sources.

## Tools

| Tool | Description |
|------|-------------|
| `population` | Forcibly displaced & stateless persons by year and country: refugees, asylum_seekers, idps (internally displaced), returned_refugees, returned_idps, stateless, others. Filter by coo (country of origin) and/or coa (country of asylum). coo_all/coa_all=true breaks the totals DOWN by that dimension (one row per origin or asylum country). NOTE: coo/coa take UNHCR's 3-letter code (e.g. Germany='GFR', not ISO3 'DEU') — resolve with list_countries first. |
| `asylum_applications` | Asylum applications lodged, by year, country of origin (coo) and country of asylum (coa). Rows carry procedure_type, app_type, dec_level and the `applied` count; response.total.applied is the aggregate. coo/coa take UNHCR 3-letter codes (see list_countries). |
| `asylum_decisions` | Decisions on asylum claims, by year, country of origin (coo) and country of asylum (coa). Each row breaks out dec_recognized, dec_other, dec_rejected, dec_closed and dec_total; response.total aggregates the same fields. coo/coa take UNHCR 3-letter codes (see list_countries). |
| `list_countries` | Reference list of countries/territories UNHCR tracks. Use this to map a country name to the `code` you pass as coo/coa in the other tools. Each item has: code (UNHCR 3-letter, USE THIS for filtering), iso (true ISO3), iso2, name, region, majorArea. Paginated — large list, raise `limit` or page through (response.maxPages). |

## Quick Start

Add to your MCP client (Claude Desktop, Cursor, Windsurf, etc.):

```json
{
  "mcpServers": {
    "unhcr": {
      "url": "https://gateway.pipeworx.io/unhcr/mcp"
    }
  }
}
```

### What this endpoint actually serves

`tools/list` at `https://gateway.pipeworx.io/unhcr/mcp` returns the tools in the table
above **plus the shared Pipeworx meta-tools** — `ask_pipeworx`,
`discover_tools`, `search_within`, `remember`/`recall` and the rest of the
gateway-wide set. So the tool count you see is larger than this table: a
single-pack endpoint currently lists roughly 30 shared tools alongside the
pack's own. The connection's `initialize` response states its exact scope, and
is the authoritative answer for a given day.

This is deliberate, not multiplexing by accident. The meta-tools are what let a
scoped connection answer a question this pack does not cover — via
`ask_pipeworx`, which routes across the whole catalog — without you adding a
second MCP server. There is currently no way to mount a pack endpoint without
them; if the extra schemas cost you more context than the routing is worth,
connect to the full gateway once rather than to several pack endpoints.

Or connect to the full Pipeworx gateway to get every pack's tools listed
directly, instead of just this one's:

```json
{
  "mcpServers": {
    "pipeworx": {
      "url": "https://gateway.pipeworx.io/mcp"
    }
  }
}
```

Both URLs reach the same gateway and the same 1684+ data sources. The
only difference is which pack's tools are listed **directly**; `ask_pipeworx`
reaches all of them from either one.

## No MCP client? Call it over HTTP

```bash
curl -X POST https://gateway.pipeworx.io/v1/tools/population \
  -H 'Content-Type: application/json' \
  -d '{"yearFrom":2019,"yearTo":2023}'
```

No account needed for the first calls. Inspect any tool: `GET https://gateway.pipeworx.io/v1/tools/population`. Find one: `POST https://gateway.pipeworx.io/v1/tools/search_packs` with `{"query":"..."}`.

## Standalone (no gateway account)

This package also runs as a local stdio MCP server — no Pipeworx account, no
gateway round-trip:

```json
{
  "mcpServers": {
    "unhcr": {
      "command": "npx",
      "args": ["-y", "@pipeworx/mcp-unhcr"]
    }
  }
}
```

Or run it directly to confirm it starts:

```bash
npx -y @pipeworx/mcp-unhcr
```

It speaks MCP over stdin/stdout and answers `initialize`/`tools/list`/`tools/call`
for **only** this pack's tools — none of the shared meta-tools the gateway
connection above adds. Same source, same tools, no ask_pipeworx routing.

## Using with ask_pipeworx

Instead of calling tools directly, you can ask questions in plain English —
this works on the pack endpoint above as well as on the full gateway:

```
ask_pipeworx({ question: "your question about Unhcr data" })
```

The gateway picks the right tool and fills the arguments automatically.

## More

- [Docs and guides](https://pipeworx.io/docs)
- [pipeworx.io](https://pipeworx.io)

## License

MIT
