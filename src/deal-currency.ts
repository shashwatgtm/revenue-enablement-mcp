/** Currency belongs to the supplied deal, never to a default locale. */
export const DEAL_CURRENCIES = ['INR','USD','GBP','EUR','SGD','AED'] as const;
export function dealCurrency(args: Record<string, unknown>): string | undefined {
  const explicit = typeof args.currency === 'string' ? args.currency.trim().toUpperCase() : '';
  if (explicit) return (DEAL_CURRENCIES as readonly string[]).includes(explicit) ? explicit : undefined;
  const text = ['deal_name','your_solution','economic_buyer','competitors','blockers','next_steps'].map(k => typeof args[k] === 'string' ? args[k] : '').join('; ').replace(/\\\$/g, '$');
  const found = new Set<string>();
  const signals: [string, RegExp][] = [
    ['INR', /₹|\b(?:INR|Rs\.?|rupees?|crores?|lakhs?)\b/i], ['GBP', /£|\bGBP\b/i], ['EUR', /€|\bEUR\b/i],
    ['SGD', /S\$|\bSGD\b/i], ['AED', /\bAED\b/i], ['USD', /\bUSD\b|US\$|(?<![A-Za-z])\$/i]
  ];
  for (const [code, pattern] of signals) if(pattern.test(text)) found.add(code);
  // Multiple currencies in a comparison do not identify the deal's currency.
  return found.size === 1 ? [...found][0] : undefined;
}
export function dealMoney(value: number, args: Record<string, unknown>): string {
  const currency = dealCurrency(args), amount = value.toLocaleString('en-US', {maximumFractionDigits: 20});
  if (!currency) return amount + ' (currency not supplied)';
  if (currency === 'INR') {
    const scale = Math.abs(value) >= 1e7 ? 1e7 : Math.abs(value) >= 1e5 ? 1e5 : 1;
    return '₹' + (value / scale).toLocaleString('en-IN', {maximumFractionDigits: 20}) + (scale === 1e7 ? ' crore' : scale === 1e5 ? ' lakh' : '');
  }
  return ({USD:'$',GBP:'£',EUR:'€',SGD:'S$',AED:'AED '} as Record<string,string>)[currency] + amount;
}
