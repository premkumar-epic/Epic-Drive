import React, { useCallback } from "react";

function FileRow({
  item,
  navigateToFolder,
  deleteFileOrFolder,
  downloadFile,
  setShowShareModal,
  setSharedFileName,
  setSharedFileKey,
  showToast,
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

  // Function to truncate long file names, prioritizing showing path context.
  // Only the *last part* of the path (the actual file/folder name) is truncated.
  const truncateFileName = (
    fullRelativePath,
    maxLength = 30,
    charsToShowEnd = 8
  ) => {
    const pathParts = fullRelativePath.split("/");
    const lastPart = pathParts.pop(); // Get the file/folder name part

    if (!lastPart) {
      // Handle cases like "folder/" where pop() might return ""
      return fullRelativePath;
    }

    if (lastPart.length <= maxLength) {
      return fullRelativePath; // Return full path if the last part is short enough
    }

    const lastDotIndex = lastPart.lastIndexOf(".");
    let nameWithoutExtension = lastPart;
    let extension = "";

    if (lastDotIndex !== -1 && lastDotIndex > 0) {
      nameWithoutExtension = lastPart.substring(0, lastDotIndex);
      extension = lastPart.substring(lastDotIndex);
    }

    const ellipsisLength = 3;
    const totalFixedLength = charsToShowEnd + extension.length + ellipsisLength;

    if (maxLength <= totalFixedLength) {
      // If even the truncated last part would exceed maxLength, just truncate the last part very simply
      const truncated =
        lastPart.substring(0, maxLength - ellipsisLength) + "...";
      return pathParts.length > 0
        ? pathParts.join("/") + "/" + truncated
        : truncated;
    }

    const startLength = maxLength - totalFixedLength;

    const truncatedLastPart = `${nameWithoutExtension.substring(
      0,
      startLength
    )}...${nameWithoutExtension.substring(
      nameWithoutExtension.length - charsToShowEnd
    )}${extension}`;

    // Reconstruct the path with the truncated last part
    return pathParts.length > 0
      ? pathParts.join("/") + "/" + truncatedLastPart
      : truncatedLastPart;
  };

  const handleShareClick = useCallback(() => {
    if (typeof setSharedFileName === "function") {
      setSharedFileName(item.Name);
    }
    if (typeof setSharedFileKey === "function") {
      setSharedFileKey(item.Key);
    }
    if (typeof setShowShareModal === "function") {
      setShowShareModal(true);
      showToast(`Generating share link for ${item.Name}...`, "info");
    }
  }, [
    item.Name,
    item.Key,
    setSharedFileName,
    setSharedFileKey,
    setShowShareModal,
    showToast,
  ]);

  // Handle click on the file/folder name
  const handleItemClick = useCallback(() => {
    if (isFolder) {
      // If it's a folder, navigate directly to its key (which is a prefix)
      navigateToFolder(item.Key);
    } else {
      // If it's a file, navigate to its parent directory
      const lastSlashIndex = item.Key.lastIndexOf("/");
      if (lastSlashIndex !== -1) {
        const parentFolderPrefix = item.Key.substring(0, lastSlashIndex + 1);
        navigateToFolder(parentFolderPrefix);
      } else {
        // If no slash, it's in the root, navigate to root
        navigateToFolder("");
      }
    }
  }, [isFolder, item.Key, navigateToFolder]);

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
          <button
            className="text-accent hover:underline focus:outline-none file-name-text overflow-hidden text-ellipsis"
            onClick={handleItemClick} // Use the new handler here
            title={item.Name} // Original full relative path for hover tooltip
          >
            {truncateFileName(item.Name)}{" "}
            {/* Display truncated relative path */}
          </button>
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
