const { BlobServiceClient } = require('@azure/storage-blob');

function getRequiredEnv(name) {
  const value = process.env[name];

  if (!value || !value.trim()) {
    throw new Error(`Variavel de ambiente obrigatoria ausente: ${name}`);
  }

  return value.trim();
}

function getAzureContainerClient() {
  const connectionString = getRequiredEnv('AZURE_STORAGE_CONNECTION_STRING');
  const containerName = getRequiredEnv('AZURE_CONTAINER_NAME');
  const blobServiceClient = BlobServiceClient.fromConnectionString(connectionString);

  return blobServiceClient.getContainerClient(containerName);
}

module.exports = {
  getAzureContainerClient
};
