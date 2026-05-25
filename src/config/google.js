const { google } = require('googleapis');

const DRIVE_READONLY_SCOPE = 'https://www.googleapis.com/auth/drive.readonly';

function getRequiredEnv(name) {
  const value = process.env[name];

  if (!value || !value.trim()) {
    throw new Error(`Variavel de ambiente obrigatoria ausente: ${name}`);
  }

  return value.trim();
}

function normalizePrivateKey(privateKey) {
  return privateKey.replace(/\\n/g, '\n');
}

function getGoogleDriveClient() {
  const clientEmail = getRequiredEnv('GOOGLE_SERVICE_ACCOUNT_EMAIL');
  const privateKey = normalizePrivateKey(getRequiredEnv('GOOGLE_PRIVATE_KEY'));

  const auth = new google.auth.JWT({
    email: clientEmail,
    key: privateKey,
    scopes: [DRIVE_READONLY_SCOPE]
  });

  return google.drive({ version: 'v3', auth });
}

module.exports = {
  getGoogleDriveClient,
  normalizePrivateKey
};
