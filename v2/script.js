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
const accountMenuButton = document.getElementById("account-menu-button");
const accountDropdownMenu = document.getElementById("account-dropdown-menu");
const popupBucketName = document.getElementById("popupBucketName");
const disconnectButton = document.getElementById("disconnectButton");
const themeToggleDropdown = document.getElementById("theme-toggle-dropdown");
const themeIconDropdown = document.getElementById("theme-icon-dropdown");
const accountIconContainer = document.getElementById("account-icon-container");

// Elements for new file manager header (breadcrumbs & sync)
const filePathBreadcrumbs = document.getElementById("file-path-breadcrumbs");
const syncStatusButton = document.getElementById("syncStatusButton");
const syncStatusIcon = syncStatusButton.querySelector(".sync-icon");
// const syncStatusText = syncStatusButton.querySelector(".sync-status-text"); // REMOVED
const backButton = document.getElementById("backButton"); // New back button

// --- Toast Notification Container ---
const toastContainer = document.getElementById("toast-container");

// --- Share Link Modal ---
const shareLinkModal = document.getElementById("shareLinkModal");
const generatedShareLinkInput = document.getElementById("generatedShareLink");
const copyShareLinkButton = document.getElementById("copyShareLinkButton");
const closeShareModalButton = document.getElementById("closeShareModal");
const durationButtonsContainer = document.getElementById("durationButtons");
const sharedFileNameSpan = document.getElementById("sharedFileName");
const newShareLinkButton = document.getElementById("newShareLinkButton");

let s3;
let currentBucket;
let currentPrefix = ""; // Always ends with a '/' for folders or empty for root
let fileKeyToShare = ""; // Stores the key of the file currently being shared
let initialConnectionLoad = true; // Flag for initial file listing after connection

// --- Utility Functions for UI & Status Messages ---

function showToast(message, type = "info") {
  const toast = document.createElement("div");
  toast.classList.add("toast", type);
  toast.innerHTML = `
        <i class="fas ${
          type === "success"
            ? "fa-check-circle"
            : type === "error"
            ? "fa-times-circle"
            : "fa-info-circle"
        }"></i>
        <span>${message}</span>
    `;
  toastContainer.appendChild(toast);

  setTimeout(() => {
    toast.remove();
  }, 4000); // Toast disappears after 4 seconds
}

function showStatus(message, type = "info") {
  console.log(`[[Connection Status]] ${message} [[${type}]]`);
  if (statusMessage) {
    statusMessage.textContent = message;
    statusMessage.className = `message text-sm ${
      type === "info" ? "info" : type === "success" ? "success" : "error"
    }`;
    statusMessage.style.display = "block";
  }
}

function hideStatus() {
  if (statusMessage) {
    statusMessage.textContent = "";
    statusMessage.style.display = "none";
    statusMessage.className = "message"; // Reset classes
  }
}

function showFileManagerStatus(message, type = "info") {
  console.log(`[[File Manager Status]] ${message} [[${type}]]`);
  if (fileManagerStatus) {
    fileManagerStatus.textContent = message;
    fileManagerStatus.className = `message text-sm ${
      type === "info" ? "info" : type === "success" ? "success" : "error"
    }`;
    fileManagerStatus.style.display = "block";
  }
}

function hideFileManagerStatus() {
  if (fileManagerStatus) {
    fileManagerStatus.textContent = "";
    fileManagerStatus.style.display = "none";
    fileManagerStatus.className = "message"; // Reset classes
  }
}

function showModal(modalElement) {
  modalElement.classList.remove("hidden");
  document.body.classList.add("overflow-hidden");
}

function hideModal(modalElement) {
  modalElement.classList.add("hidden");
  document.body.classList.remove("overflow-hidden");
}

function formatBytes(bytes, decimals = 2) {
  if (bytes === 0) return "0 Bytes";
  const k = 1024;
  const dm = decimals < 0 ? 0 : decimals;
  const sizes = ["Bytes", "KB", "MB", "GB", "TB", "PB", "EB", "ZB", "YB"];
  const i = Math.floor(Math.log(bytes) / Math.log(k));
  return parseFloat((bytes / Math.pow(k, i)).toFixed(dm)) + " " + sizes[i];
}

