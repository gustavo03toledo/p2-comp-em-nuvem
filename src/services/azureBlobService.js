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

async function deleteAllBlobs() {
  const containerClient = await getReadyContainerClient();
  const results = [];

  for await (const blob of containerClient.listBlobsFlat()) {
    try {
      console.log(`[DELETE] Excluindo blob: ${blob.name}`);
      await containerClient.deleteBlob(blob.name);
      console.log(`[SUCESSO] Blob excluido com sucesso: ${blob.name}`);
      results.push({
        fileName: blob.name,
        status: 'success',
        message: 'Blob excluido com sucesso'
      });
    } catch (error) {
      console.error(`[ERRO] Falha ao excluir blob ${blob.name}: ${error.message}`);
      results.push({
        fileName: blob.name,
        status: 'error',
        message: error.message
      });
    }
  }

  return results;
}

module.exports = {
  listBlobs,
  uploadFile,
  deleteAllBlobs
};
