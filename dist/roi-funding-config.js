"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
exports.MAX_REQUIRED_CUSTOMER_MULTIPLE = exports.MAX_PAYBACK_MONTHS = exports.CLASS_TABLE = exports.CLASS_NAMES = exports.BOOKING = exports.SHOW_COPY_INPUTS = exports.PAGE_SUBTITLE = exports.PAGE_HEADING = exports.PAGE_TITLE = exports.INDIA_FY_DEFAULT_START_MONTH = exports.PROOF_LINE = exports.SHOW_PROOF_LINE = exports.REFERENCE_LINE = exports.SHOW_BESSEMER_LINE = exports.GTM_FIX_RULE = exports.SHOW_GTM_FIX_RULE = exports.BOOTH_SPONSORSHIP_CLASS = exports.SMALL_TEST_MULTIPLE = exports.DEFAULT_LIMIT_MONTHS = void 0;
// Funding decisions approved for this release. The public tool contract stays unchanged.
exports.DEFAULT_LIMIT_MONTHS = 12; // Decision 3.
exports.SMALL_TEST_MULTIPLE = 2; // Decision 3.
exports.BOOTH_SPONSORSHIP_CLASS = 'direct'; // Decision 2.
exports.SHOW_GTM_FIX_RULE = true; // Decision 4.
exports.GTM_FIX_RULE = "Shashwat's working rule: a GTM fix takes 9 to 15 months to show in revenue.";
exports.SHOW_BESSEMER_LINE = true; // Decision 5. Cited source identity is allowed.
exports.REFERENCE_LINE = 'Bessemer Venture Partners set these targets in 2021 for payback on gross margin: under 12 months for SMB customers, under 18 for mid-market, under 24 for enterprise. No regional benchmark is shown here. https://www.bvp.com/atlas/scaling-to-100-million';
exports.SHOW_PROOF_LINE = true; // Decision 8. Published past engagement identity is allowed.
exports.PROOF_LINE = "Shashwat's own ABM result at Seclore: Rs 2.35 crore TCV in 6 months and 225+ sales meetings. https://gtmhelix.com/about/";
exports.INDIA_FY_DEFAULT_START_MONTH = 4; // Decision 9.
exports.PAGE_TITLE = 'Marketing ROI and Payback Check for B2B Teams | Helix GTM'; // Decision 11.
exports.PAGE_HEADING = 'Should you fund this marketing programme?';
exports.PAGE_SUBTITLE = 'Payback on your own numbers. CAC against ARR. Nothing made up.';
exports.SHOW_COPY_INPUTS = true; // Decision 12.
exports.BOOKING = 'https://calendly.com/shashwat-gtmhelix/45min';
exports.CLASS_NAMES = { enabler: 'a software or data purchase', brand: 'brand spend', other: 'GTM work with no direct revenue line', long: 'a long build', direct: 'a demand programme' };
// Decision 2. Ordered by least verdict. Each group also identifies the next action.
exports.CLASS_TABLE = [
    { kind: 'enabler', group: 'purchase', pattern: /\b(?:software|platforms?|tools?|licen[cs]es?|subscriptions?|seats|SaaS|data provider|databases?|automation|technology|stack|suite|analytics|attribution|apps?|vendors?)\b/gi },
    { kind: 'enabler', group: 'martech', pattern: /\b(?:martech|CRM|CDP|customer data platforms?|web(?:site)? personali[sz]ation|marketing (?:automation|technology|stack|cloud|operations|analytics|attribution)|ad tech|advertising technology|email platforms?|webinar platforms?|event apps?|partner (?:portal|management))\b/gi },
    { kind: 'enabler', group: 'data', pattern: /\b(?:sales engagement|sales enablement|dial[l]?ers?|intent data|buyer intent|(?:contact|lead|account|B2B|firmographic|technographic) data|(?:data|lead) enrichment|(?:revenue|conversation|sales) intelligence|lead (?:scoring|routing|management))\b/gi },
    { kind: 'brand', group: 'sponsorship', pattern: /\b(?:sponsorships?|sponsoring|sponsored (?:content|posts?|events?|sessions?))\b/gi },
    { kind: 'brand', group: 'relations', pattern: /\b(?:analyst (?:relations|briefings?|days?|firms?)|public relations|media relations|press|earned media|communications|thought leadership|AR\/PR|PR\/AR|PR (?:agency|agencies|firm|campaign|programme|program|retainer|outreach|coverage|push|plan|strategy|launch|team))\b/gi },
    { kind: 'brand', group: 'audience', pattern: /\b(?:podcasts?|newsletters?|social media|influencers?)\b/gi },
    { kind: 'brand', group: 'brand', pattern: /\b(?:out[- ]of[- ]home|OOH|billboards?|brand (?:awareness|campaigns?|building|refresh|positioning|programmes?|programs?|study|tracking|strategy|identity|design|lift|spend|reputation)|rebrand(?:ing)?|branding)\b/gi },
    { kind: 'other', group: 'advice', pattern: /\b(?:go[- ]to[- ]market|GTM|fractional CMO|CMO (?:services|advisory)|(?:positioning|messaging) (?:workshops?|projects?|frameworks?|programmes?|programs?))\b/gi },
    { kind: 'other', group: 'web', pattern: /\b(?:landing pages?|website (?:redesign|revamp|rebuild|refresh|relaunch)|product launch(?:es)?|launch campaigns?)\b/gi },
    { kind: 'long', group: 'content', pattern: /\bcontent (?:marketing|programmes?|programs?|strategy|production|agenc(?:y|ies)|studio|hub|calendar|creation|writing|series|engine|assets?|campaigns?|distribution|amplification)\b/gi },
    { kind: 'long', group: 'search', pattern: /\b(?:SEO|AEO|search engine optimi[sz]ation|answer engine optimi[sz]ation|generative engine optimi[sz]ation|AI search|AI visibility|LLM visibility|organic search|search visibility|search rankings?)\b/gi },
    { kind: 'long', group: 'search', pattern: /\bGEO\b/g },
    { kind: 'long', group: 'partner', pattern: /\b(?:partnerships?|partner (?:programmes?|programs?|marketing|ecosystem|recruitment|enablement)|channel (?:programmes?|programs?|partners?|marketing|sales|incentives?)|resellers?|co[- ]?marketing|co[- ]?sell(?:ing)?|affiliate|alliances?|referral (?:programmes?|programs?)|ecosystem (?:programmes?|programs?|partners?))\b/gi },
    { kind: 'direct', group: 'marketing', pattern: /\b(?:marketing|demand[- ]gen(?:eration)?|lead[- ]gen(?:eration)?|pipeline generation|email (?:campaigns?|nurture|nurturing)|nurture (?:programmes?|programs?|campaigns?|streams?|journeys?))\b/gi },
    { kind: 'direct', group: 'abm', pattern: /\b(?:ABM|ABX|account[- ]based (?:marketing|selling|advertising|engagement|experience|programmes?|programs?))\b/gi },
    { kind: 'direct', group: 'events', pattern: /\b(?:events?|trade[- ]?shows?|exhibitions?|expos?|conferences?|summits?|roundtables?|webinars?|booths?)\b/gi },
    { kind: 'direct', group: 'media', pattern: /\b(?:paid (?:media|search|social|ads|advertising|campaigns?|acquisition|(?:LinkedIn|Google|Meta)(?: (?:programmes?|programs?|campaigns?|ads))?)|social (?:media )?ads|(?:LinkedIn|Google|Meta) (?:ads|campaigns?)|sponsored posts bought as ads|media (?:spends?|buying|budgets?|plans?|mix|campaigns?)|ad ?spends?|advertising|adverts?|ads|PPC|pay[- ]per[- ]click|programmatic|retargeting|content syndication)\b/gi },
    { kind: 'direct', group: 'outbound', pattern: /\b(?:outbound|cold (?:email|emailing|calling|outreach)|SDRs?|BDRs?|sales development|appointment setting|prospecting)\b/gi },
];
// Implausible input safety limits. These are tool rules, never market benchmarks.
exports.MAX_PAYBACK_MONTHS = 120;
exports.MAX_REQUIRED_CUSTOMER_MULTIPLE = 100;
//# sourceMappingURL=roi-funding-config.js.map