/**
 * Formats a long file name for display, truncating if it exceeds 2 lines.
 * If truncated, it shows the beginning and the extension (e.g., "verylongfilena...txt").
 * @param {string} fileName The original file name.
 * @returns {string} The formatted file name.
 */
function formatFileNameForDisplay(fileName) {
  const maxLength = 30; // Max characters before attempting to truncate for a single line
  const maxLines = 2; // Max lines before truly truncating with ellipsis

  const canvas = document.createElement("canvas");
  const context = canvas.getContext("2d");
  context.font = "1rem 'Open Sans'"; // Adjust font to match .text-lg and .font-semibold

  const words = fileName.split(" ");
  let currentLine = "";
  let lineCount = 0;
  const lines = [];

  for (let i = 0; i < words.length; i++) {
    const testLine =
      currentLine === "" ? words[i] : currentLine + " " + words[i];
    const metrics = context.measureText(testLine);
    // Rough estimate for max width in the modal to fit about 2 lines.
    // This is highly dependent on actual CSS width of parent, so we use a character count heuristic as well.
    const containerWidthEstimate = 350; // px, roughly max-w-md - padding
    const charWidthEstimate = 8; // px per character

    if (metrics.width > containerWidthEstimate && currentLine !== "") {
      // If current line overflows
      lines.push(currentLine);
      currentLine = words[i];
      lineCount++;
    } else {
      currentLine = testLine;
    }
    if (currentLine.length > maxLength && lineCount < maxLines - 1) {
      // If a single word is very long, force break
      lines.push(currentLine);
      currentLine = "";
      lineCount++;
    }

    if (lineCount >= maxLines) {
      break; // Stop processing words if already past max lines
    }
  }
  if (currentLine !== "") {
    lines.push(currentLine);
  }

  if (lines.length > maxLines) {
    const parts = fileName.split(".");
    const extension = parts.length > 1 ? "." + parts.pop() : "";
    let baseName = parts.join(".");

    const truncateLength = 15 - extension.length; // Adjusted length for beginning of name
    if (baseName.length > truncateLength) {
      baseName = baseName.substring(0, truncateLength);
    }
    return `${baseName}...${extension}`;
  }
  return fileName;
}

// --- S3 Operations ---

// Save credentials to localStorage
function saveCredentials(accessKeyId, secretAccessKey, region, bucketName) {
  localStorage.setItem("awsAccessKeyId", accessKeyId);
  localStorage.setItem("awsSecretAccessKey", secretAccessKey);
  localStorage.setItem("awsRegion", region);
  localStorage.setItem("awsBucketName", bucketName);
}

// Load credentials from localStorage
function loadCredentials() {
  const accessKeyId = localStorage.getItem("awsAccessKeyId");
  const secretAccessKey = localStorage.getItem("awsSecretAccessKey");
  const region = localStorage.getItem("awsRegion");
  const bucketName = localStorage.getItem("awsBucketName");

  if (accessKeyId && secretAccessKey && region && bucketName) {
    accessKeyIdInput.value = accessKeyId;
    secretAccessKeyInput.value = secretAccessKey;
    regionInput.value = region;
    bucketNameInput.value = bucketName;
    return true;
  }
  return false;
}

