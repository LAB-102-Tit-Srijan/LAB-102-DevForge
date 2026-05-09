import { forwardRef } from 'react';

const Input = forwardRef(({
  label,
  error,
  className = '',
  containerClassName = '',
  ...props
}, ref) => {
  return (
    <div className={`space-y-2 ${containerClassName}`}>
      {label && (
        <label className="block text-[13px] font-medium text-text-secondary tracking-wide">
          {label}
        </label>
      )}
      <input
        ref={ref}
        className={`
          w-full px-5 py-3 rounded-[16px]
          bg-bg-input border border-border-default
          text-text-primary placeholder-text-muted
          transition-all duration-300
          focus:outline-none focus:ring-2 focus:ring-coral/30 focus:border-border-strong
          disabled:opacity-40 disabled:cursor-not-allowed
          ${error ? 'border-error focus:ring-error/30' : ''}
          ${className}
        `}
        {...props}
      />
      {error && (
        <p className="text-sm text-error">{error}</p>
      )}
    </div>
  );
});

Input.displayName = 'Input';
export default Input;
