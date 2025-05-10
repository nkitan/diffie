const express = require('express');
const fs = require('fs');
const path = require('path');
const Diff = require('diff');

const app = express();
const PORT = process.env.PORT || 3000;

// Serve static files from the public directory
app.use(express.static('public'));

// API endpoint to get file content
app.get('/api/file', (req, res) => {
  const filePath = req.query.path;
  
  if (!filePath) {
    return res.status(400).json({ error: 'File path is required' });
  }

  // Security check to prevent directory traversal
  const normalizedPath = path.normalize(filePath);
  if (normalizedPath.includes('..')) {
    return res.status(403).json({ error: 'Invalid file path' });
  }

  fs.readFile(filePath, 'utf8', (err, data) => {
    if (err) {
      return res.status(404).json({ error: `Error reading file: ${err.message}` });
    }
    res.json({ content: data });
  });
});

// API endpoint to get diff between two files
app.get('/api/diff', (req, res) => {
  const file1Path = req.query.file1;
  const file2Path = req.query.file2;
  
  if (!file1Path || !file2Path) {
    return res.status(400).json({ error: 'Both file paths are required' });
  }

  // Security check to prevent directory traversal
  const normalizedPath1 = path.normalize(file1Path);
  const normalizedPath2 = path.normalize(file2Path);
  if (normalizedPath1.includes('..') || normalizedPath2.includes('..')) {
    return res.status(403).json({ error: 'Invalid file path' });
  }

  try {
    const file1Content = fs.readFileSync(file1Path, 'utf8');
    const file2Content = fs.readFileSync(file2Path, 'utf8');
    
    // Generate diff
    const diffResult = Diff.createTwoFilesPatch(
      path.basename(file1Path),
      path.basename(file2Path),
      file1Content,
      file2Content
    );
    
    res.json({ diff: diffResult });
  } catch (err) {
    res.status(500).json({ error: `Error generating diff: ${err.message}` });
  }
});

// Serve the main HTML file for any other route
app.get('*', (req, res) => {
  res.sendFile(path.join(__dirname, 'public', 'index.html'));
});

app.listen(PORT, () => {
  console.log(`Server running on http://localhost:${PORT}`);
});