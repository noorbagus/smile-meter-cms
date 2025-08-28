import React, { useEffect, useRef } from 'react';
import { X, AlertTriangle, CheckCircle, AlertCircle, Info } from 'lucide-react';
import Button from './button';

const Modal = ({
  isOpen,
  onClose,
  title,
  children,
  size = 'md',
  closable = true,
  closeOnOverlayClick = true,
  className = '',
  showCloseButton = true
}) => {
  const modalRef = useRef(null);
  const previousFocus = useRef(null);

  const sizes = {
    sm: 'max-w-sm',
    md: 'max-w-md',
    lg: 'max-w-lg',
    xl: 'max-w-xl',
    '2xl': 'max-w-2xl',
    '4xl': 'max-w-4xl',
    full: 'max-w-full mx-4'
  };

  useEffect(() => {
    if (isOpen) {
      previousFocus.current = document.activeElement;
      document.body.style.overflow = 'hidden';
      modalRef.current?.focus();
    } else {
      document.body.style.overflow = 'unset';
      previousFocus.current?.focus();
    }

    return () => {
      document.body.style.overflow = 'unset';
    };
  }, [isOpen]);

  useEffect(() => {
    const handleEscape = (e) => {
      if (e.key === 'Escape' && closable) {
        onClose();
      }
    };

    if (isOpen) {
      document.addEventListener('keydown', handleEscape);
    }

    return () => {
      document.removeEventListener('keydown', handleEscape);
    };
  }, [isOpen, closable, onClose]);

  if (!isOpen) return null;

  const handleOverlayClick = (e) => {
    if (e.target === e.currentTarget && closeOnOverlayClick && closable) {
      onClose();
    }
  };

  return (
    <div className="fixed inset-0 z-50 overflow-y-auto">
      <div 
        className="flex min-h-full items-center justify-center p-4 text-center"
        onClick={handleOverlayClick}
      >
        <div className="fixed inset-0 bg-black bg-opacity-50 transition-opacity" />
        
        <div
          ref={modalRef}
          tabIndex={-1}
          className={`
            relative transform overflow-hidden rounded-lg bg-white text-left shadow-xl transition-all
            w-full ${sizes[size]} ${className}
          `}
        >
          {(title || showCloseButton) && (
            <div className="flex items-center justify-between px-6 py-4 border-b border-gray-200">
              {title && (
                <h3 className="text-lg font-semibold text-gray-900">
                  {title}
                </h3>
              )}
              {showCloseButton && closable && (
                <button
                  onClick={onClose}
                  className="text-gray-400 hover:text-gray-600 transition-colors"
                >
                  <X className="h-6 w-6" />
                </button>
              )}
            </div>
          )}
          
          <div className="px-6 py-4">
            {children}
          </div>
        </div>
      </div>
    </div>
  );
};

// Confirmation modal for destructive actions
export const ConfirmModal = ({
  isOpen,
  onClose,
  onConfirm,
  title = "Confirm Action",
  message,
  confirmText = "Confirm",
  cancelText = "Cancel",
  variant = "danger",
  loading = false
}) => {
  const variants = {
    danger: {
      icon: AlertTriangle,
      iconColor: 'text-red-600',
      buttonVariant: 'danger'
    },
    warning: {
      icon: AlertCircle,
      iconColor: 'text-yellow-600', 
      buttonVariant: 'warning'
    },
    info: {
      icon: Info,
      iconColor: 'text-blue-600',
      buttonVariant: 'primary'
    }
  };

  const config = variants[variant];
  const Icon = config.icon;

  return (
    <Modal
      isOpen={isOpen}
      onClose={onClose}
      size="sm"
      title={title}
    >
      <div className="flex items-start gap-4">
        <div className={`flex-shrink-0 ${config.iconColor}`}>
          <Icon className="h-6 w-6" />
        </div>
        <div className="flex-1">
          <p className="text-gray-700">{message}</p>
        </div>
      </div>
      
      <div className="flex justify-end gap-3 mt-6">
        <Button
          variant="outline"
          onClick={onClose}
          disabled={loading}
        >
          {cancelText}
        </Button>
        <Button
          variant={config.buttonVariant}
          onClick={onConfirm}
          loading={loading}
        >
          {confirmText}
        </Button>
      </div>
    </Modal>
  );
};

// Form modal wrapper
export const FormModal = ({
  isOpen,
  onClose,
  onSubmit,
  title,
  children,
  submitText = "Save",
  cancelText = "Cancel",
  loading = false,
  size = "md"
}) => {
  const handleSubmit = (e) => {
    e.preventDefault();
    onSubmit(e);
  };

  return (
    <Modal
      isOpen={isOpen}
      onClose={onClose}
      title={title}
      size={size}
      closable={!loading}
    >
      <form onSubmit={handleSubmit}>
        <div className="space-y-4 mb-6">
          {children}
        </div>
        
        <div className="flex justify-end gap-3">
          <Button
            type="button"
            variant="outline"
            onClick={onClose}
            disabled={loading}
          >
            {cancelText}
          </Button>
          <Button
            type="submit"
            loading={loading}
          >
            {submitText}
          </Button>
        </div>
      </form>
    </Modal>
  );
};

