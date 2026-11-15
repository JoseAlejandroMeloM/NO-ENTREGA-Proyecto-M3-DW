import type { ChangeEvent } from 'react';
import type { FieldSpec } from './fields';
import TextField from './TextField';


interface Props {
  fields: FieldSpec[];
  values: Record<string, string>;
  errors: Record<string, string>;
  onChange: (e: ChangeEvent<HTMLInputElement>) => void;
}

/** Renders a list of text fields from a config array, wiring values and API errors by name. */
export default function FieldList({ fields, values, errors, onChange }: Props) {
  return (
    <>
      {fields.map((f) => (
        <TextField
          key={f.name}
          {...f}
          required
          value={values[f.name] ?? ''}
          error={errors[f.name]}
          onChange={onChange}
        />
      ))}
    </>
  );
}
