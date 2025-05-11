/**
 * Configuration file for Diffie application
 */
module.exports = {
  // Application name - used in the browser title and UI
  APP_NAME: 'Diffie',
  
  // Application description - used in the UI and footer
  APP_DESCRIPTION: 'A beautiful file diff viewer',
  
  // Base path where all the files to be compared are located
  // Users will provide paths relative to this directory
  BASE_PATH: '/mnt/d/Work/diffie/test',
  
  // Port for the server to listen on
  // Can be overridden with PORT environment variable
  PORT: 3000,
  
  // UI Configuration options
  UI: {
    // Whether to show the app info section at the top of the page
    SHOW_APP_INFO: false,
    
    // Whether word wrap should be enabled by default
    WORD_WRAP_DEFAULT: true,
    
    // Whether to show the application title in the navbar
    SHOW_NAVBAR_TITLE: false,
    
    // Tab configuration
    TABS: {
      // Which tabs to show: "both", "server", or "local"
      VISIBLE: "both",
      
      // Whether to allow users to switch between tabs
      // Only applicable when VISIBLE is set to "both"
      ALLOW_SWITCHING: true
    },
    
    // File URL configuration
    FILE_URLS: {
      // Whether to enable clickable filenames that open in a new tab
      ENABLED: true,
      
      // URL prefix to prepend to the file path
      // For example: "https://github.com/username/repo/blob/main/"
      // The file path will be appended to this prefix
      PREFIX: "https://github.com/username/repo/blob/main/",
      
      // Whether to use absolute paths (true) or relative paths (false) when creating URLs
      USE_ABSOLUTE_PATHS: false
    }
  }
}; 