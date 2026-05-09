const variants = {
  default: 'bg-bg-elevated text-text-secondary',
  primary: 'bg-coral-muted text-coral border border-border-strong',
  success: 'bg-success/15 text-success border border-success/25',
  warning: 'bg-warning/15 text-warning border border-warning/25',
  error: 'bg-error/15 text-error border border-error/25',
  accent: 'bg-coral-muted text-coral border border-border-strong',
};

const Badge = ({
  variant = 'default',
  children,
  className = '',
  ...props
}) => {
  return (
    <span
      className={`
        inline-flex items-center px-3 py-1 rounded-full
        text-xs font-medium tracking-wide
        ${variants[variant]}
        ${className}
      `}
      {...props}
    >
      {children}
    </span>
  );
};

export default Badge;
