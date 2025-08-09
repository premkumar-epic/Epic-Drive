// --- Global Variables (will be assigned after DOMContentLoaded) ---
let accessKeyIdInput;
let secretAccessKeyInput;
let regionInput;
let bucketNameInput;
let connectButton;
let statusMessage; // Persistent connection status
let connectionSection;
let fileManagerSection;
let fileListContainer;
let fileManagerStatus; // Persistent file manager status

let fileUploadInput;
let uploadButton;

// Moved "Create New Folder" to a modal
let newFolderButton;
let createNewFolderModal;
let newFolderNameInput;
let createFolderConfirmButton;
let createFolderCancelButton;

// Search and Filter
let searchFilesInput;
let searchButton;
let filterButton; // Placeholder for future filter logic
let filterDropdown; // New: Filter dropdown
let filterOptions; // New: Filter options

// New DOM elements for header/account menu
let accountMenuButton;
let accountDropdownMenu;
let popupBucketName;
let disconnectButton;
let themeToggleDropdown;
let themeIconDropdown;
let accountIconContainer;

// Elements for new file manager header (breadcrumbs & sync)
let filePathBreadcrumbs;
let syncStatusButton;
let syncStatusIcon;
let backButton; // New back button, now on top of table

// --- Toast Notification Container ---
let toastContainer;

// --- Share Link Modal ---
let shareLinkModal;
let generatedShareLinkInput;
let copyShareLinkButton;
let closeShareModalButton;

// --- Duplicate File Modal ---
let duplicateFileModal;
let fileNameInModal;
let newFileNameInputDuplicate; // Renamed to avoid conflict
let duplicateCancelButton; // Re-using for both close and cancel
let duplicateRenameButton;
let duplicateReplaceButton;

// --- Global State Variables ---
let s3;
let currentBucket;
let currentPrefix = ""; // Represents the current "folder"
let filesToUploadQueue = [];
let currentFileBeingProcessed = null;
let currentFileOriginalName = "";
let isProcessingQueue = false;

// --- Utility Functions ---

function showToast(message, type = "info") {
  if (!toastContainer) {
    console.error("Toast container not found!");
    return;
  }
  const toast = document.createElement("div");
  toast.classList.add("toast", type);
  toast.textContent = message;
  toastContainer.appendChild(toast);

  // Automatically remove the toast after a few seconds
  setTimeout(() => {
    toast.remove();
  }, 5000); // 5 seconds
}

function showModal(modalElement) {
  if (modalElement) {
    modalElement.classList.remove("hidden");
  }
}

function hideModal(modalElement) {
  if (modalElement) {
    modalElement.classList.add("hidden");
  }
}

// --- Initialize DOM Elements Function ---
function initializeDOMElements() {
  // Connection & Status
  accessKeyIdInput = document.getElementById("accessKeyId");
  secretAccessKeyInput = document.getElementById("secretAccessKey");
  regionInput = document.getElementById("region");
  bucketNameInput = document.getElementById("bucketName");
  connectButton = document.getElementById("connectButton");
  statusMessage = document.getElementById("statusMessage");
  connectionSection = document.getElementById("connection-section");
  fileManagerSection = document.getElementById("file-manager-section");
  fileListContainer = document.getElementById("file-list");
  fileManagerStatus = document.getElementById("fileManagerStatus");

  // File Upload
  fileUploadInput = document.getElementById("fileUploadInput");
  uploadButton = document.getElementById("uploadButton");

  // Create New Folder Modal
  newFolderButton = document.getElementById("newFolderButton");
  createNewFolderModal = document.getElementById("createNewFolderModal");
  newFolderNameInput = document.getElementById("newFolderNameInput");
  createFolderConfirmButton = document.getElementById(
    "createFolderConfirmButton"
  );
  createFolderCancelButton = document.getElementById(
    "createFolderCancelButton"
  );

  // Search and Filter
  searchFilesInput = document.getElementById("searchFilesInput");
  searchButton = document.getElementById("searchButton");
  filterButton = document.getElementById("filterButton");
  filterDropdown = document.getElementById("filterDropdown");
  filterOptions = document.querySelectorAll(".filter-option"); // Get all filter options

  // Header Account Menu
  accountMenuButton = document.getElementById("accountMenuButton");
  accountDropdownMenu = document.getElementById("accountDropdownMenu");
  popupBucketName = document.getElementById("popupBucketName");
  disconnectButton = document.getElementById("disconnectButton");
  themeToggleDropdown = document.getElementById("themeToggleDropdown");
  themeIconDropdown = document.getElementById("themeIconDropdown"); // Corrected: Get the icon element
  accountIconContainer = document.getElementById("accountIconContainer");

  // File Manager Header (Breadcrumbs & Sync)
  filePathBreadcrumbs = document.getElementById("filePathBreadcrumbs");
  syncStatusButton = document.getElementById("syncStatusButton");
  syncStatusIcon = document.getElementById("syncStatusIcon");
  backButton = document.getElementById("backButton");

  // Toast Container
  toastContainer = document.getElementById("toast-container");

  // Share Link Modal
  shareLinkModal = document.getElementById("shareLinkModal");
  generatedShareLinkInput = document.getElementById("generatedShareLinkInput");
  copyShareLinkButton = document.getElementById("copyShareLinkButton");
  closeShareModalButton = document.getElementById("closeShareModalButton");

  // Duplicate File Modal
  duplicateFileModal = document.getElementById("duplicateFileModal");
  fileNameInModal = document.getElementById("fileNameInModal");
  newFileNameInputDuplicate = document.getElementById("newFileNameInput"); // Ensure correct ID
  duplicateRenameButton = document.getElementById("duplicateRenameButton");
  // Important: Use the specific ID for the cancel button, as there are two buttons with 'duplicateCancelButton' ID
  duplicateCancelButton = document.querySelector(
    "#duplicateFileModal .close-modal-button"
  ); // Select the 'x' button
  document
    .getElementById("duplicateCancelButton")
    .addEventListener("click", () => {
      hideModal(duplicateFileModal);
      showToast(`Upload for '${currentFileOriginalName}' cancelled.`, "info");
      currentFileBeingProcessed = null;
      processNextFileInQueue();
    });
  duplicateReplaceButton = document.getElementById("duplicateReplaceButton");
}

