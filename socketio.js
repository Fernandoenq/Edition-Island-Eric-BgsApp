require('dotenv').config();
const { Server } = require('socket.io');

const sharp = require('sharp');
const Jimp = require('jimp');

const prompts = require('./prompts.json');


const ftp = require("ftp");
const fs = require("fs");
const path = require('path');

const {funcs} = require('./utils/funcs');

const { DiscordMD } = require('./discord');

const ClientDC = new DiscordMD();

const func = new funcs();

// const clientFtp = new ftp();
const FtpClient = require("basic-ftp");

const NodeWebcam = require("node-webcam");
const { exec } = require('child_process');

const webcamOptions = {
  width: 1280,
  height: 720,
  quality: 100,
  delay: 0,
  saveShots: true,
  output: "jpeg",
  device: false,
  callbackReturn: "base64",
  verbose: true, // Habilita logs detalhados
};

const Webcam = NodeWebcam.create(webcamOptions);

const io = new Server({
  cors: {
    origin: "*"
  }
});

const clients = [
  {
    name: "Ilha #1", //Nome de identificação da ilha - MDJ (Account 1) - DC (Account 3)
    token: "f65e2d91-9c82-493b-9040-008201340d8f", //Token da API do MIDJOURNEY
    password: "2011", //Senha de cada uma das ilhas de edição
    isConnected: false //Verifica se o usuário esta conectado!
  },
  {
    name: "Ilha #2", //Nome de identificação da ilha - MDJ (Account 2) - DC (Account 2)
    token: "6af8d6b9-6262-4866-8479-fc6068c13dc2", //Token da API do MIDJOURNEY
    password: "2022", //Senha de cada uma das ilhas de edição
    isConnected: false //Verifica se o usuário esta conectado!
  },
  {
    name: "Ilha #3", //Nome de identificação da ilha - MDJ (Account 3) - DC (Account 1)
    token: "b43233de-ef50-408f-aac7-01de6addbd92", //Token da API do MIDJOURNEY
    password: "2033", //Senha de cada uma das ilhas de edição
    isConnected: false //Verifica se o usuário esta conectado!
  }
];

const admins = [
  { name: "Eric", password: "#Ericvnasicmento2018", isConnected: false }
]
// Middleware to check if the socket is authenticated
function isAuthenticated(socket, next) {
  const client = clients.find(c => c.name === socket.name);
  if (client && client.isConnected) {
    return next();
  } else {
    return next(new Error('Cliente não autenticado.'));
  }
}

var isLoaded = false;
var quantas_vezes = 0;

io.use((socket, next) => {
  // You can set the socket's name here based on your authentication mechanism
  // For simplicity, we're assuming the socket's name is set as part of the authentication process.
  // You can customize this based on your actual implementation.

  // if (!socket.name) {
  //   return next(new Error('Usuário não conectado.'));
  // }
  if ((!(isLoaded))) return;

  console.log('Requisição recebida...', socket.name);
  next();
});

