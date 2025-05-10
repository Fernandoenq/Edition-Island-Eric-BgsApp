const { Server } = require("socket.io");
// const { IaGenerate } = require("./midjourney");
// const { createCanvas, loadImage } = require('canvas');
const fs = require('fs');
const prompts = require('./prompts.json');
const sharp = require('sharp');

const io = new Server({
  cors: {
    origin: "http://localhost:3000"
  }
});

const connections = new Map(); //<Socket>, <House Object>

const houses = {
  islands: [
    {
      house: 'HOUSE#1', //NOME DA HOUSE
      midjourney: '', //TOKEN DO MIDJOURNEY
      connected: false, //STATUS DA HOUSE
      token: '#d90045', //TOKEN DE ACESSO DA HOUSE
    },
    {
      house: 'HOUSE#2', //NOME DA HOUSE
      midjourney: '', //TOKEN DO MIDJOURNEY
      connected: false, //STATUS DA HOUSE
      token: '#2c6ff5', //TOKEN DE ACESSO DA HOUSE
    },
    {
      house: 'HOUSE#3', //NOME DA HOUSE
      midjourney: '', //TOKEN DO MIDJOURNEY
      connected: false, //STATUS DA HOUSE
      token: '#04d361', //TOKEN DE ACESSO DA HOUSE
    }
  ],
  admins: []
}

// the disconnect function you create the way you wish to, example:
const disconnect = (socket) => {
  io.emit('disconected', socket.handshake.auth)
  io.in(socket.id).disconnectSockets()
  houses.islands = houses.islands.filter((hs) => {
    if (hs.token == socket.handshake.auth.token) {
      return {
        ...hs,
        connected: false
      }
    } else {
      return hs;
    }
  });
}


io.on("connection", (socket) => {

  console.log(`Conexão recebida (${socket.handshake.auth.token})`);

  socket.on('theme', (data) => {
    console.log('Tema recebido:', data)
  });

  socket.on('prompts', () => {
    loadPrompts(socket);
  });

  socket.on('ia_upscale_variation', (data) => {
    console.log('Dados recebidos:', data);
    require('./midjourney').buttonSelect(socket, data.variation, data.buttonMessageId, data.reference);
  })

  socket.on('generate_image', (data) => {
    console.log('Dados para gerar o tema:', data.user.image);

    const originalImageId = Date.now();

    // Remova o cabeçalho da string base64
    const base64Data = data.user.image.replace(/^data:image\/\w+;base64,/, '');

    // Crie um buffer a partir da string base64
    const buffer = Buffer.from(base64Data, 'base64');

    sharp(buffer)
      .resize({
        width: 3000,
        height: 4000,
        fit: 'inside', // Mantém a proporção original, ajustando dentro das dimensões especificadas
        withoutEnlargement: true // Não aumenta a imagem se ela já for menor que as dimensões especificadas
      })
      .toFile(`./IA/${originalImageId}_original.png`, (err, info) => {
        if (err) {
          console.error('Erro ao salvar a imagem:', err);
        } else {
          console.log('Enviando prompt no tema.', data.tema);
          require('./midjourney').IaGenerate(socket, originalImageId, 'https://cdn.discordapp.com/attachments/1154785401823834162/1159529339738656829/20230918_150919.jpg?ex=65315ad9&is=651ee5d9&hm=e8c7cd1a39b75d58b5d940895eae72df39c31e06dcad2b7852268f860adb1fe4&', data.tema.prompt)
          socket.emit('ia_generating', true);
          console.log(`Imagem salva como ${originalImageId}_original.png`);
        }
      });

  })

  // Verifica se a house esta conectada
  // let drop;
  // const dropCheck = () => {
  //   if (!socket) return; // if user connects twice before the check, simply stops process
  //   socket.emit('dropCheck')
  //   drop = setTimeout(() => disconnect(socket), 4000) // 4 secs to recieve answer
  // }

  // const setDrop = () => setTimeout(() => dropCheck(), 15000) // 60 secs to restart the process

  // socket.on('dropCheck', () => {
  //   console.log('DropCheck recebido')
  //   clearTimeout(drop) // cancells actual drop coutdown (if any)
  //   setDrop() // sets a new
  //   console.log('Atualizar house', socket.handshake.auth.token);
  //   houses.islands = houses.islands.filter((hs) => {
  //     if (hs.token == socket.handshake.auth.token) {
  //       console.log('Atualizando status da house: conectado');

  //       return {
  //         ...hs,
  //         connected: true
  //       }
  //     } else {
  //       return hs;
  //     }
  //   });
  // });


  // setDrop();
});



(() => {
  console.log('Habilitando sistema...');

  console.log('#Ligando o serviço Socket.IO');
  io.listen(3004);

  console.log('#Habilitando status das Houses (10 segundos)');
  const connectedhouses = setInterval(() => {
    console.log('\nStatus das Houses');
    houses.islands.map(async (house) => {
      console.log(`${house.house} - ${house.connected}`);
    });
    console.log('\n');
  }, 10000);
})();

const signInHouse = (socket) => {
  connections.set(socket, {
    house: 'HOUSE#1', //NOME DA HOUSE
    midjourney: '', //TOKEN DO MIDJOURNEY
    connected: false, //STATUS DA HOUSE
    token: '#d90045', //TOKEN DE ACESSO DA HOUSE
  })
}

const loadPrompts = (socket) => {
  socket.emit('getprompts', prompts);
}