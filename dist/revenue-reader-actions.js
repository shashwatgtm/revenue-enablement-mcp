"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
exports.revenueReading = revenueReading;
const rw_kit_ts_1 = require("./rw-kit.js");
// Inputs have already crossed the shared escaping boundary. Do not cut an escape.
const label = (v, fallback) => typeof v === 'string' && v.trim() && v.trim().length <= 150 && !/[\r\n]/.test(v) && !/^\(?\s*(?:not (?:given|supplied|stated|known)|unknown|n\/?a|none|unspecified)\s*\)?$/i.test(v) ? v.trim() : fallback;
const num = (v, fallback) => typeof v === 'number' && Number.isFinite(v) ? v.toLocaleString('en-US', { maximumFractionDigits: 6 }) : fallback;
function revenueReading(name, a, result) {
    const solution = label(a.your_solution, 'the supplied offer');
    if (name === 'email_sequence_generator') {
        const persona = label(a.target_persona, 'the intended recipient'), pain = label(a.specific_pain_point, 'the supplied problem'), proof = label(a.social_proof, 'the supplied proof, if any');
        return { meaning: `This is a draft invitation for ${persona} to discuss ${solution}. The reported problem is a reason to ask, not proof that this recipient has it.`, evidence: `the recipient denies the reported problem, the example lacks support, or contact or customer permission is missing`, roles: [
                `Founder: ask whether the observation "${pain}" is true for the intended recipient before endorsing the opening; retain a denial as evidence to revise it.`,
                `CEO: name the reply owner and confirm they can deliver the proposed next step for ${solution} before approving a send; hold promises the team cannot fulfil.`,
                `CMO: check "${proof}" against its source and permission record before approving the example; do not turn an unmeasured change into a saving.`,
                `CRO: ask ${persona} which next observation would justify a conversation about ${solution}; use that answer to approve or revise the reply request.`,
                `Demand generation head: check contact permission, exclusions and a working reply route for ${persona} before sending; stop follow ups after a refusal and record relevance objections.`,
            ] };
    }
    if (name === 'demo_script_builder') {
        const objection = label(a.known_objections, 'the unresolved buyer objection');
        const closure = /\balerts?\b/i.test(String(a.known_objections)) && /\bclos/i.test(String(a.known_objections));
        const check = closure ? 'whether an alert remains open until an authorized person approves closure' : 'whether the buyer chosen record reaches the agreed result';
        return { meaning: `The script supports an acceptance discussion for ${solution}. Start with one buyer chosen example: agree the expected result, demonstrate only a confirmed capability, then ask the buyer to accept or reject what happened. Check ${check}; if this cannot be shown, record a gap rather than implying the capability exists.`, evidence: `the buyer rejects the observed result, the required capability is unavailable, or the objection remains unresolved`, roles: [
                `Founder: ask the buyer whether the test addresses "${objection}" before endorsing the demonstration; record the observation that would disprove fit.`,
                `CEO: have the delivery lead confirm a safe test environment and a named operator for ${solution} before committing staff; hold any live change that has no approval.`,
                `CMO: compare the claims in the ${solution} demo with the recorded screen or service evidence before reusing them; do not infer a performance improvement from a walkthrough.`,
                `CRO: agree with the buyer how to check ${check} before the demonstration; record pass, failure or not demonstrated against the same condition.`,
                `Demand generation head: use the unresolved objection "${objection}" to review the next invitation list; check that invitees face this problem before scaling demo outreach.`,
            ] };
    }
    if (name === 'discovery_question_bank') {
        const role = label(a.prospect_role, 'the proposed buyer').replace(/\s*\((?:title of|source:)[^)]*\)/gi, ''), pain = label(a.known_pain_points, 'the reported problem'), metrics = label(a.known_metrics, 'the unverified metric baseline');
        return { meaning: `Use the question bank to test ${solution}, beginning with three observations: ask ${role} for the most recent instance of "${pain}"; ask how often it happened and how the cost was counted; then ask what result and whose approval would justify changing the process. The remaining questions are optional probes, not a required script.`, evidence: `the buyer cannot confirm a recent instance, the metric counts a different scope or period, or the approval condition does not support a change`, roles: [
                `Founder: ask ${role} for a recent example of "${pain}" before accepting it as a buying problem; record a counterexample where the current process worked.`,
                `CEO: have finance verify the scope and period behind "${metrics}" before valuing the problem; distinguish total team effort from effort per person.`,
                `CMO: check the attributed notes from ${role} before using "${pain}" in messaging; keep a seller hypothesis separate from the buyer's words.`,
                `CRO: use the recent example, frequency and approval questions with ${role} first; advance only when the buyer confirms a problem and an observable acceptance condition.`,
                `Demand generation head: test whether a fresh account with the same role reports "${pain}" before widening the audience; record accounts that deny it.`,
            ] };
    }
    if (name === 'proposal_section_writer') {
        const problem = label(a.customer_challenges, 'the supplied customer challenge'), difference = label(a.key_differentiators, 'the proposed difference'), section = label(a.section_type, 'requested');
        return { meaning: `The ${section.replace(/_/g, ' ')} section supports a scope conversation for ${solution}. The buyer must approve deliverables, excluded work and acceptance evidence before this becomes a commitment. An unmeasured improvement stays a hypothesis.`, evidence: `the buyer disputes the problem, rejects the scope or acceptance check, or measured results contradict the proposed difference`, roles: [
                `Founder: confirm with the buyer that "${problem}" is the problem this proposal must resolve before endorsing ${solution}; record any competing priority.`,
                `CEO: have the delivery lead list included work, exclusions and staff effort for ${solution} before approving the section; do not accept a delivery obligation without agreed boundaries.`,
                `CMO: verify "${difference}" against source records before approving the proposal wording; retain any unmeasured outcome as a hypothesis.`,
                `CRO: ask the buyer to approve an observable acceptance condition for "${problem}" and identify the signatory before sending the proposal for approval.`,
                `Demand generation head: compare the ${solution} proposal audience with the account brief before reuse; remove this case's claims unless the new account has matching evidence.`,
            ] };
    }
    if (name === 'deal_strategy_coach') {
        const deal = label(a.deal_name, 'this deal'), stage = label(a.deal_stage, 'the stated stage'), buyer = label(a.economic_buyer, 'economic buyer not identified'), champion = label(a.champion_status, 'champion status not supplied').replace(/_/g, ' ');
        return { meaning: `The advice supports choosing the next evidence check for ${deal} at ${stage}. The rubric does not establish buyer participation, purchase authority or a close probability. Treat the buyer and champion records as facts to verify, not completed approval steps.`, evidence: `direct buyer confirmation contradicts the recorded authority, participation, acceptance condition or blocker`, roles: [
                `Founder: challenge whether the ${stage} label for ${deal} is supported by a buyer action; request the action record before endorsing progression.`,
                `CEO: confirm the delivery effort reserved for ${deal} before approving more spend; release no additional commitment until the buyer decision path is verified.`,
                `CMO: check whether the proof used for ${solution} answers the buyer's stated concern before adding sales material; do not infer that a proposal proves interest.`,
                `CRO: resolve the buyer record "${buyer}" through direct confirmation before advancing ${deal}; record the approver's participation and acceptance condition.`,
                `Demand generation head: ask the account owner to verify the recorded status "${champion}" before copying this contact profile into outreach; distinguish a contact from confirmed advocacy.`,
            ] };
    }
    if (name === 'account_plan_builder') {
        const account = label(a.account_name, 'this account'), expansion = label(a.expansion_opportunities, 'unconfirmed expansion'), contacts = label(a.known_contacts, 'the supplied contact list'), current = label(a.current_products, 'the current delivery scope');
        return { meaning: `The plan supports an account review for ${account}. Current revenue and a proposed expansion do not establish new demand or access. Confirm the new buyer's problem and approval process before assigning expansion revenue.`, evidence: `the proposed expansion lacks buyer demand, the contact cannot arrange access, or current delivery economics do not support more work`, roles: [
                `Founder: test the proposed expansion "${expansion}" with the new problem owner before endorsing growth in ${account}; record whether the need is confirmed or denied.`,
                `CEO: have finance separate current annual revenue of ${num(a.current_arr, 'unstated amount')} from unapproved expansion at ${account}; check delivery cost before reserving staff.`,
                `CMO: verify outcomes from "${current}" before using them in an expansion story for ${account}; do not extend one location's evidence to another.`,
                `CRO: review "${contacts}" with the account owner and arrange an introduction to the expansion approver; record access, authority and the next approval step before forecasting it.`,
                `Demand generation head: compare the confirmed need in ${account} with a fresh account sample before copying its profile into campaigns; exclude expansion assumptions from selection criteria.`,
            ] };
    }
    if (name === 'mutual_action_plan_generator') {
        const deal = label(a.deal_name, 'this deal'), date = label(a.target_close_date, 'the proposed close date'), buyer = label(a.economic_buyer, 'the unconfirmed approver'), procurement = label(a.procurement_contact, 'the procurement owner to identify'), technical = label(a.technical_evaluators, 'the technical owner to identify'), requirements = typeof a.known_requirements === 'string' && /;|\n/.test(a.known_requirements) ? 'each supplied requirement, tested separately' : label(a.known_requirements, 'the supplied acceptance requirement'), blockers = label(a.blockers, 'the unresolved dependencies');
        return { meaning: `This is a proposed dependency sequence for ${deal}, not a commitment to close on ${date}. Agree the acceptance, review and signature owners before accepting the dates.`, evidence: `a dependency finishes later, the buyer cannot attend, the acceptance test fails, or the budget and signature authority remain unresolved`, roles: [
                `Founder: have the buyer confirm "${requirements}" before accepting the first milestone for ${deal}; record what would fail acceptance.`,
                `CEO: resolve "${blockers}" with ${buyer} before approving resources against ${date}; keep the close date proposed while budget or capacity is unconfirmed.`,
                `CMO: have ${technical} confirm the evidence needed for the ${deal} technical review before circulating claims; retain the approval record and any unresolved condition.`,
                `CRO: confirm lead times and signature dependencies with ${procurement} and ${buyer} before accepting ${date}; move dependent dates when an upstream review slips.`,
                `Demand generation head: confirm attendance and the handoff owner for ${deal} before issuing meeting invitations; check buyer availability against ${date} rather than treating a sent invite as agreement.`,
            ] };
    }
    if (name === 'win_loss_analyzer') {
        const outcome = label(a.deal_outcome, 'recorded'), reason = label(a.loss_reason || a.win_reason, 'the reported decision reason'), stakeholders = label(a.stakeholders_involved, 'the recorded contacts');
        return { meaning: `The analysis supports investigating the ${outcome} decision for ${solution}. This sample cannot establish a general cause or justify changing the entire sales motion. Compare deals with the same segment, scope and period and retain contrary cases.`, evidence: `the buyer gives a different reason or comparable wins, losses and deferred decisions do not show the proposed pattern`, roles: [
                `Founder: compare the reported reason "${reason}" with a comparable win and loss for ${solution} before changing the motion; retain cases that contradict it.`,
                `CEO: have finance compare the pursuit cost and ${num(a.sales_cycle_days, 'unstated')} day cycle for the ${num(a.deal_value, 'unstated')} value opportunity before funding a process change; do not generalize one deal's economics.`,
                `CMO: verify "${reason}" with attributed buyer notes before changing a claim or campaign; separate buyer evidence from seller inference.`,
                `CRO: ask ${stakeholders} for access to the actual decision maker and confirm the reason independently; record whether authority and the approval path were covered.`,
                `Demand generation head: test the proposed ${solution} selection change on a separate, comparable account cohort; agree the measure and stop rule before comparing outcomes with the current criteria.`,
            ] };
    }
    if (name === 'pricing_negotiation_guide') {
        const price = num(a.deal_value, 'unstated amount'), rival = label(a.competitor_price, 'the unverified alternative quote'), value = label(a.value_delivered, 'the claimed value');
        return { meaning: `This is preparation for negotiating ${solution}. The supplied deal amount ${price} and alternative quote "${rival}" are not a like for like comparison until scope, period and exclusions match. Suggested terms require approval.`, evidence: `matched quote scope or period changes the comparison, delivery cost removes the margin, or the buyer cannot substantiate the claimed value`, roles: [
                `Founder: ask the buyer which requirement makes "${value}" valuable before defending the ${price} amount; retain any unmeasured benefit as a hypothesis.`,
                `CEO: have finance reconcile the ${price} amount with its period, delivery cost and minimum approved margin before authorizing a concession; name the person who can approve it.`,
                `CMO: verify the source and scope of "${value}" before using it to justify price; remove unsupported savings or response time claims.`,
                `CRO: obtain the scope, term and exclusions behind "${rival}" and the ${price} offer before discussing a discount; record unresolved differences.`,
                `Demand generation head: check that any ${solution} pricing message uses the approved scope and period before reuse; do not turn this negotiated quote into a public price promise.`,
            ] };
    }
    if (name === 'champion_enablement_kit') {
        const approver = label((0, rw_kit_ts_1.splitNotes)(String(a.target_stakeholder || '')).text, 'the approval owner to identify'), value = label(a.key_value_points, 'the supplied value claim');
        return { meaning: `The kit supports a conversation with ${approver} about ${solution}. A contact's reported effort or enthusiasm does not establish savings, advocacy, budget or approval authority.`, evidence: `the contact cannot arrange approver access, the measured result contradicts the value claim, or the buyer declines the scope or funding request`, roles: [
                `Founder: ask the contact to explain "${value}" in their own words before endorsing the internal case; distinguish reported effort from measured savings.`,
                `CEO: confirm who can authorize spending and delivery for ${solution} before supporting a purchase recommendation; ask ${approver} to confirm budget authority.`,
                `CMO: check the source, period and measurement behind "${value}" before approving the internal brief; keep any unmeasured benefit explicit.`,
                `CRO: ask the contact to arrange a conversation with ${approver} and confirm willingness to advocate for ${solution}; record the introduction rather than inferring influence from title.`,
                `Demand generation head: check that the brief for ${solution} reaches only the agreed buying group and has an owner for questions; do not classify the contact as a champion until advocacy is confirmed.`,
            ] };
    }
    if (name === 'competitive_trap_setter') {
        const rival = label(a.competitor, 'the named alternative'), strength = typeof a.your_strengths === 'string' && /;|\n/.test(a.your_strengths) ? 'one of the listed strengths' : label(a.your_strengths, 'the claimed strength'), weakness = label(a.competitor_weaknesses, 'the claimed alternative weakness');
        return { meaning: `The questions support a buyer controlled comparison of ${solution} and ${rival}. A supplied weakness is a hypothesis, not a verified fact about the alternative. Test the same case and acceptance criterion on both.`, evidence: `the alternative passes the agreed test, the proposed strength cannot be demonstrated, or the buyer does not value the distinction`, roles: [
                `Founder: ask the buyer whether "${strength}" changes their decision before endorsing the comparison; drop the distinction if it is not material.`,
                `CEO: approve only the effort needed for an equal scope comparison of ${solution} and ${rival}; check that costs and test conditions are recorded for both.`,
                `CMO: verify "${weakness}" before using it externally; keep an unverified prospect observation out of factual claims about ${rival}.`,
                `CRO: ask the buyer to run the same example through ${rival} and ${solution} with an agreed pass condition; record contrary results as well as failures.`,
                `Demand generation head: use the buyer validated criterion for ${solution} to review a fresh audience sample; do not use the unverified weakness of ${rival} as a targeting fact.`,
            ] };
    }
    return undefined;
}
//# sourceMappingURL=revenue-reader-actions.js.map