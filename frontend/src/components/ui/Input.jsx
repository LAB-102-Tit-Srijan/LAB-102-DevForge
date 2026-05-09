import { forwardRef } from 'react';

const Input = forwardRef(({
  label,
  error,
  className = '',
  containerClassName = '',
  ...props
}, ref) => {
  return (
    <div className={`space-y-1.5 ${containerClassName}`}>
      {label && (
        <label className="block text-sm font-medium text-text-secondary">
          {label}
        </label>
      )}
      <input
        ref={ref}
        className={`
          w-full px-4 py-2.5 rounded-xl
          bg-surface-elevated border border-border-subtle
          text-text-primary placeholder-text-muted
          transition-all duration-200
          focus:outline-none focus:ring-2 focus:ring-primary/50 focus:border-primary
          disabled:opacity-50 disabled:cursor-not-allowed
          ${error ? 'border-error focus:ring-error/50' : ''}
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
