const variants = {
  default: 'bg-[var(--bg-elevated)] text-[var(--text-secondary)]',
  primary: 'bg-[var(--accent-muted)] text-[var(--accent)] border border-[var(--border-strong)]',
  success: 'bg-[rgba(74,222,128,0.15)] text-[#4ADE80] border border-[rgba(74,222,128,0.25)]',
  warning: 'bg-[rgba(250,204,21,0.15)] text-[#FACC15] border border-[rgba(250,204,21,0.25)]',
  error: 'bg-[rgba(248,113,113,0.15)] text-[var(--error)] border border-[rgba(248,113,113,0.25)]',
  accent: 'bg-[var(--accent-muted)] text-[var(--accent)] border border-[var(--border-strong)]',
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
