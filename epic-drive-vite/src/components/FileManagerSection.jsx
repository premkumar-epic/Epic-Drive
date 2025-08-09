import React from "react";
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
    setFilterType(newFilterType);
    listFilesInCurrentFolder(currentPrefix, searchQuery, newFilterType);
  };

  return (
    <section
      id="file-manager-section"
      className="file-manager-section bg-secondary p-6 rounded-lg shadow-md"
    >
      <h2 className="text-2xl font-semibold mb-4 text-primary">File Manager</h2>

      {/* Breadcrumbs */}
      <nav className="text-sm mb-4 flex items-center">
        <ol className="list-none p-0 inline-flex flex-wrap items-center">
          {/* Home/Root button */}
          <li className="flex items-center">
            <button
              onClick={() => navigateToFolder("")} // Navigate to root
              className={`text-accent hover:underline focus:outline-none flex items-center ${
                currentPrefix === ""
                  ? "text-secondary-pop cursor-default no-underline"
                  : ""
              }`}
              disabled={currentPrefix === ""} // Disable if already at root
            >
              <i className="fas fa-home mr-1"></i> Root
            </button>
          </li>

          {/* Dynamic Breadcrumbs */}
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
              type="submit"
              id="searchButton"
              className="px-3 py-2 bg-btn-secondary-bg text-btn-secondary-text hover:bg-gray-200 dark:hover:bg-gray-700 transition-colors duration-200"
            >
              <i className="fas fa-search"></i>
            </button>
          </form>

          <div className="relative dropdown">
            <button
              id="filterButton"
              className="btn-secondary px-4 py-2 rounded-md text-sm dropdown-toggle"
              type="button"
            >
              <i className="fas fa-filter mr-2"></i> Filter:{" "}
              <span id="currentFilterText">
                {filterType.charAt(0).toUpperCase() + filterType.slice(1)}
              </span>
            </button>
            <div
              id="filterDropdown"
              className="dropdown-menu absolute right-0 mt-2 w-48 rounded-md shadow-lg hidden"
            >
              <div
                className="py-1"
                role="menu"
                aria-orientation="vertical"
                aria-labelledby="filterButton"
              >
                <button
                  className="block w-full text-left px-4 py-2 text-sm dropdown-item filter-option"
                  data-filter="all"
                  role="menuitem"
                  onClick={() => handleFilterChange("all")}
                >
                  All Files
                </button>
                <button
                  className="block w-full text-left px-4 py-2 text-sm dropdown-item filter-option"
                  data-filter="folders"
                  role="menuitem"
                  onClick={() => handleFilterChange("folders")}
                >
                  Folders
                </button>
                <button
                  className="block w-full text-left px-4 py-2 text-sm dropdown-item filter-option"
                  data-filter="documents"
                  role="menuitem"
                  onClick={() => handleFilterChange("documents")}
                >
                  Documents
                </button>
                <button
                  className="block w-full text-left px-4 py-2 text-sm dropdown-item filter-option"
                  data-filter="images"
                  role="menuitem"
                  onClick={() => handleFilterChange("images")}
                >
                  Images
                </button>
                <button
                  className="block w-full text-left px-4 py-2 text-sm dropdown-item filter-option"
                  data-filter="videos"
                  role="menuitem"
                  onClick={() => handleFilterChange("videos")}
                >
                  Videos
                </button>
                <button
                  className="block w-full text-left px-4 py-2 text-sm dropdown-item filter-option"
                  data-filter="audio"
                  role="menuitem"
                  onClick={() => handleFilterChange("audio")}
                >
                  Audio
                </button>
                <button
                  className="block w-full text-left px-4 py-2 text-sm dropdown-item filter-option"
                  data-filter="code"
                  role="menuitem"
                  onClick={() => handleFilterChange("code")}
                >
                  Code
                </button>
                <button
                  className="block w-full text-left px-4 py-2 text-sm dropdown-item filter-option"
                  data-filter="archives"
                  role="menuitem"
                  onClick={() => handleFilterChange("archives")}
                >
                  Archives
                </button>
                <button
                  className="block w-full text-left px-4 py-2 text-sm dropdown-item filter-option"
                  data-filter="other"
                  role="menuitem"
                  onClick={() => handleFilterChange("other")}
                >
                  Other
                </button>
              </div>
            </div>
          </div>
        </div>
      </div>

      {/* Back button positioned above the table */}
      {currentPrefix !== "" && (
        <div className="mb-4">
          {" "}
          {/* Added margin-bottom for spacing */}
          <button
            onClick={() =>
              navigateToFolder(
                breadcrumbs[breadcrumbs.length - 2]?.prefix || ""
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
