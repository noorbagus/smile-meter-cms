import React, { forwardRef, useState } from 'react';
import { Eye, EyeOff, AlertCircle, Check, X } from 'lucide-react';

const Input = forwardRef(({
  label,
  error,
  helperText,
  type = 'text',
  size = 'md',
  variant = 'default',
  disabled = false,
  required = false,
  placeholder,
  value,
  defaultValue,
  onChange,
  onFocus,
  onBlur,
  className = '',
  icon: Icon,
  iconPosition = 'left',
  suffix,
  prefix,
  maxLength,
  min,
  max,
  step,
  autoComplete,
  id,
  name,
  ...props
}, ref) => {
  const [showPassword, setShowPassword] = useState(false);
  const [focused, setFocused] = useState(false);

  const inputId = id || name || `input-${Math.random().toString(36).substr(2, 9)}`;
  const hasError = !!error;
  const isPassword = type === 'password';
  const actualType = isPassword && showPassword ? 'text' : type;

  const sizes = {
    sm: 'px-3 py-1.5 text-sm',
    md: 'px-3 py-2 text-sm',
    lg: 'px-4 py-3 text-base'
  };

  const variants = {
    default: `border-gray-300 bg-white text-gray-900 placeholder-gray-500 
             focus:border-blue-500 focus:ring-blue-500`,
    filled: `border-gray-200 bg-gray-50 text-gray-900 placeholder-gray-500
            focus:border-blue-500 focus:ring-blue-500 focus:bg-white`,
    outline: `border-2 border-gray-300 bg-transparent text-gray-900 placeholder-gray-500
             focus:border-blue-500 focus:ring-0`
  };

  const baseInputStyles = `
    block w-full rounded-lg border transition-colors duration-200
    focus:outline-none focus:ring-2 focus:ring-offset-0 focus:ring-opacity-50
    disabled:bg-gray-100 disabled:text-gray-500 disabled:cursor-not-allowed
    ${sizes[size]}
    ${hasError 
      ? 'border-red-500 focus:border-red-500 focus:ring-red-500' 
      : variants[variant]
    }
    ${disabled ? 'opacity-50' : ''}
    ${className}
  `;

  const handleFocus = (e) => {
    setFocused(true);
    onFocus?.(e);
  };

  const handleBlur = (e) => {
    setFocused(false);
    onBlur?.(e);
  };

  const togglePasswordVisibility = () => {
    setShowPassword(!showPassword);
  };

  return (
    <div className="w-full">
      {label && (
        <label 
          htmlFor={inputId}
          className={`block text-sm font-medium mb-2 transition-colors duration-200 ${
            hasError ? 'text-red-700' : 'text-gray-700'
          }`}
        >
          {label}
          {required && <span className="text-red-500 ml-1">*</span>}
        </label>
      )}
      
      <div className="relative">
        {prefix && (
          <div className="absolute left-3 top-1/2 transform -translate-y-1/2 text-gray-500">
            {prefix}
          </div>
        )}
        
        {Icon && iconPosition === 'left' && (
          <div className={`absolute left-3 top-1/2 transform -translate-y-1/2 ${
            hasError ? 'text-red-500' : focused ? 'text-blue-500' : 'text-gray-400'
          }`}>
            <Icon className="h-5 w-5" />
          </div>
        )}
        
        <input
          ref={ref}
          id={inputId}
          name={name}
          type={actualType}
          value={value}
          defaultValue={defaultValue}
          placeholder={placeholder}
          disabled={disabled}
          required={required}
          maxLength={maxLength}
          min={min}
          max={max}
          step={step}
          autoComplete={autoComplete}
          onChange={onChange}
          onFocus={handleFocus}
          onBlur={handleBlur}
          className={`
            ${baseInputStyles}
            ${prefix ? 'pl-8' : ''}
            ${Icon && iconPosition === 'left' ? 'pl-10' : ''}
            ${Icon && iconPosition === 'right' ? 'pr-10' : ''}
            ${isPassword || suffix ? 'pr-10' : ''}
          `}
          {...props}
        />
        
        {Icon && iconPosition === 'right' && (
          <div className={`absolute right-3 top-1/2 transform -translate-y-1/2 ${
            hasError ? 'text-red-500' : focused ? 'text-blue-500' : 'text-gray-400'
          }`}>
            <Icon className="h-5 w-5" />
          </div>
        )}
        
        {isPassword && (
          <button
            type="button"
            onClick={togglePasswordVisibility}
            className="absolute right-3 top-1/2 transform -translate-y-1/2 text-gray-400 hover:text-gray-600"
          >
            {showPassword ? <EyeOff className="h-5 w-5" /> : <Eye className="h-5 w-5" />}
          </button>
        )}
        
        {suffix && !isPassword && (
          <div className="absolute right-3 top-1/2 transform -translate-y-1/2 text-gray-500">
            {suffix}
          </div>
        )}
        
        {hasError && (
          <div className="absolute right-3 top-1/2 transform -translate-y-1/2 text-red-500">
            <AlertCircle className="h-5 w-5" />
          </div>
        )}
      </div>
      
      {(error || helperText) && (
        <div className="mt-2 flex items-start gap-2">
          {error && <AlertCircle className="h-4 w-4 text-red-500 mt-0.5 flex-shrink-0" />}
          <p className={`text-sm ${error ? 'text-red-600' : 'text-gray-600'}`}>
            {error || helperText}
          </p>
        </div>
      )}
    </div>
  );
});

