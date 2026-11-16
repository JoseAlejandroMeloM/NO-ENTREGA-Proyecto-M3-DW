import type { ReactNode } from 'react';
import ButtonLink from './ButtonLink';
import Logo from './Logo';

interface Props {
  code: string;
  title: string;
  children: ReactNode;
  to: string;
  action: string;
}

/** Full-page message for 403 and 404 (S26): what happened and one way out. */
export default function StatusPage({ code, title, children, to, action }: Props) {
  return (
    <main className="grid min-h-dvh place-items-center px-4 py-16">
      <div className="max-w-md text-center">
        <Logo />
        <p className="mt-10 font-display text-7xl leading-none font-semibold tracking-tight text-primary tabular-nums">{code}</p>
        <h1 className="mt-4 text-2xl font-semibold">{title}</h1>
        <p className="mt-2 text-slate-600">{children}</p>
        <ButtonLink to={to} size="lg" className="mt-8">
          {action}
        </ButtonLink>
      </div>
    </main>
  );
}
