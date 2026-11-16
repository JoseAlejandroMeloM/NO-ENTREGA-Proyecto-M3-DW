import { useState } from 'react';
import { ApiError, patch } from '../../api/client';
import Button from '../../components/Button';
import FormAlert from '../../components/FormAlert';
import EmployeeForm from '../../components/team/EmployeeForm';
import TeamTable from '../../components/team/TeamTable';
import { useApi } from '../../hooks/useApi';
import { useAuth } from '../../hooks/useAuth';
import type { User } from '../../types/auth';
import PageHeader from '../../components/PageHeader';
import LoadingState from '../../components/LoadingState';

/** S18 Store team / S24 Distributor team (US-04). */
export default function TeamPage() {
  const { session } = useAuth();
  const { data, error, loading, reload } = useApi<{ data: User[] }>('/users');
  const [creating, setCreating] = useState(false);
  const [busyId, setBusyId] = useState<string | null>(null);
  const [actionError, setActionError] = useState<string | null>(null);
  if (!session) return null;

  const toggle = async (user: User) => {
    setBusyId(user.id);
    setActionError(null);
    try {
      await patch(`/users/${user.id}`, { active: !user.active });
      reload();
    } catch (err) {
      setActionError(err instanceof ApiError ? err.message : 'Could not update the employee');
    } finally {
      setBusyId(null);
    }
  };

  return (
    <section className="space-y-4">
      <PageHeader
        title="Team"
        subtitle="Each employee signs in with their own account and role."
        actions={
          !creating && <Button onClick={() => setCreating(true)}>Add employee</Button>
        }
      />
      {creating && (
        <EmployeeForm
          orgType={session.organization.type}
          onCancel={() => setCreating(false)}
          onCreated={() => (setCreating(false), reload())}
        />
      )}
      <FormAlert message={error ?? actionError} />
      {loading && !data ? (
        <LoadingState label="Loading team…" />
      ) : (
        <TeamTable users={data?.data ?? []} currentUserId={session.user.id} busyId={busyId} onToggle={toggle} />
      )}
    </section>
  );
}
