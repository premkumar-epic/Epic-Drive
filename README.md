# My S3 File Manager

## Project Description

This project is a **client-side web application** that provides a user-friendly interface for managing files in Amazon S3 (Simple Storage Service) buckets. Inspired by tools like Chai Storage, it allows users to connect directly to their own AWS S3 buckets using their credentials, enabling seamless file uploads, downloads, deletions, and more—all within their web browser.

The core principle behind "My S3 File Manager" is **"Bring Your Own Keys."**  
**All AWS S3 interactions occur directly from the user's browser** via the AWS SDK for JavaScript. Crucially, user AWS credentials are **stored securely in their browser's local storage**, ensuring that no sensitive information ever leaves the user's device or is stored on the application's server.

## Features

- **Secure Client-Side Operation:** All AWS S3 operations are performed directly from the browser; no user credentials are ever stored on the application's server.
- **Intuitive UI for S3 Management:** A clean and easy-to-use interface for common S3 tasks.
- **Connect & Disconnect:** Easily connect to a specified S3 bucket using AWS Access Key ID, Secret Access Key, Region, and Bucket Name. Disconnect to clear credentials from local storage.
- **File & Folder Listing:** View the contents of your connected S3 bucket.
- **File Uploads:** Upload single or multiple files to your S3 bucket.
- **File Downloads:** Download files directly from S3.
- **File Deletion:** Delete unwanted files.
- **Folder Creation:** Create new "folders" (S3 object prefixes) within your bucket.
- **Shareable Links (Pre-signed URLs):** Generate temporary, secure links for individual files, allowing controlled sharing with an optional expiry time.
- **Local Credential Storage:** AWS credentials are saved in the browser's local storage for convenience, eliminating the need to re-enter them on subsequent visits.
- **Basic Search & Filtering:** Quickly find files by name.

## Technologies Used

- **HTML5:** For structuring the web content.
- **CSS3:** For styling and layout (can be enhanced with frameworks like Bootstrap or Tailwind CSS).
- **JavaScript (ES6+):** The primary language for all client-side logic and S3 interactions.
- **AWS SDK for JavaScript (in the Browser):** The official Amazon Web Services SDK for interacting with S3 APIs directly from the browser.
- **Web Storage API (Local Storage):** For persistent, client-side storage of user credentials.

## Setup & Usage

1. **Clone the Repository:**
    ```
    git clone https://github.com/your-username/my-s3-file-manager.git
    cd my-s3-file-manager
    ```
2. **Open `index.html`:**  
   Simply open the `index.html` file in your web browser. You can also serve it using a local web server (e.g., `npx serve` or Python's `http.server`).
3. **AWS S3 Configuration:**
    - **Create an S3 Bucket:** Log into your AWS Management Console and create a new S3 bucket.
    - **Configure CORS:**  
      On your S3 bucket's "Permissions" tab, add a CORS policy that allows requests from your website's origin (e.g., `http://localhost:8000` or `https://your-github-pages-url.com`).  
      A typical policy looks like this:
        ```
        [
            {
                "AllowedHeaders": ["*"],
                "AllowedMethods": ["GET", "PUT", "POST", "DELETE", "HEAD"],
                "AllowedOrigins": ["*"], // Replace with your specific origin(s) for production!
                "ExposeHeaders": ["ETag"],
                "MaxAgeSeconds": 3000
            }
        ]
        ```
    - **Create an IAM User:**  
      Create a dedicated IAM user with **minimum necessary permissions** (`s3:GetObject`, `s3:PutObject`, `s3:ListBucket`, `s3:DeleteObject`) restricted to **your specific S3 bucket**.  
      Avoid using root account credentials. Generate an Access Key ID and Secret Access Key for this user.
4. **Connect in the Application:**  
   Enter your AWS Access Key ID, Secret Access Key, AWS Region (e.g., `us-east-1`), and S3 Bucket Name into the application's interface and click "Connect."

## Security Disclaimer

> **IMPORTANT:** This application is designed for educational purposes and personal use where you control your AWS credentials. While credentials are stored only in your browser's local storage and not transmitted to any server, it is crucial to:
>
> - **NEVER use your AWS Root Account credentials.** Always create a dedicated IAM user with limited permissions.
> - **Restrict IAM User Permissions:** Grant only the necessary S3 permissions to the IAM user.
> - **Use HTTPS:** Always host this application over HTTPS to encrypt communication.
> - **Be Mindful of CORS `AllowedOrigins`:** For production, replace `"*"` with your specific deployment URL(s).

