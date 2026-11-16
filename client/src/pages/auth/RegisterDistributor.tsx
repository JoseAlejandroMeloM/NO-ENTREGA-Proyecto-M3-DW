import { Link, useNavigate } from 'react-router-dom';
import Button from '../../components/Button';
import FieldList from '../../components/FieldList';
import { OWNER_FIELDS, type FieldSpec } from '../../components/fields';
import FormAlert from '../../components/FormAlert';
import { useAuth } from '../../hooks/useAuth';
import { nest, useForm } from '../../hooks/useForm';
import AuthLayout from '../../layouts/AuthLayout';
import RegisterSwitch from '../../components/auth/RegisterSwitch';

const D = 'distributor';
const COMPANY_FIELDS: FieldSpec[] = [
  { name: `${D}.name`, label: 'Company name', autoComplete: 'organization' },
  { name: `${D}.nit`, label: 'NIT', hint: 'Example: 900123456-7' },
  { name: `${D}.phone`, label: 'Phone', type: 'tel', inputMode: 'tel' },
  { name: `${D}.coverageArea`, label: 'Coverage area', hint: 'Example: Chía, Cajicá, Bogotá norte' },
  { name: `${D}.deliveryDays`, label: 'Delivery time (days)', type: 'number', inputMode: 'numeric' },
  { name: `${D}.minimumOrder`, label: 'Minimum order (COP)', type: 'number', inputMode: 'numeric' },
];

const INITIAL: Record<string, string> = { name: '', email: '', password: '' };
COMPANY_FIELDS.forEach((f) => (INITIAL[f.name] = ''));

const toNumberOrRaw = (v: string) => (v.trim() !== '' && !Number.isNaN(Number(v)) ? Number(v) : v);

/** S04 Register distributor (US-02). */
export default function RegisterDistributor() {
  const { register } = useAuth();
  const navigate = useNavigate();
  const form = useForm(INITIAL, async (values) => {
    const body = {
      ...values,
      [`${D}.deliveryDays`]: toNumberOrRaw(values[`${D}.deliveryDays`]),
      [`${D}.minimumOrder`]: toNumberOrRaw(values[`${D}.minimumOrder`]),
    };
    await register('distributor', nest(body));
    navigate('/dist', { replace: true });
  });

  return (
    <AuthLayout
      wide
      top={<RegisterSwitch />}
      title="Register your distribution company"
      subtitle="Stores will find you, compare you and send you orders."
      footer={<>Already have an account? <Link className="font-medium text-primary" to="/login">Log in</Link></>}
    >
      <form onSubmit={form.handleSubmit} className="space-y-6" noValidate>
        <FormAlert message={form.formError} />
        <fieldset className="grid gap-4 sm:grid-cols-2">
          <legend className="mb-3 text-sm font-semibold text-slate-900">You</legend>
          <FieldList fields={OWNER_FIELDS} values={form.values} errors={form.errors} onChange={form.onChange} />
        </fieldset>
        <fieldset className="grid gap-4 sm:grid-cols-2">
          <legend className="mb-3 text-sm font-semibold text-slate-900">Company</legend>
          <FieldList fields={COMPANY_FIELDS} values={form.values} errors={form.errors} onChange={form.onChange} />
        </fieldset>
        <Button type="submit" size="lg" loading={form.submitting} className="w-full">
          Create company
        </Button>
      </form>
    </AuthLayout>
  );
}
