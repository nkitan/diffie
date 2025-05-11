document.addEventListener('DOMContentLoaded', () => {
  // State variables
  let originalFile1Content = '';
  let originalFile2Content = '';
  let showingCompleteFiles = false;
  let fileUrlConfig = {
    enabled: false,
    prefix: '',
    useAbsolutePaths: false
  };
  let originalFile1Path = '';
  let originalFile2Path = '';
  
  // DOM Elements
  const file1PathInput = document.getElementById('file1-path');
  const file2PathInput = document.getElementById('file2-path');
  const compareServerBtn = document.getElementById('compare-server-btn');
  const compareLocalBtn = document.getElementById('compare-local-btn');
  const file1Upload = document.getElementById('file1-upload');
  const file2Upload = document.getElementById('file2-upload');
  const file1UploadName = document.getElementById('file1-upload-name');
  const file2UploadName = document.getElementById('file2-upload-name');
  const tabBtns = document.querySelectorAll('.tab-btn');
  const tabContents = document.querySelectorAll('.tab-content');
  const file1NameEl = document.getElementById('file1-name');
  const file2NameEl = document.getElementById('file2-name');
  const diffContent = document.getElementById('diff-content');
  const sideBySideBtn = document.getElementById('side-by-side-btn');
  const unifiedBtn = document.getElementById('unified-btn');
  const wordWrapBtn = document.getElementById('word-wrap-btn');
  const lineNumbersBtn = document.getElementById('line-numbers-btn');
  const showCompleteBtn = document.getElementById('show-complete-btn');
  const shareBtn = document.getElementById('share-btn');
  const loadingIndicator = document.querySelector('.loading-indicator');
  const emptyState = document.querySelector('.empty-state');
  const noChangesState = document.querySelector('.no-changes-state');
  const diffView = document.querySelector('.diff-view');
  const unifiedView = document.querySelector('.unified-view');
  const unifiedDiff = document.getElementById('unified-diff');
  const file1Content = document.querySelector('.file1-content');
  const file2Content = document.querySelector('.file2-content');
  const additionsCount = document.getElementById('additions-count');
  const deletionsCount = document.getElementById('deletions-count');
  const changesCount = document.getElementById('changes-count');
  const themeToggle = document.getElementById('theme-toggle-checkbox');
  const errorToast = document.getElementById('error-toast');
  const errorMessage = document.getElementById('error-message');
  const toastClose = document.querySelector('.toast-close');
  const appInfo = document.querySelector('.app-info');
  const file1FilenameEl = document.querySelector('.file1-filename');
  const file2FilenameEl = document.querySelector('.file2-filename');
  const filenameBar = document.querySelector('.filename-bar');
  
  // Fetch app configuration
  fetchAppConfig();
  
  // Check URL parameters on load
  checkUrlParams();

  // Event Listeners
  compareServerBtn.addEventListener('click', compareServerFiles);
  compareLocalBtn.addEventListener('click', compareLocalFiles);
  file1Upload.addEventListener('change', updateFileName.bind(null, file1Upload, file1UploadName));
  file2Upload.addEventListener('change', updateFileName.bind(null, file2Upload, file2UploadName));
  tabBtns.forEach(btn => {
    btn.addEventListener('click', () => switchTab(btn.dataset.tab));
  });
  sideBySideBtn.addEventListener('click', () => setViewMode('side-by-side'));
  unifiedBtn.addEventListener('click', () => setViewMode('unified'));
  wordWrapBtn.addEventListener('click', toggleWordWrap);
  lineNumbersBtn.addEventListener('click', toggleLineNumbers);
  showCompleteBtn.addEventListener('click', toggleCompleteFiles);
  shareBtn.addEventListener('click', shareDiff);
  themeToggle.addEventListener('change', toggleTheme);
  toastClose.addEventListener('click', () => errorToast.classList.add('hidden'));
  document.querySelector('#success-toast .toast-close').addEventListener('click', () => {
    document.getElementById('success-toast').classList.add('hidden');
  });
  
  // Add event listeners for the filename bar toggle buttons
  if (document.querySelector('.toggle-filename-btn')) {
    document.querySelector('.toggle-filename-btn').addEventListener('click', toggleFilenameBar);
  }
  
  if (document.querySelector('.persistent-toggle-btn')) {
    document.querySelector('.persistent-toggle-btn').addEventListener('click', toggleFilenameBar);
  }

  // Check for saved theme preference
  if (localStorage.getItem('theme') === 'dark' || 
      (window.matchMedia('(prefers-color-scheme: dark)').matches && !localStorage.getItem('theme'))) {
    document.body.classList.add('dark-theme');
    themeToggle.checked = true;
  }
  
  // Check for saved filename bar preference
  if (localStorage.getItem('filenameBarCollapsed') === 'true' && filenameBar) {
    filenameBar.classList.add('collapsed');
    const toggleBtn = document.querySelector('.toggle-filename-btn');
    if (toggleBtn) {
      const icon = toggleBtn.querySelector('i');
      icon.className = 'fas fa-chevron-down';
      toggleBtn.title = 'Show filename bar';
    }
    
    // Make sure the persistent toggle button is visible
    const persistentBtn = document.querySelector('.persistent-toggle-btn');
    if (persistentBtn) {
      persistentBtn.style.opacity = '1';
      persistentBtn.style.transform = 'translateY(0)';
    }
  }

  // Functions

  function checkUrlParams() {
    // We'll check the app configuration first to see if we should process URL params
    fetch('/api/info')
      .then(response => response.json())
      .then(data => {
        // Only process URL params if the relevant tab is visible
        if (data.ui && data.ui.TABS) {
          const tabsVisible = data.ui.TABS.VISIBLE;
          
          // If only local tab is visible, don't process server file params
          if (tabsVisible === 'local') {
            return;
          }
          
          const urlParams = new URLSearchParams(window.location.search);
          const file1 = urlParams.get('file1');
          const file2 = urlParams.get('file2');
          const mode = urlParams.get('mode') || 'server';
          
          if (file1 && file2) {
            if (mode === 'server') {
              // Only switch tab if tab switching is allowed or both tabs are visible
              if (tabsVisible === 'both' && data.ui.TABS.ALLOW_SWITCHING !== false) {
                switchTab('server-files');
              }
              
              file1PathInput.value = file1;
              file2PathInput.value = file2;
              compareServerFiles();
            }
          }
        } else {
          // Default behavior if no tab configuration
          const urlParams = new URLSearchParams(window.location.search);
          const file1 = urlParams.get('file1');
          const file2 = urlParams.get('file2');
          const mode = urlParams.get('mode') || 'server';
          
          if (file1 && file2) {
            if (mode === 'server') {
              switchTab('server-files');
              file1PathInput.value = file1;
              file2PathInput.value = file2;
              compareServerFiles();
            }
          }
        }
      })
      .catch(error => {
        console.error('Error fetching app configuration:', error);
        
        // Fallback to default behavior
        const urlParams = new URLSearchParams(window.location.search);
        const file1 = urlParams.get('file1');
        const file2 = urlParams.get('file2');
        const mode = urlParams.get('mode') || 'server';
        
        if (file1 && file2) {
          if (mode === 'server') {
            switchTab('server-files');
            file1PathInput.value = file1;
            file2PathInput.value = file2;
            compareServerFiles();
          }
        }
      });
  }

  function switchTab(tabId) {
    // Update tab buttons
    tabBtns.forEach(btn => {
      if (btn.dataset.tab === tabId) {
        btn.classList.add('active');
      } else {
        btn.classList.remove('active');
      }
    });
    
    // Update tab content
    tabContents.forEach(content => {
      if (content.id === `${tabId}-tab`) {
        content.classList.remove('hidden');
      } else {
        content.classList.add('hidden');
      }
    });
  }
  
  function updateFileName(fileInput, fileNameElement) {
    if (fileInput.files.length > 0) {
      fileNameElement.textContent = fileInput.files[0].name;
    } else {
      fileNameElement.textContent = 'Choose a file';
    }
  }
  
  function compareServerFiles() {
    const file1Path = file1PathInput.value.trim();
    const file2Path = file2PathInput.value.trim();
    
    if (!file1Path || !file2Path) {
      showError('Please enter both file paths');
      return;
    }
    
    // Store original file paths for URL generation
    originalFile1Path = file1Path;
    originalFile2Path = file2Path;

    // Update URL with query parameters
    const url = new URL(window.location);
    url.searchParams.set('file1', file1Path);
    url.searchParams.set('file2', file2Path);
    url.searchParams.set('mode', 'server');
    window.history.pushState({}, '', url);

    // Update file names in the header
    file1NameEl.textContent = getFileName(file1Path);
    file2NameEl.textContent = getFileName(file2Path);
    
    // Update filenames in the filename bar
    file1FilenameEl.textContent = getFileName(file1Path);
    file2FilenameEl.textContent = getFileName(file2Path);

    // Show loading indicator
    loadingIndicator.classList.remove('hidden');
    emptyState.classList.add('hidden');
    diffView.classList.add('hidden');
    unifiedView.classList.add('hidden');
    noChangesState.classList.add('hidden');

    // Reset complete files toggle
    showingCompleteFiles = false;
    showCompleteBtn.classList.remove('active');
    showCompleteBtn.title = "Show complete files";

    // First check if the files are identical by fetching their contents
    Promise.all([
      fetch(`/api/file?path=${encodeURIComponent(file1Path)}`).then(res => res.ok ? res.json() : null),
      fetch(`/api/file?path=${encodeURIComponent(file2Path)}`).then(res => res.ok ? res.json() : null)
    ])
      .then(([file1Data, file2Data]) => {
        // If we successfully got both file contents
        if (file1Data && file2Data && file1Data.content && file2Data.content) {
          // Store original file contents
          originalFile1Content = file1Data.content;
          originalFile2Content = file2Data.content;
          
          // Check if files are identical
          if (file1Data.content === file2Data.content) {
            // Files are identical, show the no-changes message
            loadingIndicator.classList.add('hidden');
            noChangesState.classList.remove('hidden');
            diffView.classList.add('hidden');
            unifiedView.classList.add('hidden');
            
            // Update stats
            additionsCount.textContent = 0;
            deletionsCount.textContent = 0;
            changesCount.textContent = 0;
            
            return Promise.reject({ skipErrorDisplay: true });
          }
        }
        
        // Files are different or we couldn't compare them directly, proceed with diff
        return fetch(`/api/diff?file1=${encodeURIComponent(file1Path)}&file2=${encodeURIComponent(file2Path)}`);
      })
      .then(response => {
        if (!response.ok) {
          return response.json().then(data => {
            throw new Error(data.error || 'Failed to generate diff');
          });
        }
        return response.json();
      })
      .then(data => {
        // If we didn't already store the file contents, do it now
        if (!originalFile1Content && !originalFile2Content && data.file1Content && data.file2Content) {
          originalFile1Content = data.file1Content;
          originalFile2Content = data.file2Content;
        }
        
        renderDiff(data.diff);
        loadingIndicator.classList.add('hidden');
      })
      .catch(error => {
        loadingIndicator.classList.add('hidden');
        
        // Only show error if it's not our special case for identical files
        if (!error.skipErrorDisplay) {
          emptyState.classList.remove('hidden');
          noChangesState.classList.add('hidden');
          diffView.classList.add('hidden');
          unifiedView.classList.add('hidden');
          showError(error.message);
        }
      });
  }
  
  function compareLocalFiles() {
    if (!file1Upload.files.length || !file2Upload.files.length) {
      showError('Please select both files');
      return;
    }
    
    const file1 = file1Upload.files[0];
    const file2 = file2Upload.files[0];
    
    // Store original file paths for URL generation
    originalFile1Path = file1.name;
    originalFile2Path = file2.name;
    
    // Update file names in the header
    file1NameEl.textContent = file1.name;
    file2NameEl.textContent = file2.name;
    
    // Update filenames in the filename bar
    file1FilenameEl.textContent = file1.name;
    file2FilenameEl.textContent = file2.name;
    
    // Show loading indicator
    loadingIndicator.classList.remove('hidden');
    emptyState.classList.add('hidden');
    diffView.classList.add('hidden');
    unifiedView.classList.add('hidden');
    noChangesState.classList.add('hidden');
    
    // Reset complete files toggle
    showingCompleteFiles = false;
    showCompleteBtn.classList.remove('active');
    showCompleteBtn.title = "Show complete files";
    
    // Read files
    Promise.all([
      readFileAsText(file1),
      readFileAsText(file2)
    ])
      .then(([file1Content, file2Content]) => {
        // Store original file contents
        originalFile1Content = file1Content;
        originalFile2Content = file2Content;
        
        // Explicitly check if files are identical before proceeding with diff
        if (file1Content === file2Content) {
          // Files are identical, show the no-changes message
          loadingIndicator.classList.add('hidden');
          noChangesState.classList.remove('hidden');
          diffView.classList.add('hidden');
          unifiedView.classList.add('hidden');
          
          // Update stats
          additionsCount.textContent = 0;
          deletionsCount.textContent = 0;
          changesCount.textContent = 0;
          
          return;
        }
        
        // Generate diff using the Diff library loaded from CDN
        if (typeof Diff === 'undefined') {
          throw new Error('Diff library not loaded. Please check your internet connection.');
        }
        
        const diffResult = Diff.createTwoFilesPatch(
          file1.name,
          file2.name,
          file1Content,
          file2Content
        );
        
        renderDiff(diffResult);
        loadingIndicator.classList.add('hidden');
      })
      .catch(error => {
        loadingIndicator.classList.add('hidden');
        emptyState.classList.remove('hidden');
        noChangesState.classList.add('hidden');
        diffView.classList.add('hidden');
        unifiedView.classList.add('hidden');
        showError(`Error comparing files: ${error.message}`);
      });
  }
  
  function readFileAsText(file) {
    return new Promise((resolve, reject) => {
      const reader = new FileReader();
      reader.onload = event => resolve(event.target.result);
      reader.onerror = error => reject(error);
      reader.readAsText(file);
    });
  }
  
  function fetchFileContents(file1Path, file2Path) {
    // Fetch file1 content
    fetch(`/api/file?path=${encodeURIComponent(file1Path)}`)
      .then(response => {
        if (!response.ok) {
          console.warn('Could not fetch file1 content');
          return null;
        }
        return response.json();
      })
      .then(data => {
        if (data && data.content) {
          originalFile1Content = data.content;
        }
      })
      .catch(error => {
        console.error('Error fetching file1:', error);
      });
    
    // Fetch file2 content
    fetch(`/api/file?path=${encodeURIComponent(file2Path)}`)
      .then(response => {
        if (!response.ok) {
          console.warn('Could not fetch file2 content');
          return null;
        }
        return response.json();
      })
      .then(data => {
        if (data && data.content) {
          originalFile2Content = data.content;
        }
      })
      .catch(error => {
        console.error('Error fetching file2:', error);
      });
  }

  function renderDiff(diffText) {
    // If the files are identical and we're not showing complete files,
    // don't process the diff and show the no-changes message
    if (originalFile1Content === originalFile2Content && !showingCompleteFiles) {
      // Update stats
      additionsCount.textContent = 0;
      deletionsCount.textContent = 0;
      changesCount.textContent = 0;
      
      // Show the no-changes message
      noChangesState.classList.remove('hidden');
      diffView.classList.add('hidden');
      unifiedView.classList.add('hidden');
      return;
    }
    
    // Parse the unified diff format
    const lines = diffText.split('\n');
    
    // Clear previous content
    file1Content.innerHTML = '';
    file2Content.innerHTML = '';
    unifiedDiff.textContent = diffText;
    
    let inHeader = true;
    let file1LineNumber = 0;
    let file2LineNumber = 0;
    let additions = 0;
    let deletions = 0;
    let changes = 0;
    
    // Check if files are identical
    // When files are identical, the diff will only contain header lines and no actual changes
    let hasChanges = false;
    
    // Quick check for empty diff or only header lines
    // This is a simple heuristic to detect identical files from the diff output
    let onlyHeaderLines = true;
    for (let i = 0; i < lines.length; i++) {
      const line = lines[i];
      if (!line.startsWith('---') && !line.startsWith('+++') && 
          !line.startsWith('diff') && !line.startsWith('index') && 
          line.trim() !== '') {
        onlyHeaderLines = false;
        break;
      }
    }
    
    // If we only have header lines, files are identical
    if (onlyHeaderLines) {
      // Update stats
      additionsCount.textContent = 0;
      deletionsCount.textContent = 0;
      changesCount.textContent = 0;
      
      // Show the no-changes message
      noChangesState.classList.remove('hidden');
      diffView.classList.add('hidden');
      unifiedView.classList.add('hidden');
      return;
    }

    for (let i = 0; i < lines.length; i++) {
      const line = lines[i];
      
      // Skip header lines
      if (inHeader && (line.startsWith('---') || line.startsWith('+++') || line.startsWith('diff') || line.startsWith('index'))) {
        continue;
      }
      
      // Check for hunk header
      if (line.startsWith('@@')) {
        inHeader = false;
        hasChanges = true; // If we have a hunk header, there are changes
        
        // Extract line numbers from hunk header
        const match = line.match(/@@ -(\d+),\d+ \+(\d+),\d+ @@/);
        if (match) {
          file1LineNumber = parseInt(match[1]) - 1;
          file2LineNumber = parseInt(match[2]) - 1;
        }
        continue;
      }
      
      inHeader = false;
      
      // Process diff lines
      if (line.startsWith('-')) {
        // Deletion - only in file1
        file1LineNumber++;
        deletions++;
        hasChanges = true;
        appendLine(file1Content, file1LineNumber, line.substring(1), 'deletion');
      } else if (line.startsWith('+')) {
        // Addition - only in file2
        file2LineNumber++;
        additions++;
        hasChanges = true;
        appendLine(file2Content, file2LineNumber, line.substring(1), 'addition');
      } else if (line.startsWith(' ')) {
        // Context - in both files
        file1LineNumber++;
        file2LineNumber++;
        appendLine(file1Content, file1LineNumber, line.substring(1), 'context');
        appendLine(file2Content, file2LineNumber, line.substring(1), 'context');
      }
    }
    
    // Update stats
    additionsCount.textContent = additions;
    deletionsCount.textContent = deletions;
    changesCount.textContent = Math.min(additions, deletions);
    
    // Show appropriate view based on whether files are identical or not
    if (!hasChanges) {
      // Files are identical, show the no-changes message
      noChangesState.classList.remove('hidden');
      diffView.classList.add('hidden');
      unifiedView.classList.add('hidden');
    } else {
      // Files have differences, show the appropriate diff view
      noChangesState.classList.add('hidden');
      if (diffContent.classList.contains('side-by-side')) {
        diffView.classList.remove('hidden');
        unifiedView.classList.add('hidden');
        
        // Make sure the filename bar is properly initialized
        if (filenameBar && localStorage.getItem('filenameBarCollapsed') === 'true') {
          filenameBar.classList.add('collapsed');
          const toggleBtn = document.querySelector('.toggle-filename-btn');
          if (toggleBtn) {
            const icon = toggleBtn.querySelector('i');
            icon.className = 'fas fa-chevron-down';
            toggleBtn.title = 'Show filename bar';
          }
        }
      } else {
        unifiedView.classList.remove('hidden');
        diffView.classList.add('hidden');
      }
    }
  }

  function appendLine(container, lineNumber, content, type) {
    const lineEl = document.createElement('div');
    lineEl.className = `line ${type}`;
    
    const lineNumberEl = document.createElement('div');
    lineNumberEl.className = 'line-number';
    lineNumberEl.textContent = lineNumber;
    
    const lineContentEl = document.createElement('div');
    lineContentEl.className = 'line-content';
    lineContentEl.textContent = content;
    
    lineEl.appendChild(lineNumberEl);
    lineEl.appendChild(lineContentEl);
    container.appendChild(lineEl);
  }

  function setViewMode(mode) {
    if (mode === 'side-by-side') {
      diffContent.classList.add('side-by-side');
      diffContent.classList.remove('unified');
      sideBySideBtn.classList.add('active');
      unifiedBtn.classList.remove('active');
      
      if (!emptyState.classList.contains('hidden')) {
        return;
      }
      
      diffView.classList.remove('hidden');
      unifiedView.classList.add('hidden');
    } else {
      diffContent.classList.add('unified');
      diffContent.classList.remove('side-by-side');
      unifiedBtn.classList.add('active');
      sideBySideBtn.classList.remove('active');
      
      if (!emptyState.classList.contains('hidden')) {
        return;
      }
      
      unifiedView.classList.remove('hidden');
      diffView.classList.add('hidden');
    }
  }

  function toggleWordWrap() {
    diffContent.classList.toggle('word-wrap');
    wordWrapBtn.classList.toggle('active');
  }

  function toggleLineNumbers() {
    diffContent.classList.toggle('hide-line-numbers');
    lineNumbersBtn.classList.toggle('active');
    
    // If the button is not active, line numbers are hidden
    if (!lineNumbersBtn.classList.contains('active')) {
      lineNumbersBtn.title = "Show line numbers";
    } else {
      lineNumbersBtn.title = "Hide line numbers";
    }
  }

  function toggleTheme() {
    document.body.classList.toggle('dark-theme');
    localStorage.setItem('theme', document.body.classList.contains('dark-theme') ? 'dark' : 'light');
  }
  
  function toggleCompleteFiles() {
    showingCompleteFiles = !showingCompleteFiles;
    showCompleteBtn.classList.toggle('active');
    
    // Check if files are identical
    const filesAreIdentical = originalFile1Content === originalFile2Content;
    
    if (showingCompleteFiles) {
      showCompleteBtn.title = "Show only changes";
      
      // If we're in the middle of a comparison and have original content
      if (originalFile1Content && originalFile2Content) {
        // Store current view state
        const isSideBySide = diffContent.classList.contains('side-by-side');
        
        // Clear current content
        file1Content.innerHTML = '';
        file2Content.innerHTML = '';
        
        // Display complete files
        const file1Lines = originalFile1Content.split('\n');
        const file2Lines = originalFile2Content.split('\n');
        
        for (let i = 0; i < file1Lines.length; i++) {
          appendLine(file1Content, i + 1, file1Lines[i], 'context');
        }
        
        for (let i = 0; i < file2Lines.length; i++) {
          appendLine(file2Content, i + 1, file2Lines[i], 'context');
        }
        
        // For identical files, update stats but show the content
        if (filesAreIdentical) {
          additionsCount.textContent = 0;
          deletionsCount.textContent = 0;
          changesCount.textContent = 0;
        }
        
        // Show the appropriate view
        noChangesState.classList.add('hidden');
        if (isSideBySide) {
          diffView.classList.remove('hidden');
          unifiedView.classList.add('hidden');
        } else {
          unifiedView.classList.remove('hidden');
          diffView.classList.add('hidden');
        }
      }
    } else {
      showCompleteBtn.title = "Show complete files";
      
      // Rerender the diff to show only changes
      if (originalFile1Content && originalFile2Content) {
        // For identical files, show the no-changes message
        if (filesAreIdentical) {
          // Make sure the stats are correct
          additionsCount.textContent = 0;
          deletionsCount.textContent = 0;
          changesCount.textContent = 0;
          
          // Show the no-changes message
          noChangesState.classList.remove('hidden');
          diffView.classList.add('hidden');
          unifiedView.classList.add('hidden');
        } else {
          // Use empty strings for file names to avoid them showing as changes
          const diffResult = Diff.createTwoFilesPatch(
            "", // Use empty string instead of file1NameEl.textContent
            "", // Use empty string instead of file2NameEl.textContent
            originalFile1Content,
            originalFile2Content
          );
          
          renderDiff(diffResult);
        }
      }
    }
  }
  
  function shareDiff() {
    // Get current URL
    const currentUrl = window.location.href;
    
    // Create a temporary input element
    const tempInput = document.createElement('input');
    tempInput.value = currentUrl;
    document.body.appendChild(tempInput);
    
    // Select the input content
    tempInput.select();
    tempInput.setSelectionRange(0, 99999); // For mobile devices
    
    // Copy the content to clipboard
    document.execCommand('copy');
    
    // Remove the temporary element
    document.body.removeChild(tempInput);
    
    // Show success message
    showSuccess('URL copied to clipboard! You can now share this diff.');
  }

  function getFileName(path) {
    return path.split('/').pop().split('\\').pop();
  }

  function showError(message) {
    errorMessage.textContent = message;
    errorToast.classList.remove('hidden');
    
    // Auto-hide after 5 seconds
    setTimeout(() => {
      errorToast.classList.add('hidden');
    }, 5000);
  }
  
  function showSuccess(message) {
    const successMessage = document.getElementById('success-message');
    const successToast = document.getElementById('success-toast');
    
    successMessage.textContent = message;
    successToast.classList.remove('hidden');
    
    // Auto-hide after 3 seconds
    setTimeout(() => {
      successToast.classList.add('hidden');
    }, 3000);
  }
  
  function toggleFilenameBar() {
    if (filenameBar) {
      filenameBar.classList.toggle('collapsed');
      
      // Update the toggle button icon
      const toggleBtn = document.querySelector('.toggle-filename-btn');
      if (toggleBtn) {
        const icon = toggleBtn.querySelector('i');
        if (filenameBar.classList.contains('collapsed')) {
          icon.className = 'fas fa-chevron-down';
          toggleBtn.title = 'Show filename bar';
        } else {
          icon.className = 'fas fa-chevron-up';
          toggleBtn.title = 'Hide filename bar';
        }
      }
      
      // Save preference in localStorage
      localStorage.setItem('filenameBarCollapsed', filenameBar.classList.contains('collapsed'));
    }
  }
  
  // Fetch application configuration from the server
  function fetchAppConfig() {
    fetch('/api/info')
      .then(response => {
        if (!response.ok) {
          throw new Error('Failed to fetch app configuration');
        }
        return response.json();
      })
      .then(data => {
        // Update page title and application name in UI
        if (data.name) {
          // Update the page title
          document.title = data.name;
          
          // Update the application name in the navbar
          const navbarTitle = document.querySelector('.logo h1');
          if (navbarTitle) {
            navbarTitle.textContent = data.name;
          }
          
          // Update the footer
          const footer = document.getElementById('app-footer');
          if (footer) {
            footer.textContent = `${data.name} © 2025 | ${data.description || 'A beautiful file diff viewer'} | Ankit Das`;
          }
        }
        
        // Apply UI configuration
        if (data.ui) {
          // Handle app info visibility
          if (data.ui.SHOW_APP_INFO === false) {
            // Hide the app info section if configured to be hidden
            const appInfo = document.querySelector('.app-info');
            if (appInfo) {
              appInfo.classList.add('hidden');
            }
          }
          
          // Handle word wrap default setting
          if (data.ui.WORD_WRAP_DEFAULT === true) {
            // Enable word wrap by default
            diffContent.classList.add('word-wrap');
            wordWrapBtn.classList.add('active');
          }
          
          // Handle navbar title visibility
          if (data.ui.SHOW_NAVBAR_TITLE === false) {
            // Hide the "Diffie" title in the navbar
            const navbarTitle = document.querySelector('.logo h1');
            if (navbarTitle) {
              navbarTitle.classList.add('hidden');
            }
          }
          
          // Handle file URL configuration
          if (data.ui.FILE_URLS) {
            fileUrlConfig = {
              enabled: data.ui.FILE_URLS.ENABLED === true,
              prefix: data.ui.FILE_URLS.PREFIX || '',
              useAbsolutePaths: data.ui.FILE_URLS.USE_ABSOLUTE_PATHS === true
            };
            
            // Make filenames clickable if enabled
            if (fileUrlConfig.enabled) {
              setupClickableFilenames();
            }
          }
          
          // Handle tab visibility and switching
          if (data.ui.TABS) {
            const tabsContainer = document.querySelector('.tabs');
            const serverTabBtn = document.querySelector('.tab-btn[data-tab="server-files"]');
            const localTabBtn = document.querySelector('.tab-btn[data-tab="local-files"]');
            const serverTabContent = document.getElementById('server-files-tab');
            const localTabContent = document.getElementById('local-files-tab');
            
            // Configure tab visibility
            if (data.ui.TABS.VISIBLE === 'server') {
              // Show only server tab
              if (localTabBtn) localTabBtn.classList.add('hidden');
              if (localTabContent) localTabContent.classList.add('hidden');
              if (serverTabBtn) serverTabBtn.classList.add('active');
              if (serverTabContent) serverTabContent.classList.remove('hidden');
              
              // Hide the tabs container if only one tab is visible
              if (tabsContainer) tabsContainer.classList.add('hidden');
            } 
            else if (data.ui.TABS.VISIBLE === 'local') {
              // Show only local tab
              if (serverTabBtn) serverTabBtn.classList.add('hidden');
              if (serverTabContent) serverTabContent.classList.add('hidden');
              if (localTabBtn) localTabBtn.classList.add('active');
              if (localTabContent) localTabContent.classList.remove('hidden');
              
              // Hide the tabs container if only one tab is visible
              if (tabsContainer) tabsContainer.classList.add('hidden');
            }
            else {
              // Both tabs are visible, check if switching is allowed
              if (data.ui.TABS.ALLOW_SWITCHING === false) {
                // Disable tab switching by removing event listeners
                tabBtns.forEach(btn => {
                  // Clone the button to remove all event listeners
                  const newBtn = btn.cloneNode(true);
                  btn.parentNode.replaceChild(newBtn, btn);
                  
                  // Add a visual indication that tabs are disabled
                  newBtn.style.opacity = '0.7';
                  newBtn.style.cursor = 'default';
                });
              }
            }
          }
        }
      })
      .catch(error => {
        console.error('Error fetching app configuration:', error);
      });
  }
  
  // Set up clickable filenames
  function setupClickableFilenames() {
    // Add click event listeners to filename elements
    if (file1FilenameEl) {
      file1FilenameEl.classList.add('clickable');
      file1FilenameEl.title = 'Click to open file in new tab';
      file1FilenameEl.addEventListener('click', () => openFileInNewTab(originalFile1Path));
    }
    
    if (file2FilenameEl) {
      file2FilenameEl.classList.add('clickable');
      file2FilenameEl.title = 'Click to open file in new tab';
      file2FilenameEl.addEventListener('click', () => openFileInNewTab(originalFile2Path));
    }
  }
  
  // Open file in a new tab
  function openFileInNewTab(filePath) {
    if (!filePath || !fileUrlConfig.enabled || !fileUrlConfig.prefix) {
      return;
    }
    
    let path = filePath;
    
    // If using absolute paths, use the full path
    // Otherwise, use just the filename or relative path as provided
    if (!fileUrlConfig.useAbsolutePaths) {
      // Extract just the filename or relative path
      path = filePath;
    }
    
    // Create the full URL
    const url = fileUrlConfig.prefix + path;
    
    // Open in a new tab
    window.open(url, '_blank');
  }
});