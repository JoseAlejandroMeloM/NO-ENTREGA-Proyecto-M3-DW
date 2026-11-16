import { Link, useNavigate } from 'react-router-dom';
import Button from '../../components/Button';
import FieldList from '../../components/FieldList';
import { OWNER_FIELDS, type FieldSpec } from '../../components/fields';
import FormAlert from '../../components/FormAlert';
import { useAuth } from '../../hooks/useAuth';
import { nest, useForm } from '../../hooks/useForm';
import AuthLayout from '../../layouts/AuthLayout';
import RegisterSwitch from '../../components/auth/RegisterSwitch';

const STORE_FIELDS: FieldSpec[] = [
  { name: 'store.name', label: 'Store name', autoComplete: 'organization' },
  { name: 'store.address', label: 'Address', autoComplete: 'street-address' },
  { name: 'store.phone', label: 'Phone', type: 'tel', inputMode: 'tel', hint: 'Digits only, 7 to 15.' },
];

const INITIAL = { name: '', email: '', password: '', 'store.name': '', 'store.address': '', 'store.phone': '' };

/** S03 Register store (US-01). */
export default function RegisterStore() {
  const { register } = useAuth();
  const navigate = useNavigate();
  const form = useForm(INITIAL, async (values) => {
    await register('store', nest(values));
    navigate('/app', { replace: true });
  });

  return (
    <AuthLayout
      wide
      top={<RegisterSwitch />}
      title="Register your store"
      subtitle="You will be the store owner and can add your employees later."
      footer={<>Already have an account? <Link className="font-medium text-primary" to="/login">Log in</Link></>}
    >
      <form onSubmit={form.handleSubmit} className="space-y-6" noValidate>
        <FormAlert message={form.formError} />
        <fieldset className="grid gap-4 sm:grid-cols-2">
          <legend className="mb-3 text-sm font-semibold text-slate-900">You</legend>
          <FieldList fields={OWNER_FIELDS} values={form.values} errors={form.errors} onChange={form.onChange} />
        </fieldset>
        <fieldset className="grid gap-4 sm:grid-cols-2">
          <legend className="mb-3 text-sm font-semibold text-slate-900">Store</legend>
          <FieldList fields={STORE_FIELDS} values={form.values} errors={form.errors} onChange={form.onChange} />
        </fieldset>
        <Button type="submit" size="lg" loading={form.submitting} className="w-full">
          Create store
        </Button>
      </form>
    </AuthLayout>
  );
}
