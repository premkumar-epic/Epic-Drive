import React, { useCallback } from "react";

function UploadItem({ upload, onCancel }) {
  const getStatusIcon = (status) => {
    switch (status) {
      case "uploading":
        return "fas fa-sync-alt fa-spin text-accent"; // Spinning icon
      case "completed":
        return "fas fa-check-circle text-green-500";
      case "failed":
        return "fas fa-exclamation-circle text-red-500";
      case "cancelled":
        return "fas fa-times-circle text-gray-500"; // Gray for cancelled
      default:
        return "fas fa-info-circle text-gray-500";
    }
  };

  const getProgressColor = (status) => {
    if (status === "completed") return "bg-green-500";
    if (status === "failed" || status === "cancelled") return "bg-red-500";
    return "bg-accent"; // Default blue for uploading
  };

  // Function to truncate filename to show start and extension
  const truncateFileName = useCallback((fileName, charsToShowStart = 15) => {
    const lastDotIndex = fileName.lastIndexOf(".");
    let nameWithoutExtension = fileName;
    let extension = "";

    if (lastDotIndex !== -1 && lastDotIndex > fileName.lastIndexOf("/")) {
      nameWithoutExtension = fileName.substring(0, lastDotIndex);
      extension = fileName.substring(lastDotIndex); // Includes the dot
    }

    // If the name without extension is short enough, just return the full name
    if (nameWithoutExtension.length <= charsToShowStart) {
      return fileName;
    }

    // Combine truncated start with extension
    return `${nameWithoutExtension.substring(
      0,
      charsToShowStart
    )}...${extension}`;
  }, []);

  const handleCancelClick = useCallback(() => {
    if (
      onCancel &&
      (upload.status === "uploading" || upload.status === "pending")
    ) {
      // Only allow cancellation if actively uploading
      onCancel(upload.id);
    }
  }, [onCancel, upload.id, upload.status]);

  return (
    <div className="upload-item flex items-center space-x-3 text-sm text-text-primary pr-2">
      {" "}
      {/* Added pr-2 for spacing with scrollbar */}
      <i
        className={getStatusIcon(upload.status)}
        style={{ minWidth: "20px", textAlign: "center" }}
      ></i>{" "}
      {/* Fixed width for icon to prevent shift */}
      <div className="flex-grow min-w-0">
        {" "}
        {/* min-w-0 important for flex item truncation */}
        <div className="flex justify-between items-center mb-0.5">
          <span className="truncate flex-grow" title={upload.name}>
            {" "}
            {/* flex-grow for truncation */}
            {truncateFileName(upload.name)}
          </span>
          <span
            className="text-secondary-pop text-xs ml-2"
            style={{ minWidth: "80px", textAlign: "right" }}
          >
            {" "}
            {/* Increased width for message/percentage */}
            {upload.status === "uploading"
              ? `${upload.progress}%`
              : upload.displayMessage}
          </span>
        </div>
        <div className="progress-bar-background w-full bg-gray-200 dark:bg-gray-700 rounded-full h-1.5 overflow-hidden">
          <div
            className={`progress-bar ${getProgressColor(
              upload.status
            )} h-full rounded-full`}
            style={{ width: `${upload.progress}%` }}
          ></div>
        </div>
      </div>
      {(upload.status === "uploading" || upload.status === "pending") && ( // Show cancel button only if pending or uploading
        <button
          className="ml-2 text-secondary-pop hover:text-primary p-1 rounded-full hover:bg-gray-100 dark:hover:bg-gray-700 transition-colors duration-200"
          onClick={handleCancelClick}
          title="Cancel Upload"
        >
          <i className="fas fa-times text-xs"></i>
        </button>
      )}
    </div>
  );
}

export default UploadItem;
