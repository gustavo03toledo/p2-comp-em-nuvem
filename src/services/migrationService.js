const googleDriveService = require('./googleDriveService');
const azureBlobService = require('./azureBlobService');

async function migrateFiles() {
  const originFiles = await googleDriveService.listFiles();
  const results = [];

  console.log('[ORIGEM] Arquivos encontrados no Google Drive.');

  for (const file of originFiles) {
    const targetFileName = googleDriveService.getDestinationFileName(file);

    try {
      console.log(`[DOWNLOAD] Baixando arquivo: ${targetFileName}`);
      const downloadedFile = await googleDriveService.downloadFile(file);

      console.log(`[UPLOAD] Enviando para Azure Blob: ${downloadedFile.fileName}`);
      await azureBlobService.uploadFile(
        downloadedFile.fileName,
        downloadedFile.data,
        downloadedFile.contentType
      );

      console.log(`[SUCESSO] Arquivo enviado com sucesso: ${downloadedFile.fileName}`);
      results.push({
        fileName: downloadedFile.fileName,
        status: 'success',
        message: 'Arquivo migrado com sucesso'
      });
    } catch (error) {
      console.error(`[ERRO] Falha ao migrar arquivo ${targetFileName}: ${error.message}`);
      results.push({
        fileName: targetFileName,
        status: 'error',
        message: error.message
      });
    }
  }

  return results;
}

module.exports = {
  migrateFiles
};
