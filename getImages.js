const ftp = require("ftp");
const fs = require("fs");

const client = new ftp();

client.on("ready", () => {
  client.cwd("/", (err, currentDir) => {
    if (err) throw err;
    client.list((err, list) => {
      if (err) throw err;
      console.log("Lista de arquivos no servidor FTP:");
      console.log(list);

      list.forEach((file, index) => {
        console.log('Validando arquivo...')
        if (file && !file.name.includes('trashed') && file.name.endsWith('.jpg')) {
          const localFilePath = `./Fotos/${file.name}`;
          const remoteFilePath = `./${file.name}`;

          client.get(remoteFilePath, (err, stream) => {
            if (err) {
              // throw err;
              console.log(`${file.name} - (${index}) Falha ao copiar arquivo.`);
              return;
            } else {
              console.log(`${file.name} - (${index}) Copiando arquivo.`);
            }
            const localFile = fs.createWriteStream(localFilePath);
            stream.pipe(localFile);
            localFile.on("close", () => {
              console.log(`Arquivo ${file.name} baixado com sucesso.`);
            });
          });
        }
      });

      client.end();
    });
  });
});

client.connect({
  host: "192.168.1.51",//ftp://bgsgalaxy@192.168.1.51:2221/
  port: 2221,
  user: "bgsgalaxy",
  password: "android"
});
