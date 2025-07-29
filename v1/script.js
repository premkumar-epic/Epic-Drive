// --- Global Variables & DOM Elements ---
const accessKeyIdInput = document.getElementById("accessKeyId");
const secretAccessKeyInput = document.getElementById("secretAccessKey");
const regionInput = document.getElementById("region");
const bucketNameInput = document.getElementById("bucketName");
const connectButton = document.getElementById("connectButton");
const statusMessage = document.getElementById("statusMessage"); // Persistent connection status
const connectionSection = document.getElementById("connection-section");
const fileManagerSection = document.getElementById("file-manager-section");
const fileListContainer = document.getElementById("file-list");
const fileManagerStatus = document.getElementById("fileManagerStatus"); // Persistent file manager status

const fileUploadInput = document.getElementById("fileUploadInput");
const chooseFilesButton = document.getElementById("chooseFilesButton"); // New choose files button
const selectedFileNamesSpan = document.getElementById("selectedFileNames"); // Span to show selected file names
const uploadButton = document.getElementById("uploadButton");

// Moved "Create New Folder" to a modal
const newFolderButton = document.getElementById("newFolderButton");
const createNewFolderModal = document.getElementById("createNewFolderModal");
const newFolderNameInput = document.getElementById("newFolderNameInput");
const createFolderConfirmButton = document.getElementById(
  "createFolderConfirmButton"
);
const createFolderCancelButton = document.getElementById(
  "createFolderCancelButton"
);

// Search and Filter
const searchFilesInput = document.getElementById("searchFilesInput");
const searchButton = document.getElementById("searchButton");
const filterButton = document.getElementById("filterButton"); // Placeholder for future filter logic

// New DOM elements for header/account menu
const accountIconButton = document.getElementById("accountIconButton");
const accountPopup = document.getElementById("accountPopup");
const popupBucketName = document.getElementById("popupBucketName"); // For bucket name inside the popup
const disconnectButton = document.getElementById("disconnectButton"); // Now inside the popup

// Existing DOM elements for sync indicator and back button (now dynamically managed inside fileListContainer)
const syncStatusButton = document.getElementById("syncStatusButton");
const syncStatusIcon = syncStatusButton
  ? syncStatusButton.querySelector(".sync-icon")
  : null;

// New: Path Breadcrumbs
const pathBreadcrumbs = document.getElementById("pathBreadcrumbs");

// --- Toast Notification Container ---
const toastContainer = document.createElement("div");
toastContainer.id = "toastContainer";
toastContainer.style.cssText = `
    position: fixed;
    top: 80px; /* Adjusted to be below the new header */
    right: 20px;
    z-index: 2000;
    display: flex;
    flex-direction: column;
    gap: 10px;
`;
document.body.appendChild(toastContainer);

// --- Share Link Modal (using existing ID from HTML) ---
const shareLinkModal = document.getElementById("shareLinkModal");
const generatedShareLinkInput = document.getElementById("generatedShareLink");
const copyShareLinkButton = document.getElementById("copyShareLinkButton");
const closeShareModalButton = document.getElementById("closeShareModal");
const durationButtonsContainer = document.getElementById("durationButtons");
const sharedFileNameSpan = document.getElementById("sharedFileName");

let s3;
let currentBucket;
let currentPrefix = ""; // Always ends with a '/' for folders or empty for root
let fileKeyToShare = ""; // Stores the key of the file currently being shared

// --- Utility Functions for UI & Status Messages ---

function showStatus(message, type = "info") {
  console.log(`[[Connection Status]] ${message} [[${type}]]`);
  if (statusMessage) {
    // Check if element exists
    statusMessage.textContent = message;
    statusMessage.className = `message ${type}`;
    statusMessage.style.display = "block";
  }
}

function hideStatus() {
  if (statusMessage) {
    // Check if element exists
    statusMessage.textContent = "";
    statusMessage.style.display = "none";
    statusMessage.className = "message";
  }
}

function showFileManagerStatus(message, type = "info") {
  console.log(`[[File Manager Status]] ${message} [[${type}]]`);
  if (fileManagerStatus) {
    // Check if element exists
    fileManagerStatus.textContent = message;
    fileManagerStatus.className = `message ${type}`;
    fileManagerStatus.style.display = "block";
  }
}

function hideFileManagerStatus() {
  if (fileManagerStatus) {
    // Check if element exists
    fileManagerStatus.textContent = "";
    fileManagerStatus.style.display = "none";
    fileManagerStatus.className = "message";
  }
}

// --- New Toast Notification Function ---
function showToast(message, type = "info") {
  const toast = document.createElement("div");
  toast.classList.add("toast", type);
  toast.textContent = message;

  toastContainer.appendChild(toast);

  setTimeout(() => {
    toast.style.opacity = "1";
    toast.style.transform = "translateY(0)";
  }, 10);

  setTimeout(() => {
    toast.style.opacity = "0";
    toast.style.transform = "translateY(-20px)";
    toast.addEventListener("transitionend", () => toast.remove());
  }, 3000);
}

