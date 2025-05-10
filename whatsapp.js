const axios = require('axios');
const fs = require('fs');
const { funcs } = require('./utils/funcs');

const func = new funcs();


class Whatsapp {
  constructor() {
    this.apiUrl = 'https://graph.facebook.com/v16.0/417177008156791/messages'; // Substitua pelo ID do número de telefone
    this.accessToken = 'EAAiVpN5lgYYBO6bDuMvdNYw9BkxligAkF0dPZBvDLwD06acrCyjZBHbfGW8wM13CZCAZBU46TazGGS38DgmLTeLRnQuyW4j4hQnaWOgNlmfPjjbzCCAFCgzTH7b4xZALBR1WsA8JeIo2fvper6Y2p1XdXdAVCjEp899M8zvFKraVB7WZA0HGmFxT1iWHJfECpjMZC32SVksHnAbTGXUZA3CIel3ASWaR0R8ZAyeefoaiMC9IZD'; // Substitua pelo token de acesso do Facebook Business Manager
  }

  async start() {
    console.log('Inicializando API oficial do WhatsApp Business...');
    // Aqui você pode adicionar qualquer inicialização adicional necessária para a API oficial
    return true;
  }

  async getClient() {
    // Na API oficial, o cliente é sempre disponível com as credenciais corretas.
    return { apiUrl: this.apiUrl, accessToken: this.accessToken };
  }

  async sendMessage(name, number, reference) {
    const promise = new Promise(async (resolve, reject) => {
      const client = await this.getClient();

      if (!client) {
        console.error('API do WhatsApp não inicializada corretamente.');
        return resolve(null);
      }

      try {
        const base64Image = fs.readFileSync(`./MASK/${reference}.png`, { encoding: 'base64' });

        if (!base64Image) {
          console.error('Falha ao ler o arquivo de imagem.');
          return resolve(null);
        }

        console.log('Imagem convertida para base64.');

        const response = await axios.post(
          client.apiUrl,
          {
            messaging_product: 'whatsapp',
            to: `55${number}`,
            type: 'image',
            image: {
              link: `data:image/png;base64,${base64Image}`,
              caption: `Olá, ${name}, aqui está a foto que você tirou com a Samsung.`
            }
          },
          {
            headers: {
              Authorization: `Bearer ${client.accessToken}`,
              'Content-Type': 'application/json'
            }
          }
        );

        console.log('Mensagem enviada com sucesso:', response.data);
        resolve(response.data);
      } catch (error) {
        console.error('Erro ao enviar mensagem:', error.response ? error.response.data : error.message);
        reject(error);
      }
    });

    return promise;
  }
}

const WhatsappClient = new Whatsapp();

module.exports = { Whatsapp };
