const fetch = require('node-fetch');
const path = require('path');

async function printImage(imagePath) {
    console.log("bora imprimir imagePath")
    console.log(imagePath)
  try {
    const absoluteImagePath = path.resolve(imagePath); // Gera o caminho absoluto

    console.log("bora imprimir completo imagePath")
    console.log(imagePath)


    const response = await fetch('http://127.0.0.1:5000/print', {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
      },
      body: JSON.stringify({
        image_path: absoluteImagePath,
        printer_name: 'DS-RX1',
      }),
    });

    const result = await response.json();
    console.log('Resposta da API:', result);
  } catch (error) {
    console.error('Erro ao chamar a API:', error.message);
  }
}


module.exports = { printImage };