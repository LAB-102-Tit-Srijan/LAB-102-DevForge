import { useState, useEffect, useCallback } from 'react';
import { createPortal } from 'react-dom';
import { motion, AnimatePresence } from 'framer-motion';
import { X, CheckCircle, AlertCircle, Info, AlertTriangle } from 'lucide-react';
import { setExternalAddToast } from '../../lib/toast';

let toastIdCounter = 0;

const icons = {
  success: <CheckCircle className="w-5 h-5 text-success" />,
  error: <AlertCircle className="w-5 h-5 text-error" />,
  info: <Info className="w-5 h-5 text-coral" />,
  warning: <AlertTriangle className="w-5 h-5 text-warning" />,
};

const borderColors = {
  success: 'border-success/30',
  error: 'border-error/30',
  info: 'border-border-strong',
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
        glass-strong rounded-[16px] px-4 py-3 flex items-center gap-3 min-w-[300px] max-w-[420px]
        border ${borderColors[t.type] || borderColors.info}
        shadow-[0_10px_30px_rgba(0,0,0,0.35)]
      `}
    >
      {icons[t.type] || icons.info}
      <p className="flex-1 text-sm text-text-primary">{t.message}</p>
      <button
        onClick={() => onRemove(t.id)}
        className="text-text-muted hover:text-text-primary transition-colors cursor-pointer"
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
    setExternalAddToast(addToast);
    return () => { setExternalAddToast(null); };
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
