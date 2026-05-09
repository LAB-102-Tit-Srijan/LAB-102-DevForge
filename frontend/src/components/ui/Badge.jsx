const variants = {
  default: 'bg-surface-overlay text-text-secondary',
  primary: 'bg-primary/20 text-primary-hover border border-primary/30',
  success: 'bg-success/20 text-success border border-success/30',
  warning: 'bg-warning/20 text-warning border border-warning/30',
  error: 'bg-error/20 text-error border border-error/30',
  accent: 'bg-accent/20 text-accent border border-accent/30',
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
        inline-flex items-center px-2.5 py-0.5 rounded-full
        text-xs font-medium
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
