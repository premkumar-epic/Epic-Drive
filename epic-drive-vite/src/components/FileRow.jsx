import React, { useCallback } from "react";

function FileRow({
  item,
  navigateToFolder,
  deleteFileOrFolder,
  downloadFile,
  setShowShareModal,
  setSharedFileName,
  setSharedFileKey,
  showToast, // Receive showToast prop
}) {
  const isFolder = item.Type === "folder";

  const formatFileSize = (bytes) => {
    if (bytes === null) return "";
    if (bytes === 0) return "0 Bytes";
    const k = 1024;
    const sizes = ["Bytes", "KB", "MB", "GB", "TB"];
    const i = Math.floor(Math.log(bytes) / Math.log(k));
    return parseFloat((bytes / Math.pow(k, i)).toFixed(2)) + " " + sizes[i];
  };

  const getFileIcon = (type) => {
    switch (type) {
      case "folder":
        return "fas fa-folder";
      case "image":
        return "fas fa-file-image";
      case "video":
        return "fas fa-file-video";
      case "audio":
        return "fas fa-file-audio";
      case "document":
        return "fas fa-file-word"; // More specific for word docs
      case "spreadsheet":
        return "fas fa-file-excel";
      case "presentation":
        return "fas fa-file-powerpoint";
      case "pdf":
        return "fas fa-file-pdf";
      case "archive":
        return "fas fa-file-archive";
      case "code":
        return "fas fa-file-code";
      case "text":
        return "fas fa-file-alt"; // For plain text, markdown, csv
      default:
        return "fas fa-file";
    }
  };

  // Function to truncate long file names with ellipsis for display
  const truncateFileName = (fileName, maxLength = 30, charsToShowEnd = 8) => {
    if (fileName.length <= maxLength) {
      return fileName;
    }

    const lastDotIndex = fileName.lastIndexOf(".");
    let nameWithoutExtension = fileName;
    let extension = "";

    if (lastDotIndex !== -1 && lastDotIndex > fileName.lastIndexOf("/")) {
      nameWithoutExtension = fileName.substring(0, lastDotIndex);
      extension = fileName.substring(lastDotIndex);
    }

    const ellipsisLength = 3; // "..."
    const totalFixedLength = charsToShowEnd + extension.length + ellipsisLength;

    if (maxLength <= totalFixedLength) {
      return fileName.substring(0, maxLength - ellipsisLength) + "...";
    }

    const startLength = maxLength - totalFixedLength;

    return `${nameWithoutExtension.substring(
      0,
      startLength
    )}...${nameWithoutExtension.substring(
      nameWithoutExtension.length - charsToShowEnd
    )}${extension}`;
  };

  const handleShareClick = useCallback(() => {
    // console.log("FileRow: Share button clicked for item:", item.Name); // Debug log
    if (typeof setSharedFileName === "function") {
      setSharedFileName(item.Name);
    }
    if (typeof setSharedFileKey === "function") {
      setSharedFileKey(item.Key);
    }
    if (typeof setShowShareModal === "function") {
      setShowShareModal(true);
      // Trigger toast immediately when share button is clicked, preventing duplicates from modal's useEffect
      showToast(`Generating share link for ${item.Name}...`, "info");
    }
  }, [
    item.Name,
    item.Key,
    setSharedFileName,
    setSharedFileKey,
    setShowShareModal,
    showToast, // Added showToast to dependencies
  ]);

  return (
    <tr
      className="file-item-row"
      style={{
        backgroundColor: "var(--bg-secondary)",
        color: "var(--text-primary)",
      }}
    >
      {/* Column 1: File Name and Icon (left-aligned) */}
      <td className="px-6 py-3 text-left max-w-xs">
        <div className="flex items-center whitespace-nowrap overflow-hidden">
          <i
            className={`${getFileIcon(item.Type)} mr-3 flex-shrink-0 ${
              isFolder ? "text-folder-icon" : "text-file-icon"
            }`}
            style={{
              color: isFolder
                ? "var(--folder-icon-color)"
                : "var(--file-icon-color)",
            }}
          ></i>
          {isFolder ? (
            <button
              className="text-accent hover:underline focus:outline-none file-name-text overflow-hidden text-ellipsis"
              onClick={() => navigateToFolder(item.Key)}
              title={item.Name} // Add title for hover tooltip
            >
              {truncateFileName(item.Name)}
            </button>
          ) : (
            <span
              className="file-name-text overflow-hidden text-ellipsis"
              title={item.Name}
            >
              {" "}
              {/* Add title for hover tooltip */}
              {truncateFileName(item.Name)}
            </span>
          )}
        </div>
      </td>

      {/* Column 2: Size (right-aligned) */}
      <td className="px-6 py-3 whitespace-nowrap text-sm font-medium text-right">
        <span className="text-secondary-pop">
          {isFolder ? "-" : formatFileSize(item.Size)}
        </span>
      </td>

      {/* Column 3: Last Modified (Date & Time, right-aligned) */}
      <td className="px-6 py-3 whitespace-nowrap text-sm font-medium text-right">
        <span className="text-secondary-pop">
          {item.LastModified
            ? new Date(item.LastModified).toLocaleString("en-US", {
                year: "numeric",
                month: "2-digit",
                day: "2-digit",
                hour: "2-digit",
                minute: "2-digit",
                hour12: true, // Ensure AM/PM format, no seconds
              })
            : ""}
        </span>
      </td>

      {/* Column 4: Action Buttons (right-aligned) */}
      <td className="pr-6 py-3 whitespace-nowrap text-sm font-medium text-right">
        <div className="flex items-center justify-end space-x-1.5 flex-shrink-0">
          {" "}
          {/* space-x-1.5 for button padding */}
          {!isFolder && (
            <button
              className="px-2 py-1 rounded-md transition-colors duration-200"
              style={{
                backgroundColor: "var(--action-btn-download-bg)",
                color: "var(--action-btn-text)",
              }}
              onClick={() => downloadFile(item.Key, item.Name)}
              title="Download File"
            >
              <i className="fas fa-download"></i>
            </button>
          )}
          {!isFolder && (
            <button
              className="px-2 py-1 rounded-md transition-colors duration-200"
              style={{
                backgroundColor: "var(--action-btn-share-bg)",
                color: "var(--action-btn-text)",
              }}
              onClick={handleShareClick}
              title="Share File"
            >
              <i className="fas fa-share-alt"></i>
            </button>
          )}
          <button
            className="px-2 py-1 rounded-md transition-colors duration-200"
            style={{
              backgroundColor: "var(--action-btn-delete-bg)",
              color: "var(--action-btn-text)",
            }}
            onClick={() => deleteFileOrFolder(item.Key, isFolder)}
            title="Delete Item"
          >
            <i className="fas fa-trash"></i>
          </button>
        </div>
      </td>
    </tr>
  );
}

export default FileRow;
