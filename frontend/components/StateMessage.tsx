export function LoadingState({ label = "Loading…" }: { label?: string }) {
  return <div className="alert alert-secondary">{label}</div>;
}

export function EmptyState({ label }: { label: string }) {
  return <div className="alert alert-light border">{label}</div>;
}

export function ErrorState({ message }: { message: string }) {
  return <div className="alert alert-danger">{message}</div>;
}