function showConnectionSection() {
  console.log("Showing connection section.");
  if (connectionSection) connectionSection.style.display = "block";
  if (fileManagerSection) fileManagerSection.style.display = "none";
  if (accountIconButton) {
    accountIconButton.style.display = "none";
    accountIconButton.title = "Not Connected";
  }
  if (accountPopup) accountPopup.style.display = "none";
  if (newFolderButton) newFolderButton.style.display = "none"; // Hide new folder button in header

  if (connectButton) connectButton.style.display = "inline-block";
}

function showFileManagerSection() {
  console.log("Showing file manager section.");
  if (connectionSection) connectionSection.style.display = "none";
  if (fileManagerSection) fileManagerSection.style.display = "block";
  if (accountIconButton) {
    accountIconButton.style.display = "inline-flex";
    accountIconButton.title = `Connected to: ${currentBucket}`;
  }
  if (newFolderButton) newFolderButton.style.display = "inline-flex"; // Show new folder button
  if (popupBucketName) popupBucketName.textContent = currentBucket;

  if (connectButton) connectButton.style.display = "none";
  hideStatus();
}

// --- Local Storage Functions ---

const LOCAL_STORAGE_KEY = "epicDriveCredentials";

function saveCredentials(accessKeyId, secretAccessKey, region, bucketName) {
  const credentials = { accessKeyId, secretAccessKey, region, bucketName };
  localStorage.setItem(LOCAL_STORAGE_KEY, JSON.stringify(credentials));
  showToast("Credentials saved to browser local storage!", "success");
}

function loadCredentials() {
  const storedCredentials = localStorage.getItem(LOCAL_STORAGE_KEY);
  if (storedCredentials) {
    try {
      const { accessKeyId, secretAccessKey, region, bucketName } =
        JSON.parse(storedCredentials);
      accessKeyIdInput.value = accessKeyId || "";
      secretAccessKeyInput.value = secretAccessKey || "";
      regionInput.value = region || "";
      bucketNameInput.value = bucketName || "";
      console.log("Credentials loaded from local storage.");
      return true;
    } catch (e) {
      console.error("Error parsing stored credentials:", e);
      clearCredentials();
      showToast("Error loading saved credentials. Please re-enter.", "error");
      return false;
    }
  }
  console.log("No credentials found in local storage.");
  return false;
}

function clearCredentials() {
  localStorage.removeItem(LOCAL_STORAGE_KEY);
  accessKeyIdInput.value = "";
  secretAccessKeyInput.value = "";
  regionInput.value = "";
  bucketNameInput.value = "";
  showToast("Credentials cleared from local storage.", "info");
  console.log("Local storage credentials cleared.");
}

// --- Helper to format file sizes ---
function formatBytes(bytes, decimals = 2) {
  if (bytes === 0) return "0 Bytes";
  const k = 1024;
  const dm = decimals < 0 ? 0 : decimals;
  const sizes = ["Bytes", "KB", "MB", "GB", "TB", "PB", "EB", "ZB", "YB"];
  const i = Math.floor(Math.log(bytes) / Math.log(k));
  return parseFloat((bytes / Math.pow(k, i)).toFixed(dm)) + " " + sizes[i];
}

// --- File Management Functions ---

// Function to update the sync status indicator
let currentSyncState = { status: "disconnected", message: "Not connected" }; // To store current state for hover

function updateSyncStatusIndicator(status, message = "") {
  if (!syncStatusButton || !syncStatusIcon) {
    console.warn("Sync status button or icon element not found.");
    return;
  }

  currentSyncState = { status, message };

  let color = "";
  let tooltip = "";

  // The icon is now static in HTML, only color changes
  switch (status) {
    case "syncing":
      color = "#ffc107"; // Yellow
      tooltip = "Syncing...";
      // Add a spinning class if you want the icon to spin
      syncStatusIcon.classList.add("fa-spin");
      break;
    case "synced":
      color = "#28a745"; // Green
      tooltip = "Synced with S3";
      syncStatusIcon.classList.remove("fa-spin");
      break;
    case "error":
      color = "#dc3545"; // Red
      tooltip = `Sync Error: ${message}`;
      syncStatusIcon.classList.remove("fa-spin");
      break;
    case "disconnected":
    default:
      color = "#6c757d"; // Grey
      tooltip = "Not connected or disconnected";
      syncStatusIcon.classList.remove("fa-spin");
      break;
  }

  syncStatusIcon.style.color = color;
  syncStatusButton.title = tooltip;
  syncStatusButton.style.cursor = "pointer";

  if (
    message &&
    (status === "error" ||
      status === "disconnected" ||
      (status === "synced" && message === "Files loaded successfully."))
  ) {
    showToast(
      message,
      status === "synced" ? "success" : status === "error" ? "error" : "info"
    );
  }
}