async function connectToS3() {
  const accessKeyId = accessKeyIdInput.value;
  const secretAccessKey = secretAccessKeyInput.value;
  const region = regionInput.value;
  const bucketName = bucketNameInput.value;

  if (!accessKeyId || !secretAccessKey || !region || !bucketName) {
    showStatus("Please fill in all connection details.", "error");
    showToast("Please fill in all connection details.", "error");
    return;
  }

  showStatus("Attempting to connect...", "info");
  showToast("Attempting to connect...", "info");
  AWS.config.update({
    accessKeyId: accessKeyId,
    secretAccessKey: secretAccessKey,
    region: region,
  });

  s3 = new AWS.S3({ apiVersion: "2006-03-01", signatureVersion: "v4" });
  currentBucket = bucketName;

  try {
    await s3.listObjectsV2({ Bucket: currentBucket, MaxKeys: 1 }).promise();
    showStatus("Connection successful!", "success");
    showToast("Connected to S3 bucket!", "success"); // Show toast only on successful connection
    connectionSection.classList.add("hidden");
    fileManagerSection.classList.remove("hidden");
    popupBucketName.textContent = currentBucket;
    currentPrefix = ""; // Reset prefix on new connection
    accountIconContainer.classList.remove("hidden");
    initialConnectionLoad = true; // Set flag for initial file listing after connection
    saveCredentials(accessKeyId, secretAccessKey, region, bucketName); // Save on successful connection
    listFiles();
  } catch (error) {
    console.error("S3 Connection Error:", error);
    showStatus(`Connection failed: ${error.message}`, "error");
    showToast(`Connection failed: ${error.message}`, "error");
    s3 = null; // Clear S3 object on failure
    // If auto-connect failed, clear credentials so user has to re-enter
    localStorage.removeItem("awsAccessKeyId");
    localStorage.removeItem("awsSecretAccessKey");
    localStorage.removeItem("awsRegion");
    localStorage.removeItem("awsBucketName");
  }
}