// Stock reduction confirmation modal
export const StockReductionModal = ({
  isOpen,
  onClose,
  onConfirm,
  productName,
  currentStock,
  reductionAmount,
  loading = false
}) => {
  const newStock = currentStock - reductionAmount;
  const isStockCritical = newStock <= 5;
  const isStockEmpty = newStock <= 0;

  return (
    <Modal
      isOpen={isOpen}
      onClose={onClose}
      title="Confirm Stock Reduction"
      size="md"
    >
      <div className="space-y-4">
        <div className="bg-gray-50 p-4 rounded-lg">
          <h4 className="font-medium text-gray-900 mb-2">{productName}</h4>
          <div className="grid grid-cols-3 gap-4 text-sm">
            <div>
              <span className="text-gray-600">Current Stock:</span>
              <div className="font-semibold">{currentStock}</div>
            </div>
            <div>
              <span className="text-gray-600">Reduction:</span>
              <div className="font-semibold text-red-600">-{reductionAmount}</div>
            </div>
            <div>
              <span className="text-gray-600">New Stock:</span>
              <div className={`font-semibold ${
                isStockEmpty ? 'text-red-600' : 
                isStockCritical ? 'text-yellow-600' : 
                'text-green-600'
              }`}>
                {newStock}
              </div>
            </div>
          </div>
        </div>

        {(isStockCritical || isStockEmpty) && (
          <div className={`flex items-start gap-3 p-4 rounded-lg ${
            isStockEmpty ? 'bg-red-50' : 'bg-yellow-50'
          }`}>
            <AlertTriangle className={`h-5 w-5 mt-0.5 ${
              isStockEmpty ? 'text-red-600' : 'text-yellow-600'
            }`} />
            <div>
              <p className={`font-medium ${
                isStockEmpty ? 'text-red-800' : 'text-yellow-800'
              }`}>
                {isStockEmpty ? 'Stock akan habis!' : 'Stock akan kritis!'}
              </p>
              <p className={`text-sm ${
                isStockEmpty ? 'text-red-700' : 'text-yellow-700'
              }`}>
                {isStockEmpty 
                  ? 'Hadiah tidak akan tersedia setelah pengurangan ini.'
                  : 'Stock akan di bawah 5 item setelah pengurangan ini.'
                }
              </p>
            </div>
          </div>
        )}

        <div className="flex justify-end gap-3 pt-4">
          <Button
            variant="outline"
            onClick={onClose}
            disabled={loading}
          >
            Cancel
          </Button>
          <Button
            variant={isStockEmpty ? "danger" : "warning"}
            onClick={onConfirm}
            loading={loading}
          >
            Confirm Reduction
          </Button>
        </div>
      </div>
    </Modal>
  );
};

// Add product modal
export const AddProductModal = ({
  isOpen,
  onClose,
  onSubmit,
  loading = false,
  categories = []
}) => {
  return (
    <FormModal
      isOpen={isOpen}
      onClose={onClose}
      onSubmit={onSubmit}
      title="Add New Product"
      submitText="Add Product"
      loading={loading}
    >
      <div>
        <label className="block text-sm font-medium text-gray-700 mb-2">
          Product Name *
        </label>
        <input
          type="text"
          name="productName"
          required
          className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent"
          placeholder="Enter product name"
        />
      </div>
      
      <div>
        <label className="block text-sm font-medium text-gray-700 mb-2">
          Category *
        </label>
        <select
          name="category"
          required
          className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent"
        >
          <option value="">Select category</option>
          {categories.map(cat => (
            <option key={cat.id} value={cat.id}>{cat.name}</option>
          ))}
        </select>
      </div>
      
      <div>
        <label className="block text-sm font-medium text-gray-700 mb-2">
          Description
        </label>
        <textarea
          name="description"
          rows={3}
          className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent"
          placeholder="Product description (optional)"
        />
      </div>
    </FormModal>
  );
};

// Add user modal
export const AddUserModal = ({
  isOpen,
  onClose,
  onSubmit,
  loading = false,
  units = []
}) => {
  return (
    <FormModal
      isOpen={isOpen}
      onClose={onClose}
      onSubmit={onSubmit}
      title="Add Customer Service"
      submitText="Create Account"
      loading={loading}
    >
      <div>
        <label className="block text-sm font-medium text-gray-700 mb-2">
          Full Name *
        </label>
        <input
          type="text"
          name="fullName"
          required
          className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent"
          placeholder="Enter full name"
        />
      </div>
      
      <div>
        <label className="block text-sm font-medium text-gray-700 mb-2">
          Email *
        </label>
        <input
          type="email"
          name="email"
          required
          className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent"
          placeholder="Enter email address"
        />
      </div>
      
      <div>
        <label className="block text-sm font-medium text-gray-700 mb-2">
          Password *
        </label>
        <input
          type="password"
          name="password"
          required
          minLength={6}
          className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent"
          placeholder="Enter password (min 6 characters)"
        />
      </div>
      
      <div>
        <label className="block text-sm font-medium text-gray-700 mb-2">
          Assign to Unit
        </label>
        <select
          name="unitId"
          className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent"
        >
          <option value="">Select unit (optional)</option>
          {units.map(unit => (
            <option key={unit.id} value={unit.id}>{unit.name}</option>
          ))}
        </select>
      </div>
    </FormModal>
  );
};

export default Modal;