// Function to update breadcrumbs
function updateBreadcrumbs() {
  if (!pathBreadcrumbs) return;

  pathBreadcrumbs.innerHTML = ""; // Clear existing breadcrumbs
  let path = currentPrefix.split("/").filter((p) => p !== ""); // Split and remove empty strings

  // Add Root crumb
  const rootCrumb = document.createElement("span");
  rootCrumb.classList.add("crumb", "root-crumb");
  rootCrumb.textContent = "Root";
  rootCrumb.dataset.prefix = "";
  pathBreadcrumbs.appendChild(rootCrumb);

  let cumulativePrefix = "";
  path.forEach((segment, index) => {
    cumulativePrefix += segment + "/";
    const crumb = document.createElement("span");
    crumb.classList.add("crumb");
    crumb.textContent = segment;
    crumb.dataset.prefix = cumulativePrefix;
    if (index === path.length - 1) {
      crumb.classList.add("active"); // Last segment is active
    }
    pathBreadcrumbs.appendChild(crumb);
  });

  // Add event listeners to new crumbs
  pathBreadcrumbs.querySelectorAll(".crumb").forEach((crumb) => {
    crumb.addEventListener("click", async () => {
      const targetPrefix = crumb.dataset.prefix;
      console.log(
        `Breadcrumb clicked: Navigating to ${targetPrefix || "Root"}`
      );
      await listFiles(targetPrefix);
    });
  });
}

async function listFiles(prefix = "", isInitialLoad = false, searchTerm = "") {
  console.log(
    `Attempting to list files for prefix: '${prefix}' in bucket: '${currentBucket}' (Initial Load: ${isInitialLoad}, Search Term: '${searchTerm}')`
  );
  if (!s3 || !currentBucket) {
    showFileManagerStatus("Not connected to an S3 bucket.", "error");
    console.error("listFiles: S3 object or currentBucket is null/undefined.");
    updateSyncStatusIndicator("disconnected", "Not connected to S3.");
    return;
  }

  currentPrefix = prefix; // Update global currentPrefix
  updateBreadcrumbs(); // Update breadcrumbs with new prefix

  fileListContainer.innerHTML = ""; // Clear previous file list contents

  // Re-create the file-list-nav-header inside fileListContainer
  const navHeaderDiv = document.createElement("div");
  navHeaderDiv.classList.add("file-list-nav-header");
  navHeaderDiv.innerHTML = `
        <button id="backButton" class="action-button back-button" style="display:none;">← Back</button>
    `;
  fileListContainer.appendChild(navHeaderDiv);

  // Re-attach back button listener
  const backButton = fileListContainer.querySelector("#backButton");
  if (backButton) {
    backButton.addEventListener("click", async () => {
      console.log("Back button clicked.");
      if (currentPrefix !== "") {
        const pathSegments = currentPrefix.split("/").filter((s) => s !== "");
        pathSegments.pop(); // Remove current folder
        const parentFolder =
          pathSegments.length > 0 ? pathSegments.join("/") + "/" : "";
        await listFiles(parentFolder);
      }
    });
  }

  // Update back button visibility based on new currentPrefix
  if (backButton) {
    if (currentPrefix !== "") {
      backButton.style.display = "inline-block";
    } else {
      backButton.style.display = "none";
    }
  }

  showFileManagerStatus(
    `Loading files in '${currentPrefix || "root"}'...`,
    "info"
  );
  updateSyncStatusIndicator("syncing", "Syncing files...");

  const params = {
    Bucket: currentBucket,
    Prefix: currentPrefix,
    Delimiter: "/",
  };

  try {
    const data = await s3.listObjectsV2(params).promise();
    console.log("S3 listObjectsV2 Response Data:", data);

    const ul = document.createElement("ul");
    ul.classList.add("file-list-items");

    let hasContent = false;

    // Process Common Prefixes (folders)
    if (data.CommonPrefixes && data.CommonPrefixes.length > 0) {
      console.log("Processing CommonPrefixed folders:", data.CommonPrefixes);
      data.CommonPrefixes.forEach((commonPrefix) => {
        const folderName = commonPrefix.Prefix.replace(
          currentPrefix,
          ""
        ).replace("/", "");
        if (
          folderName &&
          (searchTerm === "" ||
            folderName.toLowerCase().includes(searchTerm.toLowerCase()))
        ) {
          const li = document.createElement("li");
          li.classList.add("file-item", "folder-item");
          li.dataset.folderName = commonPrefix.Prefix; // Store full prefix for navigation
          li.innerHTML = `
                        <span class="file-icon folder-icon">📁</span>
                        <span class="file-name">${folderName}</span>
                        <span class="file-actions">
                            <button class="action-button delete-folder" data-folder-name="${commonPrefix.Prefix}">Delete</button>
                        </span>
                    `;
          ul.appendChild(li);
          hasContent = true;
          console.log(
            `Added folder: ${folderName} (Key: ${commonPrefix.Prefix})`
          );
        }
      });
    }

    // Process Files (Contents)
    const renderedKeys = new Set();
    const filesToDisplay = (data.Contents || []).filter((file) => {
      if (
        file.Key === currentPrefix ||
        (file.Key.endsWith("/") && file.Size === 0)
      ) {
        console.log(
          `Skipping S3 folder marker or current prefix key: ${file.Key}`
        );
        return false;
      }
      if (renderedKeys.has(file.Key)) {
        console.warn(`Skipping duplicate key during rendering: ${file.Key}`);
        return false;
      }
      renderedKeys.add(file.Key);

      const fileName = file.Key.substring(currentPrefix.length);
      return (
        searchTerm === "" ||
        fileName.toLowerCase().includes(searchTerm.toLowerCase())
      );
    });

    filesToDisplay.sort((a, b) => a.Key.localeCompare(b.Key));
    console.log(
      "Files to display after filtering and sorting:",
      filesToDisplay
    );

    filesToDisplay.forEach((file) => {
      const fileName = file.Key.substring(currentPrefix.length);
      if (!fileName) {
        console.log(
          `Skipping file with empty name after prefix removal: ${file.Key}`
        );
        return;
      }

      const fileSize = formatBytes(file.Size);
      const lastModified = new Date(file.LastModified).toLocaleDateString();

      const li = document.createElement("li");
      li.classList.add("file-item");
      li.dataset.key = file.Key;
      li.dataset.fileName = fileName;

      li.innerHTML = `
                <span class="file-icon">📄</span>
                <span class="file-name" title="${file.Key}">${fileName}</span>
                <span class="file-size">${fileSize}</span>
                <span class="file-date">${lastModified}</span>
                <span class="file-actions">
                    <button class="action-button download-file" data-key="${file.Key}">Download</button>
                    <button class="action-button delete-file" data-key="${file.Key}">Delete</button>
                    <button class="action-button share-file" data-key="${file.Key}" data-file-name="${fileName}">Share</button>
                </span>
            `;
      ul.appendChild(li);
      hasContent = true;
      console.log(`Added file: ${fileName} (Key: ${file.Key})`);
    });

    if (!hasContent) {
      const noContentMessage = searchTerm
        ? `<p class="empty-message">No files or folders matching "${searchTerm}" found in this location.</p>`
        : '<p class="empty-message">No files or folders found in this location.</p>';
      fileListContainer.appendChild(
        document.createRange().createContextualFragment(noContentMessage)
      );
      console.log("No files or folders to display after filtering.");
    } else {
      fileListContainer.appendChild(ul);
      console.log("File list rendered.");
    }

    hideFileManagerStatus();
    updateSyncStatusIndicator(
      "synced",
      isInitialLoad ? "Files loaded successfully." : "Files refreshed."
    );
  } catch (error) {
    console.error("Error listing files:", error);
    showFileManagerStatus(`Failed to list files: ${error.message}`, "error");
    fileListContainer.innerHTML +=
      '<p class="empty-message error">Failed to load files. Please check bucket permissions and CORS.</p>';
    updateSyncStatusIndicator("error", "Sync failed!");
  }
}

