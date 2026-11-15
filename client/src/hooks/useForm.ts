import { useState, type ChangeEvent, type FormEvent } from 'react';
import { ApiError } from '../api/client';

/**
 * Form state + submit handling. Field names may be dotted ("store.phone") so they
 * match the `path` of API validation errors and nested request bodies.
 */
export function useForm<T extends Record<string, string>>(initial: T, onSubmit: (values: T) => Promise<unknown>) {
  const [values, setValues] = useState(initial);
  const [errors, setErrors] = useState<Record<string, string>>({});
  const [formError, setFormError] = useState<string | null>(null);
  const [submitting, setSubmitting] = useState(false);

  const onChange = (e: ChangeEvent<HTMLInputElement>) => setValues((v) => ({ ...v, [e.target.name]: e.target.value }));

  const handleSubmit = async (e: FormEvent) => {
    e.preventDefault();
    setSubmitting(true);
    setErrors({});
    setFormError(null);
    try {
      await onSubmit(values);
    } catch (err) {
      if (err instanceof ApiError) {
        setErrors(err.fieldErrors());
        setFormError(err.details.length ? 'Please fix the highlighted fields.' : err.message);
      } else {
        setFormError('Could not reach the server. Check your connection.');
      }
    } finally {
      setSubmitting(false);
    }
  };

  return { values, errors, formError, submitting, onChange, handleSubmit };
}

/** Turns { "store.phone": "1" } into { store: { phone: "1" } }. */
export function nest(flat: Record<string, unknown>) {
  const out: Record<string, unknown> = {};
  for (const [key, value] of Object.entries(flat)) {
    const parts = key.split('.');
    let node = out;
    parts.slice(0, -1).forEach((p) => (node = (node[p] ??= {}) as Record<string, unknown>));
    node[parts[parts.length - 1]] = value;
  }
  return out;
}
