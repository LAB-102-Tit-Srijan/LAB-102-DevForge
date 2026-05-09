const Card = ({
  children,
  className = '',
  glass = false,
  hover = false,
  glow = false,
  ...props
}) => {
  return (
    <div
      className={`
        rounded-2xl p-6
        ${glass
          ? 'glass'
          : 'bg-surface-elevated border border-border-subtle'
        }
        ${hover ? 'transition-all duration-300 hover:border-primary/30 hover:shadow-lg hover:shadow-primary/5 hover:-translate-y-0.5' : ''}
        ${glow ? 'glow-primary' : ''}
        ${className}
      `}
      {...props}
    >
      {children}
    </div>
  );
};

const CardHeader = ({ children, className = '' }) => (
  <div className={`mb-4 ${className}`}>{children}</div>
);

const CardTitle = ({ children, className = '' }) => (
  <h3 className={`text-lg font-semibold text-text-primary ${className}`}>{children}</h3>
);

const CardDescription = ({ children, className = '' }) => (
  <p className={`text-sm text-text-secondary mt-1 ${className}`}>{children}</p>
);

const CardContent = ({ children, className = '' }) => (
  <div className={className}>{children}</div>
);

export { Card, CardHeader, CardTitle, CardDescription, CardContent };
export default Card;
