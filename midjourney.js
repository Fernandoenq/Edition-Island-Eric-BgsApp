const fs = require("fs");
const Jimp = require('jimp');
const sharp = require('sharp');
const https = require("https");
const readline = require('readline');
const ProgressBar = require('progress');
const { funcs } = require("./utils/funcs");
const { WhatsappClient } = require("./whatsapp");
const path = require('path');

// Api frame pro
const TNL_API_KEY = '753bd12e-ce2b-4994-b038-b59edfc84c2b';
const BASE_URL = 'https://api.apiframe.pro';
const AUTH_TOKEN = TNL_API_KEY;

// Go Api
//const BASE_URL = 'https://api.goapi.ai'; // Exemplo, substitua pela URL correta
//const AUTH_TOKEN = 'seu-token-da-goAPI'; // Adicione o token apropriado


var quantas_vezes_interno = 0;
var imagem_a_ser_impressa = "";
var idDaVez_separado = 0;

const AUTH_HEADERS = {
  Authorization: `${AUTH_TOKEN}`,
  'Content-Type': 'application/json',
};

const funcInstance = new funcs(); // Instancia a classe funcs
let numeroExtraido = 1;
let caminhooriginal = "";
let id_da_vez = 1;
let activeIntervals = {}; // Armazena intervalos ativos associados a `messageId`


function SaveImage(image){
  console.log("SaveImage image");
  console.log(image);
  caminhooriginal = image;
}
function SavenumeroExtraido(numeroExtraidoExtern){
  console.log("numeroExtraidoExtern");
  console.log(numeroExtraidoExtern);
  SavenumeroExtraido = numeroExtraidoExtern;
}
async function downloadTheImage(imageUrl, imageId) {
  console.log('Tipo de downloadTheImage:', typeof downloadTheImage);
  console.log(`[downloadTheImage] Iniciando o download da imagem: ${imageUrl}, ID: ${imageId}`);
  console.log(`Iniciando o download da imagem: ${imageUrl}, ID: ${imageId}`);

  const local_path = fs.createWriteStream(`./IA/${imageId}.png`);

  https.get(imageUrl, function (response) {
    console.log(`[downloadTheImage] Status do download: ${response.statusCode}`);
    if (response.statusCode === 200) {
      console.log(`[downloadTheImage] Imagem salva com sucesso (${imageId})`);
      response.pipe(local_path);
    } else {
      console.error(`[downloadTheImage] Erro ao baixar a imagem. Status: ${response.statusCode}`);
    }
  });
}

async function downloadTheImage2(imageUrl, imageId) {
  console.log('Tipo de downloadTheImage2:', typeof downloadTheImage);
  console.log(`[downloadTheImage] Iniciando o download da imagem: ${imageUrl}, ID: ${imageId}`);
  const local_path = fs.createWriteStream(`./IA/${imageId}.png`);

  return new Promise((resolve, reject) => {
    https.get(imageUrl, function (response) {
      console.log(`[downloadTheImage] Status do download: ${response.statusCode}`);
      if (response.statusCode === 200) {
        response.pipe(local_path);
        local_path.on('finish', () => {
          console.log(`[downloadTheImage] Imagem salva com sucesso (${imageId})`);
          
          if (fs.existsSync(`./IA/${imageId}.png`)) {
            console.log(`[downloadTheImage] O arquivo foi salvo com sucesso: ./IA/${imageId}.png`);
            resolve();  // Download concluído com sucesso
          } else {
            console.error(`[downloadTheImage] O arquivo não foi salvo corretamente.`);
            reject(new Error('Erro ao salvar o arquivo.'));
          }
        });
      } else {
        console.error(`[downloadTheImage] Erro ao baixar a imagem. Status: ${response.statusCode}`);
        reject(new Error(`Erro ao baixar a imagem: Status ${response.statusCode}`));
      }
    }).on('error', (err) => {
      console.error(`[downloadTheImage] Erro no download:, err.message`);
      reject(err);
    });
  });
}