// --- File Upload Function ---
async function uploadFiles() {
  console.log("UploadFiles function called.");
  if (!s3 || !currentBucket) {
    showToast("Not connected to an S3 bucket.", "error");
    console.error("uploadFiles: S3 object or currentBucket is null/undefined.");
    return;
  }

  const files = fileUploadInput.files;
  if (files.length === 0) {
    showToast("Please select one or more files to upload.", "info");
    console.log("No files selected for upload.");
    return;
  }

  showFileManagerStatus(
    `Starting upload of ${files.length} file(s)...`,
    "info"
  );
  console.log(`Selected files for upload:`, files);

  let uploadedCount = 0;
  let failedCount = 0;

  for (const file of files) {
    const fileKey = currentPrefix + file.name;
    console.log(
      `Attempting to upload file: ${file.name} to S3 Key: ${fileKey}`
    );

    const params = {
      Bucket: currentBucket,
      Key: fileKey,
      Body: file,
      ContentType: file.type,
    };

    try {
      const uploader = s3.upload(params);

      uploader.on("httpUploadProgress", function (progress) {
        showFileManagerStatus(
          `Uploading ${file.name}: ${Math.round(
            (progress.loaded / progress.total) * 100
          )}% complete...`,
          "info"
        );
        console.log(
          `Upload progress for ${file.name}: ${Math.round(
            (progress.loaded / progress.total) * 100
          )}%`
        );
      });

      await uploader.promise();
      uploadedCount++;
      console.log(`Successfully uploaded: ${file.name} to ${fileKey}`);
    } catch (error) {
      failedCount++;
      console.error(`Error uploading ${file.name}:`, error);
      showToast(
        `Failed to upload ${file.name}. Error: ${error.message}`,
        "error"
      );
    }
  }

  if (uploadedCount > 0) {
    showToast(
      `Upload complete! ${uploadedCount} file(s) uploaded, ${failedCount} failed.`,
      "success"
    );
    console.log("Uploads finished. Refreshing file list.");
    const currentSearchTerm = searchFilesInput
      ? searchFilesInput.value.trim()
      : "";
    await listFiles(currentPrefix, false, currentSearchTerm);
  } else if (failedCount > 0) {
    showToast(`All uploads failed. Check console for details.`, "error");
    console.error("All uploads failed.");
  } else {
    hideFileManagerStatus();
    console.log("No files uploaded.");
  }

  fileUploadInput.value = "";
  selectedFileNamesSpan.textContent = "No file chosen";
}

