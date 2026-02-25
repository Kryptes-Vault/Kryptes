const express = require('express');
const cors = require('cors');
const dotenv = require('dotenv');
const multer = require('multer');
const { initMega, uploadToMega } = require('./megaService');

// Load environment variables
dotenv.config();

const app = express();
const PORT = process.env.PORT || 5000;

// Multer Configuration: ZERO-DISK POLICY
// Using memoryStorage ensures the file buffer stays in RAM and is NOT written to /tmp
const storage = multer.memoryStorage();
const upload = multer({
    storage: storage,
    limits: { fileSize: 50 * 1024 * 1024 } // 50MB limit
});

app.use(cors());
app.use(express.json());

let megaStorage;

/**
 * Startup Logic: Connect to MEGA before accepting requests.
 */
async function startServer() {
    try {
        console.log('🔄 Initializing Kryptes Backend...');
        megaStorage = await initMega();
        
        app.listen(PORT, () => {
            console.log(`📡 Kryptes Zero-Knowledge Backend listening on port ${PORT}`);
        });
    } catch (err) {
        console.error('❌ CRITICAL: Server failed to connect to MEGA. Terminating.');
        process.exit(1);
    }
}

/**
 * Primary Upload Route:
 * Receives an encrypted file buffer and streams it directly to MEGA storage.
 */
app.post('/api/vault/upload', upload.single('encryptedDocument'), async (req, res) => {
    try {
        if (!req.file) {
            return res.status(400).json({ status: 'error', message: 'No file provided.' });
        }

        const timestamp = new Date().toISOString().replace(/[:.]/g, '-');
        const uniqueFileName = `${timestamp}_${req.file.originalname}`;

        // Pass the buffer directly to the service layer (RAM-to-Stream)
        const downloadLink = await uploadToMega(megaStorage, req.file.buffer, uniqueFileName);

        return res.status(200).json({
            status: 'success',
            message: 'ZERO-KNOWLEDGE SYNC COMPLETED',
            fileName: uniqueFileName,
            link: downloadLink
        });

    } catch (error) {
        console.error('⚠️ Upload Error:', error.message);
        return res.status(500).json({
            status: 'error',
            message: 'SYNC FAILED: Storage connection interrupted.',
            error: error.message
        });
    }
});

// Default Health Route
app.get('/', (req, res) => {
    res.json({ service: 'Kryptes Vault Sync', status: 'Active', diskPolicy: 'Zero-Disk Isolation' });
});

startServer();