async function listFiles(prefix = "") {
  if (!s3) {
    showFileManagerStatus("Not connected to S3.", "error");
    syncStatusButton.title = "Disconnected";
    return;
  }

  // Show "Loading files..." message if not the initial connection load
  if (!initialConnectionLoad) {
    showFileManagerStatus("Loading files...", "info");
  }
  syncStatusIcon.classList.add("fa-spin");
  syncStatusButton.title = "Syncing...";

  try {
    const params = {
      Bucket: currentBucket,
      Delimiter: "/",
      Prefix: prefix,
    };
    const data = await s3.listObjectsV2(params).promise();

    fileListContainer.innerHTML = ""; // Clear existing list, except the top nav

    // Update dynamic breadcrumbs
    filePathBreadcrumbs.innerHTML = ""; // Clear previous breadcrumbs

    // Add Back button
    backButton.disabled = prefix === ""; // Disable if at root
    filePathBreadcrumbs.appendChild(backButton);

    // Add "Root" button with home icon
    const rootButton = document.createElement("button");
    rootButton.id = "rootButton";
    rootButton.className = "crumb-button";
    rootButton.innerHTML = `<i class="fas fa-home"></i><span>Root</span>`;
    rootButton.addEventListener("click", () => {
      if (currentPrefix !== "") {
        currentPrefix = "";
        initialConnectionLoad = false; // Not an initial load when navigating to root
        listFiles();
      }
    });
    filePathBreadcrumbs.appendChild(rootButton);

    // Add path segments for breadcrumbs
    if (currentPrefix !== "") {
      const pathParts = currentPrefix.split("/").filter(Boolean); // Split and remove empty strings
      let currentPath = "";
      pathParts.forEach((part, index) => {
        currentPath += part + "/";

        const separator = document.createElement("span");
        separator.className = "crumb-separator";
        separator.textContent = "/";
        filePathBreadcrumbs.appendChild(separator);

        const crumb = document.createElement("span");
        crumb.className = "crumb";
        crumb.textContent = part;
        crumb.dataset.prefix = currentPath; // Store full prefix for this segment

        // Make all but the last crumb clickable
        if (index < pathParts.length - 1) {
          crumb.addEventListener("click", (e) => {
            e.stopPropagation(); // Prevent bubbling to parent elements
            currentPrefix = e.target.dataset.prefix;
            initialConnectionLoad = false;
            listFiles(currentPrefix);
          });
        } else {
          crumb.classList.add("active"); // Last part is the active/current folder
          crumb.style.cursor = "default"; // Make last crumb not appear clickable
        }
        filePathBreadcrumbs.appendChild(crumb);
      });
    }

    const table = document.createElement("table");
    table.className = "min-w-full divide-y";
    table.style.borderColor = "var(--border-color)";

    const tbody = document.createElement("tbody");
    tbody.className = "divide-y";
    tbody.style.backgroundColor = "var(--bg-secondary)";
    tbody.style.borderColor = "var(--border-color)";

    // Folders
    data.CommonPrefixes.forEach((commonPrefix) => {
      const folderName = commonPrefix.Prefix.replace(prefix, "").replace(
        "/",
        ""
      );
      const row = document.createElement("tr");
      row.className = "file-item transition-colors duration-150";
      row.innerHTML = `
                <td class="px-6 py-4 whitespace-nowrap">
                    <div class="flex items-center">
                        <i class="fas fa-folder folder-icon text-xl mr-3"></i>
                        <span class="font-medium" style="color: var(--text-primary);">${folderName}</span>
                    </div>
                </td>
                <td class="px-6 py-4 whitespace-nowrap text-right text-sm font-medium">
                    <div class="flex items-center justify-end space-x-4 file-actions">
                        <span style="color: var(--text-secondary);">Folder</span>
                    </div>
                </td>
            `;
      row.addEventListener("click", () => {
        currentPrefix = commonPrefix.Prefix;
        initialConnectionLoad = false; // Not an initial load when navigating into a folder
        listFiles(currentPrefix);
      });
      tbody.appendChild(row);
    });

    // Files
    data.Contents.forEach((content) => {
      const fileName = content.Key.replace(prefix, "");
      if (fileName === "") return; // Skip the prefix itself if it's listed

      const fileSize = formatBytes(content.Size);
      const lastModified = new Date(content.LastModified).toLocaleDateString();
      const fileExtension = fileName.split(".").pop().toLowerCase();
      let fileIconClass = "fas fa-file file-icon"; // Default file icon

      if (fileExtension === "pdf") fileIconClass = "fas fa-file-pdf file-icon";
      else if (fileExtension === "doc" || fileExtension === "docx")
        fileIconClass = "fas fa-file-word file-icon";
      else if (fileExtension === "xls" || fileExtension === "xlsx")
        fileIconClass = "fas fa-file-excel file-icon";
      else if (fileExtension === "ppt" || fileExtension === "pptx")
        fileIconClass = "fas fa-file-powerpoint file-icon";
      else if (
        fileExtension === "jpg" ||
        fileExtension === "jpeg" ||
        fileExtension === "png" ||
        fileExtension === "gif"
      )
        fileIconClass = "fas fa-file-image file-icon";
      else if (
        fileExtension === "zip" ||
        fileExtension === "rar" ||
        fileExtension === "7z"
      )
        fileIconClass = "fas fa-file-archive file-icon";
      else if (fileExtension === "mp3" || fileExtension === "wav")
        fileIconClass = "fas fa-file-audio file-icon";
      else if (fileExtension === "mp4" || fileExtension === "mov")
        fileIconClass = "fas fa-file-video file-icon";
      else if (fileExtension === "txt")
        fileIconClass = "fas fa-file-alt file-icon";
      else if (
        fileExtension === "js" ||
        fileExtension === "html" ||
        fileExtension === "css" ||
        fileExtension === "json"
      )
        fileIconClass = "fas fa-file-code file-icon";

      const row = document.createElement("tr");
      row.className = "file-item transition-colors duration-150";
      row.innerHTML = `
                <td class="px-6 py-4 whitespace-nowrap">
                    <div class="flex items-center">
                        <i class="${fileIconClass} text-xl mr-3"></i>
                        <span class="font-medium" style="color: var(--text-primary);">${fileName}</span>
                    </div>
                </td>
                <td class="px-6 py-4 whitespace-nowrap text-right text-sm font-medium">
                    <div class="flex items-center justify-end space-x-4 file-actions">
                        <span style="color: var(--text-secondary);">${fileSize}</span>
                        <span style="color: var(--text-secondary);">${lastModified}</span>
                        <button class="text-accent hover:filter hover:brightness(80%) transition-colors duration-200 flex items-center space-x-1" onclick="downloadFile('${content.Key}')">
                            <i class="fas fa-download"></i>
                            <span>Download</span>
                        </button>
                        <button class="text-share hover:filter hover:brightness(80%) transition-colors duration-200 flex items-center space-x-1" onclick="showShareLinkModal('${content.Key}', '${fileName}')">
                            <i class="fas fa-share-alt"></i>
                            <span>Share</span>
                        </button>
                        <button class="text-red-500 hover:text-red-700 transition-colors duration-200 flex items-center space-x-1" onclick="deleteFile('${content.Key}')">
                            <i class="fas fa-trash-alt"></i>
                            <span>Delete</span>
                        </button>
                    </div>
                </td>
            `;
      tbody.appendChild(row);
    });

    table.appendChild(tbody);
    fileListContainer.appendChild(table);

    // Only show "Files loaded successfully" as a toast for initial connection load
    if (initialConnectionLoad) {
      showToast("Files loaded successfully!", "success");
      initialConnectionLoad = false; // Reset flag after the initial load
    }
    hideFileManagerStatus(); // Clear fileManagerStatus after loading

    syncStatusIcon.classList.remove("fa-spin");
    syncStatusButton.title = "Files are up-to-date";
  } catch (error) {
    console.error("Error listing files:", error);
    showFileManagerStatus(`Error listing files: ${error.message}`, "error");
    showToast(`Error listing files: ${error.message}`, "error");
    initialConnectionLoad = false; // Reset flag on error too
    syncStatusIcon.classList.remove("fa-spin");
    syncStatusButton.title = `Error syncing: ${error.message}`;
  }
}