// --- AWS S3 Configuration and Connection ---
function configureS3(accessKeyId, secretAccessKey, region) {
  AWS.config.update({
    accessKeyId: accessKeyId,
    secretAccessKey: secretAccessKey,
    region: region,
  });
  s3 = new AWS.S3();
  console.log("S3 configured.");
}

function saveCredentials(accessKeyId, secretAccessKey, region, bucketName) {
  localStorage.setItem("awsAccessKeyId", accessKeyId);
  localStorage.setItem("awsSecretAccessKey", secretAccessKey);
  localStorage.setItem("awsRegion", region);
  localStorage.setItem("s3BucketName", bucketName);
  console.log("Credentials saved.");
}

function loadCredentials() {
  const accessKeyId = localStorage.getItem("awsAccessKeyId");
  const secretAccessKey = localStorage.getItem("awsSecretAccessKey");
  const region = localStorage.getItem("awsRegion");
  const bucketName = localStorage.getItem("s3BucketName");

  if (accessKeyId && secretAccessKey && region && bucketName) {
    configureS3(accessKeyId, secretAccessKey, region);
    currentBucket = bucketName;
    return true;
  }
  return false;
}

function clearCredentials() {
  localStorage.removeItem("awsAccessKeyId");
  localStorage.removeItem("awsSecretAccessKey");
  localStorage.removeItem("awsRegion");
  localStorage.removeItem("s3BucketName");
  console.log("Credentials cleared.");
}

async function connectToS3() {
  const accessKeyId = accessKeyIdInput
    ? accessKeyIdInput.value
    : localStorage.getItem("awsAccessKeyId");
  const secretAccessKey = secretAccessKeyInput
    ? secretAccessKeyInput.value
    : localStorage.getItem("awsSecretAccessKey");
  const region = regionInput
    ? regionInput.value
    : localStorage.getItem("awsRegion");
  const bucketName = bucketNameInput
    ? bucketNameInput.value
    : localStorage.getItem("s3BucketName");

  if (!accessKeyId || !secretAccessKey || !region || !bucketName) {
    showStatus("Please enter all connection details.", "error");
    return;
  }

  showStatus("Connecting...", "info");
  configureS3(accessKeyId, secretAccessKey, region);
  currentBucket = bucketName;

  try {
    // Verify connection by listing the bucket's contents
    await s3
      .listObjectsV2({
        Bucket: currentBucket,
        MaxKeys: 1, // Just check if we can access
      })
      .promise();

    saveCredentials(accessKeyId, secretAccessKey, region, bucketName);
    showStatus(`Connected to bucket: ${currentBucket}`, "success");
    showToast(`Connected to bucket: ${currentBucket}`, "success");
    connectionSection.classList.add("hidden");
    fileManagerSection.classList.remove("hidden");
    accountIconContainer.classList.remove("hidden"); // Show account icon on successful connection
    if (popupBucketName) popupBucketName.textContent = currentBucket;
    listFiles();
  } catch (error) {
    showStatus(`Connection failed: ${error.message}`, "error");
    showToast(`Connection failed: ${error.message}`, "error");
    console.error("Connection error:", error);
    // Ensure file manager is hidden and connection section is visible on error
    fileManagerSection.classList.add("hidden");
    connectionSection.classList.remove("hidden");
    accountIconContainer.classList.add("hidden"); // Hide account icon on connection failure
  }
}

