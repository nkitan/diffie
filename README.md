# ConfDiff - Beautiful File Diff Viewer

A beautiful web-based file diff viewer that displays the differences between two files. The files reside on the server, and the file paths are provided as URL query parameters.

## Features

- Side-by-side and unified diff views
- Syntax highlighting for differences
- Dark/light theme toggle
- Word wrap toggle
- Responsive design for all screen sizes
- Diff statistics (additions, deletions, changes)
- URL parameter support for direct linking

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

### Via Web Interface

1. Enter the paths to the two files you want to compare
2. Click "Compare Files"
3. View the differences in either side-by-side or unified mode

### Via URL Parameters

You can directly link to a comparison by using URL parameters:

```
http://localhost:3000/?file1=/path/to/first/file.txt&file2=/path/to/second/file.txt
```

## Sample Files

The repository includes two sample files for testing:

- `sample1.txt`
- `sample2.txt`

You can compare these by entering their paths in the web interface or using the URL:

```
http://localhost:3000/?file1=sample1.txt&file2=sample2.txt
```

## Technologies Used

- Node.js with Express for the server
- diff library for generating file differences
- HTML, CSS, and JavaScript for the frontend
- Font Awesome for icons

## License

MIT