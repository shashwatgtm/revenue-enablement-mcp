import test from 'node:test';
import assert from 'node:assert/strict';
import { answerBlocker } from '../src/answers.ts';
import { readAlt } from '../src/rw-common.ts';
import { buildWinLoss } from '../src/rw-winloss.ts';

test('Named Item 2 and RC-13: answerBlocker reads security and procurement wording, and a usage add-on is not an adoption concern', () => {
  const security = answerBlocker('AppSec team asked for a penetration test report',{ product: 'the product' });
  assert.equal(security.kind, 'security');

  const procurement = answerBlocker('Procurement wants three quotes', { product: 'the product' });
  assert.equal(procurement.kind, 'procurement');

  const usage = answerBlocker('The buyer asked about a usage add-on', { product: 'the product' });
  assert.notEqual(usage.kind, 'adoption');
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