function disconnectFromS3() {
  s3 = null;
  currentBucket = null;
  clearCredentials();
  showStatus("Disconnected.", "info");
  showToast("Disconnected from S3.", "info");
  fileManagerSection.classList.add("hidden");
  connectionSection.classList.remove("hidden");
  accountIconContainer.classList.add("hidden"); // Hide account icon
  if (connectButton) connectButton.textContent = "Connect"; // Reset button text
  console.log("Disconnected from S3.");
}

function showStatus(message, type) {
  if (statusMessage) {
    statusMessage.textContent = message;
    statusMessage.className = `text-center mt-4 text-sm font-medium ${
      type === "error"
        ? "text-red-600"
        : type === "success"
        ? "text-green-600"
        : "text-blue-600"
    }`;
  }
}

// --- File Management Functions ---

async function listFiles(prefix = "", searchTerm = "") {
  currentPrefix = prefix; // Update current prefix

  if (fileManagerStatus) fileManagerStatus.textContent = "Loading files...";
  if (fileListContainer) fileListContainer.innerHTML = ""; // Clear current list

  updateBreadcrumbs(); // Update breadcrumbs when listing files

  try {
    const params = {
      Bucket: currentBucket,
      Delimiter: "/", // Treat common prefixes as folders
      Prefix: prefix,
    };
    const data = await s3.listObjectsV2(params).promise();

    let filesAndFolders = [];

    // Add folders (CommonPrefixes)
    if (data.CommonPrefixes) {
      data.CommonPrefixes.forEach((commonPrefix) => {
        const folderName = commonPrefix.Prefix.replace(prefix, "").replace(
          "/",
          ""
        );
        filesAndFolders.push({
          name: folderName,
          type: "folder",
          fullPath: commonPrefix.Prefix,
          lastModified: null,
          size: null,
        });
      });
    }

    // Add files (Contents) - Filter out the "folder" entry itself if it appears as a file
    if (data.Contents) {
      data.Contents.forEach((content) => {
        // Skip if it's the current "folder" itself (e.g., a 0-byte object representing the folder)
        if (content.Key === prefix) {
          return;
        }

        const fileName = content.Key.replace(prefix, "");
        // Only add files directly in the current prefix (not nested files)
        if (fileName && !fileName.includes("/")) {
          filesAndFolders.push({
            name: fileName,
            type: "file",
            fullPath: content.Key,
            lastModified: content.LastModified,
            size: content.Size,
          });
        }
      });
    }

    // Apply search filter
    const filteredFilesAndFolders = filesAndFolders.filter((item) =>
      item.name.toLowerCase().includes(searchTerm.toLowerCase())
    );

    // Apply file type filter based on dropdown selection
    const selectedFilter = filterButton
      ? filterButton.querySelector("span").textContent.trim()
      : "All Files"; // Default to "All Files" if button not found

    const finalFilteredList = filteredFilesAndFolders.filter((item) => {
      if (item.type === "folder") return true; // Always show folders

      const fileExtension = item.name.split(".").pop().toLowerCase();
      switch (selectedFilter) {
        case "Documents":
          return ["pdf", "doc", "docx", "txt", "rtf", "odt"].includes(
            fileExtension
          );
        case "Images":
          return ["jpg", "jpeg", "png", "gif", "bmp", "svg", "webp"].includes(
            fileExtension
          );
        case "Videos":
          return ["mp4", "mov", "avi", "mkv", "webm"].includes(fileExtension);
        case "Audio":
          return ["mp3", "wav", "aac", "flac"].includes(fileExtension);
        case "Code":
          return [
            "js",
            "html",
            "css",
            "py",
            "java",
            "c",
            "cpp",
            "json",
            "xml",
          ].includes(fileExtension);
        case "Archives":
          return ["zip", "tar", "gz", "rar", "7z"].includes(fileExtension);
        case "All Files":
        default:
          return true;
      }
    });

    displayFiles(finalFilteredList);

    if (fileManagerStatus)
      fileManagerStatus.textContent = `Displaying ${finalFilteredList.length} items.`;
  } catch (error) {
    if (fileManagerStatus)
      fileManagerStatus.textContent = `Error listing files: ${error.message}`;
    showToast(`Error listing files: ${error.message}`, "error");
    console.error("Error listing files:", error);
  }
}