// --- Download File Function ---
async function downloadFile(key) {
  console.log(`DownloadFile function called for key: ${key}`);
  if (!s3 || !currentBucket) {
    showToast("Not connected to an S3 bucket.", "error");
    console.error(
      "downloadFile: S3 object or currentBucket is null/undefined."
    );
    return;
  }

  showToast(`Preparing to download: ${key.split("/").pop()}...`, "info");

  const params = {
    Bucket: currentBucket,
    Key: key,
  };
  console.log("Download params:", params);

  try {
    const data = await s3.getObject(params).promise();
    console.log("Download data received:", data);

    const blob = new Blob([data.Body], { type: data.ContentType });
    const url = window.URL.createObjectURL(blob);
    const a = document.createElement("a");
    a.href = url;
    a.download = key.split("/").pop();
    document.body.appendChild(a);
    a.click();
    console.log(`Download initiated for ${key}`);

    window.URL.revokeObjectURL(url);
    document.body.removeChild(a);
    console.log("Temporary download elements cleaned up.");

    showToast(`Successfully downloaded: ${key.split("/").pop()}`, "success");
  } catch (error) {
    console.error(`Error downloading ${key}:`, error);
    showToast(
      `Failed to download ${key.split("/").pop()}. Error: ${error.message}`,
      "error"
    );
  }
}

// --- Delete File/Folder Function ---
async function deleteItem(key, isFolder = false) {
  console.log(
    `DeleteItem function called for key: ${key}, isFolder: ${isFolder}`
  );
  if (!s3 || !currentBucket) {
    showToast("Not connected to an S3 bucket.", "error");
    console.error("deleteItem: S3 object or currentBucket is null/undefined.");
    return;
  }

  const confirmMessage = isFolder
    ? `Are you sure you want to delete the folder "${key}" and all its contents? This action is irreversible.`
    : `Are you sure you want to delete the file "${key}"? This action is irreversible.`;

  if (!window.confirm(confirmMessage)) {
    showToast("Deletion cancelled.", "info");
    console.log("Deletion cancelled by user.");
    return;
  }

  showFileManagerStatus(`Deleting: ${key}...`, "info");

  try {
    if (isFolder) {
      console.log(`Attempting to delete folder (prefix): ${key}`);
      const objectsToDelete = [];
      let isTruncated = true;
      let continuationToken;

      while (isTruncated) {
        const listParams = {
          Bucket: currentBucket,
          Prefix: key,
          ContinuationToken: continuationToken,
        };
        console.log(
          "Listing objects for folder deletion with params:",
          listParams
        );
        const data = await s3.listObjectsV2(listParams).promise();
        data.Contents.forEach((obj) => {
          objectsToDelete.push({ Key: obj.Key });
        });
        isTruncated = data.IsTruncated;
        continuationToken = data.NextContinuationToken;
      }
      console.log(
        `Found ${objectsToDelete.length} objects to delete in folder: ${key}`
      );

      if (objectsToDelete.length > 0) {
        const deleteParams = {
          Bucket: currentBucket,
          Delete: {
            Objects: objectsToDelete,
            Quiet: false,
          },
        };
        console.log("Calling deleteObjects with params:", deleteParams);
        await s3.deleteObjects(deleteParams).promise();
        showToast(
          `Successfully deleted folder "${key}" and ${objectsToDelete.length} items.`,
          "success"
        );
        console.log(`Folder "${key}" and its contents deleted successfully.`);
      } else {
        console.log(
          `No objects found in folder "${key}", attempting to delete folder marker.`
        );
        // If folder is truly empty but exists as a marker (e.g., 'myfolder/'), delete the marker itself
        await s3.deleteObject({ Bucket: currentBucket, Key: key }).promise();
        showToast(
          `Successfully deleted empty folder marker: ${key}.`,
          "success"
        );
        console.log(`Empty folder marker "${key}" deleted successfully.`);
      }
    } else {
      console.log(`Attempting to delete single file: ${key}`);
      const params = {
        Bucket: currentBucket,
        Key: key,
      };
      console.log("Calling deleteObject with params:", params);
      await s3.deleteObject(params).promise();
      showToast(`Successfully deleted file: ${key}`, "success");
      console.log(`File "${key}" deleted successfully.`);
    }
    const currentSearchTerm = searchFilesInput
      ? searchFilesInput.value.trim()
      : "";
    await listFiles(currentPrefix, false, currentSearchTerm);
    console.log("File list refreshed after deletion.");
  } catch (error) {
    console.error(`Error deleting ${key}:`, error);
    showToast(`Failed to delete ${key}. Error: ${error.message}`, "error");
  }
}

// --- Create Folder Functions (with Modal) ---
function showCreateFolderModal() {
  if (createNewFolderModal) {
    newFolderNameInput.value = ""; // Clear previous input
    createNewFolderModal.style.display = "flex"; // Use flex for centering
  }
}

