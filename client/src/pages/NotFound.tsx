import StatusPage from '../components/StatusPage';

/** S26 — friendly 404. */
export default function NotFound() {
  return (
    <StatusPage code="404" title="Page not found" to="/" action="Back to home">
      The page you are looking for does not exist or was moved.
    </StatusPage>
  );
}
