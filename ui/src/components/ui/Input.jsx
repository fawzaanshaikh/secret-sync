export default function Input({ label, error, className = '', id, mono = false, ...props }) {
  const inputId = id ?? props.name;
  return (
    <label className="flex flex-col gap-1.5" htmlFor={inputId}>
      {label && (
        <span className="text-xs font-medium text-text-dim">{label}</span>
      )}
      <input
        id={inputId}
        className={`rounded-md border bg-bg px-3 py-2 text-sm text-text-bright placeholder:text-text-dim/60 outline-none transition-colors focus:border-accent-border focus:ring-1 focus:ring-accent-border ${
          mono ? 'font-mono' : 'font-sans'
        } ${error ? 'border-danger-border' : 'border-border-strong'} ${className}`}
        {...props}
      />
      {error && <span className="text-xs text-danger">{error}</span>}
    </label>
  );
}
