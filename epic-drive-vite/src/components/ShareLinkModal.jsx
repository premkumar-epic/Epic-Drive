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
  const [selectedDuration, setSelectedDuration] = useState(
    DURATION_OPTIONS[0].value
  );
  const linkInputRef = useRef(null);
  const isInitialMount = useRef(true); // Ref to track initial mount for StrictMode

  // Function to truncate long file names for display in the modal title
  // It shows the start and end of the file name with ellipsis in between
  const truncateFileNameForModal = useCallback(
    (fileName, charsToShowStart = 10, charsToShowEnd = 10) => {
      const lastDotIndex = fileName.lastIndexOf(".");
      let nameWithoutExtension = fileName;
      let extension = "";

      if (lastDotIndex !== -1 && lastDotIndex > fileName.lastIndexOf("/")) {
        // Check if it's a file with an extension
        nameWithoutExtension = fileName.substring(0, lastDotIndex);
        extension = fileName.substring(lastDotIndex); // includes the dot
      }

      const totalDesiredLength =
        charsToShowStart + 3 + charsToShowEnd + extension.length; // 3 for "..."

      if (fileName.length <= totalDesiredLength) {
        return fileName; // No need to truncate
      }

      // Ensure we don't try to get negative substrings if parts are too short
      const actualStartChars = Math.min(
        charsToShowStart,
        nameWithoutExtension.length
      );
      const actualEndChars = Math.min(
        charsToShowEnd,
        nameWithoutExtension.length - actualStartChars
      );

      const truncatedStart = nameWithoutExtension.substring(
        0,
        actualStartChars
      );
      const truncatedEnd = nameWithoutExtension.substring(
        nameWithoutExtension.length - actualEndChars
      );

      return `${truncatedStart}...${truncatedEnd}${extension}`;
    },
    []
  );

  // Effect to automatically generate link when modal opens or duration changes
  useEffect(() => {
    const generateLinkEffect = async () => {
      // console.log('ShareLinkModal useEffect: Running generateLinkEffect'); // Debug log
      if (isInitialMount.current || !generatedLink) {
        // Only generate if initial mount or link needs regeneration
        // Check if this is the very first render of the component
        if (sharedFileKey && selectedDuration) {
          // console.log('ShareLinkModal useEffect: Calling generateShareLink'); // Debug log
          const url = await generateShareLink(sharedFileKey, selectedDuration);
          setGeneratedLink(url);
          if (isInitialMount.current) {
            isInitialMount.current = false; // Mark initial mount complete after first generation
          }
        }
      } else {
        // console.log('ShareLinkModal useEffect: Link already generated, skipping regeneration.'); // Debug log
      }
    };
    generateLinkEffect();
  }, [sharedFileKey, selectedDuration, generateShareLink, generatedLink]);

  // Function to copy link to clipboard
  const handleCopyLink = useCallback(() => {
    if (linkInputRef.current) {
      linkInputRef.current.select();
      // For cross-browser compatibility and iframe support
      try {
        document.execCommand("copy");
        showToast("Link copied to clipboard!", "success");
        onClose(); // Automatically close modal after copying
      } catch (err) {
        console.error("Failed to copy text: ", err);
        showToast("Failed to copy link. Please copy manually.", "error");
      }
    }
  }, [showToast, onClose]);

  // Function to handle duration button clicks
  const handleDurationChange = useCallback((duration) => {
    setSelectedDuration(duration);
    setGeneratedLink(""); // Clear generated link to force re-generation when duration changes
  }, []);

  return (
    <div className="fixed inset-0 bg-modal-overlay flex items-center justify-center p-4 z-50">
      <div className="main-card-bg rounded-lg shadow-xl p-6 w-full max-w-md transform transition-all scale-100 opacity-100">
        {" "}
        {/* Ensures opaque background */}
        <div className="flex justify-between items-start mb-4">
          <h3 className="text-xl font-semibold text-primary flex-grow pr-4">
            Share File:{" "}
            <span
              id="sharedFileName"
              className="text-accent inline-block align-top"
              title={sharedFileName} // Full name on hover
              style={{ wordBreak: "break-word", whiteSpace: "normal" }} // Allow wrapping
            >
              {truncateFileNameForModal(sharedFileName)}
            </span>
          </h3>
          <button
            onClick={onClose}
            className="text-secondary-pop hover:text-primary transition-colors duration-200 flex-shrink-0"
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
                // Apply 'btn-primary' for selected, 'btn-secondary' for others
                className={
                  selectedDuration === option.value
                    ? "btn-primary" // This class should define all primary button styles
                    : "btn-secondary hover:brightness-90" // This class should define all secondary button styles
                }
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
