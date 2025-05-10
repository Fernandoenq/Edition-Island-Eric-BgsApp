
require('dotenv').config()
const Discord = require('discord.js')
const clientOptions = {
  intents: [
    Discord.GatewayIntentBits.Guilds,
    Discord.GatewayIntentBits.GuildMessages,
    Discord.GatewayIntentBits.GuildPresences,
    Discord.GatewayIntentBits.GuildMessageReactions,
    Discord.GatewayIntentBits.DirectMessages,
    Discord.GatewayIntentBits.MessageContent
  ],
  partials: [Discord.Partials.Channel, Discord.Partials.Message, Discord.Partials.User, Discord.Partials.GuildMember, Discord.Partials.Reaction]
}

// const {io} = require("socket.io-client");
// const socket = io("ws://192.168.0.190:3003");

TOKEN_ILHA_1 = 'MTI5NzYwNzYwOTQ3NzYzMjEyMA.GWz85X.6flBOh-TmE7zNStRhy5T5UAMoDrRm3onSgFsBo';
TOKEN_ILHA_2 = 'MTI5NzYwNzYwOTQ3NzYzMjEyMA.GWz85X.6flBOh-TmE7zNStRhy5T5UAMoDrRm3onSgFsBo';
TOKEN_ILHA_3 = 'MTI5NzYwNzYwOTQ3NzYzMjEyMA.GWz85X.6flBOh-TmE7zNStRhy5T5UAMoDrRm3onSgFsBo';

class DiscordMD {

  constructor() {
    var client_ilha_1 = null;
    var client_ilha_2 = null;
    var client_ilha_3 = null;
  }

  async start() {
    console.log('[DISCORD] Iniciando sistema...');
    this.client_ilha_1 = new Discord.Client(clientOptions);
    this.client_ilha_2 = new Discord.Client(clientOptions);
    this.client_ilha_3 = new Discord.Client(clientOptions);

    setTimeout(() => {
      this.client_ilha_1.login(TOKEN_ILHA_1);
      this.client_ilha_2.login(TOKEN_ILHA_2);
      this.client_ilha_3.login(TOKEN_ILHA_3);

      this.client_ilha_1.on("ready", () => {

        this.client_ilha_1.user.setActivity(`picbrand.com.br`, { type: Discord.ActivityType.Playing })

        console.log(`[DISCORD] ${this.client_ilha_1.user.username} Iniciado corretamente.`);

      });

      this.client_ilha_2.on("ready", () => {

        this.client_ilha_2.user.setActivity(`picbrand.com.br`, { type: Discord.ActivityType.Playing })

        console.log(`[DISCORD] ${this.client_ilha_2.user.username} Iniciado corretamente.`);

      });

      this.client_ilha_3.on("ready", () => {

        this.client_ilha_3.user.setActivity(`picbrand.com.br`, { type: Discord.ActivityType.Playing })

        console.log(`[DISCORD] ${this.client_ilha_3.user.username} Iniciado corretamente.`);

      });
    }, 2000);

  }

  async sendImageMessage(island, imageDir, counter = 0) {
    const promise = new Promise(async (resolve, reject) => {
      if (counter >= 3) {
        return reject('Falha ao gerar imagem após 3 tentativas.');
      }
      try {
        let client = null;
        let channel = null;
  
        if (island === 'Ilha #1') {
          client = this.client_ilha_1;
          channel = client?.channels.cache.get('1298038016215879700');
        } else if (island === 'Ilha #2') {
          client = this.client_ilha_2;
          channel = client?.channels.cache.get('1298038016215879700');
        } else if (island === 'Ilha #3') {
          client = this.client_ilha_3;
          channel = client?.channels.cache.get('1298038016215879700');
        }
  
        if (!channel) return reject('Canal não encontrado');
  
        const attachment = new Discord.AttachmentBuilder(imageDir);
        require('./midjourney').SaveImage(imageDir);
        await channel.send({ files: [attachment] });
  
        const lastMessage = await channel.messages.fetch({ limit: 1 });
        const imageUrl = lastMessage.first().attachments.first().url;
        
        resolve(imageUrl);
      } catch (error) {
        console.error(`Erro ao enviar imagem, tentativa ${counter + 1}:`, error);
        setTimeout(() => {
          this.sendImageMessage(island, imageDir, counter + 1)
            .then(resolve)
            .catch(reject);
        }, 1000); // Aguarde 1 segundo antes de tentar novamente
      }
    });
  
    return promise;
  }
  

}

module.exports = { DiscordMD }