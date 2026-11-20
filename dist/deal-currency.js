"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
exports.DEAL_CURRENCIES = void 0;
exports.dealCurrency = dealCurrency;
exports.dealMoney = dealMoney;
/** Currency belongs to the supplied deal, never to a default locale. */
exports.DEAL_CURRENCIES = ['INR', 'USD', 'GBP', 'EUR', 'SGD', 'AED'];
function dealCurrency(args) {
    const explicit = typeof args.currency === 'string' ? args.currency.trim().toUpperCase() : '';
    if (explicit)
        return exports.DEAL_CURRENCIES.includes(explicit) ? explicit : undefined;
    const text = ['deal_name', 'your_solution', 'economic_buyer', 'competitors', 'blockers', 'next_steps'].map(k => typeof args[k] === 'string' ? args[k] : '').join('; ').replace(/\\\$/g, '$');
    const found = new Set();
    const signals = [
        ['INR', /₹|\b(?:INR|Rs\.?|rupees?|crores?|lakhs?)\b/i], ['GBP', /£|\bGBP\b/i], ['EUR', /€|\bEUR\b/i],
        ['SGD', /(?<![A-Za-z])S\$|\bSGD\b/i], ['AED', /\bAED\b/i], ['USD', /\bUSD\b|US\$|(?<![A-Za-z])\$/i]
    ];
    for (const [code, pattern] of signals)
        if (pattern.test(text))
            found.add(code);
    // Multiple currencies in a comparison do not identify the deal's currency.
    return found.size === 1 ? [...found][0] : undefined;
}
function dealMoney(value, args) {
    const currency = dealCurrency(args);
    const format = (n, locale = 'en-US', scaled = false) => n.toLocaleString(locale, { minimumFractionDigits: scaled || Number.isInteger(n) ? 0 : 2, maximumFractionDigits: 2 });
    const tiny = value > 0 && value < 0.005;
    if (!currency)
        return (tiny ? 'under 0.01' : format(value)) + ' (currency not supplied)';
    if (currency === 'INR') {
        if (tiny)
            return 'under ₹0.01';
        const scale = Math.abs(value) >= 1e7 ? 1e7 : Math.abs(value) >= 1e5 ? 1e5 : 1;
        return '₹' + format(value / scale, 'en-IN', scale !== 1) + (scale === 1e7 ? ' crore' : scale === 1e5 ? ' lakh' : '');
    }
    const symbol = { USD: '$', GBP: '£', EUR: '€', SGD: 'S$', AED: 'AED ' }[currency];
    return tiny ? 'under ' + symbol + '0.01' : symbol + format(value);
}
//# sourceMappingURL=deal-currency.js.map