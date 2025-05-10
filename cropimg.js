const sharp = require('sharp');

const caminhoEntrada = './IA/1696874112339_original.jpg'; // Substitua pelo caminho da sua imagem de entrada
const caminhoSaida = './imagem_redimensionada.jpg'; // Substitua pelo caminho de saída desejado

const larguraDesejada = 964;
const alturaDesejada = 964;

sharp(caminhoEntrada)
  .resize(larguraDesejada, alturaDesejada)
  .withMetadata() // Preserva os metadados, incluindo a orientação
  .toFile(caminhoSaida, (err, info) => {
    if (err) {
      console.error(err);
    } else {
      console.log('Imagem redimensionada e salva com sucesso!');
      console.log(info);
    }
  });