io.on('connection', (socket) => {
  console.log(`Socket conectado: ${socket.id}`);
  socket.emit('auth', {
    message: 'Por favor, insira sua senha.',
    state: false,
  });

  socket.on('reset', (data) => {
    console.log('Adicionando prompt');
    console.log(`Socket conectado: ${socket.id}`);
    socket.emit('auth', {
      message: 'Por favor, insira sua senha.',
      state: false,
    });
  });

  socket.on('reiniciar', (data) => {
    console.log('Adicionando prompt');
    console.log(`Socket conectado: ${socket.id}`);
    socket.emit('auth', {
      message: 'recomeço',
      state: true,
    });
  });

  socket.on('setprompt', (data) => {
    console.log('Adicionando prompt');
  });

  socket.on('password', (password) => {
    console.log('logando')
    const client = clients.find(c => c.password === password);

    if (client && !client.isConnected) {
      client.isConnected = true;
      socket.name = client.name; // Altera o nome do socket para o nome do client
      socket.emit('auth', {
        message: `${client.name} Conectada com sucesso!`,
        state: true
      });

      io.emit('clientConnected', client.name);
      console.log(`${client.name} Ilha conectada.`);
    } else {
      socket.emit('auth', {
        message: `${(client && client.isConnected) ? 'Ilha já se encontra conectada.' : 'Usuário não encontrado!'}`,
        state: false
      });

      socket.disconnect(true);
    }
  });

  socket.on('local_gallery_update', () => {
    io.emit('set_gallery_update');
  })

  socket.on('disconnect', (e) => {
    const client = clients.find(c => c.isConnected && c.name === socket.name);

    if (client) {
      client.isConnected = false;
      io.emit('clientDisconnected', client.name);

      console.log(`${socket.name} Ilha se desconectou.`);
      console.log(e);
    }
  });

  // Evento - Precisa estar autenticado
  socket.on('getPrompts', (data) => {
    // Verifica se o cliente esta autenticado
    isAuthenticated(socket, (error) => {
      if (error) {
        console.error(`Requisição não autorizada de ${socket.name}: ${error.message}`);
      } else {
        console.log('enviando prompts');
        console.log('Tentando carregar prompts.json');
        const localprompts = require('./prompts.json');
        console.log('Prompts carregados:', localprompts);
        socket.emit('setPrompts', localprompts);
      }
    });
  });

  // Evento - Precisa estar autenticado
  // Conclui a geração de Imagem com a IA/MIDJOURNEY
  socket.on('ia_upscale_variation', (data) => {
    console.log('[ia_upscale_variation] Dados recebidos:', data);
    // Verifica se o cliente esta autenticado
    isAuthenticated(socket, (error) => {
      if (error) {
        console.error(`Requisição não autorizada de ${socket.name}: ${error.message}`);
      } else {
        console.log("Client")
        console.log(getClient(socket.name).token);
        console.log("data.buttonMessageId");
        console.log(data.buttonMessageId);
        console.log("data.reference");
        console.log(data.reference);
        require('./midjourney').buttonSelect(getClient(socket.name).token, socket, data.variation, data.reference, quantas_vezes);
      }
    });
  });

  socket.on("take_photo", (data) => {
    console.log("Requisição para tirar uma foto recebida.");
    socket.emit('disable_cam');
    console.log("disable_cam.");

    const photoDir = path.join(__dirname, 'fotos_tiradas');
    const photoPath = path.join(photoDir, `foto_${Date.now()}.jpg`);
    const rotatedPhotoPath = photoPath.replace('.jpg', '_rotated.jpg');

    if (!fs.existsSync(photoDir)) {
        console.log(`Criando diretório: ${photoDir}`);
        fs.mkdirSync(photoDir, { recursive: true });
    }

    const command = `"${path.join(__dirname, 'node_modules', 'node-webcam', 'src', 'bindings', 'CommandCam', 'CommandCam.exe')}" /filename "${photoPath}"`;

    exec(command, (err) => {
        if (err) {
            console.error("Erro ao capturar a foto:", err);
            socket.emit("photo_error", "Erro ao capturar a foto.");
            return;
        }

        console.log("Foto capturada com sucesso (comando executado):", photoPath);

        const maxWaitTime = 5000;
        const intervalTime = 500;
        let elapsedTime = 0;

        const interval = setInterval(() => {
            if (fs.existsSync(photoPath)) {
                clearInterval(interval);

                console.log(`Foto encontrada: ${photoPath}`);

                // Use Jimp para processar a imagem
                Jimp.read(photoPath)
                    .then((image) => {
                        console.log("Imagem carregada com sucesso pelo Jimp.");
                        return image.rotate(-90).writeAsync(rotatedPhotoPath);
                    })
                    .then(() => {
                        console.log(`Foto rotacionada com sucesso: ${rotatedPhotoPath}`);

                        const photoData = {
                            nome: path.basename(rotatedPhotoPath),
                            caminho: rotatedPhotoPath,
                            image: `http://localhost:8080/${path.basename(rotatedPhotoPath)}`
                        };

                        console.log("Foto processada com sucesso:", photoData);
                        socket.emit('get_photo_webcam', photoData);
                    })
                    .catch((jimpError) => {
                        console.error("Erro ao processar a imagem com Jimp:", jimpError);
                        socket.emit("photo_error", "Erro ao processar a imagem.");
                    });
            } else {
                elapsedTime += intervalTime;
                if (elapsedTime >= maxWaitTime) {
                    clearInterval(interval);
                    console.error("Foto não encontrada dentro do tempo limite.");
                    socket.emit("photo_error", "Foto não encontrada dentro do tempo limite.");
                }
            }
        }, intervalTime);
    });
});



  // Evento - Precisa estar autenticado
  // Envia as últimas 10 imagens da galeria
  socket.on('get_gallery', (data) => {
    console.log("Entrou no evento 'get_gallery'"); // Log inicial da função
    

    // Verifica se o cliente está autenticado
    isAuthenticated(socket, (error) => {
      if (error) {
        console.error(`Requisição não autorizada de ${socket.name}: ${error.message}`);
      } else {
        console.log("Cliente autenticado com sucesso"); // Log de autenticação bem-sucedida
  
        const pasta = './GALERIA';
        console.log(`Lendo a pasta: ${pasta}`); // Indica qual pasta está sendo lida
  
        fs.readdir(pasta, (err, arquivos) => {
          if (err) {
            console.error('Erro ao ler a pasta:', err);
            return;
          }
  
          console.log(`Arquivos encontrados na pasta: ${arquivos.length}`); // Mostra quantos arquivos foram encontrados
  
          // Mapeie os arquivos com seus caminhos completos e datas de modificação
          const arquivosComDatas = arquivos.map(arquivo => {
            const caminhoCompleto = path.join(pasta, arquivo);
            return {
              nome: arquivo,
              caminho: caminhoCompleto,
              dataModificacao: fs.statSync(caminhoCompleto).mtime
            };
          });
  
          console.log("Arquivos com suas datas de modificação mapeados:", arquivosComDatas);
  
          // Ordene os arquivos por data de modificação em ordem decrescente
          const arquivosOrdenados = arquivosComDatas.sort((a, b) => b.dataModificacao - a.dataModificacao);
  
          console.log("Arquivos ordenados por data de modificação:", arquivosOrdenados);
  
          // Pegue os últimos 15 arquivos
          const ultimos15Arquivos = arquivosOrdenados.slice(0, 15);
  
          console.log("Últimos 15 arquivos selecionados:", ultimos15Arquivos);
  
          var galleryImages = [];
          ultimos15Arquivos.forEach(arquivo => {
            try {
              console.log(`Lendo arquivo: ${arquivo.nome}`); // Log para cada arquivo processado
              const base64 = fs.readFileSync(`${arquivo.caminho}`, { encoding: 'base64' });
  
              galleryImages.push({
                nome: arquivo.nome,
                caminho: arquivo.caminho,
                //image: `http://${process.env.LOCAL_ADDRESS || 'localhost'}:8080/${arquivo.nome}`
                image: `http://localhost:8080/${arquivo.nome}`
              });
  
              console.log(`Arquivo ${arquivo.nome} processado com sucesso`);
            } catch (readError) {
              console.error(`Erro ao ler o arquivo ${arquivo.nome}:`, readError);
            }
          });
  
          console.log("Imagens da galeria prontas para envio:", galleryImages);
  
          socket.emit('set_gallery', galleryImages);
          console.log("Emitido 'set_gallery' para o cliente"); // Log indicando que o evento foi emitido
        });
      }
    });
  });
  
  socket.on('print', async (data) => {
    require('./midjourney').printImageMultipleTimes(data)
  });
  // Evento - Precisa estar autenticado
  // Inicia a geração de Imagem com a IA/MIDJOURNEY
  socket.on('generate_image', async (data) => {
    // Verifica se o cliente esta autenticado
    console.log(data);
    isAuthenticated(socket, (error) => {
      if (error) {
        console.error(`Requisição não autorizada de ${socket.name}: ${error.message}`);
      } else {
        const originalImageId = Date.now();
        const url = data.user.image
        quantas_vezes = data.valor
        const result = url.replace(/^.*?(f)/, '$1');

        // Cria o caminho completo para o arquivo de origem e destino
        const caminhoOrigem = path.join('./fotos_tiradas/', result);
        const caminhoDestino = path.join('./IA/', `${originalImageId}_original${path.extname(result)}`);

        // Lê o arquivo de origem e copia para o destino
        fs.readFile(caminhoOrigem, (err, dados) => {
          if (err) {
            console.error('[GALERIA] Erro ao ler o arquivo de origem:', err);
          } else {
            // Escreve os dados no arquivo de destino
            fs.writeFile(caminhoDestino, dados, async (err) => {
              if (err) {
                console.error('[GALERIA] Erro ao copiar o arquivo para o destino:', err);
              } else {
                console.log('Requisitando url do discord');
                const image = await ClientDC.sendImageMessage(socket.name, `./IA/${originalImageId}_original${path.extname(result)}`);
                console.log('URL RETORNADA COM SUCESSO')
                if (!(image)) {
                  return socket.emit('ia_generate_error', '(DISCORD) FALHA AO VALIDAR IMAGEM!');
                }

                //FUNÇÃO DE INSERT
                //user.nome - user.whatsapp - originalImageId -- image
                console.log('INSERINDO NO BANCO DE DADOS')
                await func.create({
                  NOME_CLIENTE: "sem nome",
                  WHATSAPP_CLIENTE: "16991005074",
                  ID_IMAGEM: `${originalImageId}`,
                  IMAGEM_ENVIADA: image
                })

                require('./midjourney').SavenumeroExtraido(originalImageId);
                console.log('BANCO DE DADOS INSERIDO, GERANDO MIDJOURNEY COMMAND')
                // console.log('Enviando prompt no tema.', data.tema);
                var localprompt = data.tema.prompt;

                console.log('Usuario:', data.user);
                console.log('Tema:', data.tema);

                if (data.user.genero == 'masculino') {
                  localprompt = data.tema.prompt_masculino;
                } else if (data.user.genero == 'feminino') {
                  localprompt = data.tema.prompt_feminino;
                }

                require('./midjourney').IaGenerate(getClient(socket.name).token, socket, originalImageId, image, localprompt)
                socket.emit('ia_generating', true);
                // console.log(`Imagem salva como ${originalImageId}_original.png`);
              }
            });
          }
        });
      }
    });
  });


  // Add more events that require authentication as needed
});

const { Whatsapp } = require('./whatsapp'); // Importa a classe
const WhatsappClient = new Whatsapp(); // Cria a instância

(async () => {
  isLoaded = false;
  console.log('Habilitando sistema...');

  console.log('#Ligando o serviço Socket.IO');
  io.listen(3003);

  await WhatsappClient.start(); // Inicialize a instância aqui
  await ClientDC.start();

  isLoaded = true;
})();


function getClient(username) {
  return clients.find(c => c.name === username);
}

function isUserConnected(username) {
  const client = clients.find(c => c.name === username);
  return client ? client.isConnected : false;
}
