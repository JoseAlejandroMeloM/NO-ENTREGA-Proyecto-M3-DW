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
        className="field mt-1.5 block w-full"
        {...select}
      >
        {options.map((o) => (
          <option key={o.value} value={o.value}>
            {o.label}
          </option>
        ))}
      </select>
      {error && (
        <span id={`${name}-error`} className="mt-1.5 block text-xs font-medium text-red-700">
          {error}
        </span>
      )}
    </label>
  );
}
