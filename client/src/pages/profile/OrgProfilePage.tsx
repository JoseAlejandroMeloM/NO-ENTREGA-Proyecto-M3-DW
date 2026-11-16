import FormAlert from '../../components/FormAlert';
import ProfileForm from '../../components/ProfileForm';
import type { FieldSpec } from '../../components/fields';
import { useApi } from '../../hooks/useApi';
import LoadingState from '../../components/LoadingState';

const STORE_FIELDS: FieldSpec[] = [
  { name: 'name', label: 'Store name' },
  { name: 'address', label: 'Address' },
  { name: 'phone', label: 'Phone', type: 'tel', inputMode: 'tel' },
];

const DISTRIBUTOR_FIELDS: FieldSpec[] = [
  { name: 'name', label: 'Company name' },
  { name: 'nit', label: 'NIT' },
  { name: 'phone', label: 'Phone', type: 'tel', inputMode: 'tel' },
  { name: 'coverageArea', label: 'Coverage area' },
  { name: 'deliveryDays', label: 'Delivery time (days)', type: 'number', inputMode: 'numeric' },
  { name: 'minimumOrder', label: 'Minimum order (COP)', type: 'number', inputMode: 'numeric' },
];

const CONFIG = {
  store: { path: '/stores/me', title: 'Store profile', fields: STORE_FIELDS },
  distributor: { path: '/distributors/me', title: 'Company profile', fields: DISTRIBUTOR_FIELDS },
};

/** Store profile and S23 Company profile (owner only). */
export default function OrgProfilePage({ type }: { type: 'store' | 'distributor' }) {
  const { path, title, fields } = CONFIG[type];
  const { data, error } = useApi<Record<string, unknown>>(path);
  const initial = data ? Object.fromEntries(fields.map((f) => [f.name, String(data[f.name] ?? '')])) : null;

  return (
    <section className="space-y-4">
      <h1 className="text-2xl font-semibold">{title}</h1>
      <FormAlert message={error} />
      {initial ? (
        <ProfileForm path={path} fields={fields} initial={initial} numeric={['deliveryDays', 'minimumOrder']} />
      ) : (
        !error && <LoadingState />
      )}
    </section>
  );
}
