type Input = Record<string, unknown>;
type Reading = {meaning: string; evidence: string; roles: string[]};
// Inputs have already crossed the shared escaping boundary. Do not cut an escape.
const label = (v: unknown, fallback: string): string => typeof v === 'string' && v.trim() && v.trim().length <= 150 && !/[\r\n]/.test(v) ? v.trim() : fallback;
const num = (v: unknown, fallback: string): string => typeof v === 'number' && Number.isFinite(v) ? v.toLocaleString('en-US', {maximumFractionDigits: 6}) : fallback;
export function revenueReading(name: string, a: Input, result: string): Reading | undefined {
 const solution=label(a.your_solution,'the supplied offer');
 if(name==='email_sequence_generator'){
  const persona=label(a.target_persona,'the intended recipient'),pain=label(a.specific_pain_point,'the supplied problem'),proof=label(a.social_proof,'the supplied proof, if any');
  return {meaning:`This is a draft invitation for ${persona} to discuss ${solution}. The reported problem is a reason to ask, not proof that this recipient has it.`,evidence:`the recipient denies the reported problem, the example lacks support, or contact or customer permission is missing`,roles:[
   `Founder: ask whether the observation "${pain}" is true for the intended recipient before endorsing the opening; retain a denial as evidence to revise it.`,
   `CEO: name the reply owner and confirm they can deliver the proposed next step for ${solution} before approving a send; hold promises the team cannot fulfil.`,
   `CMO: check "${proof}" against its source and permission record before approving the example; do not turn an unmeasured change into a saving.`,
   `CRO: ask ${persona} which next observation would justify a conversation about ${solution}; use that answer to approve or revise the reply request.`,
   `Demand generation head: check contact permission, exclusions and a working reply route for ${persona} before sending; stop follow ups after a refusal and record relevance objections.`,
  ]};
 }

 if(name==='demo_script_builder'){
  const objection=label(a.known_objections,'the unresolved buyer objection');
  const closure=/\balerts?\b/i.test(String(a.known_objections))&&/\bclos/i.test(String(a.known_objections));
  const check=closure?'whether an alert remains open until an authorized person approves closure':'whether the buyer chosen record reaches the agreed result';
  return {meaning:`The script supports an acceptance discussion for ${solution}. Start with one buyer chosen example: agree the expected result, demonstrate only a confirmed capability, then ask the buyer to accept or reject what happened. Check ${check}; if this cannot be shown, record a gap rather than implying the capability exists.`,evidence:`the buyer rejects the observed result, the required capability is unavailable, or the objection remains unresolved`,roles:[
   `Founder: ask the buyer whether the test addresses "${objection}" before endorsing the demonstration; record the observation that would disprove fit.`,
   `CEO: have the delivery lead confirm a safe test environment and a named operator for ${solution} before committing staff; hold any live change that has no approval.`,
   `CMO: compare the claims in the ${solution} demo with the recorded screen or service evidence before reusing them; do not infer a performance improvement from a walkthrough.`,
   `CRO: agree with the buyer how to check ${check} before the demonstration; record pass, failure or not demonstrated against the same condition.`,
   `Demand generation head: use the unresolved objection "${objection}" to review the next invitation list; check that invitees face this problem before scaling demo outreach.`,
  ]};
 }
 return undefined;
}
