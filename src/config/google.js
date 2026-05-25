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

function validateGoogleConfig(clientEmail, privateKey) {
  if (clientEmail.includes('seu-service-account')) {
    throw new Error('GOOGLE_SERVICE_ACCOUNT_EMAIL ainda esta com o valor de exemplo. Copie o client_email do JSON da Service Account para o arquivo .env.');
  }

  if (
    privateKey.includes('COLE_A_CHAVE_PRIVADA_AQUI') ||
    privateKey.length < 500 ||
    !privateKey.includes('-----BEGIN PRIVATE KEY-----') ||
    !privateKey.includes('-----END PRIVATE KEY-----')
  ) {
    throw new Error('GOOGLE_PRIVATE_KEY esta ausente ou ainda esta com o valor de exemplo. Copie a private_key completa do JSON da Service Account para o arquivo .env.');
  }
}

function getGoogleDriveClient() {
  const clientEmail = getRequiredEnv('GOOGLE_SERVICE_ACCOUNT_EMAIL');
  const privateKey = normalizePrivateKey(getRequiredEnv('GOOGLE_PRIVATE_KEY'));

  validateGoogleConfig(clientEmail, privateKey);

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
