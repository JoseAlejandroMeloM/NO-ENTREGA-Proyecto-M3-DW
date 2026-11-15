import type { SelectHTMLAttributes } from 'react';

interface Props extends SelectHTMLAttributes<HTMLSelectElement> {
  label: string;
  name: string;
  options: { value: string; label: string }[];
  error?: string;
}

/** Labeled select with the same look and error handling as TextField. */
export default function SelectField({ label, name, options, error, ...select }: Props) {
  return (
    <label className="block">
      <span className="text-sm font-medium text-slate-700">{label}</span>
      <select
        id={name}
        name={name}
        aria-invalid={Boolean(error)}
        aria-describedby={error ? `${name}-error` : undefined}
        className={`mt-1 block w-full rounded-lg border bg-white px-3 py-2 text-sm outline-none focus:ring-2 focus:ring-primary/40 ${
          error ? 'border-red-500' : 'border-slate-300 focus:border-primary'
        }`}
        {...select}
      >
        {options.map((o) => (
          <option key={o.value} value={o.value}>
            {o.label}
          </option>
        ))}
      </select>
      {error && (
        <span id={`${name}-error`} className="mt-1 block text-xs text-red-600">
          {error}
        </span>
      )}
    </label>
  );
}
