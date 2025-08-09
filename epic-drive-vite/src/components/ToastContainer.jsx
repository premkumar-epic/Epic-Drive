import React from 'react';

function ToastContainer({ toasts }) {
  const getToastClasses = (type) => {
    switch (type) {
      case 'success': return 'bg-green-500';
      case 'error': return 'bg-red-500';
      case 'info': return 'bg-blue-500';
      case 'warning': return 'bg-yellow-500';
      default: return 'bg-gray-700';
    }
  };

  return (
    <div id="toast-container" className="fixed bottom-4 right-4 flex flex-col space-y-2 z-[9999]">
      {toasts.map((toast) => (
        <div
          key={toast.id} // This is correctly using toast.id as the key
          className={`${getToastClasses(toast.type)} text-white px-4 py-2 rounded-md shadow-lg transition-opacity duration-300 ease-out`}
          role="alert"
        >
          {toast.message}
        </div>
      ))}
    </div>
  );
}

export default ToastContainer;
