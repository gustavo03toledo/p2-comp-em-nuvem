require('dotenv').config();

const path = require('path');
const cors = require('cors');
const express = require('express');
const apiRoutes = require('./routes/apiRoutes');

const app = express();
const port = process.env.PORT || 3000;

app.use(cors());
app.use(express.json());
app.use(express.static(path.join(__dirname, '..', 'public')));

app.get('/health', (req, res) => {
  res.json({ status: 'ok' });
});

app.use('/api', apiRoutes);

app.use((req, res) => {
  res.status(404).json({
    message: 'Rota nao encontrada'
  });
});

app.use((error, req, res, next) => {
  console.error('[ERRO]', error.message);

  const responseBody = {
    message: 'Nao foi possivel processar a solicitacao.',
  };

  if (process.env.NODE_ENV !== 'production') {
    responseBody.error = error.message;
  }

  res.status(500).json(responseBody);
});

const server = app.listen(port, () => {
  console.log(`Servidor iniciado em http://localhost:${port}`);
});

server.on('error', (error) => {
  if (error.code === 'EADDRINUSE') {
    console.error(`[ERRO] A porta ${port} ja esta em uso.`);
    console.error('Feche o outro servidor Node.js ou configure outra porta no .env, por exemplo: PORT=3001.');
    process.exit(1);
  }

  console.error('[ERRO] Falha ao iniciar o servidor:', error.message);
  process.exit(1);
});

module.exports = app;
