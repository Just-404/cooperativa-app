export default function EmptyState({ children, error = false }) {
  return (
    <p
      className={`dashboard-empty-state${error ? ' is-error' : ''}`}
      role={error ? 'alert' : 'status'}
    >
      {children}
    </p>
  );
}
