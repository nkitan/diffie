const express = require('express');
const fs = require('fs');
const path = require('path');

const app = express();

// Add endpoint for getting raw file content
app.get('/api/file-content', async (req, res) => {
    try {
        const filePath = req.query.path;
        if (!filePath) {
            return res.status(400).json({ error: 'No file path provided' });
        }

        // Security check to prevent directory traversal
        const normalizedPath = path.normalize(filePath).replace(/^(\.\.(\/|\\|$))+/, '');
        const fullPath = path.resolve(process.cwd(), normalizedPath);

        if (!fs.existsSync(fullPath)) {
            return res.status(404).json({ error: 'File not found' });
        }

        const content = await fs.promises.readFile(fullPath, 'utf8');
        res.send(content);
    } catch (error) {
        console.error('Error reading file:', error);
        res.status(500).json({ error: 'Failed to read file' });
    }
});

module.exports = app;