import { useRef, useState } from 'react';
import { patch } from '../api/client';
import { useForm } from '../hooks/useForm';
import Button from './Button';
import FieldList from './FieldList';
import type { FieldSpec } from './fields';
import FormAlert from './FormAlert';

interface Props {
  path: string;
  fields: FieldSpec[];
  initial: Record<string, string>;
  numeric?: string[];
}

/** Edit form for an organization profile; sends only the fields that changed. */
export default function ProfileForm({ path, fields, initial, numeric = [] }: Props) {
  const [saved, setSaved] = useState(false);
  const baseline = useRef(initial); // last saved values, to send only what changed
  const form = useForm(initial, async (values) => {
    setSaved(false);
    const changes = Object.fromEntries(
      Object.entries(values)
        .filter(([k, v]) => v !== baseline.current[k])
        .map(([k, v]) => [k, numeric.includes(k) && v.trim() !== '' ? Number(v) : v]),
    );
    if (Object.keys(changes).length === 0) return setSaved(true);
    await patch(path, changes);
    baseline.current = values;
    setSaved(true);
  });

  return (
    <form onSubmit={form.handleSubmit} noValidate className="max-w-lg space-y-4 card p-5">
      <FormAlert message={form.formError} />
      {saved && <p className="rounded-lg bg-green-50 px-3 py-2 text-sm text-green-800">Changes saved.</p>}
      <FieldList fields={fields} values={form.values} errors={form.errors} onChange={form.onChange} />
      <Button type="submit" loading={form.submitting}>Save changes</Button>
    </form>
  );
}
