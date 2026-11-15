export interface FieldSpec {
  name: string;
  label: string;
  type?: string;
  autoComplete?: string;
  hint?: string;
  inputMode?: 'numeric' | 'email' | 'tel' | 'text';
}

/** Owner fields shared by both registration forms (US-01 AC1, US-02 AC1). */
export const OWNER_FIELDS: FieldSpec[] = [
  { name: 'name', label: 'Your full name', autoComplete: 'name' },
  { name: 'email', label: 'Email', type: 'email', autoComplete: 'email', inputMode: 'email' },
  {
    name: 'password',
    label: 'Password',
    type: 'password',
    autoComplete: 'new-password',
    hint: 'At least 8 characters, with letters and numbers.',
  },
];
