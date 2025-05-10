const Jimp = require('jimp');
const path = require('path');

async function testImageOverlay(maskPath, imagePath, outputPath) {
    try {
        // Carrega a máscara e a imagem base
        const original_mask = await Jimp.read(maskPath); // Máscara
        const AiConvertedImage = await Jimp.read(imagePath); // Imagem base

        // Define o fator de aumento
        const increaseFactor = 1.3; // Aumentar 10%

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

        // Salve a imagem final
        await combinedImage.writeAsync(outputPath);

        console.log(`Imagem combinada salva em: ${outputPath}`);
    } catch (error) {
        console.error('Erro durante o teste de sobreposição:', error);
    }
}
// Caminhos para a máscara, imagem e saída
const maskPath = path.resolve(__dirname, 'molduravertical.png'); // Substitua pelo caminho da máscara
const imagePath = path.resolve(__dirname, './IA/febf22c7-3e67-46b1-b866-6422af0fd14c_final.png'); // Substitua pelo caminho da imagem base
const outputPath = path.resolve(__dirname, 'output_combined.png'); // Caminho da imagem combinada

// Executa o teste
testImageOverlay(maskPath, imagePath, outputPath);
