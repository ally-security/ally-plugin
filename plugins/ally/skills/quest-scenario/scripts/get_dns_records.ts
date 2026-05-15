#!/usr/bin/env node

/**
 * DNS context helper for quest scenario research.
 *
 * Mirrors the intent of Simply Ally's company profile DNS tool:
 * `domain_dns_lookup(domain)` / `fetch_domain_dns_lookup(domain)`.
 */

export {};

declare const process: {
  argv: string[];
  exit(code?: number): never;
};

const domain = process.argv[2];

if (!domain) {
  console.error("Usage: get_dns_records.ts <domain>");
  process.exit(1);
}

async function lookup(recordType: string): Promise<string[]> {
  const response = await fetch(
    `https://dns.google/resolve?name=${encodeURIComponent(domain)}&type=${recordType}`,
  );

  if (!response.ok) {
    throw new Error(`Google DNS returned ${response.status} for ${recordType}`);
  }

  const body = await response.json() as {
    Answer?: Array<{ name?: string; type?: number; TTL?: number; data?: string }>;
  };

  return (body.Answer ?? []).map((record) => {
    return `${record.name ?? domain} ${record.type ?? recordType} ${record.TTL ?? ""} ${record.data ?? ""}`.trim();
  });
}

for (const type of ["A", "AAAA", "MX", "TXT", "NS", "CNAME"]) {
  try {
    const records = await lookup(type);
    if (records.length === 0) {
      continue;
    }

    console.log(`### ${type} Records for ${domain}`);
    console.log("");
    console.log("```");
    console.log(records.join("\n"));
    console.log("```");
    console.log("");
  } catch (error) {
    console.error(`Failed to fetch ${type} records: ${error instanceof Error ? error.message : String(error)}`);
  }
}
