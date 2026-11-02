/** Internal aliases for existing reviewed tool fields. No MCP inputs are added. */
export function regionalInputs(args: unknown): Record<string, unknown> {
  if (!args || typeof args !== 'object' || Array.isArray(args)) return {};
  const input = args as Record<string, unknown>;
  const seller: unknown[] = [];
  for (const key of ['product_description', 'your_solution', 'product_feature', 'product_context']) {
    if (typeof input[key] === 'string') seller.push(input[key]);
  }
  // Only explicit first person seller statements in prose become seller context.
  // Customer quotes, proof, competitor descriptions and identities are excluded.
  for (const key of ['your_take', 'content', 'source_content', 'document_content', 'gtm_challenge', 'challenge']) {
    if (typeof input[key] !== 'string') continue;
    for (const sentence of (input[key] as string).split(/(?<=[.!?])\s+|\n+/)) {
      if (/^\s*(?:we\s+(?:(?:do\s+not|never|currently|only|also)\s+)*(?:sell|serve|target|operate|offer|provide|are\s+(?:selling|not\s+selling))\b|our\s+(?:company|business|product|service|market)\s+(?:sells|serves|targets|operates|is|offers|provides)\b)/i.test(sentence)) seller.push(sentence);
    }
  }
  const ownSector = typeof input.your_sector === 'string' && input.your_sector !== 'other'
    ? input.your_sector.replace(/_/g, ' ') : undefined;
  return { ...input, ...(seller.length ? { product_description: seller } : {}), ...(ownSector ? { sector: ownSector } : {}) };
}
