import React from 'react';

function ConnectionSection({
  accessKeyId,
  setAccessKeyId,
  secretAccessKey,
  setSecretAccessKey,
  region,
  setRegion,
  bucketName,
  setBucketName,
  statusMessage,
  connectToS3,
}) {
  const handleSubmit = (e) => {
    e.preventDefault();
    connectToS3();
  };

  return (
    <section
      id="connection-section"
      className="main-card-bg rounded-xl shadow-lg p-6 md:p-8 space-y-4 max-w-2xl mx-auto"
    >
      <h2
        className="text-2xl font-semibold text-center"
        style={{ color: 'var(--text-primary)' }}
      >
        Connect to S3 Bucket
      </h2>
      <form onSubmit={handleSubmit} className="grid grid-cols-1 gap-4">
        <div>
          <label
            htmlFor="accessKeyId"
            className="block text-sm font-medium text-secondary-pop mb-1"
          >
            Access Key ID:
          </label>
          <input
            type="text"
            id="accessKeyId"
            className="w-full px-4 py-2 border input-border rounded-lg focus:outline-none focus:ring-2 focus:ring-accent"
            placeholder="Your AWS Access Key ID"
            value={accessKeyId}
            onChange={(e) => setAccessKeyId(e.target.value)}
            required
          />
        </div>
        <div>
          <label
            htmlFor="secretAccessKey"
            className="block text-sm font-medium text-secondary-pop mb-1"
          >
            Secret Access Key:
          </label>
          <input
            type="password"
            id="secretAccessKey"
            className="w-full px-4 py-2 border input-border rounded-lg focus:outline-none focus:ring-2 focus:ring-accent"
            placeholder="Your AWS Secret Access Key"
            value={secretAccessKey}
            onChange={(e) => setSecretAccessKey(e.target.value)}
            required
          />
        </div>
        <div>
          <label
            htmlFor="region"
            className="block text-sm font-medium text-secondary-pop mb-1"
          >
            Region:
          </label>
          <input
            type="text"
            id="region"
            className="w-full px-4 py-2 border input-border rounded-lg focus:outline-none focus:ring-2 focus:ring-accent"
            placeholder="e.g., us-east-1"
            value={region}
            onChange={(e) => setRegion(e.target.value)}
            required
          />
        </div>
        <div>
          <label
            htmlFor="bucketName"
            className="block text-sm font-medium text-secondary-pop mb-1" // Changed 'class' to 'className' here
          >
            Bucket Name:
          </label>
          <input
            type="text"
            id="bucketName"
            className="w-full px-4 py-2 border input-border rounded-lg focus:outline-none focus:ring-2 focus:ring-accent"
            placeholder="Your S3 Bucket Name"
            value={bucketName}
            onChange={(e) => setBucketName(e.target.value)}
            required
          />
        </div>
        <button
          type="submit"
          id="connectButton"
          className="btn-primary w-full py-2 rounded-lg font-semibold transition-colors duration-200"
        >
          Connect
        </button>
      </form>
      {statusMessage && (
        <p id="statusMessage" className="message text-center">
          {statusMessage}
        </p>
      )}
    </section>
  );
}

export default ConnectionSection;
