interface McpToolDefinition {
  name: string;
  description: string;
  inputSchema: {
    type: 'object';
    properties: Record<string, unknown>;
    required?: string[];
  };
}

interface McpToolExport {
  tools: McpToolDefinition[];
  callTool: (name: string, args: Record<string, unknown>) => Promise<unknown>;
  meter?: { credits: number };
  cost?: Record<string, unknown>;
  provider?: string;
}

/**
 * UNHCR Refugee Data Finder MCP (keyless).
 *
 * UNHCR = UN Refugee Agency. Public statistics on forcibly displaced and
 * stateless people: refugees, asylum-seekers, IDPs (internally displaced),
 * plus asylum applications and decisions.
 *
 * API: https://api.unhcr.org/population/v1  (keyless, no auth)
 * Every response is an envelope: { page, maxPages, total, items: [...] }.
 *
 * COUNTRY CODES — IMPORTANT QUIRK:
 *   The `coo` (country of origin) and `coa` (country of asylum) filters expect
 *   UNHCR's own 3-letter `code`, which is NOT always ISO3. Many match ISO3
 *   (SYR, AFG), but plenty differ — e.g. Germany is "GFR" (ISO3 "DEU"),
 *   Algeria is "ALG" (ISO3 "DZA"). Passing the ISO3 silently returns 0 items.
 *   Always resolve via the `list_countries` tool: use the `code` field for
 *   filtering; the `iso` field is the true ISO3 for reference.
 */


const BASE = 'https://api.unhcr.org/population/v1';
const UA = 'pipeworx-mcp-unhcr/1.0 (+https://pipeworx.io)';

const tools: McpToolExport['tools'] = [
  {
    name: 'population',
    description:
      "Forcibly displaced & stateless persons by year and country: refugees, asylum_seekers, idps (internally displaced), returned_refugees, returned_idps, stateless, others. Filter by coo (country of origin) and/or coa (country of asylum). coo_all/coa_all=true breaks the totals DOWN by that dimension (one row per origin or asylum country). NOTE: coo/coa take UNHCR's 3-letter code (e.g. Germany='GFR', not ISO3 'DEU') — resolve with list_countries first.",
    inputSchema: {
      type: 'object',
      properties: {
        yearFrom: { type: 'integer', description: 'Start year, inclusive (data spans 1951+).' },
        yearTo: { type: 'integer', description: 'End year, inclusive.' },
        coo: { type: 'string', description: 'Country of ORIGIN — UNHCR 3-letter code (see list_countries.code).' },
        coa: { type: 'string', description: 'Country of ASYLUM — UNHCR 3-letter code (see list_countries.code).' },
        coo_all: { type: 'boolean', description: 'true = break results down per country of origin.' },
        coa_all: { type: 'boolean', description: 'true = break results down per country of asylum.' },
        limit: { type: 'integer', description: 'Rows per page (default 25).' },
        page: { type: 'integer', description: '1-based page; response.maxPages tells you the total.' },
      },
    },
  },
  {
    name: 'asylum_applications',
    description:
      'Asylum applications lodged, by year, country of origin (coo) and country of asylum (coa). Rows carry procedure_type, app_type, dec_level and the `applied` count; response.total.applied is the aggregate. coo/coa take UNHCR 3-letter codes (see list_countries).',
    inputSchema: {
      type: 'object',
      properties: {
        yearFrom: { type: 'integer', description: 'Start year, inclusive.' },
        yearTo: { type: 'integer', description: 'End year, inclusive.' },
        coo: { type: 'string', description: 'Country of ORIGIN — UNHCR 3-letter code.' },
        coa: { type: 'string', description: 'Country of ASYLUM — UNHCR 3-letter code.' },
        limit: { type: 'integer', description: 'Rows per page (default 25).' },
        page: { type: 'integer', description: '1-based page.' },
      },
    },
  },
  {
    name: 'asylum_decisions',
    description:
      'Decisions on asylum claims, by year, country of origin (coo) and country of asylum (coa). Each row breaks out dec_recognized, dec_other, dec_rejected, dec_closed and dec_total; response.total aggregates the same fields. coo/coa take UNHCR 3-letter codes (see list_countries).',
    inputSchema: {
      type: 'object',
      properties: {
        yearFrom: { type: 'integer', description: 'Start year, inclusive.' },
        yearTo: { type: 'integer', description: 'End year, inclusive.' },
        coo: { type: 'string', description: 'Country of ORIGIN — UNHCR 3-letter code.' },
        coa: { type: 'string', description: 'Country of ASYLUM — UNHCR 3-letter code.' },
        limit: { type: 'integer', description: 'Rows per page (default 25).' },
        page: { type: 'integer', description: '1-based page.' },
      },
    },
  },
  {
    name: 'list_countries',
    description:
      "Reference list of countries/territories UNHCR tracks. Use this to map a country name to the `code` you pass as coo/coa in the other tools. Each item has: code (UNHCR 3-letter, USE THIS for filtering), iso (true ISO3), iso2, name, region, majorArea. Paginated — large list, raise `limit` or page through (response.maxPages).",
    inputSchema: {
      type: 'object',
      properties: {
        limit: { type: 'integer', description: 'Rows per page (default 25; raise to fetch more at once).' },
        page: { type: 'integer', description: '1-based page; see response.maxPages.' },
      },
    },
  },
];

async function callTool(name: string, args: Record<string, unknown>): Promise<unknown> {
  switch (name) {
    case 'population':
      return unhcrGet('/population/', {
        yearFrom: args.yearFrom,
        yearTo: args.yearTo,
        coo: args.coo,
        coa: args.coa,
        coo_all: args.coo_all,
        coa_all: args.coa_all,
        limit: args.limit,
        page: args.page,
      });
    case 'asylum_applications':
      return unhcrGet('/asylum-applications/', {
        yearFrom: args.yearFrom,
        yearTo: args.yearTo,
        coo: args.coo,
        coa: args.coa,
        limit: args.limit,
        page: args.page,
      });
    case 'asylum_decisions':
      return unhcrGet('/asylum-decisions/', {
        yearFrom: args.yearFrom,
        yearTo: args.yearTo,
        coo: args.coo,
        coa: args.coa,
        limit: args.limit,
        page: args.page,
      });
    case 'list_countries':
      return unhcrGet('/countries/', { limit: args.limit, page: args.page });
    default:
      throw new Error(`Unknown tool: ${name}`);
  }
}

async function unhcrGet(path: string, params: Record<string, unknown>): Promise<unknown> {
  const qs = new URLSearchParams();
  for (const [k, v] of Object.entries(params)) {
    if (v === undefined || v === null || v === '') continue;
    qs.set(k, typeof v === 'boolean' ? String(v) : String(v));
  }
  const url = `${BASE}${path}${qs.toString() ? `?${qs}` : ''}`;
  const res = await fetch(url, { headers: { Accept: 'application/json', 'User-Agent': UA } });
  if (!res.ok) throw new Error(`UNHCR: ${res.status} ${await res.text().then((t) => t.slice(0, 200))}`);
  return res.json();
}

export default { tools, callTool, meter: { credits: 1 } } satisfies McpToolExport;
