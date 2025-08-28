import React from 'react';

const Button = ({ 
  children, 
  variant = 'primary', 
  size = 'md', 
  disabled = false, 
  loading = false,
  onClick,
  type = 'button',
  className = '',
  icon: Icon,
  iconPosition = 'left',
  ...props 
}) => {
  const baseStyles = 'inline-flex items-center justify-center font-medium rounded-lg transition-all duration-200 focus:outline-none focus:ring-2 focus:ring-offset-2 disabled:cursor-not-allowed';
  
  const variants = {
    primary: 'bg-blue-600 hover:bg-blue-700 text-white focus:ring-blue-500 disabled:bg-blue-300',
    secondary: 'bg-gray-600 hover:bg-gray-700 text-white focus:ring-gray-500 disabled:bg-gray-300',
    success: 'bg-green-600 hover:bg-green-700 text-white focus:ring-green-500 disabled:bg-green-300',
    danger: 'bg-red-600 hover:bg-red-700 text-white focus:ring-red-500 disabled:bg-red-300',
    warning: 'bg-yellow-600 hover:bg-yellow-700 text-white focus:ring-yellow-500 disabled:bg-yellow-300',
    outline: 'border border-gray-300 bg-white hover:bg-gray-50 text-gray-700 focus:ring-blue-500 disabled:bg-gray-100 disabled:text-gray-400',
    ghost: 'text-gray-600 hover:text-gray-900 hover:bg-gray-100 focus:ring-gray-500 disabled:text-gray-400',
    link: 'text-blue-600 hover:text-blue-700 hover:underline focus:ring-blue-500 disabled:text-blue-300'
  };

  const sizes = {
    xs: 'px-2 py-1 text-xs gap-1',
    sm: 'px-3 py-1.5 text-sm gap-1.5',
    md: 'px-4 py-2 text-sm gap-2',
    lg: 'px-6 py-3 text-base gap-2',
    xl: 'px-8 py-4 text-lg gap-3'
  };

  const buttonClasses = `${baseStyles} ${variants[variant]} ${sizes[size]} ${className}`;

  const handleClick = (e) => {
    if (disabled || loading) return;
    onClick?.(e);
  };

  return (
    <button
      type={type}
      className={buttonClasses}
      disabled={disabled || loading}
      onClick={handleClick}
      {...props}
    >
      {loading && (
        <svg
          className="animate-spin h-4 w-4"
          xmlns="http://www.w3.org/2000/svg"
          fill="none"
          viewBox="0 0 24 24"
        >
          <circle
            className="opacity-25"
            cx="12"
            cy="12"
            r="10"
            stroke="currentColor"
            strokeWidth="4"
          />
          <path
            className="opacity-75"
            fill="currentColor"
            d="M4 12a8 8 0 018-8V0C5.373 0 0 5.373 0 12h4zm2 5.291A7.962 7.962 0 014 12H0c0 3.042 1.135 5.824 3 7.938l3-2.647z"
          />
        </svg>
      )}
      
      {Icon && iconPosition === 'left' && !loading && (
        <Icon className="h-4 w-4" />
      )}
      
      {children}
      
      {Icon && iconPosition === 'right' && !loading && (
        <Icon className="h-4 w-4" />
      )}
    </button>
  );
};

// Predefined button components for common use cases
export const PrimaryButton = (props) => <Button variant="primary" {...props} />;
export const SecondaryButton = (props) => <Button variant="secondary" {...props} />;
export const SuccessButton = (props) => <Button variant="success" {...props} />;
export const DangerButton = (props) => <Button variant="danger" {...props} />;
export const OutlineButton = (props) => <Button variant="outline" {...props} />;
export const GhostButton = (props) => <Button variant="ghost" {...props} />;
export const LinkButton = (props) => <Button variant="link" {...props} />;

// Icon button wrapper
export const IconButton = ({ icon: Icon, 'aria-label': ariaLabel, size = 'md', ...props }) => {
  const iconSizes = {
    xs: 'h-3 w-3',
    sm: 'h-4 w-4', 
    md: 'h-5 w-5',
    lg: 'h-6 w-6',
    xl: 'h-7 w-7'
  };

  return (
    <Button
      aria-label={ariaLabel}
      size={size}
      className="p-2"
      {...props}
    >
      <Icon className={iconSizes[size]} />
    </Button>
  );
};

// Button group for related actions
export const ButtonGroup = ({ children, className = '' }) => {
  return (
    <div className={`inline-flex rounded-lg shadow-sm ${className}`}>
      {React.Children.map(children, (child, index) => {
        if (React.isValidElement(child)) {
          const isFirst = index === 0;
          const isLast = index === React.Children.count(children) - 1;
          
          let roundedClasses = '';
          if (isFirst && !isLast) {
            roundedClasses = 'rounded-r-none border-r-0';
          } else if (isLast && !isFirst) {
            roundedClasses = 'rounded-l-none';
          } else if (!isFirst && !isLast) {
            roundedClasses = 'rounded-none border-r-0';
          }
          
          return React.cloneElement(child, {
            className: `${child.props.className || ''} ${roundedClasses}`.trim()
          });
        }
        return child;
      })}
    </div>
  );
};

export default Button;