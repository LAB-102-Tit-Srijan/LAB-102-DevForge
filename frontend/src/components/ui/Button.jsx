import { forwardRef } from 'react';

const variants = {
  default: 'bg-gradient-to-r from-coral to-coral-light text-bg-app font-semibold shadow-lg hover:shadow-[0_0_30px_rgba(245,158,139,0.25)] hover:-translate-y-0.5',
  secondary: 'bg-bg-card hover:bg-bg-elevated text-text-primary border border-border-default hover:border-border-strong',
  ghost: 'hover:bg-bg-card text-text-secondary hover:text-text-primary',
  outline: 'border border-border-default hover:border-border-strong hover:bg-bg-card text-text-secondary hover:text-text-primary',
  accent: 'bg-gradient-to-r from-coral to-coral-light text-bg-app font-semibold shadow-lg hover:shadow-[0_0_30px_rgba(245,158,139,0.25)]',
  danger: 'bg-error hover:bg-error/80 text-white',
};

const sizes = {
  sm: 'px-4 py-2 text-[13px] rounded-[10px]',
  md: 'px-5 py-2.5 text-sm rounded-[14px]',
  lg: 'px-7 py-3.5 text-base rounded-[14px]',
  icon: 'p-2.5 rounded-[12px]',
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
        focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-coral/50
        disabled:opacity-40 disabled:cursor-not-allowed disabled:hover:translate-y-0
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
