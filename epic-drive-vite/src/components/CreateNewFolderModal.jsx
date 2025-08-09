import React, { useState, useRef, useEffect } from 'react';

function CreateNewFolderModal({ onClose, onCreate }) {
  const [folderName, setFolderName] = useState('');
  const modalRef = useRef(null);

  const handleCreateClick = () => {
    onCreate(folderName);
    onClose();
  };

  useEffect(() => {
    // Optional: Close modal if clicking outside
    const handleClickOutside = (event) => {
      if (modalRef.current && !modalRef.current.contains(event.target)) {
        onClose();
      }
    };
    document.addEventListener('mousedown', handleClickOutside);
    return () => {
      document.removeEventListener('mousedown', handleClickOutside);
    };
  }, [onClose]);

  return (
    <div
      id="createNewFolderModal"
      className="fixed inset-0 bg-modal-overlay flex items-center justify-center p-4 z-50"
    >
      <div ref={modalRef} className="main-card-bg rounded-lg shadow-xl p-6 w-full max-w-sm">
        <h3
          className="text-lg font-semibold mb-4"
          style={{ color: 'var(--text-primary)' }}
        >
          Create New Folder
        </h3>
        <input
          type="text"
          id="newFolderNameInput"
          className="w-full px-4 py-2 border input-border rounded-lg focus:outline-none focus:ring-2 focus:ring-accent mb-4"
          placeholder="Folder Name"
          value={folderName}
          onChange={(e) => setFolderName(e.target.value)}
          onKeyPress={(e) => {
            if (e.key === 'Enter') handleCreateClick();
          }}
        />
        <div className="flex justify-end space-x-3">
          <button
            id="createFolderCancelButton"
            className="btn-secondary px-4 py-2 rounded-lg font-medium"
            onClick={onClose}
          >
            Cancel
          </button>
          <button
            id="createFolderConfirmButton"
            className="btn-primary px-4 py-2 rounded-lg font-medium"
            onClick={handleCreateClick}
          >
            Create
          </button>
        </div>
      </div>
    </div>
  );
}

export default CreateNewFolderModal;
