const { BlobServiceClient } = require('@azure/storage-blob');

function getRequiredEnv(name) {
  const value = process.env[name];

  if (!value || !value.trim()) {
    throw new Error(`Variavel de ambiente obrigatoria ausente: ${name}`);
  }

  return value.trim();
}

function validateAzureConnectionString(connectionString) {
  if (
    connectionString.includes('sua-conta.blob.core.windows.net') ||
    connectionString.includes('sv=...') ||
    connectionString.length < 120
  ) {
    throw new Error('AZURE_STORAGE_CONNECTION_STRING ainda esta ausente ou com valor de exemplo. Cole a connection string real do Azure no arquivo .env.');
  }
}

function getAzureContainerClient() {
  const connectionString = getRequiredEnv('AZURE_STORAGE_CONNECTION_STRING');
  const containerName = getRequiredEnv('AZURE_CONTAINER_NAME');

  validateAzureConnectionString(connectionString);

  const blobServiceClient = BlobServiceClient.fromConnectionString(connectionString);

  return blobServiceClient.getContainerClient(containerName);
}

module.exports = {
  getAzureContainerClient
};
