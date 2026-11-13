// Owner decision (13 Nov 2026): "Business model: not stated. Tell us how you charge and the plan will adjust." and
// "Any priced offer below requires a written quote and buyer agreement." print only in tools whose answer carries a price,
// a priced offer or a commercial plan. Every other tool keeps the sector line and drops these two lines.
export const PRICED_TOOLS: ReadonlySet<string> = new Set(['account_plan_builder', 'mutual_action_plan_generator', 'competitive_trap_setter', 'roi_business_case_builder', 'pricing_negotiation_guide', 'proposal_section_writer']);
export function pricingLines(tool: string, text: string): string {
  if (PRICED_TOOLS.has(tool)) return text;
  return text
    .replace(/\n\nAny priced offer below requires a written quote and buyer agreement\./g, '')
    .replace(/^Any priced offer below requires a written quote and buyer agreement\.\n?/gm, '')
    .replace(/^\*Business model: not stated\. Tell us how you charge and the plan will adjust\.\*\n?/gm, '')
    .replace(/ Business model: not stated\. Tell us how you charge and the plan will adjust\./g, '')
    .replace(/^Business model: not stated\. Tell us how you charge and the plan will adjust\.\n?/gm, '');
}
