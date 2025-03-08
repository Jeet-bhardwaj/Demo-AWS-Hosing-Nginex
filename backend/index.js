const express = require('express');
const cloudinary = require('cloudinary').v2;
const cors = require('cors'); // Add CORS to prevent frontend issues
const app = express();
const port = process.env.PORT || 5000;
const multer = require('multer');
const upload = multer({ storage: multer.memoryStorage() });
const path = require('path');

const buildPath = path.join(__dirname, "../dist");

// Serve static files from the React app
app.use(express.static(buildPath));

// Middleware
app.use(cors()); // Allow frontend to access API

// Configure Cloudinary
cloudinary.config({
  cloud_name: process.env.CLOUDINARY_CLOUD_NAME || 'dtnakrubh',
  api_key: process.env.CLOUDINARY_API_KEY || '553596293654989',
  api_secret: process.env.CLOUDINARY_API_SECRET || '-T0AdHZ3guFzYDfcJoZCcNfoyB4'
});

// Endpoint to fetch images from the 'fitness-platinum' folder in Cloudinary
app.get('/api/images', async (req, res) => {
  try {
    const result = await cloudinary.api.resources({
      type: 'upload',
      prefix: 'fitness-platinum/', // Fetch images only from this folder
      max_results: 30
    });

    // Extract only required details (URLs)
    const images = result.resources.map((img) => ({
      url: img.secure_url,
      public_id: img.public_id
    }));

    res.json(images);
  } catch (error) {
    console.error('Error fetching images from Cloudinary:', error);
    res.status(500).send('Error fetching images');
  }
});

// Upload endpoint
app.post('/api/upload', upload.single('image'), async (req, res) => {
  try {
    if (!req.file) {
      return res.status(400).send('No file uploaded');
    }

    // Convert buffer to base64
    const base64Image = Buffer.from(req.file.buffer).toString('base64');
    const dataURI = `data:${req.file.mimetype};base64,${base64Image}`;

    // Upload to Cloudinary
    const result = await cloudinary.uploader.upload(dataURI, {
      folder: 'fitness-platinum',
      public_id: req.body.name.replace(/\s+/g, '_')
    });

    res.json({
      url: result.secure_url,
      public_id: result.public_id
    });
  } catch (error) {
    console.error('Error uploading to Cloudinary:', error);
    res.status(500).send('Error uploading image');
  }
});

// Delete endpoint
app.delete('/api/delete', async (req, res) => {
  try {
    const { public_id } = req.body;
    await cloudinary.uploader.destroy(public_id);
    res.json({ message: 'Image deleted successfully' });
  } catch (error) {
    console.error('Error deleting from Cloudinary:', error);
    res.status(500).send('Error deleting image');
  }
});

// Handles any requests that don't match the ones above
app.get('*', (req, res) => {
  res.sendFile(path.join(__dirname, '../dist/index.html'));
});

app.listen(port, () => {
  console.log(`Server is running on http://localhost:${port}`);
});
