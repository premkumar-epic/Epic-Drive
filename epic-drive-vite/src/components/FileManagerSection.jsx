import React, { useState, useEffect, useRef } from "react";
import FileRow from "./FileRow.jsx";

function FileManagerSection({
  fileManagerStatus,
  fileList,
  currentPrefix,
  navigateToFolder,
  uploadFile,
  deleteFileOrFolder,
  downloadFile,
  createNewFolder,
  setShowCreateFolderModal,
  setShowShareModal,
  setSharedFileName,
  setSharedFileKey,
  listFilesInCurrentFolder,
  searchQuery,
  setSearchQuery,
  filterType,
  setFilterType,
  showToast,
  getBreadcrumbs,
}) {
  const breadcrumbs = getBreadcrumbs();
  const [showFilterDropdown, setShowFilterDropdown] = useState(false);
  const filterDropdownRef = useRef(null);
  const filterButtonRef = useRef(null);

  const handleFileUpload = (event) => {
    const file = event.target.files[0];
    if (file) {
      uploadFile(file);
    }
  };

  const handleNewFolderClick = () => {
    setShowCreateFolderModal(true);
  };

  const handleSearchChange = (event) => {
    setSearchQuery(event.target.value);
  };

  const handleSearchSubmit = (event) => {
    event.preventDefault(); // Prevent page reload
    listFilesInCurrentFolder(currentPrefix, searchQuery, filterType);
  };

  const handleFilterChange = (newFilterType) => {
    // console.log('FileManagerSection: handleFilterChange called with:', newFilterType); // Debug log
    setFilterType(newFilterType);
    listFilesInCurrentFolder(currentPrefix, searchQuery, newFilterType);
    setShowFilterDropdown(false); // Close dropdown after selection
  };

  const toggleFilterDropdown = () => {
    setShowFilterDropdown((prev) => !prev);
  };

  useEffect(() => {
    const handleClickOutside = (event) => {
      if (
        filterDropdownRef.current &&
        !filterDropdownRef.current.contains(event.target) &&
        filterButtonRef.current &&
        !filterButtonRef.current.contains(event.target)
      ) {
        setShowFilterDropdown(false);
      }
    };

    document.addEventListener("mousedown", handleClickOutside);
    return () => {
      document.removeEventListener("mousedown", handleClickOutside);
    };
  }, []);

  return (
    <section
      id="file-manager-section"
      className="file-manager-section bg-secondary p-6 rounded-lg shadow-md"
    >
      <h2 className="text-2xl font-semibold mb-4 text-primary">File Manager</h2>

      {/* Breadcrumbs */}
      <nav className="text-sm mb-4 flex items-center">
        <ol className="list-none p-0 inline-flex flex-wrap items-center">
          <li className="flex items-center">
            <button
              type="button" // Explicitly set type to button
              onClick={() => navigateToFolder("")}
              className={`text-accent hover:underline focus:outline-none flex items-center ${
                currentPrefix === ""
                  ? "text-secondary-pop cursor-default no-underline"
                  : ""
              }`}
              disabled={currentPrefix === ""}
            >
              <i className="fas fa-home mr-1"></i> Root
            </button>
          </li>

          {breadcrumbs
            .filter((crumb) => crumb.name !== "Root" && crumb.prefix !== "")
            .map((crumb, index) => (
              <li key={crumb.prefix} className="flex items-center">
                <span className="mx-2 text-secondary-pop">/</span>
                {crumb.prefix === currentPrefix ? (
                  <span className="text-secondary-pop cursor-default">
                    {crumb.name}
                  </span>
                ) : (
                  <button
                    type="button" // Explicitly set type to button
                    onClick={() => navigateToFolder(crumb.prefix)}
                    className="text-accent hover:underline focus:outline-none"
                  >
                    {crumb.name}
                  </button>
                )}
              </li>
            ))}
        </ol>
      </nav>

      {/* Controls Bar */}
      <div className="controls-bar flex justify-between items-center mb-6 flex-wrap gap-4">
        {/* Left Group: Upload & New Folder */}
        <div className="upload-controls flex items-center space-x-3 flex-wrap gap-2">
          <label
            htmlFor="fileUploadInput"
            className="btn-primary px-4 py-2 rounded-md cursor-pointer text-sm"
          >
            <i className="fas fa-upload mr-2"></i> Upload File
          </label>
          <input
            type="file"
            id="fileUploadInput"
            className="hidden"
            onChange={handleFileUpload}
          />
          <button
            type="button" // Explicitly set type to button
            id="newFolderButton"
            className="btn-secondary px-4 py-2 rounded-md text-sm"
            onClick={handleNewFolderClick}
          >
            <i className="fas fa-folder-plus mr-2"></i> New Folder
          </button>
        </div>

        {/* Right Group: Search & Filter */}
        <div className="search-filter-controls flex items-center space-x-3 flex-wrap gap-2 flex-grow">
          <form
            onSubmit={handleSearchSubmit}
            className="search-input-group flex rounded-md overflow-hidden border border-input-border focus-within:ring-2 focus-within:ring-accent flex-grow"
          >
            <input
              type="text"
              id="searchFilesInput"
              className="px-3 py-2 bg-transparent text-primary placeholder-placeholder-color focus:outline-none flex-grow"
              placeholder="Search files..."
              value={searchQuery}
              onChange={handleSearchChange}
            />
            <button
              type="submit" // This is intentionally submit for search form
              id="searchButton"
              className="px-3 py-2 bg-btn-secondary-bg text-btn-secondary-text hover:bg-gray-200 dark:hover:bg-gray-700 transition-colors duration-200"
            >
              <i className="fas fa-search"></i>
            </button>
          </form>

          <div className="relative dropdown">
            <button
              type="button" // Explicitly set type to button
              id="filterButton"
              ref={filterButtonRef}
              className="btn-secondary px-4 py-2 rounded-md text-sm dropdown-toggle"
              onClick={toggleFilterDropdown}
            >
              <i className="fas fa-filter mr-2"></i> Filter:{" "}
              <span id="currentFilterText">
                {filterType.charAt(0).toUpperCase() + filterType.slice(1)}
              </span>
            </button>
            {showFilterDropdown && (
              <div
                id="filterDropdown"
                ref={filterDropdownRef}
                className="dropdown-menu absolute right-0 mt-2 w-48 rounded-md shadow-lg"
              >
                <div
                  className="py-1"
                  role="menu"
                  aria-orientation="vertical"
                  aria-labelledby="filterButton"
                >
                  <button
                    type="button" // Crucial: Set type to button
                    className={`block w-full text-left px-4 py-2 text-sm dropdown-item ${
                      filterType === "all" ? "bg-gray-100 dark:bg-gray-700" : ""
                    }`}
                    data-filter="all"
                    role="menuitem"
                    onClick={() => handleFilterChange("all")}
                  >
                    All Files
                  </button>
                  <button
                    type="button" // Crucial: Set type to button
                    className={`block w-full text-left px-4 py-2 text-sm dropdown-item ${
                      filterType === "folders"
                        ? "bg-gray-100 dark:bg-gray-700"
                        : ""
                    }`}
                    data-filter="folders"
                    role="menuitem"
                    onClick={() => handleFilterChange("folders")}
                  >
                    Folders
                  </button>
                  <button
                    type="button" // Crucial: Set type to button
                    className={`block w-full text-left px-4 py-2 text-sm dropdown-item ${
                      filterType === "documents"
                        ? "bg-gray-100 dark:bg-gray-700"
                        : ""
                    }`}
                    data-filter="documents"
                    role="menuitem"
                    onClick={() => handleFilterChange("documents")}
                  >
                    Documents
                  </button>
                  <button
                    type="button" // Crucial: Set type to button
                    className={`block w-full text-left px-4 py-2 text-sm dropdown-item ${
                      filterType === "images"
                        ? "bg-gray-100 dark:bg-gray-700"
                        : ""
                    }`}
                    data-filter="images"
                    role="menuitem"
                    onClick={() => handleFilterChange("images")}
                  >
                    Images
                  </button>
                  <button
                    type="button" // Crucial: Set type to button
                    className={`block w-full text-left px-4 py-2 text-sm dropdown-item ${
                      filterType === "videos"
                        ? "bg-gray-100 dark:bg-gray-700"
                        : ""
                    }`}
                    data-filter="videos"
                    role="menuitem"
                    onClick={() => handleFilterChange("videos")}
                  >
                    Videos
                  </button>
                  <button
                    type="button" // Crucial: Set type to button
                    className={`block w-full text-left px-4 py-2 text-sm dropdown-item ${
                      filterType === "audio"
                        ? "bg-gray-100 dark:bg-gray-700"
                        : ""
                    }`}
                    data-filter="audio"
                    role="menuitem"
                    onClick={() => handleFilterChange("audio")}
                  >
                    Audio
                  </button>
                  <button
                    type="button" // Crucial: Set type to button
                    className={`block w-full text-left px-4 py-2 text-sm dropdown-item ${
                      filterType === "code"
                        ? "bg-gray-100 dark:bg-gray-700"
                        : ""
                    }`}
                    data-filter="code"
                    role="menuitem"
                    onClick={() => handleFilterChange("code")}
                  >
                    Code
                  </button>
                  <button
                    type="button" // Crucial: Set type to button
                    className={`block w-full text-left px-4 py-2 text-sm dropdown-item ${
                      filterType === "archives"
                        ? "bg-gray-100 dark:bg-gray-700"
                        : ""
                    }`}
                    data-filter="archives"
                    role="menuitem"
                    onClick={() => handleFilterChange("archives")}
                  >
                    Archives
                  </button>
                  <button
                    type="button" // Crucial: Set type to button
                    className={`block w-full text-left px-4 py-2 text-sm dropdown-item ${
                      filterType === "other"
                        ? "bg-gray-100 dark:bg-gray-700"
                        : ""
                    }`}
                    data-filter="other"
                    role="menuitem"
                    onClick={() => handleFilterChange("other")}
                  >
                    Other
                  </button>
                </div>
              </div>
            )}
          </div>
        </div>
      </div>

      {/* Back button positioned above the table */}
      {currentPrefix !== "" && (
        <div className="mb-4">
          <button
            type="button" // Explicitly set type to button
            onClick={() =>
              navigateToFolder(
                getBreadcrumbs()[getBreadcrumbs().length - 2]?.prefix || ""
              )
            }
            className="btn-secondary px-3 py-1.5 rounded-md text-sm flex items-center"
          >
            <i className="fas fa-arrow-left mr-1"></i> Back
          </button>
        </div>
      )}

      {/* File List Table */}
      <div className="file-list-container overflow-x-auto rounded-lg shadow-inner">
        <table className="min-w-full divide-y divide-border rounded-lg overflow-hidden">
          <thead className="bg-header-bg">
            <tr>
              <th className="px-6 py-3 text-left text-xs font-medium text-secondary-pop uppercase tracking-wider">
                Name
              </th>
              <th className="px-6 py-3 text-right text-xs font-medium text-secondary-pop uppercase tracking-wider w-[90px]">
                Size
              </th>
              <th className="px-6 py-3 text-right text-xs font-medium text-secondary-pop uppercase tracking-wider w-[140px]">
                Last Modified
              </th>
              <th className="px-6 py-3 text-right text-xs font-medium text-secondary-pop uppercase tracking-wider w-[100px]">
                Actions
              </th>
            </tr>
          </thead>
          <tbody className="bg-secondary divide-y divide-border">
            {fileList.length > 0 ? (
              fileList.map((item) => (
                <FileRow
                  key={item.Key}
                  item={item}
                  navigateToFolder={navigateToFolder}
                  deleteFileOrFolder={deleteFileOrFolder}
                  downloadFile={downloadFile}
                  setShowShareModal={setShowShareModal}
                  setSharedFileName={setSharedFileName}
                  setSharedFileKey={setSharedFileKey}
                  showToast={showToast}
                />
              ))
            ) : (
              <tr>
                <td
                  colSpan="4"
                  className="px-6 py-4 text-center text-secondary-pop"
                >
                  No files or folders found.
                </td>
              </tr>
            )}
          </tbody>
        </table>
      </div>

      {/* Status Message */}
      <div
        id="fileManagerStatus"
        className="text-center text-secondary-pop mt-4"
      >
        {fileManagerStatus}
      </div>
    </section>
  );
}

export default FileManagerSection;