// Função principal para gerar imagem
async function generateImage() {
  console.log(`[generateImage] Iniciando geração de imagem...`);
  const promptImage = await ask('Cole a url (direta) da imagem: ');
  console.log(`[generateImage] URL da imagem fornecida: ${promptImage}`);
  const promptCommand = await ask('Digite o prompt para gerar a imagem: ');
  console.log(`[generateImage] Prompt fornecido: ${promptCommand}`);

  const originalImageId = `${Date.now()}`;
  console.log(`[generateImage] ID gerado para a imagem original: ${originalImageId}`);

  try {
    // Api pro
    const imagining = await fetch(`${BASE_URL}/imagine`, {
      method: 'POST',
      headers: AUTH_HEADERS,
      body: JSON.stringify({
        msg:`${promptImage} ${promptCommand}`,
        aspect_ratio: "9:16",
        ref: `${originalImageId}`,
      }),
    });
/* 
    const imagining = await fetch(`${BASE_URL}/generate`, { // Substitua pelo endpoint correto
      method: 'POST',
      headers: AUTH_HEADERS,
      body: JSON.stringify({
        msg:`${promptImage} ${promptCommand}`,
        ref: `${originalImageId}`,
      }),
    });*/

    console.log(`[generateImage] Requisição enviada para ${BASE_URL}/imagine`);

    const imaginingData = await imagining.json();
    console.log(`[generateImage] Resposta da API:, imaginingData`);

    if (imagining.ok) {
      console.log(`[generateImage] Imagem sendo gerada, messageId: ${imaginingData.task_id}`);
      await downloadTheImage(promptImage, `${originalImageId}_original`);
      getProgress(TNL_API_KEY, socket, imaginingData.messageId, 0);
    } else {
      console.error(`[generateImage] Erro na requisição. Status: ${imagining.status}, Mensagem: ${imaginingData.message}`);
    }

  } catch (error) {
    console.error(`[generateImage] Erro ao tentar gerar imagem:`, error);
  }
}

async function IaGenerate(iatoken, socket, originalImageId, promptImage, promptCommand) {
  console.log(`[IaGenerate] Função chamada com promptCommand: ${promptCommand}`);
  
  if (!promptCommand) {
    console.log(`[IaGenerate] Falha! Comando indefinido.`);
    return;
  }

  const promptWithImage = promptCommand.replace('<image>', promptImage);
  console.log(`[IaGenerate] Prompt final com URL da imagem: ${promptWithImage}`);

  try {
     // Api pro
    const imagining = await fetch(`${BASE_URL}/imagine`, {
      method: 'POST',
      headers: AUTH_HEADERS,
      body: JSON.stringify({
        prompt: promptWithImage,
        aspect_ratio: "9:16",
        ref: `${originalImageId}`,
      }),
    });
    /*
    const imagining = await fetch(`${BASE_URL}/generate`, { // Substitua pelo endpoint correto
      method: 'POST',
      headers: AUTH_HEADERS,
      body: JSON.stringify({
        prompt: promptWithImage,
        ref: `${originalImageId}`,
      }),
    });
    */

    console.log(`[IaGenerate] Requisição enviada para ${BASE_URL}/imagine`);

    const imaginingData = await imagining.json();
    console.log(`[IaGenerate] Resposta da API:`, imaginingData);

    if (imaginingData.errors) {
      console.error(`[IaGenerate] Erro da API: ${imaginingData.errors[0].msg}`);
    } else if (imaginingData && imaginingData.task_id) {
      console.log(`[IaGenerate] Task iniciada. task_id: ${imaginingData.task_id}`);
      getProgress(iatoken, socket, imaginingData.task_id, 0);
    } else {
      console.error(`[IaGenerate] Erro inesperado. Resposta:`, imaginingData);
    }
  } catch (error) {
    console.error(`[IaGenerate] Erro ao processar requisição:`, error);
  }
}



