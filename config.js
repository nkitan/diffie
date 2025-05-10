/**
 * Configuration file for ConfDiff application
 */
module.exports = {
  // Base path where all the files to be compared are located
  // Users will provide paths relative to this directory
  BASE_PATH: '/mnt/d/Work/confdiff/test',
  
  // Port for the server to listen on
  // Can be overridden with PORT environment variable
  PORT: 3000,
  
  // UI Configuration options
  UI: {
    // Whether to show the app info section at the top of the page
    SHOW_APP_INFO: false,
    
    // Whether word wrap should be enabled by default
    WORD_WRAP_DEFAULT: true,
    
    // Whether to show the "ConfDiff" title in the navbar
    SHOW_NAVBAR_TITLE: false,
    
    // Tab configuration
    TABS: {
      // Which tabs to show: "both", "server", or "local"
      VISIBLE: "server",
      
      // Whether to allow users to switch between tabs
      // Only applicable when VISIBLE is set to "both"
      ALLOW_SWITCHING: true
    }
  }
}; 