function displayFiles(items) {
  if (!fileListContainer) {
    console.error("fileListContainer not found!");
    return;
  }
  fileListContainer.innerHTML = ""; // Clear existing list

  if (items.length === 0) {
    fileListContainer.innerHTML =
      '<p class="text-text-secondary text-center py-8">No files or folders found.</p>';
    return;
  }

  const table = document.createElement("table");
  table.classList.add("min-w-full", "bg-bg-secondary", "shadow-md", "rounded");
  table.innerHTML = `
        <thead>
            <tr class="bg-gray-200 text-text-secondary uppercase text-sm leading-normal">
                <th class="py-3 px-6 text-left">Name</th>
                <th class="py-3 px-6 text-left">Type</th>
                <th class="py-3 px-6 text-left">Last Modified</th>
                <th class="py-3 px-6 text-left">Size</th>
                <th class="py-3 px-6 text-center">Actions</th>
            </tr>
        </thead>
        <tbody class="text-text-primary text-sm font-light"></tbody>
    `;
  const tbody = table.querySelector("tbody");

  items.forEach((item) => {
    const row = document.createElement("tr");
    row.classList.add("border-b", "border-border-color", "hover:bg-gray-100");

    let iconClass = "";
    let sizeDisplay = "";
    let lastModifiedDisplay = "";

    if (item.type === "folder") {
      iconClass = "fas fa-folder text-folder-icon-color";
      sizeDisplay = "-";
      lastModifiedDisplay = "-";
    } else {
      iconClass = getFileIcon(item.name);
      sizeDisplay = formatBytes(item.size);
      lastModifiedDisplay = item.lastModified
        ? new Date(item.lastModified).toLocaleString()
        : "-";
    }

    row.innerHTML = `
            <td class="py-3 px-6 text-left whitespace-nowrap">
                <div class="flex items-center">
                    <i class="${iconClass} mr-3"></i>
                    <span class="${
                      item.type === "folder"
                        ? "font-semibold cursor-pointer"
                        : ""
                    }">${item.name}</span>
                </div>
            </td>
            <td class="py-3 px-6 text-left">${item.type}</td>
            <td class="py-3 px-6 text-left">${lastModifiedDisplay}</td>
            <td class="py-3 px-6 text-left">${sizeDisplay}</td>
            <td class="py-3 px-6 text-center">
                <div class="flex item-center justify-center">
                    ${
                      item.type === "file"
                        ? `
                        <button class="w-6 mr-2 transform hover:text-accent-color hover:scale-110 download-button" data-key="${item.fullPath}" title="Download">
                            <i class="fas fa-download"></i>
                        </button>
                        <button class="w-6 mr-2 transform hover:text-share-color hover:scale-110 share-button" data-key="${item.fullPath}" title="Share">
                            <i class="fas fa-share-alt"></i>
                        </button>
                        <button class="w-6 mr-2 transform hover:text-red-500 hover:scale-110 delete-button" data-key="${item.fullPath}" title="Delete">
                            <i class="fas fa-trash"></i>
                        </button>
                    `
                        : `
                        <button class="w-6 mr-2 transform hover:text-red-500 hover:scale-110 delete-button" data-key="${item.fullPath}" data-type="folder" title="Delete Folder">
                            <i class="fas fa-trash"></i>
                        </button>
                    `
                    }
                </div>
            </td>
        `;

    if (item.type === "folder") {
      row
        .querySelector("span")
        .addEventListener("click", () => listFiles(item.fullPath));
    } else {
      // Add event listeners for file actions
      const downloadButton = row.querySelector(".download-button");
      if (downloadButton) {
        downloadButton.addEventListener("click", (e) => {
          e.stopPropagation();
          downloadFile(item.fullPath, item.name);
        });
      }

      const shareButton = row.querySelector(".share-button");
      if (shareButton) {
        shareButton.addEventListener("click", (e) => {
          e.stopPropagation();
          openShareModal(item.fullPath);
        });
      }
    }

    const deleteButton = row.querySelector(".delete-button");
    if (deleteButton) {
      deleteButton.addEventListener("click", (e) => {
        e.stopPropagation();
        if (item.type === "folder") {
          deleteFolder(item.fullPath);
        } else {
          deleteFile(item.fullPath, item.name);
        }
      });
    }

    tbody.appendChild(row);
  });

  fileListContainer.appendChild(table);
}