function hideCreateFolderModal() {
  if (createNewFolderModal) {
    createNewFolderModal.style.display = "none";
  }
}

async function createFolder() {
  console.log("CreateFolder function called.");
  if (!s3 || !currentBucket) {
    showToast("Not connected to an S3 bucket.", "error");
    console.error(
      "createFolder: S3 object or currentBucket is null/undefined."
    );
    return;
  }

  let folderName = newFolderNameInput.value.trim();
  if (!folderName) {
    showToast("Please enter a folder name.", "info");
    console.log("No folder name entered.");
    return;
  }

  if (!folderName.endsWith("/")) {
    folderName += "/";
  }

  const folderKey = currentPrefix + folderName;
  console.log(`Attempting to create folder with key: ${folderKey}`);

  hideCreateFolderModal(); // Hide modal immediately

  showFileManagerStatus(`Creating folder: ${folderKey}...`, "info");

  const params = {
    Bucket: currentBucket,
    Key: folderKey,
    Body: "",
    ContentType: "application/x-directory",
  };
  console.log("PutObject params for folder creation:", params);

  try {
    await s3.putObject(params).promise();
    showToast(`Folder "${folderKey}" created successfully!`, "success");
    console.log(`Folder "${folderKey}" created successfully.`);
    const currentSearchTerm = searchFilesInput
      ? searchFilesInput.value.trim()
      : "";
    await listFiles(currentPrefix, false, currentSearchTerm);
    console.log("File list refreshed after folder creation.");
  } catch (error) {
    console.error(`Error creating folder ${folderKey}:`, error);
    showToast(
      `Failed to create folder "${folderKey}". Error: ${error.message}`,
      "error"
    );
  }
}

// --- Generate Shareable Link (Pre-signed URL) Function ---
async function generateShareableLink(key, fileName, durationSeconds) {
  console.log(
    `generateShareableLink called for key: ${key}, file name: ${fileName}, duration: ${durationSeconds}s`
  );
  if (!s3 || !currentBucket) {
    showToast("Not connected to an S3 bucket.", "error");
    console.error(
      "generateShareableLink: S3 object or currentBucket is null/undefined."
    );
    return;
  }

  const params = {
    Bucket: currentBucket,
    Key: key,
    Expires: durationSeconds,
  };
  console.log("getSignedUrl params:", params);

  try {
    const url = s3.getSignedUrl("getObject", params);
    console.log("Generated Pre-signed URL:", url);

    generatedShareLinkInput.value = url;
    generatedShareLinkInput.select();
    showToast("Shareable link generated. Copy it from the modal.", "success");
  } catch (error) {
    console.error(`Error generating shareable link for ${key}:`, error);
    showToast(
      `Failed to generate shareable link. Error: ${error.message}`,
      "error"
    );
  }
}

// --- S3 Connection Logic ---

async function connectToS3() {
  console.log("connectToS3 function called.");
  hideStatus();
  showStatus("Attempting to connect to S3...", "info");

  const accessKeyId = accessKeyIdInput.value.trim();
  const secretAccessKey = secretAccessKeyInput.value.trim();
  const region = regionInput.value.trim();
  const bucketName = bucketNameInput.value.trim();

  if (!accessKeyId || !secretAccessKey || !region || !bucketName) {
    showStatus("Please fill in all AWS S3 connection details.", "error");
    console.error("Missing AWS S3 connection details.");
    return;
  }
  console.log(
    `Attempting connection with Region: ${region}, Bucket: ${bucketName}`
  );

  try {
    AWS.config.update({
      accessKeyId: accessKeyId,
      secretAccessKey: secretAccessKey,
      region: region,
    });
    console.log("AWS SDK config updated.");

    s3 = new AWS.S3({ apiVersion: "2006-03-01" });
    currentBucket = bucketName;
    currentPrefix = ""; // Reset prefix to root on new connection
    console.log(
      "S3 service object initialized. currentBucket and currentPrefix set."
    );

    await s3.listObjectsV2({ Bucket: currentBucket, MaxKeys: 1 }).promise();
    console.log(
      "S3 connection test (listObjectsV2 with MaxKeys:1) successful."
    );

    saveCredentials(accessKeyId, secretAccessKey, region, bucketName);
    showStatus(`Successfully connected to bucket: ${currentBucket}`, "success");
    showFileManagerSection();
    console.log("UI updated to show file manager.");

    await listFiles(currentPrefix, true);
    console.log("Initial file list loaded.");
  } catch (error) {
    console.error("S3 Connection Error:", error);
    let errorMessage =
      "Failed to connect to S3. Please check your credentials, region, and bucket name. ";
    if (error.code === "NetworkingError") {
      errorMessage +=
        "Check your internet connection or if there are CORS issues.";
    } else if (
      error.code === "InvalidAccessKeyId" ||
      error.code === "SignatureDoesNotMatch"
    ) {
      errorMessage += "Access Key ID or Secret Access Key is incorrect.";
    } else if (error.code === "NoSuchBucket") {
      errorMessage += `Bucket "${bucketName}" not found or you don't have access.`;
    } else if (
      error.code === "AllAccessDisabled" ||
      error.code === "AccessDenied"
    ) {
      errorMessage +=
        "Access denied. Check your IAM permissions for this bucket and ensure CORS is configured correctly.";
    } else {
      errorMessage += `Error: ${error.message || "Unknown error."}`;
    }
    showStatus(errorMessage, "error");
    s3 = null;
    console.log("S3 connection failed. S3 object cleared.");
    updateSyncStatusIndicator("error", "Connection failed.");
  }
}

