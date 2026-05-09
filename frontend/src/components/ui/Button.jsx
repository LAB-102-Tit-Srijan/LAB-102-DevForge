import { forwardRef } from 'react';

const variants = {
  default: 'bg-primary hover:bg-primary-hover text-white shadow-lg shadow-primary/25',
  secondary: 'bg-surface-overlay hover:bg-border-subtle text-text-primary border border-border-subtle',
  ghost: 'hover:bg-surface-overlay text-text-secondary hover:text-text-primary',
  outline: 'border border-border-subtle hover:bg-surface-overlay text-text-primary',
  accent: 'bg-accent hover:bg-accent-hover text-white shadow-lg shadow-accent/25',
  danger: 'bg-error hover:bg-error/80 text-white',
};

const sizes = {
  sm: 'px-3 py-1.5 text-sm rounded-lg',
  md: 'px-4 py-2 text-sm rounded-lg',
  lg: 'px-6 py-3 text-base rounded-xl',
  icon: 'p-2 rounded-lg',
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
        font-medium transition-all duration-200
        focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-primary/50
        disabled:opacity-50 disabled:cursor-not-allowed
        active:scale-[0.98]
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
