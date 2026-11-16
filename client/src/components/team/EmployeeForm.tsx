import { post } from '../../api/client';
import { useForm } from '../../hooks/useForm';
import type { OrgType, Role } from '../../types/auth';
import { ROLE_LABEL } from '../../layouts/nav';
import Button from '../Button';
import FieldList from '../FieldList';
import { OWNER_FIELDS } from '../fields';
import FormAlert from '../FormAlert';

const ROLES_BY_ORG: Record<OrgType, Role[]> = {
  store: ['store_cashier', 'store_inventory'],
  distributor: ['distributor_staff'],
};

const FIELDS = OWNER_FIELDS.map((f) => (f.name === 'name' ? { ...f, label: 'Full name' } : f));

interface Props {
  orgType: OrgType;
  onCreated: () => void;
  onCancel: () => void;
}

/** "Create employee" form on S18 / S24 (US-04 AC1). */
export default function EmployeeForm({ orgType, onCreated, onCancel }: Props) {
  const roles = ROLES_BY_ORG[orgType];
  const form = useForm({ name: '', email: '', password: '', role: roles[0] }, async (values) => {
    await post('/users', values);
    onCreated();
  });

  return (
    <form onSubmit={form.handleSubmit} noValidate className="appear space-y-4 card p-5">
      <h2 className="font-semibold">New employee</h2>
      <FormAlert message={form.formError} />
      <FieldList fields={FIELDS} values={form.values} errors={form.errors} onChange={form.onChange} />
      <fieldset>
        <legend className="text-sm font-medium text-slate-700">Role</legend>
        <div className="mt-2 flex flex-wrap gap-3">
          {roles.map((role) => (
            <label key={role} className="flex items-center gap-2 text-sm">
              <input type="radio" name="role" value={role} checked={form.values.role === role} onChange={form.onChange} />
              {ROLE_LABEL[role]}
            </label>
          ))}
        </div>
        {form.errors.role && <p className="mt-1 text-xs text-red-600">{form.errors.role}</p>}
      </fieldset>
      <div className="flex gap-2">
        <Button type="submit" loading={form.submitting}>Create account</Button>
        <Button type="button" variant="ghost" onClick={onCancel}>Cancel</Button>
      </div>
    </form>
  );
}