Input.displayName = 'Input';

// Specialized input components
export const NumberInput = forwardRef((props, ref) => (
  <Input 
    ref={ref}
    type="number"
    {...props}
  />
));

export const EmailInput = forwardRef((props, ref) => (
  <Input 
    ref={ref}
    type="email"
    autoComplete="email"
    {...props}
  />
));

export const PasswordInput = forwardRef((props, ref) => (
  <Input 
    ref={ref}
    type="password"
    autoComplete="current-password"
    {...props}
  />
));

export const SearchInput = forwardRef(({ placeholder = "Search...", ...props }, ref) => (
  <Input 
    ref={ref}
    type="search"
    placeholder={placeholder}
    {...props}
  />
));

// Form field with validation states
export const FormField = ({ 
  children, 
  label, 
  error, 
  helperText, 
  required = false,
  className = '' 
}) => {
  return (
    <div className={`space-y-2 ${className}`}>
      {label && (
        <label className={`block text-sm font-medium ${
          error ? 'text-red-700' : 'text-gray-700'
        }`}>
          {label}
          {required && <span className="text-red-500 ml-1">*</span>}
        </label>
      )}
      
      {children}
      
      {(error || helperText) && (
        <div className="flex items-start gap-2">
          {error && <AlertCircle className="h-4 w-4 text-red-500 mt-0.5 flex-shrink-0" />}
          <p className={`text-sm ${error ? 'text-red-600' : 'text-gray-600'}`}>
            {error || helperText}
          </p>
        </div>
      )}
    </div>
  );
};

// Input group for related inputs
export const InputGroup = ({ children, className = '' }) => {
  return (
    <div className={`flex ${className}`}>
      {React.Children.map(children, (child, index) => {
        if (React.isValidElement(child)) {
          const isFirst = index === 0;
          const isLast = index === React.Children.count(children) - 1;
          
          let roundedClasses = 'rounded-none';
          if (isFirst && !isLast) {
            roundedClasses = 'rounded-l-lg rounded-r-none border-r-0';
          } else if (isLast && !isFirst) {
            roundedClasses = 'rounded-r-lg rounded-l-none';
          } else if (isFirst && isLast) {
            roundedClasses = 'rounded-lg';
          }
          
          return React.cloneElement(child, {
            className: `${child.props.className || ''} ${roundedClasses} focus:z-10`.trim()
          });
        }
        return child;
      })}
    </div>
  );
};

// Stock quantity input with validation
export const StockInput = forwardRef(({ 
  value, 
  onChange, 
  min = 0, 
  max = 9999,
  placeholder = "Enter quantity",
  ...props 
}, ref) => {
  const handleChange = (e) => {
    const val = parseInt(e.target.value) || 0;
    if (val >= min && val <= max) {
      onChange?.(e);
    }
  };

  return (
    <NumberInput
      ref={ref}
      value={value}
      onChange={handleChange}
      min={min}
      max={max}
      placeholder={placeholder}
      className="text-center"
      {...props}
    />
  );
});

NumberInput.displayName = 'NumberInput';
EmailInput.displayName = 'EmailInput'; 
PasswordInput.displayName = 'PasswordInput';
SearchInput.displayName = 'SearchInput';
StockInput.displayName = 'StockInput';

export default Input;