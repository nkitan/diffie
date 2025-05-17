# Diffie - Beautiful File Diff Viewer

A beautiful web-based file diff viewer for comparing files and browsing file contents with a modern, themeable interface. Supports side-by-side and unified diffs, multi-file comparison, and a single file viewer with an IDE-like experience.

## Features

- Side-by-side and unified diff views
- Multi-file diff: compare multiple file pairs at once
- Single File Viewer: browse and read any file with line numbers and IDE-like UI
- Syntax highlighting for differences
- Resizable diff panes (per diff pair)
- Custom, modern scrollbars (light/dark)
- Dark/light theme toggle and theme selector (including Editor, GitHub, VS Code, Material, Obsidian, Cloudflare, GitLab themes)
- Editor theme: professional, text editor-inspired look (light/dark)
- Word wrap toggle
- Responsive design for all screen sizes
- Diff statistics (additions, deletions, changes)
- URL parameter support for direct linking (single or multiple pairs)
- Developer-configured base path for relative file paths
- Local file comparison (client-side only, files never sent to server)
- Custom API endpoint for secure file viewing

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

#### Multi-File Diff
1. Select the "Multiple Files" tab
2. Add as many file pairs as you want to compare
3. Click "Compare All Files"
4. View all diffs in a scrollable, resizable list with navigation and summary statistics

#### Single File Viewer
1. Use the "View File" page to browse and read a single file
2. The viewer supports all themes, line numbers, and a modern IDE-like layout
3. Access via the UI or directly by URL (see below)

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

#### Single File Viewer (Direct Link)

To view a single file in the IDE-like viewer, use:

```
http://localhost:3000/view-file.html?file=relative/path/to/file.txt
```

This page supports all themes, line numbers, and a modern code editor look.

## Modern UI/UX

- **Resizable Diffs:** Each diff pair is vertically resizable for easier comparison.
- **Custom Scrollbars:** All scrollable areas use modern, theme-aware scrollbars.
- **Theme Selector:** Choose from multiple light/dark themes, including a professional Editor theme.
- **IDE-like File Viewer:** The single file view page displays files with line numbers and a code editor layout.
- **Alignment in Diffs:** Side-by-side diffs keep changes aligned with blank lines for easier visual comparison.

## Sample Files

The repository includes sample files for testing:

- `sample1.txt`
- `sample2.txt`
- `lorem/ipsum.txt`
- `code/code1.js`, `code/code2.js`
- `text/text1.txt`, `text/text2.txt`

### Single Pair Example

You can compare a single pair by entering their paths in the web interface or using the URL:

```
http://localhost:3000/?file1=sample1.txt&file2=sample2.txt
```

### Single File Viewer Example

To view a file:

```
http://localhost:3000/view-file.html?file=sample1.txt
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