function getFileIcon(fileName) {
  const extension = fileName.split(".").pop().toLowerCase();
  switch (extension) {
    case "pdf":
      return "fas fa-file-pdf text-red-500";
    case "doc":
    case "docx":
      return "fas fa-file-word text-blue-500";
    case "xls":
    case "xlsx":
      return "fas fa-file-excel text-green-500";
    case "ppt":
    case "pptx":
      return "fas fa-file-powerpoint text-orange-500";
    case "jpg":
    case "jpeg":
    case "png":
    case "gif":
    case "bmp":
    case "svg":
    case "webp":
      return "fas fa-file-image text-purple-500";
    case "mp4":
    case "mov":
    case "avi":
    case "mkv":
    case "webm":
      return "fas fa-file-video text-indigo-500";
    case "mp3":
    case "wav":
    case "aac":
    case "flac":
      return "fas fa-file-audio text-pink-500";
    case "zip":
    case "rar":
    case "7z":
      return "fas fa-file-archive text-gray-500";
    case "txt":
      return "fas fa-file-alt text-gray-700";
    case "js":
    case "html":
    case "css":
    case "py":
    case "java":
    case "c":
    case "cpp":
    case "json":
    case "xml":
      return "fas fa-file-code text-blue-700";
    default:
      return "fas fa-file text-file-icon-color";
  }
}

function formatBytes(bytes, decimals = 2) {
  if (bytes === 0) return "0 Bytes";
  const k = 1024;
  const dm = decimals < 0 ? 0 : decimals;
  const sizes = ["Bytes", "KB", "MB", "GB", "TB"];
  const i = Math.floor(Math.log(bytes) / Math.log(k));
  return parseFloat((bytes / Math.pow(k, i)).toFixed(dm)) + " " + sizes[i];
}

async function uploadFile(file, uploadFileName) {
  if (!s3 || !currentBucket) {
    showToast("Not connected to S3.", "error");
    return;
  }

  const fileKey = currentPrefix + uploadFileName;
  const params = {
    Bucket: currentBucket,
    Key: fileKey,
    Body: file,
    ContentType: file.type,
  };

  try {
    showToast(`Uploading '${uploadFileName}'...`, "info");
    await s3.upload(params).promise();
    showToast(`'${uploadFileName}' uploaded successfully!`, "success");
    listFiles(currentPrefix, searchFilesInput.value); // Refresh list
  } catch (error) {
    showToast(
      `Upload failed for '${uploadFileName}': ${error.message}`,
      "error"
    );
    console.error("Error uploading file:", error);
  }
}

async function downloadFile(key, fileName) {
  if (!s3 || !currentBucket) {
    showToast("Not connected to S3.", "error");
    return;
  }

  try {
    showToast(`Downloading '${fileName}'...`, "info");
    const params = {
      Bucket: currentBucket,
      Key: key,
    };
    const data = await s3.getObject(params).promise();

    // Create a Blob from the file data and create a download link
    const blob = new Blob([data.Body], { type: data.ContentType });
    const url = URL.createObjectURL(blob);
    const a = document.createElement("a");
    a.href = url;
    a.download = fileName; // Set the desired file name for download
    document.body.appendChild(a);
    a.click();
    document.body.removeChild(a);
    URL.revokeObjectURL(url); // Clean up the object URL

    showToast(`'${fileName}' downloaded successfully!`, "success");
  } catch (error) {
    showToast(`Download failed for '${fileName}': ${error.message}`, "error");
    console.error("Error downloading file:", error);
  }
}

async function deleteFile(key, fileName) {
  if (!s3 || !currentBucket) {
    showToast("Not connected to S3.", "error");
    return;
  }

  if (!confirm(`Are you sure you want to delete '${fileName}'?`)) {
    return;
  }

  try {
    showToast(`Deleting '${fileName}'...`, "info");
    const params = {
      Bucket: currentBucket,
      Key: key,
    };
    await s3.deleteObject(params).promise();
    showToast(`'${fileName}' deleted successfully!`, "success");
    listFiles(currentPrefix, searchFilesInput.value); // Refresh list
  } catch (error) {
    showToast(`Delete failed for '${fileName}': ${error.message}`, "error");
    console.error("Error deleting file:", error);
  }
}

async function createFolder(folderName) {
  if (!s3 || !currentBucket) {
    showToast("Not connected to S3.", "error");
    return;
  }

  // S3 treats folders as objects with a trailing slash
  const folderKey = currentPrefix + folderName.trim() + "/";

  try {
    showToast(`Creating folder '${folderName}'...`, "info");
    const params = {
      Bucket: currentBucket,
      Key: folderKey,
      Body: "", // Body is required, can be empty for a folder
      ContentType: "application/x-directory",
    };
    await s3.putObject(params).promise();
    showToast(`Folder '${folderName}' created successfully!`, "success");
    hideModal(createNewFolderModal);
    listFiles(currentPrefix, searchFilesInput.value); // Refresh list
  } catch (error) {
    showToast(`Folder creation failed: ${error.message}`, "error");
    console.error("Error creating folder:", error);
  }
}

