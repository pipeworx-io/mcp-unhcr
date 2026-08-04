# mcp-unhcr

UNHCR Refugee Data Finder MCP (keyless).

Part of [Pipeworx](https://pipeworx.io) — an MCP gateway connecting AI agents to 1394+ live data sources.

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

Or connect to the full Pipeworx gateway for access to all 1394+ data sources:

```json
{
  "mcpServers": {
    "pipeworx": {
      "url": "https://gateway.pipeworx.io/mcp"
    }
  }
}
```

## Using with ask_pipeworx

Instead of calling tools directly, you can ask questions in plain English:

```
ask_pipeworx({ question: "your question about Unhcr data" })
```

The gateway picks the right tool and fills the arguments automatically.

## More

- [Docs and guides](https://pipeworx.io/docs)
- [pipeworx.io](https://pipeworx.io)

## License

MIT
