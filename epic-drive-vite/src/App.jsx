import React, { useState, useEffect, useCallback, useRef } from "react";
import AWS from "aws-sdk";
import ConnectionSection from "./components/ConnectionSection.jsx";
import FileManagerSection from "./components/FileManagerSection.jsx";
import CreateNewFolderModal from "./components/CreateNewFolderModal.jsx";
import ShareLinkModal from "./components/ShareLinkModal.jsx";
import ToastContainer from "./components/ToastContainer.jsx";

function App() {
  const [isConnected, setIsConnected] = useState(false);
  const [accessKeyId, setAccessKeyId] = useState("");
  const [secretAccessKey, setSecretAccessKey] = useState("");
  const [region, setRegion] = useState("");
  const [bucketName, setBucketName] = useState("");
  const [statusMessage, setStatusMessage] = useState(""); // For connection status
  const [fileManagerStatus, setFileManagerStatus] = useState(""); // For file manager status
  const [accountMenuOpen, setAccountMenuOpen] = useState(false);
  const [themeIconClass, setThemeIconClass] = useState("fas fa-moon mr-2");
  const [showCreateFolderModal, setShowCreateFolderModal] = useState(false);
  const [showShareModal, setShowShareModal] = useState(false);
  const [fileList, setFileList] = useState([]); // State for file list data
  const [searchQuery, setSearchQuery] = useState("");
  const [filterType, setFilterType] = useState("all"); // 'all', 'folders', 'documents', etc.
  const [toasts, setToasts] = useState([]); // For managing toast notifications
  const [sharedFileName, setSharedFileName] = useState(""); // State for file name in share modal
  const [sharedFileKey, setSharedFileKey] = useState(""); // New state for the S3 key of the shared file

  // Converted global 'let' variables to state for better React management
  const [currentAwsBucket, setCurrentAwsBucket] = useState("");
  const [currentAwsPrefix, setCurrentAwsPrefix] = useState("");

  // Ref for generating unique toast IDs
  const toastIdCounter = useRef(0);
  // Ref to hold the S3 client instance, managed outside of state to prevent re-instantiation on renders
  const s3ClientRef = useRef(null);

  // Callback to show toast notifications
  const showToast = useCallback((message, type = "info", duration = 3000) => {
    toastIdCounter.current += 1;
    const id = toastIdCounter.current; // Guaranteed unique ID

    setToasts((prevToasts) => [...prevToasts, { id, message, type }]);
    setTimeout(() => {
      setToasts((prevToasts) => prevToasts.filter((toast) => toast.id !== id));
    }, duration);
  }, []); // Empty dependency array because toastIdCounter.current is a mutable ref

  // Utility functions

  // Saves AWS credentials to localStorage
  const saveCredentials = useCallback(() => {
    localStorage.setItem("awsAccessKeyId", accessKeyId);
    localStorage.setItem("awsSecretAccessKey", secretAccessKey);
    localStorage.setItem("awsRegion", region);
    localStorage.setItem("awsBucketName", bucketName);
  }, [accessKeyId, secretAccessKey, region, bucketName]);

  // Loads AWS credentials from localStorage
  const loadCredentials = useCallback(() => {
    const savedAccessKeyId = localStorage.getItem("awsAccessKeyId");
    const savedSecretAccessKey = localStorage.getItem("awsSecretAccessKey");
    const savedRegion = localStorage.getItem("awsRegion");
    const savedBucketName = localStorage.getItem("awsBucketName");

    if (
      savedAccessKeyId &&
      savedSecretAccessKey &&
      savedRegion &&
      savedBucketName
    ) {
      setAccessKeyId(savedAccessKeyId);
      setSecretAccessKey(savedSecretAccessKey);
      setRegion(savedRegion);
      setBucketName(savedBucketName);
      return true;
    }
    return false;
  }, []);

  // Clears AWS credentials from localStorage
  const clearCredentials = useCallback(() => {
    localStorage.removeItem("awsAccessKeyId");
    localStorage.removeItem("awsSecretAccessKey");
    localStorage.removeItem("awsRegion");
    localStorage.removeItem("awsBucketName");
  }, []);

  // Initializes and returns the S3 client instance
  const getS3Client = useCallback(() => {
    if (!s3ClientRef.current) {
      if (!accessKeyId || !secretAccessKey || !region) {
        showToast("AWS credentials or region missing.", "error");
        return null;
      }
      AWS.config.update({
        accessKeyId: accessKeyId,
        secretAccessKey: secretAccessKey,
        region: region,
      });
      s3ClientRef.current = new AWS.S3({ apiVersion: "2006-03-01" });
    }
    return s3ClientRef.current;
  }, [accessKeyId, secretAccessKey, region, showToast]);

  // Helper function to determine file type category
  const getFileType = useCallback((fileName) => {
    const ext = fileName.split(".").pop().toLowerCase();
    switch (ext) {
      case "jpg":
      case "jpeg":
      case "png":
      case "gif":
      case "bmp":
      case "svg":
      case "webp":
      case "ico":
        return "image";
      case "mp4":
      case "mov":
      case "avi":
      case "mkv":
      case "webm":
      case "flv":
      case "wmv":
        return "video";
      case "mp3":
      case "wav":
      case "aac":
      case "flac":
      case "ogg":
      case "wma":
        return "audio";
      case "doc":
      case "docx":
      case "odt":
      case "pdf":
      case "rtf":
        return "document";
      case "xls":
      case "xlsx":
      case "ods":
      case "csv":
        return "spreadsheet";
      case "ppt":
      case "pptx":
      case "odp":
        return "presentation";
      case "zip":
      case "rar":
      case "7z":
      case "tar":
      case "gz":
      case "bz2":
      case "xz":
        return "archive";
      case "js":
      case "jsx":
      case "ts":
      case "tsx":
      case "html":
      case "css":
      case "json":
      case "xml":
      case "py":
      case "java":
      case "c":
      case "cpp":
      case "h":
      case "php":
      case "rb":
      case "go":
      case "swift":
        return "code";
      case "txt":
      case "md":
        return "text";
      default:
        return "other"; // For anything else
    }
  }, []);

  // Lists files and folders in the current prefix
  const listFilesInCurrentFolder = useCallback(
    async (
      prefixToList, // Use passed prefix
      currentSearchQuery,
      currentFilterType
    ) => {
      console.log(
        "App: listFilesInCurrentFolder called with prefix:",
        prefixToList,
        "search:",
        currentSearchQuery,
        "filter:",
        currentFilterType
      ); // Debug log

      let loadingTimer;
      loadingTimer = setTimeout(() => {
        setFileManagerStatus("Loading files...");
      }, 200);

      const s3Client = getS3Client();
      if (!s3Client || !currentAwsBucket) {
        clearTimeout(loadingTimer);
        setFileManagerStatus("Not connected to S3.");
        return;
      }

      try {
        const params = {
          Bucket: currentAwsBucket,
          Delimiter: "/",
          Prefix: prefixToList,
        };

        const data = await s3Client.listObjectsV2(params).promise();

        let items = [];

        if (data.CommonPrefixes) {
          data.CommonPrefixes.forEach((commonPrefix) => {
            const folderName = commonPrefix.Prefix.replace(
              prefixToList,
              ""
            ).replace("/", "");
            if (folderName) {
              items.push({
                Key: commonPrefix.Prefix,
                Name: folderName,
                Type: "folder",
                LastModified: null,
                Size: null,
              });
            }
          });
        }

        if (data.Contents) {
          data.Contents.forEach((content) => {
            if (content.Key !== prefixToList && !content.Key.endsWith("/")) {
              const fileName = content.Key.replace(prefixToList, "");
              items.push({
                Key: content.Key,
                Name: fileName,
                Type: getFileType(fileName),
                LastModified: content.LastModified,
                Size: content.Size,
              });
            }
          });
        }

        const filteredItems = items
          .filter((item) =>
            item.Name.toLowerCase().includes(currentSearchQuery.toLowerCase())
          )
          .filter((item) => {
            if (currentFilterType === "all") return true;
            if (currentFilterType === "folders" && item.Type === "folder")
              return true;
            if (
              currentFilterType === "documents" &&
              [
                "document",
                "text",
                "spreadsheet",
                "presentation",
                "pdf",
              ].includes(item.Type)
            )
              return true;
            if (currentFilterType === "images" && item.Type === "image")
              return true;
            if (currentFilterType === "videos" && item.Type === "video")
              return true;
            if (currentFilterType === "audio" && item.Type === "audio")
              return true;
            if (currentFilterType === "code" && item.Type === "code")
              return true;
            if (currentFilterType === "archives" && item.Type === "archive")
              return true;
            if (
              currentFilterType === "other" &&
              ["other", "unknown"].includes(item.Type)
            )
              return true;
            return false;
          });

        setFileList(filteredItems);
        setCurrentAwsPrefix(prefixToList);
        clearTimeout(loadingTimer);
        setFileManagerStatus("");
      } catch (error) {
        clearTimeout(loadingTimer);
        console.error("Error listing files:", error);
        setFileManagerStatus(`Error loading files: ${error.message}`);
        showToast(`Error loading files: ${error.message}`, "error");
      }
    },
    [getS3Client, showToast, getFileType, currentAwsBucket] // Dependencies are correct for this useCallback
  );

  // Connects to the S3 bucket
  const connectToS3 = useCallback(async () => {
    console.log("App: connectToS3 called"); // Debug log
    setStatusMessage("Connecting...");
    showToast("Connecting to S3 bucket...", "info");
    const s3Client = getS3Client();
    if (!s3Client || !bucketName) {
      setStatusMessage("Please enter all connection details.");
      showToast("Please enter all connection details.", "error");
      setIsConnected(false);
      return;
    }

    try {
      await s3Client.headBucket({ Bucket: bucketName }).promise();
      setIsConnected(true);
      saveCredentials();
      setCurrentAwsBucket(bucketName);
      setCurrentAwsPrefix(""); // Reset path on successful connection
      setStatusMessage("");
      showToast("Successfully connected to S3 bucket!", "success");
      // REMOVED: listFilesInCurrentFolder call from here. It will now be triggered by the dedicated useEffect.
    } catch (error) {
      console.error("Connection error:", error);
      setIsConnected(false);
      setStatusMessage(`Connection failed: ${error.message || error.code}`);
      showToast(`Connection failed: ${error.message || error.code}`, "error");
      clearCredentials();
    }
  }, [bucketName, saveCredentials, clearCredentials, getS3Client, showToast]); // Dependencies updated: removed listFilesInCurrentFolder, searchQuery, filterType

  // Disconnects from S3
  const disconnectS3 = useCallback(() => {
    setIsConnected(false);
    clearCredentials();
    s3ClientRef.current = null; // Clear S3 instance in ref
    setCurrentAwsBucket(""); // Reset state
    setCurrentAwsPrefix(""); // Reset state
    setFileList([]);
    setStatusMessage("");
    setFileManagerStatus("");
    showToast("Disconnected from S3 bucket.", "info");
  }, [clearCredentials, showToast]);

  // Uploads a file to the current S3 prefix
  const uploadFile = useCallback(
    async (file) => {
      if (!file) {
        showToast("No file selected for upload.", "warning");
        return;
      }
      setFileManagerStatus(`Uploading ${file.name}...`);
      showToast(`Uploading ${file.name}...`, "info");
      const s3Client = getS3Client();
      if (!s3Client || !currentAwsBucket) {
        setFileManagerStatus("Not connected to S3.");
        return;
      }

      const uploadPath = currentAwsPrefix + file.name;
      const params = {
        Bucket: currentAwsBucket,
        Key: uploadPath,
        Body: file,
      };

      try {
        await s3Client.upload(params).promise();
        showToast(`Successfully uploaded ${file.name}`, "success");
        await listFilesInCurrentFolder(
          currentAwsPrefix,
          searchQuery,
          filterType
        );
      } catch (error) {
        console.error("Upload error:", file.name, error);
        showToast(`Upload failed for ${file.name}: ${error.message}`, "error");
        setFileManagerStatus(`Upload failed: ${error.message}`);
      }
    },
    [
      getS3Client,
      showToast,
      listFilesInCurrentFolder,
      currentAwsBucket,
      currentAwsPrefix,
      searchQuery,
      filterType,
    ]
  );

  // Deletes a file or folder from S3
  const deleteFileOrFolder = useCallback(
    async (key, isFolder) => {
      if (
        !window.confirm(
          `Are you sure you want to delete ${key.split("/").pop() || key}?`
        )
      ) {
        return;
      }

      setFileManagerStatus(`Deleting ${key}...`);
      showToast(`Deleting ${key}...`, "info");
      const s3Client = getS3Client();
      if (!s3Client || !currentAwsBucket) {
        setFileManagerStatus("Not connected to S3.");
        return;
      }

      try {
        if (isFolder) {
          const listParams = {
            Bucket: currentAwsBucket,
            Prefix: key,
          };
          const listedObjects = await s3Client
            .listObjectsV2(listParams)
            .promise();

          if (listedObjects.Contents.length > 0) {
            const deleteParams = {
              Bucket: currentAwsBucket,
              Delete: {
                Objects: listedObjects.Contents.map(({ Key }) => ({ Key })),
              },
            };
            await s3Client.deleteObjects(deleteParams).promise();
          }
          if (key.endsWith("/")) {
            await s3Client
              .deleteObject({ Bucket: currentAwsBucket, Key: key })
              .promise();
          }
        } else {
          const params = {
            Bucket: currentAwsBucket,
            Key: key,
          };
          await s3Client.deleteObject(params).promise();
        }
        showToast(
          `Successfully deleted ${key.split("/").pop() || key}.`,
          "success"
        );
        await listFilesInCurrentFolder(
          currentAwsPrefix,
          searchQuery,
          filterType
        );
      } catch (error) {
        console.error("Delete error:", error);
        showToast(
          `Deletion failed for ${key.split("/").pop() || key}: ${
            error.message
          }`,
          "error"
        );
        setFileManagerStatus(`Deletion failed: ${error.message}`);
      }
    },
    [
      getS3Client,
      showToast,
      listFilesInCurrentFolder,
      currentAwsBucket,
      currentAwsPrefix,
      searchQuery,
      filterType,
    ]
  );

  // Downloads a file from S3
  const downloadFile = useCallback(
    async (key, fileName) => {
      setFileManagerStatus(`Downloading ${fileName}...`);
      showToast(`Downloading ${fileName}...`, "info");
      const s3Client = getS3Client();
      if (!s3Client || !currentAwsBucket) {
        setFileManagerStatus("Not connected to S3.");
        return;
      }

      try {
        const params = {
          Bucket: currentAwsBucket,
          Key: key,
        };
        const data = await s3Client.getObject(params).promise();

        const blob = new Blob([data.Body], { type: data.ContentType });
        const url = URL.createObjectURL(blob);
        const a = document.createElement("a");
        a.href = url;
        a.download = fileName;
        document.body.appendChild(a);
        a.click();
        document.body.removeChild(a);
        URL.revokeObjectURL(url);
        showToast(`Successfully downloaded ${fileName}.`, "success");
        setFileManagerStatus("");
      } catch (error) {
        console.error("Download error:", error);
        showToast(`Download failed for ${fileName}: ${error.message}`, "error");
        setFileManagerStatus(`Download failed: ${error.message}`);
      }
    },
    [getS3Client, showToast, currentAwsBucket]
  );

  // Creates a new folder in the current S3 prefix
  const createNewFolder = useCallback(
    async (folderName) => {
      if (!folderName) {
        showToast("Folder name cannot be empty.", "warning");
        return;
      }
      if (folderName.endsWith("/")) {
        folderName = folderName.slice(0, -1);
      }

      const fullPath = currentAwsPrefix + folderName + "/";

      if (
        fileList.some((item) => item.Key === fullPath && item.Type === "folder")
      ) {
        showToast(`Folder '${folderName}' already exists.`, "warning");
        return;
      }

      setFileManagerStatus(`Creating folder ${folderName}...`);
      showToast(`Creating folder ${folderName}...`, "info");
      const s3Client = getS3Client();
      if (!s3Client || !currentAwsBucket) {
        setFileManagerStatus("Not connected to S3.");
        return;
      }

      try {
        const params = {
          Bucket: currentAwsBucket,
          Key: fullPath,
          Body: "",
        };
        await s3Client.putObject(params).promise();
        showToast(`Folder '${folderName}' created successfully.`, "success");
        setShowCreateFolderModal(false);
        await listFilesInCurrentFolder(
          currentAwsPrefix,
          searchQuery,
          filterType
        );
      } catch (error) {
        console.error("Error creating folder:", error);
        showToast(`Failed to create folder: ${error.message}`, "error");
        setFileManagerStatus(`Failed to create folder: ${error.message}`);
      }
    },
    [
      getS3Client,
      showToast,
      listFilesInCurrentFolder,
      fileList,
      setShowCreateFolderModal,
      currentAwsBucket,
      currentAwsPrefix,
      searchQuery,
      filterType,
    ]
  );

  // Generates a pre-signed URL for sharing a file
  const generateShareLink = useCallback(
    async (key, durationSeconds) => {
      if (!key || !durationSeconds) {
        showToast("Invalid parameters for generating share link.", "error");
        return "";
      }
      const s3Client = getS3Client();
      if (!s3Client || !currentAwsBucket) {
        return "";
      }

      try {
        const params = {
          Bucket: currentAwsBucket,
          Key: key,
          Expires: durationSeconds,
        };
        const url = await s3Client.getSignedUrlPromise("getObject", params);
        showToast("Share link generated successfully!", "success");
        return url;
      } catch (error) {
        console.error("Error generating share link:", error);
        showToast(`Failed to generate share link: ${error.message}`, "error");
        return "";
      }
    },
    [getS3Client, showToast, currentAwsBucket]
  );

  // Effect for initial load and theme preference (only calls connectToS3 if credentials exist)
  useEffect(() => {
    console.log("App: useEffect for initial load/theme triggered"); // Debug log
    const savedTheme = localStorage.getItem("theme");
    if (
      savedTheme === "dark" ||
      (!savedTheme && window.matchMedia("(prefers-color-scheme: dark)").matches)
    ) {
      document.body.classList.add("dark-mode");
      setThemeIconClass("fas fa-sun mr-2");
    } else {
      document.body.classList.remove("dark-mode");
      setThemeIconClass("fas fa-moon mr-2");
    }

    // Only attempt to connect if credentials are found AND we are not already connected
    if (loadCredentials() && !isConnected) {
      setStatusMessage("Attempting to reconnect using saved credentials...");
      connectToS3();
    }
  }, [loadCredentials, connectToS3, isConnected]); // Added isConnected to dependencies

  // NEW: Effect to trigger file listing when connection and bucket are ready, or filter/search changes
  useEffect(() => {
    if (isConnected && currentAwsBucket && s3ClientRef.current) {
      console.log("App: useEffect for file listing triggered."); // Debug log
      listFilesInCurrentFolder(currentAwsPrefix, searchQuery, filterType);
    }
  }, [
    isConnected,
    currentAwsBucket,
    currentAwsPrefix,
    searchQuery,
    filterType,
    listFilesInCurrentFolder,
  ]);

  // Theme toggle handler
  const handleThemeToggle = useCallback(() => {
    const isDarkMode = document.body.classList.toggle("dark-mode");
    localStorage.setItem("theme", isDarkMode ? "dark" : "light");
    setThemeIconClass(isDarkMode ? "fas fa-sun mr-2" : "fas fa-moon mr-2");
  }, []);

  // Breadcrumbs logic (simplified for React, you'll render this dynamically)
  const getBreadcrumbs = useCallback(() => {
    const paths = currentAwsPrefix.split("/").filter((p) => p !== "");
    let crumbs = [{ name: "Root", prefix: "" }];
    let cumulativePrefix = "";
    paths.forEach((path) => {
      cumulativePrefix += path + "/";
      crumbs.push({ name: path, prefix: cumulativePrefix });
    });
    return crumbs;
  }, [currentAwsPrefix]);

  // Navigates into a folder or back to a parent folder
  const navigateToFolder = useCallback(
    async (prefix) => {
      // console.log('App: navigateToFolder called with prefix:', prefix); // Debug log
      // Do not reset filterType or searchQuery here, let the useEffect handle updates
      // Instead, explicitly update currentAwsPrefix to trigger the useEffect
      setCurrentAwsPrefix(prefix);
      setSearchQuery(""); // Always clear search on navigation
      setFilterType("all"); // Always reset filter to 'all' on navigation
      // The file listing will be handled by the dedicated useEffect due to currentAwsPrefix, searchQuery, filterType change
    },
    [] // Dependencies adjusted to only include what's needed for the callback definition
  );

  // Handle clicks outside dropdowns (account menu and filter dropdown)
  useEffect(() => {
    const handleClickOutside = (event) => {
      const accountMenuButton = document.getElementById("account-menu-button");
      const accountDropdownMenu = document.getElementById(
        "account-dropdown-menu"
      );
      if (
        accountMenuOpen &&
        accountMenuButton &&
        accountDropdownMenu &&
        !accountMenuButton.contains(event.target) &&
        !accountDropdownMenu.contains(event.target)
      ) {
        setAccountMenuOpen(false);
      }
    };
    document.addEventListener("click", handleClickOutside);
    return () => {
      document.removeEventListener("click", handleClickOutside);
    };
  }, [accountMenuOpen]);

  return (
    <div className="font-open-sans">
      <header className="header-bg shadow-sm py-4">
        <div className="container mx-auto flex justify-between items-center px-4">
          <div className="flex items-center space-x-2">
            <h1
              className="text-4xl font-bold"
              style={{ color: "var(--text-primary)" }}
            >
              Epic-Drive
              <span
                className="text-sm font-normal text-gray-500"
                style={{ color: "var(--text-secondary)" }}
              >
                <a
                  href="https://premkumar-epic.github.io/premkumar/"
                  target="_blank"
                  className="no-underline"
                  style={{ color: "inherit" }}
                >
                  By EPIC
                </a>
              </span>
            </h1>
          </div>
          <nav className="flex items-center space-x-4">
            <div className="relative" id="account-icon-container">
              <button
                id="account-menu-button"
                className="px-3 py-2 rounded-full text-accent hover:bg-gray-200 dark:hover:bg-gray-700 transition-colors duration-200"
                onClick={() => setAccountMenuOpen(!accountMenuOpen)}
              >
                <i className="fas fa-user-circle text-3xl"></i>
              </button>
              {accountMenuOpen && (
                <div
                  id="account-dropdown-menu"
                  className="absolute right-0 mt-2 w-48 rounded-md shadow-lg dropdown-menu"
                >
                  <div
                    className="py-1"
                    role="menu"
                    aria-orientation="vertical"
                    aria-labelledby="account-menu-button"
                  >
                    <p
                      id="popupBucketName"
                      className="block px-4 py-2 text-sm text-secondary-pop truncate"
                      role="menuitem"
                    >
                      {isConnected ? currentAwsBucket : "Not Connected"}{" "}
                    </p>
                    <hr className="border-gray-200 dark:border-gray-600 my-1" />
                    <button
                      id="theme-toggle-dropdown"
                      className="block w-full text-left px-4 py-2 text-sm dropdown-item"
                      role="menuitem"
                      onClick={handleThemeToggle}
                    >
                      <i
                        id="theme-icon-dropdown"
                        className={themeIconClass}
                      ></i>
                      Toggle Theme
                    </button>
                    <button
                      id="disconnectButton"
                      className="block w-full text-left px-4 py-2 text-sm dropdown-item text-red-600 hover:bg-red-100 dark:hover:bg-red-900"
                      role="menuitem"
                      onClick={disconnectS3}
                      disabled={!isConnected}
                    >
                      <i className="fas fa-sign-out-alt mr-2"></i> Disconnect
                    </button>
                  </div>
                </div>
              )}
            </div>
          </nav>
        </div>
      </header>

      <main className="container mx-auto p-4 md:p-8 main-content-area flex-grow">
        {!isConnected ? (
          <ConnectionSection
            accessKeyId={accessKeyId}
            setAccessKeyId={setAccessKeyId}
            secretAccessKey={secretAccessKey}
            setSecretAccessKey={setSecretAccessKey}
            region={region}
            setRegion={setRegion}
            bucketName={bucketName}
            setBucketName={setBucketName}
            statusMessage={statusMessage}
            connectToS3={connectToS3}
          />
        ) : (
          <FileManagerSection
            fileManagerStatus={fileManagerStatus}
            fileList={fileList}
            currentPrefix={currentAwsPrefix}
            navigateToFolder={navigateToFolder}
            uploadFile={uploadFile}
            deleteFileOrFolder={deleteFileOrFolder}
            downloadFile={downloadFile}
            createNewFolder={createNewFolder}
            setShowCreateFolderModal={setShowCreateFolderModal}
            setShowShareModal={setShowShareModal}
            setSharedFileName={setSharedFileName}
            setSharedFileKey={setSharedFileKey}
            listFilesInCurrentFolder={listFilesInCurrentFolder}
            searchQuery={searchQuery}
            setSearchQuery={setSearchQuery}
            filterType={filterType}
            setFilterType={setFilterType}
            showToast={showToast}
            getBreadcrumbs={getBreadcrumbs}
          />
        )}
      </main>

      {/* Modals */}
      {showCreateFolderModal && (
        <CreateNewFolderModal
          onClose={() => setShowCreateFolderModal(false)}
          onCreate={createNewFolder}
        />
      )}

      {showShareModal && (
        <ShareLinkModal
          onClose={() => setShowShareModal(false)}
          generateShareLink={generateShareLink}
          sharedFileName={sharedFileName}
          sharedFileKey={sharedFileKey}
          showToast={showToast}
        />
      )}

      <ToastContainer toasts={toasts} />

      <footer className="footer-bg py-4 text-center text-sm">
        <div className="container mx-auto px-4">
          &copy; {new Date().getFullYear()} Epic-Drive. All rights reserved.{" "}
          <br />
          Support this project:
          <a
            href="https://buymeacoffee.com/premkumar.dev"
            target="_blank"
            className="text-accent hover:underline"
          >
            Buy me a Coffee
          </a>
        </div>
      </footer>
    </div>
  );
}

export default App;
