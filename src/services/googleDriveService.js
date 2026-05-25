const { getGoogleDriveClient } = require('../config/google');

const GOOGLE_FOLDER_MIME_TYPE = 'application/vnd.google-apps.folder';
const GOOGLE_EXPORT_MIME_TYPES = {
  'application/vnd.google-apps.document': 'application/pdf',
  'application/vnd.google-apps.spreadsheet': 'application/pdf',
  'application/vnd.google-apps.presentation': 'application/pdf'
};

function getRequiredEnv(name) {
  const value = process.env[name];

  if (!value || !value.trim()) {
    throw new Error(`Variavel de ambiente obrigatoria ausente: ${name}`);
  }

  return value.trim();
}

function extractFolderId(value) {
  const trimmedValue = value.trim();
  const folderUrlMatch = trimmedValue.match(/\/folders\/([a-zA-Z0-9_-]+)/);

  if (folderUrlMatch) {
    return folderUrlMatch[1];
  }

  return trimmedValue
    .replace(/^<|>$/g, '')
    .replace(/^\[|\]$/g, '');
}

function getConfiguredFolderId() {
  return extractFolderId(getRequiredEnv('GOOGLE_DRIVE_FOLDER_ID'));
}

function isGoogleWorkspaceFile(file) {
  return Boolean(GOOGLE_EXPORT_MIME_TYPES[file.mimeType]);
}

function getDestinationFileName(file) {
  if (!isGoogleWorkspaceFile(file)) {
    return file.name;
  }

  return file.name.toLowerCase().endsWith('.pdf') ? file.name : `${file.name}.pdf`;
}

function mapDriveFile(file) {
  return {
    id: file.id,
    name: file.name,
    mimeType: file.mimeType,
    size: file.size ? Number(file.size) : null,
    modifiedTime: file.modifiedTime || null,
    destinationName: getDestinationFileName(file),
    exportedAsPdf: isGoogleWorkspaceFile(file)
  };
}

async function listFiles() {
  const drive = getGoogleDriveClient();
  const folderId = getConfiguredFolderId();
  const files = [];
  let pageToken;

  do {
    const response = await drive.files.list({
      q: `'${folderId}' in parents and trashed = false and mimeType != '${GOOGLE_FOLDER_MIME_TYPE}'`,
      fields: 'nextPageToken, files(id, name, mimeType, size, modifiedTime)',
      pageSize: 1000,
      pageToken,
      supportsAllDrives: true,
      includeItemsFromAllDrives: true,
      orderBy: 'name'
    });

    files.push(...(response.data.files || []).map(mapDriveFile));
    pageToken = response.data.nextPageToken;
  } while (pageToken);

  return files;
}

async function downloadFile(file) {
  const drive = getGoogleDriveClient();
  const exportMimeType = GOOGLE_EXPORT_MIME_TYPES[file.mimeType];
  const destinationName = getDestinationFileName(file);

  if (exportMimeType) {
    const response = await drive.files.export(
      {
        fileId: file.id,
        mimeType: exportMimeType
      },
      {
        responseType: 'arraybuffer'
      }
    );

    return {
      fileName: destinationName,
      contentType: exportMimeType,
      data: Buffer.from(response.data)
    };
  }

  const response = await drive.files.get(
    {
      fileId: file.id,
      alt: 'media',
      supportsAllDrives: true
    },
    {
      responseType: 'arraybuffer'
    }
  );

  return {
    fileName: destinationName,
    contentType: response.headers['content-type'] || file.mimeType || 'application/octet-stream',
    data: Buffer.from(response.data)
  };
}

module.exports = {
  listFiles,
  downloadFile,
  getDestinationFileName
};
