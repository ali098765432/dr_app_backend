// const multer = require('multer');
// const Jimp = require('jimp');

// var express = require('express');
// var router = express.Router();

// // Set up multer for handling file uploads
// const storage = multer.memoryStorage();
// const upload = multer({ storage: storage });


// router.post('/createLogo', upload.single('image'), async (req, res) => {
//   try {
//     // Get user-selected colors from the request
//     const { color1, color2 } = req.body;
// console.log(color1,color2);
//     // Load the uploaded image using Jimp
//     const image = await Jimp.read(req.file.buffer);
//     console.log(image);

//     // Apply colors or other modifications to the image
//     image.color([
//       { apply: 'mix', params: [`#${color1}`, 100] },
//       { apply: 'mix', params: [`#${color2}`, 100] },
//     ]);

//     // Send the modified image as a response
//     res.set('Content-Type', 'image/png');
//     res.send(await image.getBufferAsync(Jimp.MIME_PNG));
//   } catch (error) {
//     res.status(500).send('Error processing the image.');
//   }
// });

// module.exports = router;
const { createCanvas } = require('canvas'); // Import canvas library
const express = require('express');
const router = express.Router();

router.post('/createLogo', async (req, res) => {
  try {
    // Get user-selected symbols and colors from the request body
    const { symbol1, symbol2, color1, color2 } = req.body;
    console.log(symbol1, symbol2, color1, color2);

    // Create a canvas to draw the logo
    const canvasWidth = 200; // Adjust the canvas dimensions as needed
    const canvasHeight = 100;
    const canvas = createCanvas(canvasWidth, canvasHeight);
    const ctx = canvas.getContext('2d');

    // Set the background colors
    ctx.fillStyle = color1;
    ctx.fillRect(0, 0, canvasWidth / 2, canvasHeight);

    ctx.fillStyle = color2;
    ctx.fillRect(canvasWidth / 2, 0, canvasWidth / 2, canvasHeight);

    // Set font and symbol colors
    const fontSize = 40;
    ctx.font = `${fontSize}px Arial`;
    ctx.fillStyle = 'white'; // Color of the symbols

    // Calculate symbol positions based on canvas dimensions
    const symbol1X = canvasWidth / 4 - fontSize / 2;
    const symbol1Y = canvasHeight / 2 + fontSize / 2;
    const symbol2X = (3 * canvasWidth) / 4 - fontSize / 2;
    const symbol2Y = canvasHeight / 2 + fontSize / 2;

    // Draw symbols on the canvas
    ctx.fillText(symbol1, symbol1X, symbol1Y);
    ctx.fillText(symbol2, symbol2X, symbol2Y);

    // Convert the canvas to a buffer
    const logoBuffer = canvas.toBuffer('image/png');

    // Send the generated logo as a response
    res.set('Content-Type', 'image/png');
    res.send(logoBuffer);
  } catch (error) {
    res.status(500).send('Error generating the logo.');
  }
});

module.exports = router;
