// Toast notification wrapper with sound effects
import toast, { ToastOptions } from 'react-hot-toast';
import { notificationSound } from './notificationSound';

// Extend toast with sound effects
export const toastWithSound = {
  success: (message: string, options?: ToastOptions) => {
    notificationSound.success();
    return toast.success(message, options);
  },
  
  error: (message: string, options?: ToastOptions) => {
    notificationSound.error();
    return toast.error(message, options);
  },
  
  warning: (message: string, options?: ToastOptions) => {
    notificationSound.warning();
    return toast(message, {
      icon: '⚠️',
      ...options,
    });
  },
  
  info: (message: string, options?: ToastOptions) => {
    notificationSound.info();
    return toast(message, {
      icon: 'ℹ️',
      ...options,
    });
  },
  
  // Special notifications
  newAssignment: (message: string, options?: ToastOptions) => {
    notificationSound.newAssignment();
    return toast.success(message, {
      icon: '📋',
      duration: 5000,
      ...options,
    });
  },
  
  statusChange: (message: string, options?: ToastOptions) => {
    notificationSound.statusChange();
    return toast.success(message, {
      icon: '🔄',
      ...options,
    });
  },
  
  // Raw toast without sound (for silent notifications)
  silent: toast,
};

// Export original toast as well for compatibility
export { toast };
