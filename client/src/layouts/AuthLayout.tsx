import type { ReactNode } from 'react';
import { Link } from 'react-router-dom';
import Logo from '../components/Logo';

interface Props {
  title: string;
  subtitle?: string;
  children: ReactNode;
  footer?: ReactNode;
}

/** Login and registration screens (S02–S04): brand panel on the left from 1024 px up, the form on the right. */
export default function AuthLayout({ title, subtitle, children, footer }: Props) {
  return (
    <div className="grid min-h-dvh lg:grid-cols-[minmax(0,5fr)_minmax(0,6fr)]">
      <aside className="relative hidden overflow-hidden bg-primary-deep p-12 text-white lg:flex lg:flex-col lg:justify-between">
        <Link to="/" className="self-start focus-visible:outline-accent">
          <Logo onDark />
        </Link>
        <div className="max-w-md">
          <p className="font-display text-4xl leading-[1.1] font-semibold tracking-tight text-balance">
            Sales, stock and suppliers for your tienda, in one place.
          </p>
          <p className="mt-4 text-primary-soft/85">
            Sell at the counter with cash, card or Nequi, see what to restock and order from your distributors.
          </p>
        </div>
        {/* The logo's two circles, oversized and quiet. */}
        <svg viewBox="0 0 440 320" className="pointer-events-none absolute -top-28 -right-36 w-[30rem]" aria-hidden="true">
          <circle cx="150" cy="160" r="140" className="fill-none stroke-primary-soft/20" strokeWidth="1.5" />
          <circle cx="290" cy="160" r="140" className="fill-none stroke-accent/45" strokeWidth="1.5" />
          <path d="M220 38.76a140 140 0 0 1 0 242.48 140 140 0 0 1 0-242.48Z" className="fill-accent/10" />
        </svg>
      </aside>

      <main className="flex items-center justify-center px-4 py-10 sm:px-8">
        <div className="w-full max-w-md">
          <Link to="/" className="inline-block lg:hidden">
            <Logo />
          </Link>
          <h1 className="mt-8 text-3xl font-semibold lg:mt-0">{title}</h1>
          {subtitle && <p className="mt-2 text-slate-600">{subtitle}</p>}
          <div className="mt-8">{children}</div>
          {footer && <div className="mt-6 text-sm text-slate-600">{footer}</div>}
        </div>
      </main>
    </div>
  );
}
