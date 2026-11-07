import test from 'node:test';
import assert from 'node:assert/strict';
import { applySoftwarePolicy } from '../src/software-policy.ts';
import { answerBlocker } from '../src/answers.ts';
import { solutionBrief } from '../src/dealtext.ts';
import { readAlt, productOf } from '../src/rw-common.ts';
import { buildWinLoss } from '../src/rw-winloss.ts';
import { buildMutualActionPlan } from '../src/rw1-map.ts';
import { detectVertical } from '../src/verticals.ts';

test('RC-01 and RC-02: software-policy preserves buyer-system integration context and strips third-party recommendations', () => {
  const buyerContext = 'Integrates with Salesforce and HubSpot via two-way sync.';
  assert.equal(applySoftwarePolicy(buyerContext), buyerContext);
  const rec = 'We recommend buying Gong and Outreach for call recording.';
  assert.ok(!/\bGong\b/.test(applySoftwarePolicy(rec)));
});

test('Named Item 2 and RC-13: answerBlocker handles compound concerns and affirmed clearance without generic fallback', () => {
  const compound = answerBlocker('Budget freeze and SOC 2 compliance audit required before signing', { product: 'Chargebee' });
  assert.match(compound.kind, /\+/);
  assert.match(compound.how, /Also address/);

  const legal = answerBlocker('Legal counsel redlines on MSA liability cap and indemnity', { product: 'Chargebee' });
  assert.equal(legal.kind, 'terms');

  const security = answerBlocker('AppSec team blocked repo access pending penetration test', { product: 'QuantumStreet AI' });
  assert.equal(security.kind, 'security');

  const usageCompeting = answerBlocker('Stripe pitching native usage add-on to CFO', { product: 'Chargebee' });
  assert.equal(usageCompeting.kind, 'incumbent');
});

test('RC-07 and RC-09: solutionBrief extracts leading proper brand names from unpunctuated descriptions', () => {
  assert.equal(solutionBrief('Locus logistics_tech AI dispatch, route optimization, and SLA tracking platform').short, 'Locus');
  assert.equal(solutionBrief('QuantumStreet AI ai_native developer code review agent').short, 'QuantumStreet AI');
  assert.equal(solutionBrief('Infosys BPM BPO and IT services for banking').short, 'Infosys BPM');
  assert.equal(solutionBrief('Airtel Business telecom SD-WAN and IoT connectivity').short, 'Airtel Business');
});

test('RC-08: vertical-saas detection matches clinic, construction, and hotel management software cues', () => {
  const v = detectVertical('Practice management and patient intake software for dental clinics');
  assert.equal(v?.id, 'vertical-saas');
});

test('RC-18 and RC-22: win_loss_analyzer handles negated parentheticals and won-deal competitor labels', () => {
  const D = {
    isCommon: (w) => /^(?:the|and|for|our|your|with|from)$/i.test(w),
    lower: (s) => s.toLowerCase(),
    cap: (s) => s.charAt(0).toUpperCase() + s.slice(1),
    money: (n) => `$${n.toLocaleString('en-US')}`,
  };
  const alt = readAlt('CompetitorA (not manual spreadsheets)', D, true);
  assert.equal(alt.kind, 'vendor');

  const out = buildWinLoss({
    analysis_type: 'single_deal',
    deal_outcome: 'won',
    your_solution: 'Locus, route optimization platform',
    competitor_won: 'None (we won against CompetitorA and manual spreadsheets)',
    deal_details: 'Won after a 4-week pilot.',
  }, D);
  assert.match(out, /\*\*Competitor beaten\*\*/);
  assert.doesNotMatch(out, /ahead of None/);
});