async function deleteFolder(prefix) {
  if (!s3 || !currentBucket) {
    showToast("Not connected to S3.", "error");
    return;
  }

  if (
    !confirm(
      `Are you sure you want to delete the folder '${prefix}' and all its contents?`
    )
  ) {
    return;
  }

  try {
    showToast(`Deleting folder '${prefix}' and its contents...`, "info");

    // First, list all objects within the prefix
    const listParams = {
      Bucket: currentBucket,
      Prefix: prefix,
    };
    const listedObjects = await s3.listObjectsV2(listParams).promise();

    if (listedObjects.Contents.length === 0 && !listedObjects.CommonPrefixes) {
      // If folder is truly empty (no contents or sub-folders), delete the folder marker
      await s3
        .deleteObject({
          Bucket: currentBucket,
          Key: prefix,
        })
        .promise();
      showToast(`Folder '${prefix}' deleted successfully!`, "success");
      listFiles(currentPrefix, searchFilesInput.value);
      return;
    }

    // If there are objects, prepare them for deletion
    const deleteParams = {
      Bucket: currentBucket,
      Delete: { Objects: [] },
    };

    listedObjects.Contents.forEach(({ Key }) => {
      deleteParams.Delete.Objects.push({ Key });
    });

    // Handle more than 1000 objects (S3 API limit per delete call)
    while (listedObjects.IsTruncated) {
      listParams.ContinuationToken = listedObjects.NextContinuationToken;
      listedObjects = await s3.listObjectsV2(listParams).promise();
      listedObjects.Contents.forEach(({ Key }) => {
        deleteParams.Delete.Objects.push({ Key });
      });
    }

    if (deleteParams.Delete.Objects.length > 0) {
      await s3.deleteObjects(deleteParams).promise();
    }

    showToast(
      `Folder '${prefix}' and its contents deleted successfully!`,
      "success"
    );
    listFiles(currentPrefix, searchFilesInput.value); // Refresh list
  } catch (error) {
    showToast(`Folder deletion failed: ${error.message}`, "error");
    console.error("Error deleting folder or its contents:", error);
  }
}

// --- Share Link Functionality ---
async function openShareModal(key) {
  if (!s3 || !currentBucket) {
    showToast("Not connected to S3.", "error");
    return;
  }

  showToast("Generating shareable link...", "info");
  try {
    const params = {
      Bucket: currentBucket,
      Key: key,
      Expires: 3600, // Link valid for 1 hour (in seconds)
    };
    const url = await s3.getSignedUrlPromise("getObject", params);
    if (generatedShareLinkInput) generatedShareLinkInput.value = url;
    showModal(shareLinkModal);
    showToast("Shareable link generated!", "success");
  } catch (error) {
    showToast(`Failed to generate share link: ${error.message}`, "error");
    console.error("Error generating share link:", error);
  }
}

function copyShareLink() {
  if (generatedShareLinkInput) {
    generatedShareLinkInput.select();
    generatedShareLinkInput.setSelectionRange(0, 99999); // For mobile devices
    document.execCommand("copy");
    showToast("Link copied to clipboard!", "success");
  }
}

// --- Navigation (Breadcrumbs & Back Button) ---
function updateBreadcrumbs() {
  if (!filePathBreadcrumbs) {
    console.error("filePathBreadcrumbs not found!");
    return;
  }
  filePathBreadcrumbs.innerHTML = ""; // Clear existing breadcrumbs

  const parts = currentPrefix.split("/").filter(Boolean); // Split and remove empty strings

  // Always add the root/bucket
  const rootCrumb = document.createElement("span");
  rootCrumb.classList.add(
    "breadcrumb-item",
    "cursor-pointer",
    "text-blue-600",
    "hover:text-blue-800"
  );
  rootCrumb.textContent = currentBucket || "Home"; // Display bucket name or "Home"
  rootCrumb.dataset.prefix = "";
  rootCrumb.addEventListener("click", () => listFiles(""));
  filePathBreadcrumbs.appendChild(rootCrumb);

  if (parts.length > 0) {
    filePathBreadcrumbs.appendChild(document.createTextNode(" / "));
  }

  let path = "";
  parts.forEach((part, index) => {
    path += part + "/";
    const crumb = document.createElement("span");
    crumb.classList.add("breadcrumb-item", "cursor-pointer");
    if (index === parts.length - 1) {
      crumb.classList.add("text-gray-500", "font-semibold"); // Current folder
    } else {
      crumb.classList.add("text-blue-600", "hover:text-blue-800");
    }
    crumb.textContent = part;
    crumb.dataset.prefix = path;
    crumb.addEventListener("click", () => listFiles(path));
    filePathBreadcrumbs.appendChild(crumb);

    if (index < parts.length - 1) {
      filePathBreadcrumbs.appendChild(document.createTextNode(" / "));
    }
  });

  // Enable/disable back button
  if (backButton) {
    if (currentPrefix === "" || currentPrefix === "/") {
      backButton.classList.add("hidden");
    } else {
      backButton.classList.remove("hidden");
    }
  }
}

