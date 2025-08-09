import React, { useState, useEffect, useCallback, useRef } from "react";

// Define duration options in seconds
const DURATION_OPTIONS = [
  { label: "15 Mins", value: 15 * 60 },
  { label: "1 Hour", value: 60 * 60 },
  { label: "6 Hours", value: 6 * 60 * 60 },
  { label: "1 Day", value: 24 * 60 * 60 },
  { label: "7 Days", value: 7 * 24 * 60 * 60 },
];

function ShareLinkModal({
  onClose,
  generateShareLink,
  sharedFileName,
  sharedFileKey,
  showToast,
}) {
  const [generatedLink, setGeneratedLink] = useState("");
  // Default to 15 minutes (first option's value)
  const [selectedDuration, setSelectedDuration] = useState(
    DURATION_OPTIONS[0].value
  );
  const linkInputRef = useRef(null);

  // Effect to automatically generate link when modal opens or duration changes
  useEffect(() => {
    const generateLink = async () => {
      if (sharedFileKey && selectedDuration) {
        const url = await generateShareLink(sharedFileKey, selectedDuration);
        setGeneratedLink(url);
      }
    };
    generateLink();
  }, [sharedFileKey, selectedDuration, generateShareLink]);

  // Function to copy link to clipboard
  const handleCopyLink = useCallback(() => {
    if (linkInputRef.current) {
      linkInputRef.current.select();
      document.execCommand("copy"); // Use document.execCommand for broader compatibility in iframes
      showToast("Link copied to clipboard!", "success");
      onClose(); // Automatically close modal after copying
    }
  }, [showToast, onClose]);

  // Function to handle duration button clicks
  const handleDurationChange = useCallback((duration) => {
    setSelectedDuration(duration);
    // Link generation will be triggered by the useEffect when selectedDuration changes
  }, []);

  return (
    <div className="fixed inset-0 bg-modal-overlay flex items-center justify-center p-4 z-50">
      <div className="bg-secondary rounded-lg shadow-xl p-6 w-full max-w-md transform transition-all scale-100 opacity-100">
        <div className="flex justify-between items-start mb-4">
          <h3 className="text-xl font-semibold text-primary">
            Share File:{" "}
            <span id="sharedFileName" className="text-accent">
              {sharedFileName}
            </span>
          </h3>
          <button
            onClick={onClose}
            className="text-secondary-pop hover:text-primary transition-colors duration-200"
          >
            <i className="fas fa-times text-xl"></i>
          </button>
        </div>

        <div className="mb-4">
          <label
            htmlFor="shareLink"
            className="block text-sm font-medium text-secondary mb-2"
          >
            Generated Share Link:
          </label>
          <input
            type="text"
            id="shareLink"
            ref={linkInputRef}
            readOnly
            value={generatedLink}
            className="w-full p-2 border border-input-border rounded-md bg-transparent text-primary focus:outline-none focus:ring-2 focus:ring-accent"
            placeholder="Generating link..."
          />
        </div>

        <div className="mb-4">
          <label className="block text-sm font-medium text-secondary mb-2">
            Link Duration:
          </label>
          <div className="flex flex-wrap gap-2">
            {DURATION_OPTIONS.map((option) => (
              <button
                key={option.value}
                onClick={() => handleDurationChange(option.value)}
                className={`px-3 py-1 rounded-md text-sm transition-colors duration-200
                  ${
                    selectedDuration === option.value
                      ? "bg-btn-primary-bg text-btn-primary-text" // Highlighted
                      : "bg-btn-secondary-bg text-btn-secondary-text hover:bg-gray-200 dark:hover:bg-gray-700" // Normal
                  }`}
              >
                {option.label}
              </button>
            ))}
          </div>
        </div>

        <div className="flex justify-end space-x-3">
          <button
            onClick={handleCopyLink}
            className="btn-primary px-4 py-2 rounded-md"
            disabled={!generatedLink} // Disable if no link is generated yet
          >
            Copy Link
          </button>
          <button
            onClick={onClose}
            className="btn-secondary px-4 py-2 rounded-md"
          >
            Cancel
          </button>
        </div>
      </div>
    </div>
  );
}

export default ShareLinkModal;
