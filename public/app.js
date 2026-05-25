const elements = {
  statusBadge: document.querySelector('#statusBadge'),
  message: document.querySelector('#message'),
  originCount: document.querySelector('#originCount'),
  destinationCount: document.querySelector('#destinationCount'),
  successCount: document.querySelector('#successCount'),
  errorCount: document.querySelector('#errorCount'),
  originTable: document.querySelector('#originTable'),
  destinationTable: document.querySelector('#destinationTable'),
  migrationTable: document.querySelector('#migrationTable'),
  terminalOutput: document.querySelector('#terminalOutput'),
  buttons: [
    document.querySelector('#btnOrigin'),
    document.querySelector('#btnDestination'),
    document.querySelector('#btnMigrate')
  ]
};

document.querySelector('#btnOrigin').addEventListener('click', loadOriginFiles);
document.querySelector('#btnDestination').addEventListener('click', loadDestinationFiles);
document.querySelector('#btnMigrate').addEventListener('click', migrateFiles);
document.querySelector('#btnClearTerminal').addEventListener('click', clearTerminal);

function setLoading(isLoading, text = 'Carregando...') {
  elements.buttons.forEach((button) => {
    button.disabled = isLoading;
  });

  elements.statusBadge.textContent = isLoading ? text : 'Pronto';
}

function showMessage(text, type = '') {
  elements.message.textContent = text;
  elements.message.className = `message ${type}`.trim();
}

function writeTerminal(tag, message) {
  const timestamp = new Intl.DateTimeFormat('pt-BR', {
    hour: '2-digit',
    minute: '2-digit',
    second: '2-digit'
  }).format(new Date());
  const line = `[${timestamp}] [${tag}] ${message}`;

  if (elements.terminalOutput.textContent === '[SISTEMA] Aguardando operação.') {
    elements.terminalOutput.textContent = line;
  } else {
    elements.terminalOutput.textContent += `\n${line}`;
  }

  elements.terminalOutput.scrollTop = elements.terminalOutput.scrollHeight;
}

function clearTerminal() {
  elements.terminalOutput.textContent = '[SISTEMA] Aguardando operação.';
}

async function requestJson(url, options = {}) {
  const response = await fetch(url, options);
  const data = await response.json().catch(() => null);

  if (!response.ok) {
    const detail = data?.error && data.error !== data.message ? ` ${data.error}` : '';
    throw new Error(`${data?.message || 'O servidor retornou um erro inesperado.'}${detail}`);
  }

  return data;
}

async function loadOriginFiles() {
  try {
    setLoading(true, 'Buscando origem');
    showMessage('Listando arquivos do Google Drive...');
    writeTerminal('ORIGEM', 'Buscando arquivos no Google Drive.');

    const data = await requestJson('/api/origin');
    const files = data.files || [];

    elements.originCount.textContent = files.length;
    renderOriginTable(files);
    writeTerminal('ORIGEM', `${files.length} arquivo(s) encontrado(s) no Google Drive.`);
    showMessage('Arquivos do Google Drive listados com sucesso.', 'success');
  } catch (error) {
    writeTerminal('ERRO', `Falha ao listar Google Drive: ${error.message}`);
    showMessage(error.message, 'error');
  } finally {
    setLoading(false);
  }
}

async function loadDestinationFiles() {
  try {
    setLoading(true, 'Buscando destino');
    showMessage('Listando arquivos do Azure Blob Storage...');
    writeTerminal('DESTINO', 'Buscando arquivos no Azure Blob Storage.');

    const data = await requestJson('/api/destination');
    const files = data.files || [];

    elements.destinationCount.textContent = files.length;
    renderDestinationTable(files);
    writeTerminal('DESTINO', `${files.length} blob(s) encontrado(s) no Azure Blob Storage.`);
    showMessage('Arquivos do Azure Blob Storage listados com sucesso.', 'success');
  } catch (error) {
    writeTerminal('ERRO', `Falha ao listar Azure Blob Storage: ${error.message}`);
    showMessage(error.message, 'error');
  } finally {
    setLoading(false);
  }
}

