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
    // Check if files exist before trying to read them
    if (!fs.existsSync(fullPath1)) {
      return res.status(404).json({ error: `File not found: ${file1Path}` });
    }
    
    if (!fs.existsSync(fullPath2)) {
      return res.status(404).json({ error: `File not found: ${file2Path}` });
    }
    
    const file1Content = fs.readFileSync(fullPath1, 'utf8');
    const file2Content = fs.readFileSync(fullPath2, 'utf8');
    
    // Generate structured diff
    const structuredPatch = Diff.structuredPatch(
      "", // Use empty string instead of path.basename(file1Path)
      "", // Use empty string instead of path.basename(file2Path)
      file1Content,
      file2Content
    );
    
    // Format the diff manually without filename headers
    let diffResult = '';
    structuredPatch.hunks.forEach(hunk => {
      // Add hunk header
      diffResult += `@@ -${hunk.oldStart},${hunk.oldLines} +${hunk.newStart},${hunk.newLines} @@\n`;
      // Add hunk lines
      diffResult += hunk.lines.join('\n') + '\n';
    });
    
    res.json({ 
      diff: diffResult,
      file1Content,
      file2Content
    });
  } catch (err) {
    // Create a user-friendly error message
    let errorMessage = 'Error generating diff';
    
    if (err.message.includes('no such file or directory') || err.message.includes('File not found')) {
      errorMessage = `One or more files could not be found. Please check that the file paths are correct.`;
    } else if (err.message.includes('permission denied')) {
      errorMessage = `Permission denied when accessing files. Please check file permissions.`;
    } else if (err.message.includes('is a directory')) {
      errorMessage = `One of the paths points to a directory, not a file.`;
    }
    
    const statusCode = err.message.includes('not found') ? 404 : 500;
    res.status(statusCode).json({ error: errorMessage });
  }
});

// API endpoint to get diffs for multiple file pairs
app.post('/api/multi-diff', (req, res) => {
  const filePairs = req.body.filePairs;
  
  if (!filePairs || !Array.isArray(filePairs) || filePairs.length === 0) {
    return res.status(400).json({ error: 'File pairs array is required' });
  }

  console.log('Received file pairs:', filePairs);

  const results = [];
  const errors = [];

  // Process each file pair
  const processPromises = filePairs.map((pair) => {
    const { file1, file2, index } = pair;
    const pairIndex = typeof index === 'number' ? index : results.length;
    
    if (!file1 || !file2) {
      errors.push({ index: pairIndex, error: 'Both file paths are required for each pair' });
      return Promise.resolve();
    }

    // Security check to prevent directory traversal
    const normalizedPath1 = path.normalize(file1);
    const normalizedPath2 = path.normalize(file2);
    if (normalizedPath1.includes('..') || normalizedPath2.includes('..')) {
      errors.push({ index: pairIndex, error: 'Invalid file path' });
      return Promise.resolve();
    }

    // Resolve the paths relative to the base path
    const fullPath1 = path.isAbsolute(normalizedPath1) 
      ? normalizedPath1 
      : path.join(BASE_PATH, normalizedPath1);
    
    const fullPath2 = path.isAbsolute(normalizedPath2) 
      ? normalizedPath2 
      : path.join(BASE_PATH, normalizedPath2);

    console.log(`Processing pair ${pairIndex}:`, { file1, file2, fullPath1, fullPath2 });

    return new Promise((resolve) => {
      try {
        // Check if files exist before trying to read them
        if (!fs.existsSync(fullPath1)) {
          throw new Error(`File not found: ${file1}`);
        }
        
        if (!fs.existsSync(fullPath2)) {
          throw new Error(`File not found: ${file2}`);
        }
        
        const file1Content = fs.readFileSync(fullPath1, 'utf8');
        const file2Content = fs.readFileSync(fullPath2, 'utf8');
        
        // Generate structured diff
        const structuredPatch = Diff.structuredPatch(
          "", // Use empty string instead of path.basename(file1)
          "", // Use empty string instead of path.basename(file2)
          file1Content,
          file2Content
        );
        
        // Format the diff manually without filename headers
        let diffResult = '';
        structuredPatch.hunks.forEach(hunk => {
          // Add hunk header
          diffResult += `@@ -${hunk.oldStart},${hunk.oldLines} +${hunk.newStart},${hunk.newLines} @@\n`;
          // Add hunk lines
          diffResult += hunk.lines.join('\n') + '\n';
        });
        
        const identical = file1Content === file2Content;
        console.log(`Pair ${pairIndex} processed:`, { identical });
        
        results.push({
          index: pairIndex,
          file1,
          file2,
          diff: diffResult,
          identical
        });
        resolve();
      } catch (err) {
        console.error(`Error processing pair ${pairIndex}:`, err.message);
        
        // Create a user-friendly error message
        let errorMessage = 'Error generating diff';
        
        if (err.message.includes('no such file or directory') || err.message.includes('File not found')) {
          errorMessage = `One or more files could not be found. Please check that the file paths are correct.`;
        } else if (err.message.includes('permission denied')) {
          errorMessage = `Permission denied when accessing files. Please check file permissions.`;
        } else if (err.message.includes('is a directory')) {
          errorMessage = `One of the paths points to a directory, not a file.`;
        }
        
        errors.push({ index: pairIndex, error: errorMessage });
        resolve();
      }
    });
  });

  // Wait for all file pairs to be processed
  Promise.all(processPromises)
    .then(() => {
      console.log('All pairs processed. Results count:', results.length);
      res.json({ 
        results: results.sort((a, b) => a.index - b.index),
        errors: errors.sort((a, b) => a.index - b.index)
      });
    })
    .catch(err => {
      console.error('Error processing file pairs:', err.message);
      res.status(500).json({ error: `Error processing file pairs: ${err.message}` });
    });
});

// API endpoint to get information about the application
app.get('/api/info', (req, res) => {
  res.json({ 
    name: config.APP_NAME || 'Diffie',
    description: config.APP_DESCRIPTION || 'A beautiful file diff viewer',
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
  console.log(`${config.APP_NAME || 'Diffie'} server running on http://localhost:${PORT}`);
  console.log(`Base path for file comparisons: ${BASE_PATH}`);
});