async function getProgress(iatoken, socket, messageId, retryCount, type) {
  console.log(`[getProgress] Iniciando acompanhamento de progresso da task: ${messageId}`);
  const bar = new ProgressBar('Processando [:bar] :percent', {
    complete: '=',
    incomplete: ' ',
    width: 20,
    total: 100,
  });

  const timer = setInterval(async () => {
    if (retryCount > 20) {
      console.error(`[getProgress] Máximo de tentativas excedido. Task: ${messageId}`);
      clearInterval(timer);
      return;
    }

    try {
      const imagination = await fetch(`${BASE_URL}/fetch`, {
        method: 'POST',
        headers: {
          Authorization: `${AUTH_TOKEN}`,
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({
          task_id: `${messageId}`
        }),
      });

      console.log(`[getProgress] Requisição enviada para ${BASE_URL}/fetch. Tentativa ${retryCount}`);
      const imaginationData = await imagination.json();

      console.log(`[getProgress] Resposta da API:`, imaginationData);

      if (!imaginationData || !imaginationData.status) {
        console.error(`[getProgress] Resposta inválida da API.`);
        return;
      }

      if (imaginationData.status === "processing") {
        console.log(`[getProgress] Progresso: ${imaginationData.percentage || 0}%`);
        //api pro
        bar.tick(parseInt(imaginationData.percentage || 0));
        //bar.tick(parseInt(imaginationData.completion_percentage || 0));
        socket.emit('ia_progress', parseInt(imaginationData.percentage || 0));
      } else if (imaginationData.status === "finished") {
        clearInterval(timer);
        bar.tick(100);
        socket.emit('ia_progress', 100);

        const imageUrls = imaginationData.image_urls;
        const originalImageUrl = imaginationData.original_image_url;
        console.log(`[getProgress] URL da imagem original: ${originalImageUrl}`);
        console.log(`[getProgress] URLs das variações:`, imageUrls);
        
        console.log('Tipo de downloadTheImage:', typeof downloadTheImage);
        //numeroExtraido = `${imaginationData.task_id}`;
        await downloadTheImage2(originalImageUrl, `${imaginationData.task_id}_original`);

        if (type !== 'finalImage') {
          socket.emit('ia_variation', {
            main: originalImageUrl,
            variations: imageUrls,
            buttonMessageId: imaginationData.buttonMessageId,
            reference: imaginationData.task_id,
          });
        } else {
          setTimeout(async () => {
            await downloadTheImage(originalImageUrl, `${imaginationData.task_id}_artificial`);
            console.log(`[getProgress] Gerando máscara...`);
            setTimeout(async () => {
              createMaskImage(socket, imaginationData.task_id);
            }, 2000);
          }, 1000);
        }
      } else {
        console.error(`[getProgress] Status inesperado: ${imaginationData.status}`);
      }
    } catch (error) {
      console.error(`[getProgress] Erro ao obter progresso da imagem:`, error);
    }

    retryCount++;
    console.log(`[getProgress] Tentativa número ${retryCount}`);
  }, 5000);
}




async function getProgress2(iatoken, socket, messageId, retryCount, type) {
  console.log(`[getProgress2] Iniciando acompanhamento de progresso da task: ${messageId}`);
  id_da_vez = messageId;
  console.log("id_da_vez e  messageId", id_da_vez);

  // Impedir intervalos duplicados para o mesmo messageId
  if (activeIntervals[messageId]) {
    console.log(`[getProgress2] Intervalo já ativo para task: ${messageId}`);
    return;
  }

  const bar = new ProgressBar('Processando [:bar] :percent', {
    complete: '=',
    incomplete: ' ',
    width: 20,
    total: 100,
  });

  activeIntervals[messageId] = setInterval(async () => {
    if (retryCount > 20) {
      console.error(`[getProgress2] Máximo de tentativas excedido. Task: ${messageId}`);
      clearInterval(activeIntervals[messageId]);
      delete activeIntervals[messageId];
      return;
    }

    try {
      const imagination = await fetch(`${BASE_URL}/fetch`, {
        method: 'POST',
        headers: {
          Authorization: `${AUTH_TOKEN}`,
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({ task_id: `${messageId}` }),
      });

      const imaginationData = await imagination.json();
      console.log(`[getProgress2] Resposta da API recebida:`, imaginationData);

      if (!imaginationData || !imaginationData.status) {
        console.error("[getProgress2] A resposta da API não contém um status válido.");
        return;
      }

      if (imaginationData.status === "processing") {
        console.log(`[getProgress2] Progresso: ${imaginationData.percentage || 0}%`);
        bar.tick(parseInt(imaginationData.percentage || 0));
        socket.emit('ia_progress', parseInt(imaginationData.percentage || 0));

      } else if (imaginationData.status === "finished") {
        clearInterval(activeIntervals[messageId]);
        delete activeIntervals[messageId];

        bar.tick(100);
        socket.emit('ia_progress', 100);

        const imageUrl = imaginationData.image_url;

        if (imageUrl) {
          console.log(`[getProgress2] URL da imagem final obtida: ${imageUrl}`);
          const finalImageId = `${imaginationData.task_id}_final`;

          await downloadTheImage2(imageUrl, finalImageId);
          console.log(`[getProgress2] Imagem final salva como ${finalImageId}`);

          if (type === 'finalImage') {
            console.log(`[getProgress2] Gerando máscara para a imagem...`);
            createMaskImage(socket, caminhooriginal, finalImageId, imaginationData.task_id);
          }
        } else {
          console.error(`[getProgress2] URL da imagem não foi encontrada.`);
        }
      } else {
        console.error(`[getProgress2] Status inesperado: ${imaginationData.status}`);
      }
    } catch (error) {
      console.error(`[getProgress2] Erro ao obter o progresso da imagem:`, error);
    }

    retryCount++;
    console.log(`[getProgress2] Tentativa número (${retryCount})`);
  }, 5000);
}

async function buttonSelect2(iatoken, socket, variation, buttonMessageId, reference, client) {
  if (!['1', '2', '3', '4'].includes(`${variation}`)) {
    throw new Error('Variação não encontrada.');
  }

  try {
    const channel = await client.channels.fetch(MIDJOURNEY_CHANNEL_ID);
    if (!channel) {
      throw new Error('Canal não encontrado.');
    }

    const upscaleCommand = `/upscale ${buttonMessageId} U${variation}`;
    await channel.send(upscaleCommand);

    console.log(`${socket.name} Enviando comando de upscale: ${upscaleCommand}`);
  } catch (error) {
    console.error(`Erro durante a execução de buttonSelect: ${error.message}`);
    socket.emit('ia_gen_error', { regenerate: true });
  }
}



// Função para selecionar a variação de imagem
async function buttonSelect(iatoken, socket, variation, parentTaskId, vezes) {
  console.log("vezes");
  console.log(vezes);
  quantas_vezes_interno = vezes;
  console.log("quantas_vezes_interno");
  console.log(quantas_vezes_interno);

  console.log("parentTaskId");
  console.log(parentTaskId);
  console.log(`[buttonSelect] Função chamada. Variação: ${variation}`);

  if (!(`${variation} == '1' || ${variation} == '2' || ${variation} == '3' || ${variation} == '4'`)) {
    throw new Error('Variação não encontrada.');
  }

  console.log(`[buttonSelect] Processando imagem...`);
  try {
    // Verifique se o parentTaskId é válido
    console.log("parentTaskId");
    console.log(parentTaskId);
    if (!parentTaskId) {
      console.error('[buttonSelect] ID da tarefa original inválido.');
      socket.emit('ia_gen_error', { message: 'ID da tarefa original inválido.' });
      return;
    }
    
     //api pro
    const upscaleImage = await fetch(`${BASE_URL}/upscale-1x`, {
      method: 'POST',
      headers: AUTH_HEADERS,
      body: JSON.stringify({
        parent_task_id: parentTaskId,  // Certifique-se de que este valor é válido
        index: `${variation}`,         // Índice da variação a ser upscalada
      }),
    });
/*
    const upscaleImage = await fetch(`${BASE_URL}/upscale`, { // Substitua pelo endpoint correto
      method: 'POST',
      headers: AUTH_HEADERS,
      body: JSON.stringify({
        parent_task_id: parentTaskId,
        variation_index: `${variation}`, // Substitua pelos parâmetros corretos
      }),
    });*/

    const upscaleData = await upscaleImage.json();
    console.log(`[buttonSelect] Resposta da API:, upscaleData`);

    // Verifique se um task_id foi retornado corretamente
    if (upscaleData.task_id) {
      console.log(`[buttonSelect] Task de upscale enviada com sucesso. Task ID: ${upscaleData.task_id}`);
      socket.emit('ia_generating', true);
      getProgress2(iatoken, socket, upscaleData.task_id, 0, 'finalImage');
    } else {
      console.log(`[buttonSelect] Erro no processo de upscale. Nenhuma task ID retornada.`);
    }
  } catch (error) {
    console.error(`[buttonSelect] Erro ao processar requisição:`, error);
  }
}


module.exports = { IaGenerate, buttonSelect, SaveImage, SavenumeroExtraido, printImageMultipleTimes};

// Função para gerar a máscara na imagem
const productWidth = 1080;
const productHeight = 1080;
const borderRadius = 50;

const mask = Buffer.from(`
  <svg xmlns="http://www.w3.org/2000/svg" width="${productWidth}" height="${productHeight}">
    <rect x="0" y="0" width="${productWidth}" height="${productHeight}" rx="${borderRadius}" ry="${borderRadius}" fill="white"/>
  </svg>
`);


async function createMaskImage(socket, originalFileName, finalFileName, reference) {
  console.log(`[createMaskImage] Criando máscara para referência: ${reference}`);

  // Caminho completo dos arquivos
  const originalImagePath = `${originalFileName}`;
  const finalImagePath = `./IA/${finalFileName}.png`;

  // Verifica se o arquivo original existe
  if (!fs.existsSync(originalImagePath)) {
      console.error(`[createMaskImage] Arquivo original não encontrado: ${originalImagePath}`);
      return;
  }

  // Verifica se o arquivo final existe
  if (!fs.existsSync(finalImagePath)) {
      console.error(`[createMaskImage] Arquivo final não encontrado: ${finalImagePath}`);
      return;
  }

  await imageOverlay(socket, originalImagePath, finalImagePath, reference);
}


async function processImages(socket, originalUrl, finalUrl, reference) {
  const originalFileName = `${reference}_original.jpg`;
  const finalFileName = `${reference}_final.png`;

  try {
      console.log(`[processImages] Iniciando download das imagens...`);

      // Baixar o arquivo original
      await downloadTheImage2(originalUrl, originalFileName);
      console.log(`[processImages] Arquivo original salvo como ${originalFileName}`);

      // Baixar o arquivo final
      await downloadTheImage2(finalUrl, finalFileName);
      console.log(`[processImages] Arquivo final salvo como ${finalFileName}`);

      // Criar a máscara após os downloads concluídos
      await createMaskImage(socket, originalFileName, finalFileName, reference);
  } catch (error) {
      console.error(`[processImages], Erro ao processar as imagens:`, error);
  }
}

// Verifique se o arquivo existe antes de tentar compor a imagem
async function compositeImages(imagePath) {
  console.log(`[compositeImages] Compondo imagem: ${imagePath}`);
  
  // Verifica se o arquivo existe
  if (!fs.existsSync(imagePath)) {
    console.error(`[compositeImages] Arquivo não encontrado: ${imagePath}`);
    throw new Error(`Arquivo não encontrado: ${imagePath}`);
  }
  
  try {
    const imageBuffer = fs.readFileSync(imagePath); // Lê o arquivo da imagem
    
    const nimg = await sharp(imageBuffer)
      .resize(productWidth, productHeight, { fit: 'cover' })
      .png()
      .composite([{ input: mask, blend: 'dest-in' }])
      .toBuffer();

    const canvas = sharp({
      create: {
        width: productWidth,
        height: productHeight,
        channels: 4, // RGBA
        background: { r: 0, g: 0, b: 0, alpha: 0 } // Fundo totalmente transparente
      },
    });

    const finalImageBuffer = await canvas
      .composite([{ input: nimg }])
      .png()
      .toBuffer();

    return finalImageBuffer;
  } catch (error) {
    console.error(`[compositeImages] Erro ao compor imagem:`, error);
    throw error; // Propaga o erro para a chamada da função
  }
}

async function imageOverlay(socket, originalImage, createdAiImage, reference) {
  console.log(`[imageOverlay] Iniciando sobreposição de imagens. Referência: ${reference}`);
  
  // Verifica se o arquivo original e a imagem gerada pela IA existem
  if (!fs.existsSync(originalImage)) {
    console.error(`[imageOverlay] Arquivo original não encontrado: ${originalImage}`);
    return;
  }
  
  if (!fs.existsSync(createdAiImage)) {
    console.error(`[imageOverlay] Imagem gerada pela IA não encontrada: ${createdAiImage}`);
    return;
  }

  // Use sempre o id_da_vez para manter a consistência
  console.log("id_da_vez quase no final");
  const id_da_vez2 = id_da_vez;  // Garante que o id_da_vez seja o correto
  console.log("ID atual: ", id_da_vez2);

  try {
    const original_mask = await Jimp.read('molduravertical.png'); // Certifique-se de que este arquivo existe
    //const AiConvertedImage = await compositeImages(createdAiImage);

    const AiConvertedImage = await Jimp.read(createdAiImage);

    // Define o fator de aumento
    const increaseFactor = 1.35; // Aumentar 10%

    // Calcula a nova largura e altura proporcional
    const newWidth = AiConvertedImage.getWidth() * increaseFactor + 32;
    const newHeight = AiConvertedImage.getHeight() * increaseFactor;

    // Aplica o redimensionamento com base no fator
    AiConvertedImage.resize(newWidth, newHeight);

    // Cria uma nova imagem com o mesmo tamanho da máscara
    const combinedImage = new Jimp(original_mask.getWidth(), original_mask.getHeight(), 0xffffffff); // Fundo branco

    // Calcula as coordenadas para centralizar a imagem base na nova imagem
    const imageX = (original_mask.getWidth() - AiConvertedImage.getWidth()) / 2;
    const imageY = (original_mask.getHeight() - AiConvertedImage.getHeight()) / 2;

    // Calcula as coordenadas para centralizar a máscara na nova imagem
    const maskX = 0; // Sempre começa no topo da nova imagem
    const maskY = 0;

    // Coloca a imagem base na nova imagem, centralizada
    combinedImage.composite(AiConvertedImage, imageX, imageY);

    // Coloca a máscara por cima, centralizada
    combinedImage.composite(original_mask, maskX, maskY, {
        mode: Jimp.BLEND_SOURCE_OVER,
        opacitySource: 1, // Opacidade total
    });

    const outputPath = `./MASK/${id_da_vez2}.png`;
    // Salve a imagem final
    await combinedImage.writeAsync(outputPath);
    if (fs.existsSync(outputPath)) {
      console.log(`[imageOverlay] Arquivo salvo com sucesso: ${outputPath}`);
    } else {
      console.error(`[imageOverlay] Falha ao salvar o arquivo: ${outputPath}`);
    }

    listAllUsers();

    setTimeout(async () => {
      const regex = /IA\\(\d+)_original\.jpg/; // Expressão regular corrigida // Expressão regular para capturar o número entre 'IA\' e '_original.jpg'
      const match = caminhooriginal.match(regex);

      console.log("numeroExtraido");
      console.log(numeroExtraido);
      if (match && match[1]) {
        numeroExtraido = match[1];
        console.log(numeroExtraido); // Saída: 1729704214706
      } else {
        console.log('Número não encontrado.');
      }

      console.log("id_da_vez2 no final:", id_da_vez2);
      
      imagem_a_ser_impressa = outputPath;
      idDaVez_separado = id_da_vez2;
      // Garante que estamos sempre usando o id_da_vez correto na conversão para base64
      /*try {
        if (fs.existsSync(outputPath)) {

          //const base64 = fs.readFileSync(outputPath, { encoding: 'base64' });
          //socket.emit('ia_printing', { state: true, image: base64 });
          console.log("quantas_vezes_interno antes do loop ")
          console.log(quantas_vezes_interno)
          for (let i = 0; i < quantas_vezes_interno; i++) {
            console.log(`[imageOverlay] Impressão ${i + 1} de ${quantas_vezes_interno}`);
            await require("./printer").printImage(outputPath);
          }
          
          console.log(`[imageOverlay] Imagem enviada com sucesso via Socket para a referência ${id_da_vez2}`);
        } else {
          console.error(`[imageOverlay] Arquivo não encontrado no caminho esperado: ${outputPath}`);
        }
      } catch (err) {
        console.error(`[imageOverlay] Erro ao ler o arquivo para base64:`, err);
      }*/

      try {
        const imageUrl = await require("./bucket").uploadImageAndGetDownloadUrl(outputPath);
        console.log('URL de download da imagem:', imageUrl);
      
        // Diretório para salvar o QR Code
        const saveDirectory = path.join(__dirname, 'qrcodes'); // Certifique-se de que path está definido
        const savePath = path.join(saveDirectory, `${id_da_vez2}_qrcode.png`);
      
        // Crie a pasta "qrcodes" se não existir
        if (!fs.existsSync(saveDirectory)) {
          fs.mkdirSync(saveDirectory, { recursive: true });
        }
      
        // Gere o QR Code a partir do link
        const qrCodePath = await require("./qrcode").generateQRCode(imageUrl, savePath);
        console.log('QR Code salvo em:', qrCodePath);
      
        // Converte o QR Code gerado para base64
        try {
          if (fs.existsSync(outputPath) && fs.existsSync(qrCodePath)) {
            // Leia as imagens
            const outputImage = await Jimp.read(outputPath);
            const qrCodeImage = await Jimp.read(qrCodePath);

            const outputWidth = outputImage.getWidth();
            qrCodeImage.resize(outputWidth, outputWidth); // Como é quadrado, altura = largura

        
            // Defina a altura total combinada (altura da imagem original + altura do QR Code)
            const combinedHeight = outputImage.getHeight() + qrCodeImage.getHeight();
            const combinedWidth = Math.max(outputImage.getWidth(), qrCodeImage.getWidth());
        
            // Crie uma nova imagem com altura e largura combinadas
            const combinedImage = new Jimp(combinedWidth, combinedHeight, 0xffffffff); // Fundo branco
        
            // Adicione as imagens na nova imagem combinada
            combinedImage.composite(outputImage, 0, 0); // Imagem original no topo
            combinedImage.composite(qrCodeImage, 0 , outputImage.getHeight()); // QR Code logo abaixo
        
            // Salve a imagem combinada (opcional)
            const combinedPath = `./MASK/${id_da_vez2}_combined.png`;
            await combinedImage.writeAsync(combinedPath);
        
            // Leia o arquivo combinado como base64
            //const combinedBase64 = combinedImage.getBase64Async(Jimp.MIME_PNG);
        
            const base64 = fs.readFileSync(combinedPath, { encoding: 'base64' });
;

            //socket.emit('ia_printing', { state: true, image: base64 })
            // Envie pelo socket
            socket.emit('ia_printing', { state: true, image: base64 });
            console.log(`[imageOverlay] Imagem combinada enviada via Socket para a referência ${id_da_vez2}`);
          } else {
            console.error(`[imageOverlay] Uma ou ambas as imagens não foram encontradas: ${outputPath}, ${qrCodePath}`);
          }
        } catch (err) {
          console.error(`[imageOverlay] Erro ao combinar as imagens:`, err);
        }
      } catch (error) {
        console.error('Erro ao gerar o QR Code ou processar a imagem:', error.message);
      }
      
      
      
    }, 100);

    console.log(`[imageOverlay] Máscara criada para referência (${numeroExtraido})`);
  } catch (error) {
    console.error(`[imageOverlay] Erro na sobreposição de imagens:`, error);
  }
}

async function printImageMultipleTimes(vezesx) {
  try {
    if (fs.existsSync(imagem_a_ser_impressa)) {
      console.log("quantas_vezes_interno antes do loop ");
      console.log(vezesx);

      for (let i = 0; i < vezesx; i++) {
        console.log(`[printImageMultipleTimes] Impressão ${i + 1} de ${vezesx}`);
        await require("./printer").printImage(imagem_a_ser_impressa);
      }

      console.log(`[printImageMultipleTimes] Imagem enviada com sucesso via Socket para a referência ${id_da_vez2}`);
    } else {
      console.error(`[printImageMultipleTimes] Arquivo não encontrado no caminho esperado: ${imagem_a_ser_impressa}`);
    }
  } catch (err) {
    console.error(`[printImageMultipleTimes] Erro ao imprimir a imagem:`, err);
  }
}


async function listAllUsers() {
  try {
    const allUsers = await funcInstance.getAll(); // Assumindo que o método getAll() já existe e retorna todos os registros da tabela
    if (allUsers && allUsers.length > 0) {
      console.log('[listAllUsers] Usuários encontrados no banco de dados:');
      allUsers.forEach(user => {
        console.log(`ID_IMAGEM: ${user.ID_IMAGEM}, NOME_CLIENTE: ${user.NOME_CLIENTE}, WHATSAPP_CLIENTE: ${user.WHATSAPP_CLIENTE}`);
      });
    } else {
      console.log('[listAllUsers] Nenhum usuário encontrado no banco de dados.');
    }
  } catch (error) {
    console.error('[listAllUsers] Erro ao buscar usuários no banco de dados:', error);
  }
}

// Chame essa função logo no início para listar todos os usuários
listAllUsers();



// Função para leitura de entrada no terminal
function ask(query) {
  const rl = readline.createInterface({
    input: process.stdin,
    output: process.stdout,
  });

  return new Promise(resolve => rl.question(query, ans => {
    rl.close();
    resolve(ans);
  }));
}