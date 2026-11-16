import StatusPage from '../components/StatusPage';
import { useAuth } from '../hooks/useAuth';
import { homeFor } from '../types/auth';

/** S26 — 403 page for users without the role a screen requires. */
export default function Forbidden() {
  const { session } = useAuth();
  const home = session ? homeFor(session.organization.type) : '/';
  return (
    <StatusPage code="403" title="You don't have access to this page" to={home} action="Go to my home">
      Your role does not include this section. Ask your store or company owner.
    </StatusPage>
  );
}
