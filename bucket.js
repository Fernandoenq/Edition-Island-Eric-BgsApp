const { S3Client, PutObjectCommand, GetObjectCommand, ListObjectsCommand, DeleteObjectsCommand } = require('@aws-sdk/client-s3');
const { getSignedUrl } = require('@aws-sdk/s3-request-presigner');
const fs = require('fs');
const path = require('path');

const bucketName = 'ai-pic-pro';

// Configure o cliente S3
const s3 = new S3Client({
  region: 'sa-east-1',
  credentials: {
    accessKeyId: 'AKIAYEKP5TRVJDSDPUEF', // Substitua pela sua Access Key
    secretAccessKey: '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', // Substitua pela sua Secret Key
  },
});

// Função para deletar todas as imagens do bucket
async function deleteAllImagesFromBucket() {
  try {
    const listCommand = new ListObjectsCommand({ Bucket: bucketName });
    const listResponse = await s3.send(listCommand);

    if (listResponse.Contents && listResponse.Contents.length > 0) {
      const deleteParams = {
        Bucket: bucketName,
        Delete: {
          Objects: listResponse.Contents.map((item) => ({ Key: item.Key })),
        },
      };

      const deleteCommand = new DeleteObjectsCommand(deleteParams);
      await s3.send(deleteCommand);

      console.log('Todas as imagens foram deletadas do bucket.');
    } else {
      console.log('Nenhuma imagem encontrada para deletar.');
    }
  } catch (error) {
    console.error('Erro ao deletar as imagens:', error);
    throw error;
  }
}

// Função para fazer upload e gerar link assinado
async function uploadImageAndGetDownloadUrl(localImagePath) {
  try {
    // Verificar quantidade de imagens no bucket
    const listCommand = new ListObjectsCommand({ Bucket: bucketName });
    const listResponse = await s3.send(listCommand);

    const imageCount = listResponse.Contents ? listResponse.Contents.length : 0;

    console.log(`Imagens no bucket: ${imageCount}`);

    // Se houver mais de 10 imagens, deletar todas
    if (imageCount > 10) {
      console.log('Mais de 10 imagens encontradas. Deletando todas...');
      await deleteAllImagesFromBucket();
    }

    // Continuar com o upload
    const fileContent = fs.readFileSync(localImagePath);
    const fileName = path.basename(localImagePath);

    const uploadParams = {
      Bucket: bucketName,
      Key: fileName,
      Body: fileContent,
    };

    const uploadCommand = new PutObjectCommand(uploadParams);
    await s3.send(uploadCommand);
    console.log('Upload concluído com sucesso!');

    // Gera o link assinado para download
    const downloadParams = {
      Bucket: bucketName,
      Key: fileName,
    };
    const downloadUrl = await getSignedUrl(s3, new GetObjectCommand(downloadParams), { expiresIn: 3600 });

    console.log('URL de download:', downloadUrl);
    return downloadUrl;
  } catch (error) {
    console.error('Erro ao fazer upload ou gerar URL:', error);
    throw error;
  }
}

module.exports = { uploadImageAndGetDownloadUrl };
