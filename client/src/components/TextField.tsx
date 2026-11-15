import type { InputHTMLAttributes } from 'react';

interface Props extends InputHTMLAttributes<HTMLInputElement> {
  label: string;
  name: string;
  error?: string;
  hint?: string;
}

/** Labeled input with an inline error message (Figma "Input" component). */
export default function TextField({ label, name, error, hint, ...input }: Props) {
  const describedBy = error ? `${name}-error` : hint ? `${name}-hint` : undefined;
  return (
    <label className="block">
      <span className="text-sm font-medium text-slate-700">{label}</span>
      <input
        id={name}
        name={name}
        aria-invalid={Boolean(error)}
        aria-describedby={describedBy}
        className={`mt-1 block w-full rounded-lg border bg-white px-3 py-2 text-sm outline-none focus:ring-2 focus:ring-primary/40 ${
          error ? 'border-red-500' : 'border-slate-300 focus:border-primary'
        }`}
        {...input}
      />
      {error && (
        <span id={`${name}-error`} className="mt-1 block text-xs text-red-600">
          {error}
        </span>
      )}
      {!error && hint && (
        <span id={`${name}-hint`} className="mt-1 block text-xs text-slate-500">
          {hint}
        </span>
      )}
    </label>
  );
}
