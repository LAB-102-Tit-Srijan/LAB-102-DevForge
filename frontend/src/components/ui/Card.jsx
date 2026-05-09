const Card = ({
  children,
  className = '',
  glass = false,
  hover = false,
  ...props
}) => {
  return (
    <div
      className={`
        rounded-[24px] p-6 card-shadow
        ${glass
          ? 'glass'
          : 'bg-bg-card border border-border-default'
        }
        ${hover ? 'transition-all duration-300 hover:border-border-strong hover:-translate-y-1 hover:shadow-[0_20px_40px_rgba(0,0,0,0.4)]' : ''}
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
  <h3 className={`text-xl font-semibold text-text-primary ${className}`}>{children}</h3>
);

const CardDescription = ({ children, className = '' }) => (
  <p className={`text-sm text-text-secondary mt-1.5 leading-relaxed ${className}`}>{children}</p>
);

const CardContent = ({ children, className = '' }) => (
  <div className={className}>{children}</div>
);

export { Card, CardHeader, CardTitle, CardDescription, CardContent };
export default Card;
