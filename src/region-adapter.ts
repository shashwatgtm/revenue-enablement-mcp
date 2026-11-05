/** Internal aliases for existing reviewed tool fields. No MCP inputs are added. */
export function regionalInputs(args: unknown, industryRole: 'seller' | 'buyer' = 'seller'): Record<string, unknown> {
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
      // First person seller statements: the sentence itself, or a later clause of it, or one led by its own market phrase.
      // The shared reader decides polarity, so modal, inability and denial forms are passed through and read there.
      const sellerVerb = '(?:(?:do(?:es)?\\s+not|don\'t|never|cannot|can\'t|can|could|may|might|will|plan\\s+to|are\\s+(?:currently\\s+)?(?:unable|not\\s+able|able|not\\s+allowed|not\\s+permitted|allowed|permitted)\\s+to|currently|now|only|also|actively|stopped|ceased|used\\s+to|formerly|previously)\\s+)*(?:sell(?:ing)?|sold|serve|target|operate|offer|provide|expand\\s+into|enter)\\b';
      const quoted = /["“”]/.test(sentence) || /\b(?:said|says|told|asked|wrote|claimed|quoted|stated|replied|argued|according\s+to)\b/i.test(sentence);
      if (new RegExp('^\\s*(?:(?:in|into|within|across|for)\\s+[^,.;!?\\n]{1,70}?,?\\s+)?(?:(?:and|but|however|also|now|currently|today)\\s+)*we\\s+' + sellerVerb + '|^\\s*(?:in|into|within|across|for)\\s+[^,.;!?\\n]{1,70}?,?\\s+we\\s+' + sellerVerb, 'i').test(sentence)
        || /^\s*(?:we\s+are\s+(?:selling|not\s+selling)\b|our\s+(?:company|business|product|service|market)\s+(?:sells|serves|targets|operates|is|offers|provides)\b)/i.test(sentence)
        || (!quoted && new RegExp('(?:[,;:]|\\b(?:and|but))\\s+(?:and\\s+|but\\s+|also\\s+)?we\\s+' + sellerVerb + '|[;:]\\s*(?:in|into|within|across|for)\\s+[^,.;!?\\n]{1,70}?,?\\s+we\\s+' + sellerVerb, 'i').test(sentence))) seller.push(sentence);
      if (/^\s*we\s+are\s+(?:a|an|the)\s+[^.!?\n]{1,70}\b(?:vendor|seller|provider)\s+selling\b/i.test(sentence) && !/[\"“”]/.test(sentence)) seller.push(sentence);
      // An account receipt clause can precede the same seller's active sale.
      if (/^\s*we\s+receiv(?:e|ing)\s+(?:our\s+)?payments?\s+(?:in|into|to)\s+[^.;!?\n"“”]*?\bbank\s+account\s+(?:and|but)\s+(?:we\s+)?(?:sell(?:ing)?|serve|offer|provide)\b/i.test(sentence) && !/["“”]/.test(sentence)) seller.push(sentence);
    }
  }
  const ownSector = typeof input.your_sector === 'string' && input.your_sector !== 'other'
    ? input.your_sector.replace(/_/g, ' ') : undefined;
  const result: Record<string, unknown> = { ...input, ...(seller.length ? { product_description: seller } : {}), ...(ownSector ? { sector: ownSector } : {}) };
  // Revenue's industry means the account or buyer industry. It cannot establish
  // the seller's market or override the seller's own product category.
  if (industryRole === 'buyer') delete result.industry;
  return result;
}
