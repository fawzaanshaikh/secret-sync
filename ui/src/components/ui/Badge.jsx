const TONES = {
  neutral: 'bg-bg-hover text-text-dim border-border-strong',
  accent: 'bg-accent-bg text-accent border-accent-border',
  danger: 'bg-danger-bg text-danger border-danger-border',
  warning: 'bg-warning-bg text-warning border-warning/40',
  info: 'bg-info-bg text-info border-info/40',
};

export default function Badge({ tone = 'neutral', className = '', children }) {
  return (
    <span
      className={`inline-flex items-center gap-1 rounded-full border px-2 py-0.5 text-[11px] font-medium uppercase tracking-wide ${TONES[tone]} ${className}`}
    >
      {children}
    </span>
  );
}

const ROLE_TONES = {
  admin: 'accent',
  editor: 'info',
  viewer: 'neutral',
};

export function RoleBadge({ role }) {
  return <Badge tone={ROLE_TONES[role] ?? 'neutral'}>{role}</Badge>;
}
