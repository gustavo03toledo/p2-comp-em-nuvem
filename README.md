# Migração Google Drive para Azure Blob Storage

Aplicação monolítica em Node.js + Express para copiar arquivos de uma pasta do Google Drive para um contêiner no Azure Blob Storage. O backend e o frontend ficam no mesmo projeto, e o Express serve os arquivos estáticos da pasta `public`.

## Recursos

- Autenticação no Google Drive com Service Account.
- Autenticação no Azure Blob Storage com connection string.
- Listagem dos arquivos da pasta de origem no Google Drive.
- Listagem dos blobs do contêiner de destino no Azure.
- Migração de arquivos comuns com download por `alt=media`.
- Exportação de Google Docs, Sheets e Slides como PDF.
- Upload com sobrescrita habilitada no Azure Blob Storage.
- Interface web simples em HTML, CSS e JavaScript puro.
- Credenciais carregadas somente por variáveis de ambiente.

## Estrutura

```txt
src/
  config/
    google.js
    azure.js
  services/
    googleDriveService.js
    azureBlobService.js
    migrationService.js
  routes/
    apiRoutes.js
  server.js
public/
  index.html
  style.css
  app.js
.env.example
.gitignore
package.json
README.md
```

## Pré-requisitos

- Node.js 18 ou superior.
- Uma Service Account do Google Cloud com acesso à pasta do Google Drive.
- Uma connection string ou SAS connection string válida do Azure Blob Storage.

## Configuração

1. Instale as dependências:

```bash
npm install
```

2. Crie o arquivo `.env` a partir do exemplo:

```bash
cp .env.example .env
```

No Windows PowerShell:

```powershell
Copy-Item .env.example .env
```

3. Preencha o `.env`:

```env
PORT=3000
GOOGLE_DRIVE_FOLDER_ID=13otZTM0T7GioHSn2hxQbc-A__X0H9H9k
GOOGLE_SERVICE_ACCOUNT_EMAIL=seu-service-account@seu-projeto.iam.gserviceaccount.com
GOOGLE_PRIVATE_KEY="-----BEGIN PRIVATE KEY-----\nSUA_CHAVE_PRIVADA\n-----END PRIVATE KEY-----\n"
AZURE_STORAGE_CONNECTION_STRING="SUA_CONNECTION_STRING_DO_AZURE"
AZURE_CONTAINER_NAME=aluno-gustavo
```

No arquivo JSON da Service Account, copie:

- `client_email` para `GOOGLE_SERVICE_ACCOUNT_EMAIL`.
- `private_key` para `GOOGLE_PRIVATE_KEY`.

Compartilhe a pasta do Google Drive com o e-mail da Service Account. Sem esse compartilhamento, a API do Google Drive não conseguirá listar ou baixar os arquivos.

## Execução local

```bash
npm start
```

Depois acesse:

```txt
http://localhost:3000
```

Para desenvolvimento com reinício automático do Node.js:

```bash
npm run dev
```

## Rotas

### GET `/health`

Retorna:

```json
{ "status": "ok" }
```

### GET `/api/origin`

Lista os arquivos da pasta configurada em `GOOGLE_DRIVE_FOLDER_ID`.

### GET `/api/destination`

Lista os blobs do contêiner configurado em `AZURE_CONTAINER_NAME`.

### POST `/api/migrate`

Migra os arquivos do Google Drive para o Azure Blob Storage.

Resposta:

```json
[
  {
    "fileName": "arquivo.pdf",
    "status": "success",
    "message": "Arquivo migrado com sucesso"
  },
  {
    "fileName": "arquivo2.docx",
    "status": "error",
    "message": "Mensagem do erro"
  }
]
```

## Logs da migração

Durante a migração, o console do servidor mostra mensagens como:

```txt
[ORIGEM] Arquivos encontrados no Google Drive.
[DOWNLOAD] Baixando arquivo: nome-do-arquivo
[UPLOAD] Enviando para Azure Blob: nome-do-arquivo
[SUCESSO] Arquivo enviado com sucesso.
[ERRO] Falha ao migrar arquivo: mensagem do erro
```

Se um arquivo falhar, a aplicação registra o erro desse arquivo e continua migrando os próximos.

## Deploy

### Render

1. Publique o projeto em um repositório Git.
2. Crie um Web Service no Render.
3. Use `npm install` como build command.
4. Use `npm start` como start command.
5. Configure todas as variáveis do `.env` no painel do Render.

### Railway

1. Crie um projeto a partir do repositório.
2. Configure as variáveis de ambiente no painel Variables.
3. Use o comando de start `npm start`.

### Azure App Service

1. Crie um App Service para Node.js.
2. Configure as variáveis de ambiente em Configuration > Application settings.
3. Faça o deploy pelo GitHub Actions, VS Code ou Azure CLI.
4. Garanta que o comando de inicialização seja `npm start`.

## Segurança

- Não versionar `.env`.
- Não colocar connection string, SAS, chave privada ou JSON da Service Account no código.
- Não expor credenciais no frontend.
- Revogar e recriar chaves caso alguma credencial seja publicada por engano.