function navigateBack() {
  const parts = currentPrefix.split("/").filter(Boolean);
  if (parts.length > 0) {
    parts.pop(); // Remove last part
    const newPrefix = parts.length > 0 ? parts.join("/") + "/" : "";
    listFiles(newPrefix);
  } else {
    listFiles(""); // Go to root if at a top-level folder
  }
}

// --- Theme Toggling ---
function loadTheme() {
  const savedTheme = localStorage.getItem("theme");
  if (
    savedTheme === "dark" ||
    (!savedTheme && window.matchMedia("(prefers-color-scheme: dark)").matches)
  ) {
    document.body.classList.add("dark-mode");
    if (themeIconDropdown) {
      // Null check added
      themeIconDropdown.className = "fas fa-sun mr-2";
    }
  } else {
    document.body.classList.remove("dark-mode");
    if (themeIconDropdown) {
      // Null check added
      themeIconDropdown.className = "fas fa-moon mr-2";
    }
  }
}

function toggleTheme() {
  if (document.body.classList.contains("dark-mode")) {
    document.body.classList.remove("dark-mode");
    localStorage.setItem("theme", "light");
    if (themeIconDropdown) {
      // Null check added
      themeIconDropdown.className = "fas fa-moon mr-2";
    }
  } else {
    document.body.classList.add("dark-mode");
    localStorage.setItem("theme", "dark");
    if (themeIconDropdown) {
      // Null check added
      themeIconDropdown.className = "fas fa-sun mr-2";
    }
  }
}

// --- File Upload Queue and Duplicate Handling ---
// Moved these event listeners inside DOMContentLoaded to ensure elements are initialized
// fileUploadInput.addEventListener("change", (event) => {
//   const files = Array.from(event.target.files);
//   files.forEach((file) => filesToUploadQueue.push(file));
//   event.target.value = ""; // Clear input
//   processNextFileInQueue();
// });

// uploadButton.addEventListener("click", () => {
//   fileUploadInput.click();
// });

async function processNextFileInQueue() {
  if (isProcessingQueue || filesToUploadQueue.length === 0) {
    return;
  }

  isProcessingQueue = true;
  currentFileBeingProcessed = filesToUploadQueue.shift(); // Get the next file
  currentFileOriginalName = currentFileBeingProcessed.name;
  const fileKey = currentPrefix + currentFileOriginalName;

  try {
    // Check if file already exists
    await s3
      .headObject({
        Bucket: currentBucket,
        Key: fileKey,
      })
      .promise();

    // If headObject succeeds, file exists
    if (fileNameInModal) fileNameInModal.textContent = currentFileOriginalName;
    if (newFileNameInputDuplicate)
      newFileNameInputDuplicate.value = currentFileOriginalName;
    showModal(duplicateFileModal);
  } catch (headError) {
    // If headObject fails with NotFound, then file does not exist, proceed with upload
    if (headError.code === "NotFound") {
      await uploadFile(currentFileBeingProcessed, currentFileOriginalName);
      currentFileBeingProcessed = null; // Clear processed file
      processNextFileInQueue(); // Process next in queue
    } else {
      throw headError; // Re-throw other errors
    }
  } finally {
    isProcessingQueue = false;
  }
}

