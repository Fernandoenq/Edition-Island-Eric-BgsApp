const QRCode = require('qrcode');

async function generateQRCode(link, savePath) {
  return new Promise((resolve, reject) => {
    QRCode.toFile(savePath, link, { type: 'png' }, (err) => {
      if (err) {
        console.error('Erro ao gerar o QR Code:', err);
        reject(err);
      } else {
        console.log('QR Code gerado com sucesso em:', savePath);
        resolve(savePath);
      }
    });
  });
}

module.exports = { generateQRCode };
