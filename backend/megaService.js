const { Storage } = require('megajs');

/**
 * Initializes a connection to MEGA.nz using credentials from environment variables.
 * @returns {Promise<Storage>} A logged-in MEGA storage instance.
 */
async function initMega() {
    return new Promise((resolve, reject) => {
        const storage = new Storage({
            email: process.env.MEGA_EMAIL,
            password: process.env.MEGA_PASSWORD,
            userAgent: 'Kryptes-Vault-Service/1.0'
        }, (error) => {
            if (error) {
                console.error('❌ MEGA Login Failed:', error);
                return reject(error);
            }
            
            storage.getAccountInfo((err, info) => {
                if (!err) {
                    const used = (info.spaceUsed / 1024 / 1024 / 1024).toFixed(2);
                    const total = (info.spaceTotal / 1024 / 1024 / 1024).toFixed(2);
                    console.log(`✅ MEGA Connected: ${used}GB / ${total}GB used`);
                }
                resolve(storage);
            });
        });
    });
}

/**
 * Uploads a memory buffer directly to MEGA as a stream.
 * ZERO-DISK POLICY: File never touches the server's hard drive.
 * 
 * @param {Storage} storage - Active MEGA storage instance.
 * @param {Buffer} fileBuffer - The encrypted file data from RAM.
 * @param {string} fileName - Destination filename.
 * @returns {Promise<string>} The generated public download link.
 */
async function uploadToMega(storage, fileBuffer, fileName) {
    return new Promise((resolve, reject) => {
        console.log(`🚀 Streaming ${fileName} (${(fileBuffer.length / 1024).toFixed(2)} KB) to MEGA...`);
        
        const uploadStream = storage.upload({
            name: fileName,
            size: fileBuffer.length
        }, (err, file) => {
            if (err) return reject(err);
            
            // Generate public link for the uploaded file
            file.link((linkErr, link) => {
                if (linkErr) return reject(linkErr);
                console.log(`✨ Upload Complete: ${link}`);
                resolve(link);
            });
        });

        // Write the buffer directly to the MEGA upload stream
        uploadStream.end(fileBuffer);
    });
}

module.exports = { initMega, uploadToMega };
