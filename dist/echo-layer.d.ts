type Args = Record<string, unknown>;
type StakeholderKind = 'risk' | 'procurement' | 'finance' | 'legal' | 'it' | 'ops' | 'exec' | 'revenue' | 'other';
export declare function stakeholderKind(t: string): StakeholderKind;
type PersonaKind = 'owner' | 'operator' | 'finance' | 'tech' | 'sales' | 'other';
export declare function personaKind(t: string): PersonaKind;
export declare function applyEcho(name: string, args: Args, out: string): string;
export {};
//# sourceMappingURL=echo-layer.d.ts.map