export type ButtonVariant = 'primary' | 'secondary' | 'danger' | 'ghost' | 'inverse';
export type ButtonSize = 'sm' | 'md' | 'lg';

const BASE =
  'inline-flex items-center justify-center gap-2 rounded-lg font-medium whitespace-nowrap ' +
  'transition-[background-color,border-color,color,scale] active:scale-[0.97] ' +
  'disabled:cursor-not-allowed disabled:opacity-55 disabled:active:scale-100';

const VARIANTS: Record<ButtonVariant, string> = {
  primary: 'bg-primary text-white shadow-sm hover:bg-primary-dark',
  secondary: 'border border-slate-300 bg-surface text-slate-800 shadow-xs hover:border-slate-400 hover:bg-slate-50',
  danger: 'bg-[#dc2626] text-white shadow-sm hover:bg-[#b91c1c]',
  ghost: 'text-primary-dark hover:bg-primary-soft',
  // Outline button for deep-teal surfaces (landing, auth panel).
  inverse: 'border border-white/35 text-white hover:bg-white/10 focus-visible:outline-accent',
};

// md grows to 44 px on touch screens; lg is for the POS and other big tap targets.
const SIZES: Record<ButtonSize, string> = {
  sm: 'h-8 px-3 text-sm',
  md: 'h-10 px-4 text-sm pointer-coarse:h-11',
  lg: 'h-12 px-5 text-base',
};

/** Classes shared by Button (a <button>) and ButtonLink (a router <Link>). */
export function buttonClass(variant: ButtonVariant = 'primary', size: ButtonSize = 'md', extra = '') {
  return `${BASE} ${VARIANTS[variant]} ${SIZES[size]} ${extra}`;
}
