import { useState, useEffect, useCallback, createContext, useContext } from 'react';
import { createPortal } from 'react-dom';
import { motion, AnimatePresence } from 'framer-motion';
import { X, CheckCircle, AlertCircle, Info, AlertTriangle } from 'lucide-react';

// ── Toast Context ─────────────────────────────────────────
const ToastContext = createContext(null);

let toastIdCounter = 0;
let externalAddToast = null;

// ── Toast function (callable from anywhere) ───────────────
export const toast = {
  success: (message, options) => externalAddToast?.({ type: 'success', message, ...options }),
  error: (message, options) => externalAddToast?.({ type: 'error', message, ...options }),
  info: (message, options) => externalAddToast?.({ type: 'info', message, ...options }),
  warning: (message, options) => externalAddToast?.({ type: 'warning', message, ...options }),
};

const icons = {
  success: <CheckCircle className="w-5 h-5 text-success" />,
  error: <AlertCircle className="w-5 h-5 text-error" />,
  info: <Info className="w-5 h-5 text-accent" />,
  warning: <AlertTriangle className="w-5 h-5 text-warning" />,
};

const bgColors = {
  success: 'border-success/30',
  error: 'border-error/30',
  info: 'border-accent/30',
  warning: 'border-warning/30',
};

// ── Single Toast ──────────────────────────────────────────
const ToastItem = ({ toast: t, onRemove }) => {
  useEffect(() => {
    const timer = setTimeout(() => onRemove(t.id), t.duration || 4000);
    return () => clearTimeout(timer);
  }, [t.id, t.duration, onRemove]);

  return (
    <motion.div
      layout
      initial={{ opacity: 0, y: 20, scale: 0.95 }}
      animate={{ opacity: 1, y: 0, scale: 1 }}
      exit={{ opacity: 0, y: -10, scale: 0.95 }}
      transition={{ duration: 0.2 }}
      className={`
        glass-strong rounded-xl px-4 py-3 flex items-center gap-3 min-w-[300px] max-w-[420px]
        border ${bgColors[t.type] || bgColors.info}
        shadow-2xl
      `}
    >
      {icons[t.type] || icons.info}
      <p className="flex-1 text-sm text-text-primary">{t.message}</p>
      <button
        onClick={() => onRemove(t.id)}
        className="text-text-muted hover:text-text-primary transition-colors"
      >
        <X className="w-4 h-4" />
      </button>
    </motion.div>
  );
};

// ── Toaster Container ─────────────────────────────────────
export const Toaster = () => {
  const [toasts, setToasts] = useState([]);

  const addToast = useCallback((toast) => {
    const id = ++toastIdCounter;
    setToasts((prev) => [...prev, { ...toast, id }]);
  }, []);

  const removeToast = useCallback((id) => {
    setToasts((prev) => prev.filter((t) => t.id !== id));
  }, []);

  useEffect(() => {
    externalAddToast = addToast;
    return () => { externalAddToast = null; };
  }, [addToast]);

  return createPortal(
    <div className="fixed bottom-4 right-4 z-50 flex flex-col gap-2">
      <AnimatePresence>
        {toasts.map((t) => (
          <ToastItem key={t.id} toast={t} onRemove={removeToast} />
        ))}
      </AnimatePresence>
    </div>,
    document.body
  );
};

export default toast;
