const VARIANTS = {
  primary:
    'bg-accent text-bg hover:bg-accent-dim disabled:bg-accent/40 disabled:text-bg/70',
  secondary:
    'bg-bg-hover text-text-bright border border-border-strong hover:border-accent-border hover:text-accent disabled:opacity-50',
  ghost:
    'text-text-dim hover:text-text-bright hover:bg-bg-hover disabled:opacity-50',
  danger:
    'bg-transparent border border-danger-border text-danger hover:bg-danger-bg disabled:opacity-50',
};

const SIZES = {
  sm: 'px-2.5 py-1 text-xs',
  md: 'px-3.5 py-2 text-sm',
};

export default function Button({
  variant = 'primary',
  size = 'md',
  className = '',
  children,
  ...props
}) {
  return (
    <button
      className={`inline-flex items-center justify-center gap-1.5 rounded-md font-medium tracking-tight transition-colors disabled:cursor-not-allowed cursor-pointer ${VARIANTS[variant]} ${SIZES[size]} ${className}`}
      {...props}
    >
      {children}
    </button>
  );
}
