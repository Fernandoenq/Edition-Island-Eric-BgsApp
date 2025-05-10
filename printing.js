const escpos = require('escpos');
const path = require('path'); // Node.js path module

const device =  new escpos.USB('4931', '5');
const printer = new escpos.Printer();

device.open(function(error) {
    if (error) {
        console.error('Error opening the device:', error);
        return;
    }

    const imagePath = path.resolve(__dirname, 'MASK/1696694518596.png');

    escpos.Image.load(imagePath, function(image) {
        if (error) {
            console.error('Error loading the image:', error);
            device.close();
            return;
        }

        printer
            .align('ct')
            .image(image, 's8')
            .then(() => {
                device.close();
                console.log('Printing completed successfully.');
            })
            .catch(err => {
                console.error('Error printing the image:', err);
                device.close();
            });
    });
});
