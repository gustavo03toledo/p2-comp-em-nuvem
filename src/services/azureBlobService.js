const { getAzureContainerClient } = require('../config/azure');

async function getReadyContainerClient() {
  const containerClient = getAzureContainerClient();
  await containerClient.createIfNotExists();
  return containerClient;
}

async function listBlobs() {
  const containerClient = await getReadyContainerClient();
  const blobs = [];

  for await (const blob of containerClient.listBlobsFlat()) {
    blobs.push({
      name: blob.name,
      size: blob.properties.contentLength || 0,
      contentType: blob.properties.contentType || null,
      lastModified: blob.properties.lastModified || null
    });
  }

  return blobs;
}

async function uploadFile(fileName, data, contentType) {
  const containerClient = await getReadyContainerClient();
  const blockBlobClient = containerClient.getBlockBlobClient(fileName);

  await blockBlobClient.uploadData(data, {
    overwrite: true,
    blobHTTPHeaders: {
      blobContentType: contentType || 'application/octet-stream'
    }
  });
}

module.exports = {
  listBlobs,
  uploadFile
};
