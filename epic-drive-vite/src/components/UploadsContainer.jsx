import React from "react";
import UploadItem from "./UploadItem.jsx";

function UploadsContainer({ uploads, onCancelUpload }) {
  // Filter out completed/failed/cancelled uploads to only show active ones in the count
  const uploadingItems = uploads.filter(
    (u) => u.status === "uploading" || u.status === "pending"
  );
  const uploadingCount = uploadingItems.length;

  if (uploads.length === 0) {
    return null; // Don't render if there are no active uploads
  }

  return (
    <div className="uploads-container fixed bottom-4 right-4 z-50">
      <div className="upload-header main-card-bg rounded-t-lg shadow-lg py-2 px-4 flex justify-between items-center text-sm font-semibold border-b border-border">
        <span className="text-text-primary">
          Uploading {uploadingCount} item{uploadingCount !== 1 ? "s" : ""}
        </span>
        {/* Placeholder for expand/collapse or close all functionality if needed later */}
        {/* You could add a button here to clear all completed/failed uploads */}
        {/* <div className="flex space-x-2">
            <button className="text-secondary-pop hover:text-primary">
                <i className="fas fa-times"></i>
            </button>
        </div> */}
      </div>
      <div className="upload-items-list main-card-bg rounded-b-lg shadow-lg">
        {/* Only show a maximum number of items (e.g., 4 to match the image or more) */}
        {/* Adjust max-height in CSS for visual fit; items will overflow if too many */}
        {uploads.map((upload) => (
          <UploadItem
            key={upload.id}
            upload={upload}
            onCancel={onCancelUpload}
          />
        ))}
      </div>
    </div>
  );
}

export default UploadsContainer;
