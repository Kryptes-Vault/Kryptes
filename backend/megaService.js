const { initializeMegaVault } = require("./services/megaVaultConnection_impl.js");

/**
 * Delegates to `initializeMegaVault()` in `services/megaVaultConnection_impl.js`
 * (plain Node + tsx; avoids importing `.ts` from `node server.js`).
 * @returns {Promise<import("megajs").Storage>} A logged-in MEGA storage instance.
 */
async function initMega() {
    return initializeMegaVault();
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