// --- File Upload ---
uploadButton.addEventListener("click", () => {
  fileUploadInput.click(); // Trigger the hidden file input click
});

fileUploadInput.addEventListener("change", (event) => {
  const files = event.target.files;
  if (files.length > 0) {
    uploadFiles(files); // Automatically upload after selection
  }
});

async function uploadFiles(files) {
  if (!s3) {
    showToast("Not connected to S3.", "error");
    return;
  }
  showFileManagerStatus("Uploading files...", "info");
  showToast("Uploading files...", "info");
  syncStatusIcon.classList.add("fa-spin");
  syncStatusButton.title = "Uploading...";

  for (const file of files) {
    const uploadParams = {
      Bucket: currentBucket,
      Key: currentPrefix + file.name, // Include current prefix in the key
      Body: file,
    };

    try {
      await s3.upload(uploadParams).promise();
      showToast(`'${file.name}' uploaded successfully.`, "success");
    } catch (error) {
      console.error("Error uploading file:", file.name, error);
      showToast(`Failed to upload '${file.name}': ${error.message}`, "error");
    }
  }
  initialConnectionLoad = false; // Upload is not an initial load
  listFiles(currentPrefix); // Refresh the file list after uploads
  hideFileManagerStatus();
  fileUploadInput.value = ""; // Clear selected files from the input
}

// --- File Download ---
async function downloadFile(key) {
  if (!s3) {
    showToast("Not connected to S3.", "error");
    return;
  }
  showToast("Preparing download...", "info");
  try {
    const params = {
      Bucket: currentBucket,
      Key: key,
    };
    const data = await s3.getObject(params).promise();
    const url = URL.createObjectURL(new Blob([data.Body]));
    const a = document.createElement("a");
    a.href = url;
    a.download = key.split("/").pop(); // Get just the filename
    document.body.appendChild(a);
    a.click();
    a.remove();
    URL.revokeObjectURL(url);
    showToast("Download started.", "success");
  } catch (error) {
    console.error("Error downloading file:", error);
    showToast(`Failed to download: ${error.message}`, "error");
  }
}

// --- File Deletion ---
async function deleteFile(key) {
  if (!s3) {
    showToast("Not connected to S3.", "error");
    return;
  }

  if (!confirm(`Are you sure you want to delete '${key.split("/").pop()}'?`)) {
    return;
  }

  showToast("Deleting file...", "info");
  syncStatusIcon.classList.add("fa-spin");
  syncStatusButton.title = "Deleting...";
  try {
    const params = {
      Bucket: currentBucket,
      Key: key,
    };
    await s3.deleteObject(params).promise();
    showToast(`'${key.split("/").pop()}' deleted successfully.`, "success");
    initialConnectionLoad = false; // Deletion is not an initial load
    listFiles(currentPrefix); // Refresh list
  } catch (error) {
    console.error("Error deleting file:", error);
    showToast(`Failed to delete: ${error.message}`, "error");
    syncStatusIcon.classList.remove("fa-spin");
    syncStatusButton.title = `Error deleting: ${error.message}`;
  }
}