function disconnectFromS3() {
  console.log("DisconnectFromS3 function called.");
  s3 = null;
  currentBucket = null;
  currentPrefix = "";
  clearCredentials();
  showConnectionSection();
  hideFileManagerStatus();
  // Reset file-list content to its original empty state
  if (fileListContainer) {
    fileListContainer.innerHTML = `
            <div class="file-list-nav-header">
                <button id="backButton" class="action-button back-button" style="display:none;">← Back</button>
            </div>
            <p class="empty-message">Connect to a bucket to see files.</p>
        `;
  }
  updateBreadcrumbs(); // Reset breadcrumbs to "Root"
  showStatus("Disconnected from S3.", "info");
  updateSyncStatusIndicator("disconnected", "Disconnected.");
  console.log("Disconnected from S3. UI reset.");
}

// --- Event Listeners ---

if (connectButton) {
  connectButton.addEventListener("click", connectToS3);
}

if (disconnectButton) {
  disconnectButton.addEventListener("click", disconnectFromS3);
}

// File Upload Logic
if (chooseFilesButton) {
  chooseFilesButton.addEventListener("click", () => {
    fileUploadInput.click(); // Trigger the hidden file input
  });
}

if (fileUploadInput) {
  fileUploadInput.addEventListener("change", () => {
    if (fileUploadInput.files.length > 0) {
      if (fileUploadInput.files.length === 1) {
        selectedFileNamesSpan.textContent = fileUploadInput.files[0].name;
      } else {
        selectedFileNamesSpan.textContent = `${fileUploadInput.files.length} files selected`;
      }
    } else {
      selectedFileNamesSpan.textContent = "No file chosen";
    }
  });
}

if (uploadButton) {
  uploadButton.addEventListener("click", uploadFiles);
}

// New Folder Modal Logic
if (newFolderButton) {
  newFolderButton.addEventListener("click", showCreateFolderModal);
}
if (createFolderConfirmButton) {
  createFolderConfirmButton.addEventListener("click", createFolder);
}
if (createFolderCancelButton) {
  createFolderCancelButton.addEventListener("click", hideCreateFolderModal);
}
// Close modal on 'x' click
if (createNewFolderModal) {
  createNewFolderModal
    .querySelector(".close-button")
    .addEventListener("click", hideCreateFolderModal);
  // Close modal if clicked outside modal-content
  createNewFolderModal.addEventListener("click", (event) => {
    if (event.target === createNewFolderModal) {
      hideCreateFolderModal();
    }
  });
}
// Allow pressing Enter in newFolderNameInput to trigger create
if (newFolderNameInput) {
  newFolderNameInput.addEventListener("keypress", (e) => {
    if (e.key === "Enter") {
      e.preventDefault();
      createFolderConfirmButton.click();
    }
  });
}

// Search functionality
if (searchButton) {
  searchButton.addEventListener("click", () => {
    const searchTerm = searchFilesInput.value.trim();
    listFiles(currentPrefix, false, searchTerm);
  });
}

if (searchFilesInput) {
  searchFilesInput.addEventListener("keypress", (e) => {
    if (e.key === "Enter") {
      e.preventDefault();
      searchButton.click();
    }
  });
}

// Filter button (placeholder for now)
if (filterButton) {
  filterButton.addEventListener("click", () => {
    showToast("Filter functionality coming soon!", "info");
    console.log("Filter button clicked. (Functionality not yet implemented)");
  });
}

// Event listener for dynamically created buttons (Download, Delete, Share)
// and for double-clicking file/folder items
if (fileListContainer) {
  fileListContainer.addEventListener("click", async (event) => {
    const target = event.target;

    if (
      target.tagName === "BUTTON" &&
      (target.dataset.key || target.dataset.folderName)
    ) {
      const key = target.dataset.key;
      const folderName = target.dataset.folderName;
      const fileName = target.dataset.fileName;

      if (target.classList.contains("download-file")) {
        if (key) {
          await downloadFile(key);
        }
      } else if (target.classList.contains("delete-file")) {
        if (key) {
          await deleteItem(key, false);
        }
      } else if (target.classList.contains("delete-folder")) {
        if (folderName) {
          await deleteItem(folderName, true);
        }
      } else if (target.classList.contains("share-file")) {
        if (key && fileName) {
          fileKeyToShare = key;
          sharedFileNameSpan.textContent = fileName;
          generatedShareLinkInput.value = "";

          durationButtonsContainer
            .querySelectorAll(".duration-button")
            .forEach((btn) => {
              btn.classList.remove("selected");
            });
          const defaultButton = durationButtonsContainer.querySelector(
            '[data-duration="604800"]'
          );
          if (defaultButton) defaultButton.classList.add("selected");

          shareLinkModal.style.display = "flex";
        }
      }
    }
  });

  fileListContainer.addEventListener("dblclick", async (event) => {
    const targetLi = event.target.closest(".file-item");
    if (targetLi) {
      if (targetLi.classList.contains("folder-item")) {
        const folderName = targetLi.dataset.folderName;
        if (folderName) {
          await listFiles(folderName);
        }
      } else {
        const key = targetLi.dataset.key;
        if (key) {
          await downloadFile(key);
        }
      }
    }
  });
}

