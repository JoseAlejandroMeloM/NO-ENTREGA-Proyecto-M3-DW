import { Link, useLocation, useNavigate } from 'react-router-dom';
import Button from '../../components/Button';
import FieldList from '../../components/FieldList';
import type { FieldSpec } from '../../components/fields';
import FormAlert from '../../components/FormAlert';
import { useAuth } from '../../hooks/useAuth';
import { useForm } from '../../hooks/useForm';
import AuthLayout from '../../layouts/AuthLayout';
import { homeFor } from '../../types/auth';

const FIELDS: FieldSpec[] = [
  { name: 'email', label: 'Email', type: 'email', autoComplete: 'email', inputMode: 'email' },
  { name: 'password', label: 'Password', type: 'password', autoComplete: 'current-password' },
];

/** S02 Login (US-03). */
export default function Login() {
  const { login } = useAuth();
  const navigate = useNavigate();
  const location = useLocation();
  const from = (location.state as { from?: string } | null)?.from;
  const expired = new URLSearchParams(location.search).has('expired');

  const form = useForm({ email: '', password: '' }, async ({ email, password }) => {
    const session = await login(email, password);
    // `from` may belong to the previous user (e.g. a store page after logout); only reuse it inside this user's area.
    const home = homeFor(session.organization.type);
    const allowed = from && (from.startsWith(home) || from === '/notifications');
    navigate(allowed ? from : home, { replace: true });
  });

  return (
    <AuthLayout
      title="Log in"
      subtitle={expired ? 'Your session expired. Please log in again.' : 'Welcome back to Conecta Negocio.'}
      footer={
        <>
          New here? <Link className="font-medium text-primary" to="/register/store">Register a store</Link> or{' '}
          <Link className="font-medium text-primary" to="/register/distributor">a distributor</Link>
        </>
      }
    >
      <form onSubmit={form.handleSubmit} className="space-y-4" noValidate>
        <FormAlert message={form.formError} />
        <FieldList fields={FIELDS} values={form.values} errors={form.errors} onChange={form.onChange} />
        <Button type="submit" size="lg" loading={form.submitting} className="w-full">
          Log in
        </Button>
      </form>
    </AuthLayout>
  );
}
