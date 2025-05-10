require('dotenv').config();
const express = require("express");
const app = new express();
const fs = require("fs");
const path = require("path");
const { io } = require("socket.io-client");

const socket = io(`ws://localhost:3003`);
const diretorioLocal = path.join(__dirname, 'fotos_tiradas'); // Diretório local 'GALERIA'
var copying = false;

const cors = require('cors');
app.use(cors({
  origin: 'http://localhost:3000', // Substitua pela URL do seu front-end
  methods: ['GET', 'POST'], // Métodos permitidos
  allowedHeaders: ['Content-Type', 'Authorization'] // Cabeçalhos permitidos
}));



app.get('/', (req, res) => {
  console.log("fotos_tiradas");
  fs.readdir(diretorioLocal, (err, files) => {
    if (err) {
      console.error('Erro ao ler o diretório:', err);
      return res.status(500).send('Erro ao recuperar imagens.');
    }

    const imagensJPG = files.filter(file => path.extname(file).toLowerCase() === '.jpg');
    const caminhosDasImagens = imagensJPG.map(imagem => `${req.protocol}://${req.get('host')}/imagens/${imagem}`);

    res.json(caminhosDasImagens);
  });
});

// Rota para renderizar a imagem na tela
app.get('/:nomeImagem', (req, res) => {
  const nomeImagem = req.params.nomeImagem;
  const caminhoImagem = path.join(diretorioLocal, nomeImagem);

  // Verifica se o arquivo existe
  if (fs.existsSync(caminhoImagem)) {
    // Lê o conteúdo da imagem como um fluxo de dados
    const stream = fs.createReadStream(caminhoImagem);

    // Define o tipo de conteúdo como imagem/jpeg (ou o tipo de imagem apropriado)
    res.setHeader('Content-Type', 'image/jpeg');

    // Envia o fluxo de dados como resposta
    stream.pipe(res);
  } else {
    // Retorna um erro 404 se a imagem não for encontrada
    res.status(404).send('Imagem não encontrada');
  }
});

app.listen(8080, '0.0.0.0', () => {
  console.log("Servidor iniciado na porta 8080");

  socket.on('password', () => {
    socket.emit('auth');
  });

  setInterval(() => {
    console.log('Verificando arquivos locais.');

    try {
      if (copying) return;

      copying = true;
      // Lê os arquivos no diretório local
      fs.readdir(diretorioLocal, (err, files) => {
        if (err) {
          console.error("Erro ao listar arquivos no diretório local:", err);
          copying = false;
          return;
        }

        const imagensJPG = files.filter(file => path.extname(file).toLowerCase() === '.jpg');
        console.log(`[LOCAL] Imagens encontradas: ${imagensJPG.join(', ')}`);

        // Simula um evento para atualizar a galeria
        if (imagensJPG.length > 0) {
          console.log('Atualizando galeria.');
          socket.emit('local_gallery_update');
        }

        copying = false;
      });
    } catch (error) {
      console.error("Erro ao manipular arquivos locais:", error);
      copying = false;
    }
  }, 5000);
});
