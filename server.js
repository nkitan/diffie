const express = require('express');
const fs = require('fs');
const path = require('path');
const Diff = require('diff');
const config = require('./config');

const app = express();
const PORT = process.env.PORT || config.PORT;

// Get base path from config file
// This is the directory where all the files to be compared are located
// Users will provide paths relative to this directory
const BASE_PATH = config.BASE_PATH;

// Parse JSON request bodies
app.use(express.json());

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

  // Resolve the path relative to the base path
  const fullPath = path.isAbsolute(normalizedPath) 
    ? normalizedPath 
    : path.join(BASE_PATH, normalizedPath);

  fs.readFile(fullPath, 'utf8', (err, data) => {
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

  // Resolve the paths relative to the base path
  const fullPath1 = path.isAbsolute(normalizedPath1) 
    ? normalizedPath1 
    : path.join(BASE_PATH, normalizedPath1);
  
  const fullPath2 = path.isAbsolute(normalizedPath2) 
    ? normalizedPath2 
    : path.join(BASE_PATH, normalizedPath2);

  try {
    const file1Content = fs.readFileSync(fullPath1, 'utf8');
    const file2Content = fs.readFileSync(fullPath2, 'utf8');
    
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

// API endpoint to get information about the application
app.get('/api/info', (req, res) => {
  res.json({ 
    name: 'ConfDiff',
    description: 'A beautiful file diff viewer',
    version: '1.0.0',
    basePath: BASE_PATH,
    ui: config.UI || { SHOW_APP_INFO: true }
  });
});

// Serve the main HTML file for any other route
app.get('*', (req, res) => {
  res.sendFile(path.join(__dirname, 'public', 'index.html'));
});

app.listen(PORT, () => {
  console.log(`ConfDiff server running on http://localhost:${PORT}`);
  console.log(`Base path for file comparisons: ${BASE_PATH}`);
});