async function migrateFiles() {
  try {
    setLoading(true, 'Migrando');
    showMessage('Migrando arquivos. Acompanhe o progresso no terminal da tela e no console do servidor...');
    writeTerminal('MIGRACAO', 'Iniciando migração dos arquivos.');

    const results = await requestJson('/api/migrate', {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json'
      }
    });

    const successCount = results.filter((item) => item.status === 'success').length;
    const errorCount = results.filter((item) => item.status === 'error').length;

    elements.successCount.textContent = successCount;
    elements.errorCount.textContent = errorCount;
    renderMigrationTable(results);
    renderMigrationLogs(results);

    if (errorCount > 0) {
      writeTerminal('MIGRACAO', `Migração concluída com ${successCount} sucesso(s) e ${errorCount} erro(s).`);
      showMessage('Migração concluida com alguns erros. Veja a tabela de resultado.', 'error');
    } else {
      writeTerminal('MIGRACAO', `Migração concluída com ${successCount} sucesso(s) e nenhum erro.`);
      showMessage('Migração concluida com sucesso.', 'success');
    }

    await refreshDestinationAfterMigration();
  } catch (error) {
    writeTerminal('ERRO', `Falha geral na migração: ${error.message}`);
    showMessage(error.message, 'error');
  } finally {
    setLoading(false);
  }
}

async function refreshDestinationAfterMigration() {
  const data = await requestJson('/api/destination');
  const files = data.files || [];

  elements.destinationCount.textContent = files.length;
  renderDestinationTable(files);
}

function renderOriginTable(files) {
  if (!files.length) {
    elements.originTable.innerHTML = '<tr><td colspan="4">Nenhum arquivo encontrado.</td></tr>';
    return;
  }

  elements.originTable.innerHTML = files
    .map((file) => `
      <tr>
        <td><span class="file-name">${escapeHtml(file.name)}</span></td>
        <td>${escapeHtml(file.mimeType || 'Desconhecido')}</td>
        <td>${formatBytes(file.size)}</td>
        <td>
          ${escapeHtml(file.destinationName)}
          ${file.exportedAsPdf ? '<div class="muted">Exportado como PDF</div>' : ''}
        </td>
      </tr>
    `)
    .join('');
}

function renderDestinationTable(files) {
  if (!files.length) {
    elements.destinationTable.innerHTML = '<tr><td colspan="4">Nenhum blob encontrado.</td></tr>';
    return;
  }

  elements.destinationTable.innerHTML = files
    .map((file) => `
      <tr>
        <td><span class="file-name">${escapeHtml(file.name)}</span></td>
        <td>${escapeHtml(file.contentType || 'Desconhecido')}</td>
        <td>${formatBytes(file.size)}</td>
        <td>${formatDate(file.lastModified)}</td>
      </tr>
    `)
    .join('');
}

function renderMigrationTable(results) {
  if (!results.length) {
    elements.migrationTable.innerHTML = '<tr><td colspan="3">Nenhum arquivo para migrar.</td></tr>';
    return;
  }

  elements.migrationTable.innerHTML = results
    .map((item) => `
      <tr>
        <td><span class="file-name">${escapeHtml(item.fileName)}</span></td>
        <td><span class="pill ${item.status}">${escapeHtml(item.status)}</span></td>
        <td>${escapeHtml(item.message)}</td>
      </tr>
    `)
    .join('');
}

function renderMigrationLogs(results) {
  if (!results.length) {
    writeTerminal('MIGRACAO', 'Nenhum arquivo encontrado para migrar.');
    return;
  }

  results.forEach((item) => {
    writeTerminal('DOWNLOAD', `Arquivo processado: ${item.fileName}`);
    writeTerminal('UPLOAD', `Envio para Azure Blob Storage: ${item.fileName}`);

    if (item.status === 'success') {
      writeTerminal('SUCESSO', `${item.fileName} migrado com sucesso.`);
    } else {
      writeTerminal('ERRO', `Falha ao migrar ${item.fileName}: ${item.message}`);
    }
  });
}

function formatBytes(value) {
  if (value === null || value === undefined || Number.isNaN(Number(value))) {
    return '-';
  }

  const bytes = Number(value);
  const units = ['B', 'KB', 'MB', 'GB'];
  let size = bytes;
  let unitIndex = 0;

  while (size >= 1024 && unitIndex < units.length - 1) {
    size /= 1024;
    unitIndex += 1;
  }

  return `${size.toFixed(size >= 10 || unitIndex === 0 ? 0 : 1)} ${units[unitIndex]}`;
}

function formatDate(value) {
  if (!value) {
    return '-';
  }

  return new Intl.DateTimeFormat('pt-BR', {
    dateStyle: 'short',
    timeStyle: 'short'
  }).format(new Date(value));
}

function escapeHtml(value) {
  return String(value ?? '')
    .replaceAll('&', '&amp;')
    .replaceAll('<', '&lt;')
    .replaceAll('>', '&gt;')
    .replaceAll('"', '&quot;')
    .replaceAll("'", '&#039;');
}