// --- Create New Folder ---
async function createNewFolder() {
  if (!s3) {
    showToast("Not connected to S3.", "error");
    return;
  }

  const folderName = newFolderNameInput.value.trim();
  if (!folderName) {
    showToast("Folder name cannot be empty.", "error");
    return;
  }

  const folderKey = currentPrefix + folderName + "/";

  showToast("Creating folder...", "info");
  syncStatusIcon.classList.add("fa-spin");
  syncStatusButton.title = "Creating folder...";
  try {
    const params = {
      Bucket: currentBucket,
      Key: folderKey,
      Body: "", // Empty body for a folder object
    };
    await s3.putObject(params).promise();
    showToast(`Folder '${folderName}' created successfully.`, "success");
    hideModal(createNewFolderModal);
    newFolderNameInput.value = ""; // Clear input
    initialConnectionLoad = false; // Folder creation is not an initial load
    listFiles(currentPrefix); // Refresh list
  } catch (error) {
    console.error("Error creating folder:", error);
    showToast(`Failed to create folder: ${error.message}`, "error");
    syncStatusIcon.classList.remove("fa-spin");
    syncStatusButton.title = `Error creating folder: ${error.message}`;
  }
}

// --- Share Link Functionality ---
async function generateShareLink(fileKey, durationSeconds) {
  if (!s3) {
    showToast("Not connected to S3.", "error");
    return;
  }
  if (durationSeconds === undefined) {
    generatedShareLinkInput.value = "Select a duration.";
    newShareLinkButton.disabled = true;
    return;
  }

  try {
    const params = {
      Bucket: currentBucket,
      Key: fileKey,
      Expires: durationSeconds,
    };

    const url = await s3.getSignedUrlPromise("getObject", params);
    generatedShareLinkInput.value = url;
    copyShareLinkButton.textContent = "Copy";
    fileKeyToShare = fileKey;
    showToast("Share link generated!", "success");
    newShareLinkButton.disabled = false; // Enable button once a link is generated
  } catch (error) {
    console.error("Error generating share link:", error);
    showToast(`Failed to generate share link: ${error.message}`, "error");
    generatedShareLinkInput.value = "Error generating link.";
    newShareLinkButton.disabled = true;
  }
}

function showShareLinkModal(fileKey, fileName) {
  sharedFileNameSpan.textContent = formatFileNameForDisplay(fileName); // Format the file name
  fileKeyToShare = fileKey;
  generatedShareLinkInput.value = "Select duration to generate link"; // Reset text
  newShareLinkButton.disabled = true; // Disable until duration is selected
  // Clear any previously active duration buttons
  Array.from(durationButtonsContainer.children).forEach((button) =>
    button.classList.remove("btn-primary")
  );
  showModal(shareLinkModal);
}

// --- Event Listeners ---
connectButton.addEventListener("click", connectToS3);

disconnectButton.addEventListener("click", () => {
  s3 = null;
  currentBucket = null;
  currentPrefix = "";
  // Clear stored credentials
  localStorage.removeItem("awsAccessKeyId");
  localStorage.removeItem("awsSecretAccessKey");
  localStorage.removeItem("awsRegion");
  localStorage.removeItem("awsBucketName");

  accessKeyIdInput.value = "";
  secretAccessKeyInput.value = "";
  regionInput.value = "";
  bucketNameInput.value = "";
  connectionSection.classList.remove("hidden");
  fileManagerSection.classList.add("hidden");
  hideStatus();
  hideFileManagerStatus();
  accountIconContainer.classList.add("hidden");
  showToast("Disconnected from S3.", "info");
  initialConnectionLoad = true; // Reset initialConnectionLoad flag for next connection
  syncStatusIcon.classList.remove("fa-spin"); // Stop any spinning
  syncStatusButton.title = "Disconnected";
});

// Account Menu Dropdown
accountMenuButton.addEventListener("click", (event) => {
  event.stopPropagation(); // Prevent document click from closing it immediately
  accountDropdownMenu.classList.toggle("hidden");
});

// Close dropdown if clicked outside
document.addEventListener("click", (event) => {
  if (
    !accountMenuButton.contains(event.target) &&
    !accountDropdownMenu.contains(event.target)
  ) {
    accountDropdownMenu.classList.add("hidden");
  }
});

