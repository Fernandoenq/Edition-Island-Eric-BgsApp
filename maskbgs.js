const fs = require("fs");
const Jimp = require('jimp');
const sharp = require('sharp');
// const Drive = require("./utils/drive");
const funcoes = require("./utils/funcs");
// var drive = new Drive();:
// var funcs = new funcoes();

async function createMaskImage(img1, img2, reference) {
    const promise = new Promise(async (resolve, reject) => {
        try {
            return await imageOverlay(img1, img2, reference);
        } catch (error) {
            return reject(null);
        }
    })
    return promise;
}

const productWidth = 1280;
const productHeight = 1280;

async function compositeImages(imagePath) {
    try {
        const imageBuffer = fs.readFileSync(imagePath);

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
        console.error(error);
    }
}

async function imageOverlay(originalImage, aiImage, reference) { // Function name is same as of file
    const promise = new Promise(async (resolve, reject) => {
        // Lendo a imagem de fundo, na qual a imagem principal ficara por cima
        const original_mask = await Jimp.read('./maskbgs.jpg');

        // let ConvertedImage = await compositeImages(originalImage);

        // Lendo a imagem principal
        /*
        let original_image = await Jimp.read(originalImage);
        original_image = original_image.resize(970, 970); // Resizing watermark image
        */
        // Lendo a imagem artifical
        let artificial_image = await Jimp.read(aiImage);
        artificial_image = original_image.resize(970, 970); // Resizing watermark image
        // watermark = watermark;

        /*
        original_mask.composite(original_image, 96, 0, {
            mode: Jimp.BLEND_SOURCE_OVER,
            opacityDest: 1,
            // opacitySource: 0.5
        });
        */

        original_mask.composite(artificial_image, 96, 400, {
            mode: Jimp.BLEND_SOURCE_OVER,
            opacityDest: 1,
            // opacitySource: 0.5
        });

        await original_mask.writeAsync(`./${reference}.png`);

        setTimeout(async () => {

            // sendMessage('Éric', '18997090573', reference)
        }, 100);
        console.log(`Mascara criadaAA (${reference})`);
        return resolve(true);
    })
    return promise;
}

module.exports = { createMaskImage };

(() => {
    createMaskImage('./IA/1697123139447_original.jpg', './IA/1697123151348_artificial.png', Date.now());
})();