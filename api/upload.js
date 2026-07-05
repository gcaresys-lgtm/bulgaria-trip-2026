const { put } = require('@vercel/blob');
const { v4: uuidv4 } = require('uuid');

module.exports = async (req, res) => {
    // CORS headers
    res.setHeader('Access-Control-Allow-Origin', '*');
    res.setHeader('Access-Control-Allow-Methods', 'POST, OPTIONS');
    res.setHeader('Access-Control-Allow-Headers', 'Content-Type');

    if (req.method === 'OPTIONS') {
        return res.status(200).end();
    }

    if (req.method !== 'POST') {
        return res.status(405).json({ error: 'Method not allowed' });
    }

    try {
        const { image, eventId, fileName } = req.body;

        if (!image || !eventId) {
            return res.status(400).json({ error: 'Missing required fields' });
        }

        // Generate unique filename
        const id = uuidv4();
        const ext = fileName?.split('.').pop() || 'jpg';
        const filename = `${eventId}/${id}.${ext}`;

        // Convert base64 to buffer
        const base64Data = image.replace(/^data:image\/\w+;base64,/, '');
        const buffer = Buffer.from(base64Data, 'base64');

        // Upload to Vercel Blob
        const blob = await put(filename, buffer, {
            access: 'public',
            contentType: 'image/jpeg',
        });

        return res.status(200).json({
            success: true,
            url: blob.url,
            filename: filename,
            id: id
        });

    } catch (error) {
        console.error('Upload error:', error);
        return res.status(500).json({ error: 'Upload failed' });
    }
};