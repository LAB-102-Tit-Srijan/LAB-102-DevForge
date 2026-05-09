let externalAddToast = null;

export const setExternalAddToast = (fn) => {
  externalAddToast = fn;
};

export const toast = {
  success: (message, options) => externalAddToast?.({ type: 'success', message, ...options }),
  error: (message, options) => externalAddToast?.({ type: 'error', message, ...options }),
  info: (message, options) => externalAddToast?.({ type: 'info', message, ...options }),
  warning: (message, options) => externalAddToast?.({ type: 'warning', message, ...options }),
};

export default toast;