// Share link modal listeners
if (closeShareModalButton) {
  closeShareModalButton.addEventListener("click", () => {
    shareLinkModal.style.display = "none";
    generatedShareLinkInput.value = "";
    sharedFileNameSpan.textContent = "";
    fileKeyToShare = "";
    if (durationButtonsContainer) {
      durationButtonsContainer
        .querySelectorAll(".duration-button")
        .forEach((btn) => {
          btn.classList.remove("selected");
        });
      const defaultButton = durationButtonsContainer.querySelector(
        '[data-duration="604800"]'
      );
      if (defaultButton) defaultButton.classList.add("selected");
    }
  });
  // Close modal if clicked outside modal-content
  shareLinkModal.addEventListener("click", (event) => {
    if (event.target === shareLinkModal) {
      shareLinkModal.style.display = "none";
    }
  });
}

if (copyShareLinkButton) {
  copyShareLinkButton.addEventListener("click", () => {
    generatedShareLinkInput.select();
    document.execCommand("copy");
    showToast("Link copied to clipboard!", "success");
    shareLinkModal.style.display = "none";
    generatedShareLinkInput.value = "";
    sharedFileNameSpan.textContent = "";
    fileKeyToShare = "";
    if (durationButtonsContainer) {
      durationButtonsContainer
        .querySelectorAll(".duration-button")
        .forEach((btn) => {
          btn.classList.remove("selected");
        });
      const defaultButton = durationButtonsContainer.querySelector(
        '[data-duration="604800"]'
      );
      if (defaultButton) defaultButton.classList.add("selected");
    }
  });
}

if (durationButtonsContainer) {
  durationButtonsContainer.addEventListener("click", async (event) => {
    const target = event.target;
    if (target.classList.contains("duration-button")) {
      durationButtonsContainer
        .querySelectorAll(".duration-button")
        .forEach((btn) => {
          btn.classList.remove("selected");
        });
      target.classList.add("selected");

      const selectedDuration = parseInt(target.dataset.duration, 10);
      if (fileKeyToShare) {
        const fileName = sharedFileNameSpan.textContent;
        await generateShareableLink(fileKeyToShare, fileName, selectedDuration);
        generatedShareLinkInput.select();
      }
    }
  });
}

if (syncStatusButton) {
  syncStatusButton.addEventListener("click", async () => {
    console.log("Sync status button clicked. Initiating manual sync.");
    if (s3 && currentBucket) {
      const currentSearchTerm = searchFilesInput
        ? searchFilesInput.value.trim()
        : "";
      await listFiles(currentPrefix, false, currentSearchTerm);
      showToast("Manual sync initiated.", "info");
    } else {
      showToast("Not connected to S3 to sync.", "info");
    }
  });
}

if (accountIconButton) {
  accountIconButton.addEventListener("click", (event) => {
    event.stopPropagation();
    if (accountPopup) {
      accountPopup.style.display =
        accountPopup.style.display === "block" ? "none" : "block";
    }
  });
}

document.addEventListener("click", (event) => {
  if (
    accountPopup &&
    accountIconButton &&
    !accountPopup.contains(event.target) &&
    !accountIconButton.contains(event.target)
  ) {
    if (accountPopup.style.display === "block") {
      accountPopup.style.display = "none";
    }
  }
});

// --- Initial Page Load Logic ---
document.addEventListener("DOMContentLoaded", async () => {
  console.log("DOMContentLoaded event fired.");
  updateSyncStatusIndicator("disconnected", "Not connected to S3.");
  if (accountIconButton) {
    accountIconButton.style.display = "none";
    accountIconButton.title = "Not Connected";
  }
  if (accountPopup) accountPopup.style.display = "none";
  if (newFolderButton) newFolderButton.style.display = "none"; // Ensure hidden on initial load

  const credentialsFound = loadCredentials();
  if (credentialsFound) {
    showStatus("Attempting to reconnect using saved credentials...", "info");
    try {
      await connectToS3();
    } catch (error) {
      console.error("Auto-connect failed on load:", error);
      showStatus(
        "Auto-reconnect failed. Please enter credentials and connect manually.",
        "error"
      );
      showConnectionSection();
    }
  } else {
    showConnectionSection();
    showStatus("Enter your AWS S3 credentials to get started.", "info");
  }

  updateBreadcrumbs(); // Initialize breadcrumbs on page load
});
