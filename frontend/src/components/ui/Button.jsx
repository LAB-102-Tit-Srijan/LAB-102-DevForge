import { forwardRef } from 'react';

const variants = {
  default: 'btn-primary',
  secondary: 'btn-secondary',
  ghost: 'hover:bg-[var(--bg-card)] text-[var(--text-secondary)] hover:text-[var(--text-primary)]',
  outline: 'border border-[var(--border-default)] hover:border-[var(--border-strong)] hover:bg-[var(--bg-card)] text-[var(--text-secondary)] hover:text-[var(--text-primary)]',
  accent: 'btn-primary',
  danger: 'bg-[var(--error)] hover:opacity-80 text-white',
};

const sizes = {
  sm: 'px-4 py-2 text-[13px] rounded-[6px]',
  md: 'px-5 py-2.5 text-sm rounded-[6px]',
  lg: 'px-7 py-3.5 text-base rounded-[6px]',
  icon: 'p-2.5 rounded-[6px]',
};

const Button = forwardRef(({
  variant = 'default',
  size = 'md',
  className = '',
  disabled = false,
  loading = false,
  children,
  ...props
}, ref) => {
  return (
    <button
      ref={ref}
      disabled={disabled || loading}
      className={`
        inline-flex items-center justify-center gap-2
        font-medium transition-all duration-300 ease-out
        disabled:opacity-40 disabled:cursor-not-allowed
        active:scale-[0.97]
        cursor-pointer
        ${variants[variant]}
        ${sizes[size]}
        ${className}
      `}
      {...props}
    >
      {loading && (
        <svg className="animate-spin h-4 w-4" viewBox="0 0 24 24" fill="none">
          <circle className="opacity-25" cx="12" cy="12" r="10" stroke="currentColor" strokeWidth="4" />
          <path className="opacity-75" fill="currentColor" d="M4 12a8 8 0 018-8V0C5.373 0 0 5.373 0 12h4z" />
        </svg>
      )}
      {children}
    </button>
  );
});

Button.displayName = 'Button';
export default Button;