// --- Event Listeners (ensure DOM elements are initialized first) ---
document.addEventListener("DOMContentLoaded", async () => {
  initializeDOMElements(); // Initialize all DOM elements here

  // Now, attach event listeners to the elements AFTER they are initialized
  if (fileUploadInput) {
    // Add null checks for robustness
    fileUploadInput.addEventListener("change", (event) => {
      //
      const files = Array.from(event.target.files); //
      files.forEach((file) => filesToUploadQueue.push(file)); //
      event.target.value = ""; // Clear input
      processNextFileInQueue(); //
    });
  }

  if (uploadButton) {
    // Add null checks for robustness
    uploadButton.addEventListener("click", () => {
      //
      if (fileUploadInput) {
        // Ensure fileUploadInput is also not null before clicking
        fileUploadInput.click(); //
      }
    });
  }

  // Event Listeners for modals
  if (createNewFolderModal) {
    if (newFolderButton) {
      newFolderButton.addEventListener("click", () => {
        showModal(createNewFolderModal);
        if (newFolderNameInput) newFolderNameInput.value = ""; // Clear input on open
        if (newFolderNameInput) newFolderNameInput.focus();
      });
    }
    if (createFolderCancelButton) {
      createFolderCancelButton.addEventListener("click", () =>
        hideModal(createNewFolderModal)
      );
    }
    if (createFolderConfirmButton) {
      createFolderConfirmButton.addEventListener("click", () => {
        const folderName = newFolderNameInput
          ? newFolderNameInput.value.trim()
          : "";
        if (folderName) {
          createFolder(folderName);
        } else {
          showToast("Folder name cannot be empty.", "error");
        }
      });
    }
  }

  if (shareLinkModal) {
    if (closeShareModalButton) {
      closeShareModalButton.addEventListener("click", () =>
        hideModal(shareLinkModal)
      );
    }
    if (copyShareLinkButton) {
      copyShareLinkButton.addEventListener("click", copyShareLink);
    }
  }

  // Event Listeners for duplicate file modal actions
  if (duplicateReplaceButton) {
    duplicateReplaceButton.addEventListener("click", async () => {
      console.log("Duplicate file modal: Replace button clicked.");
      hideModal(duplicateFileModal);
      if (currentFileBeingProcessed) {
        await uploadFile(currentFileBeingProcessed, currentFileOriginalName);
      }
      currentFileBeingProcessed = null; // Clear processed file
      processNextFileInQueue(); // Process next in queue
    });
  }

  if (duplicateRenameButton) {
    duplicateRenameButton.addEventListener("click", async () => {
      console.log("Duplicate file modal: Rename button clicked.");
      hideModal(duplicateFileModal);
      const newName = newFileNameInputDuplicate
        ? newFileNameInputDuplicate.value.trim()
        : "";
      if (newName && newName !== currentFileOriginalName) {
        await uploadFile(currentFileBeingProcessed, newName);
      } else {
        showToast(
          "Invalid new file name or same as original. Skipping upload.",
          "error"
        );
        console.log("Duplicate file modal: Invalid rename, skipping upload.");
      }
      processNextFileInQueue();
    });
  }

  // Connection button
  if (connectButton) {
    connectButton.addEventListener("click", connectToS3);
  }

  // Search and Filter
  if (searchButton) {
    searchButton.addEventListener("click", () =>
      listFiles(currentPrefix, searchFilesInput.value)
    );
  }
  if (searchFilesInput) {
    searchFilesInput.addEventListener("keypress", (event) => {
      if (event.key === "Enter") {
        listFiles(currentPrefix, searchFilesInput.value);
      }
    });
  }

  if (filterButton) {
    filterButton.addEventListener("click", (event) => {
      event.stopPropagation(); // Prevent document click from closing it immediately
      if (filterDropdown) {
        filterDropdown.classList.toggle("hidden");
      }
    });
  }

  if (filterOptions) {
    filterOptions.forEach((option) => {
      option.addEventListener("click", () => {
        if (filterButton) {
          filterButton.querySelector("span").textContent =
            option.textContent.trim();
        }
        filterDropdown.classList.add("hidden");
        listFiles(currentPrefix, searchFilesInput.value); // Re-list files with new filter
      });
    });
  }
  // Hide filter dropdown when clicking outside
  document.addEventListener("click", (event) => {
    if (
      filterDropdown &&
      !filterDropdown.contains(event.target) &&
      event.target !== filterButton
    ) {
      filterDropdown.classList.add("hidden");
    }
  });

  // Back button functionality
  if (backButton) {
    backButton.addEventListener("click", navigateBack);
  }

  // Header Account Menu
  if (accountMenuButton) {
    accountMenuButton.addEventListener("click", (event) => {
      event.stopPropagation(); // Prevent click from closing immediately
      if (accountDropdownMenu) {
        accountDropdownMenu.classList.toggle("hidden");
      }
    });
  }

  if (disconnectButton) {
    disconnectButton.addEventListener("click", disconnectFromS3);
  }

  // Close dropdown when clicking outside
  document.addEventListener("click", (event) => {
    if (
      accountDropdownMenu &&
      !accountDropdownMenu.contains(event.target) &&
      event.target !== accountMenuButton
    ) {
      accountDropdownMenu.classList.add("hidden");
    }
  });

  // Theme Toggle
  if (themeToggleDropdown) {
    themeToggleDropdown.addEventListener("click", toggleTheme);
  }

  // Initial load logic for theme and connection
  loadTheme(); // Now loadTheme can safely use themeIconDropdown as it's initialized

  if (loadCredentials()) {
    //
    if (connectButton) connectButton.textContent = "Re-connect"; //
    showToast("Saved credentials found. Attempting to reconnect...", "info"); //
    // Attempt to auto-reconnect using saved credentials immediately
    await connectToS3(); //
  } else {
    // Ensure connection section is visible if no saved credentials found
    if (connectionSection) connectionSection.classList.remove("hidden"); //
    if (fileManagerSection) fileManagerSection.classList.add("hidden"); //
    if (accountIconContainer) accountIconContainer.classList.add("hidden"); // Keep account icon hidden until connected
    console.log("No saved credentials found, showing connection section."); //
  }
});