// Theme Toggle in Dropdown
themeToggleDropdown.addEventListener("click", () => {
  document.body.classList.toggle("dark-mode");
  const isDarkMode = document.body.classList.contains("dark-mode");
  themeIconDropdown.className = isDarkMode
    ? "fas fa-sun mr-2"
    : "fas fa-moon mr-2";
  showToast(`Theme changed to ${isDarkMode ? "Dark" : "Light"} Mode`, "info");
  localStorage.setItem("theme", isDarkMode ? "dark" : "light"); // Persist theme preference
});

// Sync button
syncStatusButton.addEventListener("click", () => {
  if (s3) {
    showToast("Manually refreshing file list...", "info");
    listFiles(currentPrefix); // Re-list files
  } else {
    showToast("Cannot refresh: Not connected to S3.", "error");
  }
});

// Back button
backButton.addEventListener("click", () => {
  if (currentPrefix === "") {
    return; // Already at root
  }

  // Remove the last segment from the prefix
  const pathParts = currentPrefix.split("/").filter(Boolean);
  pathParts.pop(); // Remove the last part
  currentPrefix = pathParts.length > 0 ? pathParts.join("/") + "/" : ""; // Reconstruct prefix

  initialConnectionLoad = false; // Not an initial load
  listFiles(currentPrefix);
});

// Modal related event listeners
newFolderButton.addEventListener("click", () => {
  showModal(createNewFolderModal);
  newFolderNameInput.focus();
});
createFolderCancelButton.addEventListener("click", () =>
  hideModal(createNewFolderModal)
);
createFolderConfirmButton.addEventListener("click", createNewFolder);
newFolderNameInput.addEventListener("keydown", (event) => {
  if (event.key === "Enter") {
    createNewFolder();
  }
});

// Share Link Modal Event Listeners
closeShareModalButton.addEventListener("click", () =>
  hideModal(shareLinkModal)
);

copyShareLinkButton.addEventListener("click", () => {
  generatedShareLinkInput.select();
  document.execCommand("copy");
  copyShareLinkButton.textContent = "Copied!";
  showToast("Link copied to clipboard!", "success");
});

durationButtonsContainer.addEventListener("click", (event) => {
  if (event.target.tagName === "BUTTON") {
    // Remove 'btn-primary' from all duration buttons
    Array.from(durationButtonsContainer.children).forEach((button) =>
      button.classList.remove("btn-primary")
    );
    // Add 'btn-primary' to the clicked button
    event.target.classList.add("btn-primary");

    const duration = parseInt(event.target.dataset.duration);
    generateShareLink(fileKeyToShare, duration); // Generate link immediately on duration selection
  }
});

newShareLinkButton.addEventListener("click", () => {
  const activeDurationButton =
    durationButtonsContainer.querySelector(".btn-primary");
  if (activeDurationButton) {
    const duration = parseInt(activeDurationButton.dataset.duration);
    generateShareLink(fileKeyToShare, duration);
  } else {
    showToast("Please select a duration first.", "info");
  }
});

// Initial state: hide account icon until connected
accountIconContainer.classList.add("hidden");

// Initialize theme based on localStorage or system preference
document.addEventListener("DOMContentLoaded", async () => {
  const savedTheme = localStorage.getItem("theme");
  if (
    savedTheme === "dark" ||
    (!savedTheme && window.matchMedia("(prefers-color-scheme: dark)").matches)
  ) {
    document.body.classList.add("dark-mode");
    themeIconDropdown.className = "fas fa-sun mr-2";
  } else {
    document.body.classList.remove("dark-mode");
    themeIconDropdown.className = "fas fa-moon mr-2";
  }

  // Attempt to auto-reconnect using saved credentials
  if (loadCredentials()) {
    showStatus("Attempting to reconnect using saved credentials...", "info");
    await connectToS3();
  } else {
    showConnectionSection(); // Ensure connection section is visible if no saved credentials
  }
});

function showConnectionSection() {
  connectionSection.classList.remove("hidden");
  fileManagerSection.classList.add("hidden");
  accountIconContainer.classList.add("hidden");
  syncStatusButton.title = "Not connected";
  backButton.disabled = true; // Ensure back button is disabled when not connected
}
