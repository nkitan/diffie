# Diffie - Beautiful File Diff Viewer

A beautiful web-based file diff viewer that displays the differences between two files. The files reside on the server, and the file paths are provided as URL query parameters. The application uses a developer-configured base path, allowing users to provide paths relative to this base directory.

## Features

- Side-by-side and unified diff views
- Syntax highlighting for differences
- Dark/light theme toggle
- Word wrap toggle
- Responsive design for all screen sizes
- Diff statistics (additions, deletions, changes)
- URL parameter support for direct linking
- Developer-configured base path for relative file paths
- Local file comparison (client-side only, files never sent to server)

## Installation

1. Clone this repository
2. Install dependencies:
   ```
   npm install
   ```
3. Start the server:
   ```
   npm start
   ```
4. Open your browser and navigate to `http://localhost:3000`

## Usage

### Developer Configuration

As a developer, you can configure the application settings in the `config.js` file:

```javascript
// config.js
module.exports = {
  // Base path where all the files to be compared are located
  BASE_PATH: '/var/local/diffie',
  
  // Port for the server to listen on
  PORT: 3000
};
```

### Via Web Interface

#### Server Files
1. Select the "Server Files" tab
2. Enter the paths to the two files you want to compare (relative to the configured base path)
3. Click "Compare Server Files"
4. View the differences in either side-by-side or unified mode

#### Local Files (Client-side only)
1. Select the "Local Files" tab
2. Upload two files from your local computer
3. Click "Compare Local Files"
4. View the differences in either side-by-side or unified mode
   
Note: When comparing local files, the files are processed entirely in your browser and are never sent to the server.

### Via URL Parameters

#### Single File Pair

You can directly link to a comparison of a single file pair by using URL parameters:

```
http://localhost:3000/?file1=relative/path/to/first/file.txt&file2=relative/path/to/second/file.txt
```

#### Multiple File Pairs

You can also compare multiple file pairs at once using the `pairs` parameter:

```
http://localhost:3000/?pairs=file1.txt,file2.txt&pairs=file3.txt,file4.txt&pairs=file5.txt,file6.txt
```

Each `pairs` parameter contains two file paths separated by a comma. You can add as many `pairs` parameters as needed.

All file paths are relative to the configured base path on the server.

## Sample Files

The repository includes sample files for testing:

- `sample1.txt`
- `sample2.txt`
- `lorem/ipsum.txt`

### Single Pair Example

You can compare a single pair by entering their paths in the web interface or using the URL:

```
http://localhost:3000/?file1=sample1.txt&file2=sample2.txt
```

### Multiple Pairs Example

You can compare multiple pairs at once using the URL:

```
http://localhost:3000/?pairs=sample1.txt,sample2.txt&pairs=sample2.txt,lorem/ipsum.txt
```

For more examples, see the `test_files/multi-diff-examples.html` file.

### Environment Variables

You can override the port setting by using the `PORT` environment variable before starting the server:

```
# On Windows
set PORT=8080
npm start

# On Linux/Mac
export PORT=8080
npm start
```

This allows you to change the port without modifying the configuration file.

## Technologies Used

- Node.js with Express for the server
- diff library for generating file differences
- HTML, CSS, and JavaScript for the frontend
- Font Awesome for icons

## License

MIT