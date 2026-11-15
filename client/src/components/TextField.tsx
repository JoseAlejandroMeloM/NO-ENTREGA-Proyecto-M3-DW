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
        className="field mt-1.5 block w-full"
        {...input}
      />
      {error && (
        <span id={`${name}-error`} className="mt-1.5 block text-xs font-medium text-red-700">
          {error}
        </span>
      )}
      {!error && hint && (
        <span id={`${name}-hint`} className="mt-1.5 block text-xs text-slate-600">
          {hint}
        </span>
      )}
    </label>
  );
}
