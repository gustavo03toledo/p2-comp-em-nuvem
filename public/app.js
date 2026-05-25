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
  buttons: [
    document.querySelector('#btnOrigin'),
    document.querySelector('#btnDestination'),
    document.querySelector('#btnMigrate')
  ]
};

document.querySelector('#btnOrigin').addEventListener('click', loadOriginFiles);
document.querySelector('#btnDestination').addEventListener('click', loadDestinationFiles);
document.querySelector('#btnMigrate').addEventListener('click', migrateFiles);

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

async function requestJson(url, options = {}) {
  const response = await fetch(url, options);
  const data = await response.json().catch(() => null);

  if (!response.ok) {
    throw new Error(data?.message || 'O servidor retornou um erro inesperado.');
  }

  return data;
}

async function loadOriginFiles() {
  try {
    setLoading(true, 'Buscando origem');
    showMessage('Listando arquivos do Google Drive...');

    const data = await requestJson('/api/origin');
    const files = data.files || [];

    elements.originCount.textContent = files.length;
    renderOriginTable(files);
    showMessage('Arquivos do Google Drive listados com sucesso.', 'success');
  } catch (error) {
    showMessage(error.message, 'error');
  } finally {
    setLoading(false);
  }
}

async function loadDestinationFiles() {
  try {
    setLoading(true, 'Buscando destino');
    showMessage('Listando arquivos do Azure Blob Storage...');

    const data = await requestJson('/api/destination');
    const files = data.files || [];

    elements.destinationCount.textContent = files.length;
    renderDestinationTable(files);
    showMessage('Arquivos do Azure Blob Storage listados com sucesso.', 'success');
  } catch (error) {
    showMessage(error.message, 'error');
  } finally {
    setLoading(false);
  }
}

async function migrateFiles() {
  try {
    setLoading(true, 'Migrando');
    showMessage('Migrando arquivos. Acompanhe o progresso tambem no console do servidor...');

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

    if (errorCount > 0) {
      showMessage('Migração concluida com alguns erros. Veja a tabela de resultado.', 'error');
    } else {
      showMessage('Migração concluida com sucesso.', 'success');
    }

    await refreshDestinationAfterMigration();
  } catch (error) {
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
