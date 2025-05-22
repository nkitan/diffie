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
  let currentTheme = localStorage.getItem('themeStyle') || 'default';
  let isDarkMode = localStorage.getItem('theme') === 'dark' || 
                  (window.matchMedia('(prefers-color-scheme: dark)').matches && !localStorage.getItem('theme'));
  
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
  const regularShareBtn = document.getElementById('regular-share-btn');
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
  const themeSelectorBtn = document.getElementById('theme-selector-btn');
  const themeSelectorDropdown = document.getElementById('theme-selector-dropdown');
  const themeOptions = document.querySelectorAll('.theme-option');
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
  regularShareBtn.addEventListener('click', shareDiff);
  themeToggle.addEventListener('change', toggleTheme);
  themeSelectorBtn.addEventListener('click', toggleThemeSelector);
  themeOptions.forEach(option => {
    option.addEventListener('click', () => selectTheme(option));
  });
  document.addEventListener('click', closeThemeSelectorOnClickOutside);
  toastClose.addEventListener('click', () => errorToast.classList.add('hidden'));
  
  // Add event listener for success toast close button if it exists
  const successToastClose = document.querySelector('#success-toast .toast-close');
  if (successToastClose) {
    successToastClose.addEventListener('click', () => {
      document.getElementById('success-toast').classList.add('hidden');
    });
  }
  
  // Add event listeners for the filename bar toggle buttons
  if (document.querySelector('.toggle-filename-btn')) {
    document.querySelector('.toggle-filename-btn').addEventListener('click', toggleFilenameBar);
  }
  
  if (document.querySelector('.persistent-toggle-btn')) {
    document.querySelector('.persistent-toggle-btn').addEventListener('click', toggleFilenameBar);
  }

  // Apply saved theme preference
  applyTheme(currentTheme, isDarkMode);
  themeToggle.checked = isDarkMode;
  
  // Check for saved filename bar preference
  if (localStorage.getItem('filenameBarCollapsed') === 'true' && filenameBar) {
    filenameBar.classList.add('collapsed');
    const toggleBtn = document.querySelector('.toggle-filename-btn');
    if (toggleBtn) {
      const icon = toggleBtn.querySelector('i');
      icon.className = 'fas fa-angle-down';
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
          
          // Convert tabsVisible to array format for easier checking
          let visibleTabs = [];
          if (tabsVisible === 'all' || tabsVisible === 'both') {
            visibleTabs = ['server', 'local', 'multiple'];
          } else if (Array.isArray(tabsVisible)) {
            visibleTabs = tabsVisible;
          } else {
            visibleTabs = [tabsVisible];
          }
          
          // Check which tabs are visible
          const isServerVisible = visibleTabs.includes('server');
          const isLocalVisible = visibleTabs.includes('local');
          const isMultipleVisible = visibleTabs.includes('multiple');
          
          // If no tabs are visible, don't process any params
          if (visibleTabs.length === 0) {
            return;
          }
          
          const urlParams = new URLSearchParams(window.location.search);
          
          // Check for multiple file pairs format
          const pairsParam = urlParams.getAll('pairs');
          if (pairsParam && pairsParam.length > 0 && isMultipleVisible) {
            // Only switch tab if tab switching is allowed and multiple tab is visible
            if (data.ui.TABS.ALLOW_SWITCHING !== false) {
              switchTab('multi-files');
              
              // Process the pairs and trigger multi-file comparison
              processMultiFilePairs(pairsParam);
            }
            return;
          }
          
          // Check for single file pair format (backward compatibility)
          const file1 = urlParams.get('file1');
          const file2 = urlParams.get('file2');
          const mode = urlParams.get('mode') || 'server';
          
          if (file1 && file2) {
            if (mode === 'server' && isServerVisible) {
              // Only switch tab if tab switching is allowed and server tab is visible
              if (data.ui.TABS.ALLOW_SWITCHING !== false) {
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
          
          // Check for multiple file pairs format
          const pairsParam = urlParams.getAll('pairs');
          if (pairsParam && pairsParam.length > 0) {
            switchTab('multi-files');
            processMultiFilePairs(pairsParam);
            return;
          }
          
          // Check for single file pair format (backward compatibility)
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
        
        // Check for multiple file pairs format
        const pairsParam = urlParams.getAll('pairs');
        if (pairsParam && pairsParam.length > 0) {
          switchTab('multi-files');
          processMultiFilePairs(pairsParam);
          return;
        }
        
        // Check for single file pair format (backward compatibility)
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
  
  // Function to process multiple file pairs from URL parameters
  function processMultiFilePairs(pairsParam) {
    // Make sure the multi-files tab is initialized
    const multiFilesTab = document.getElementById('multi-files-tab');
    const filePairsContainer = document.getElementById('file-pairs-container');
    
    // Clear existing file pairs
    filePairsContainer.innerHTML = '';
    
    // Process each pair parameter
    pairsParam.forEach((pairStr, index) => {
      // Parse the pair (format: file1.txt,file2.txt)
      const [file1, file2] = pairStr.split(',').map(path => path.trim());
      
      if (file1 && file2) {
        // Create a new file pair element
        const filePairEl = document.createElement('div');
        filePairEl.className = 'file-pair';
        filePairEl.dataset.pairId = index;
        
        filePairEl.innerHTML = `
          <div class="file-pair-header">
            <span class="file-pair-title">File Pair #${index + 1}</span>
            <div class="file-pair-actions">
              <button class="remove-pair-btn" title="Remove this pair">
                <i class="fas fa-times"></i>
              </button>
            </div>
          </div>
          <div class="file-inputs">
            <div class="file-input-group">
              <label>File 1 Path:</label>
              <div class="input-with-icon">
                <i class="fas fa-file-code"></i>
                <input type="text" class="file1-path-multi" placeholder="Enter path to first file" value="${file1}">
              </div>
            </div>
            <div class="file-input-group">
              <label>File 2 Path:</label>
              <div class="input-with-icon">
                <i class="fas fa-file-code"></i>
                <input type="text" class="file2-path-multi" placeholder="Enter path to second file" value="${file2}">
              </div>
            </div>
          </div>
        `;
        
        filePairsContainer.appendChild(filePairEl);
      }
    });
    
    // Trigger the compare function if we have at least one valid pair
    if (filePairsContainer.children.length > 0) {
      // We need to wait a bit for the event listeners to be attached
      setTimeout(() => {
        // Make sure the multi-diff.js has initialized the file pairs
        if (typeof initializeFilePairs === 'function') {
          initializeFilePairs();
        } else {
          // If the function isn't available directly, try to access it through window
          if (window.initializeFilePairs) {
            window.initializeFilePairs();
          }
        }
        
        // Find and click the compare button
        const compareMultiBtn = document.getElementById('compare-multi-btn');
        if (compareMultiBtn) {
          compareMultiBtn.click();
        }
      }, 200); // Increased timeout to ensure everything is loaded
    }
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
    
    // Show/hide the appropriate diff container based on the tab
    const singleDiffContainer = document.getElementById('single-diff-container');
    const multiDiffContainer = document.getElementById('multi-diff-container');
    
    if (tabId === 'multi-files') {
      if (singleDiffContainer) singleDiffContainer.classList.add('hidden');
      if (multiDiffContainer) multiDiffContainer.classList.remove('hidden');
    } else {
      if (singleDiffContainer) singleDiffContainer.classList.remove('hidden');
      if (multiDiffContainer) multiDiffContainer.classList.add('hidden');
    }
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
          
          // Log the actual error to console
          console.error('Error comparing files:', error.message);
          
          // Show a user-friendly message
          let errorMessage = 'Failed to compare files. Please try again.';
          
          if (error.message.includes('not found') || error.message.includes('no such file')) {
            errorMessage = 'One or more files could not be found. Please check that the file paths are correct.';
          } else if (error.message.includes('permission denied')) {
            errorMessage = 'Permission denied when accessing files. Please check file permissions.';
          }
          
          showError(errorMessage);
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
            icon.className = 'fas fa-angle-down';
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
    isDarkMode = !isDarkMode;
    applyTheme(currentTheme, isDarkMode);
    localStorage.setItem('theme', isDarkMode ? 'dark' : 'light');
    
    // Update the focus mode theme toggle if it exists
    const focusModeThemeToggle = document.getElementById('focus-mode-theme-toggle-checkbox');
    if (focusModeThemeToggle) {
      focusModeThemeToggle.checked = isDarkMode;
    }
  }
  
  // Make toggleTheme available globally for multi-diff.js
  window.toggleTheme = toggleTheme;
  
  function toggleThemeSelector() {
    themeSelectorDropdown.classList.toggle('show');
    
    // Mark the current theme as active
    themeOptions.forEach(option => {
      const optionTheme = option.dataset.theme;
      const optionDark = option.dataset.dark === 'true';
      
      if (optionTheme === currentTheme && optionDark === isDarkMode) {
        option.classList.add('active');
      } else {
        option.classList.remove('active');
      }
    });
  }
  
  function closeThemeSelectorOnClickOutside(event) {
    if (themeSelectorDropdown.classList.contains('show') && 
        !themeSelectorBtn.contains(event.target) && 
        !themeSelectorDropdown.contains(event.target)) {
      themeSelectorDropdown.classList.remove('show');
    }
  }
  
  function selectTheme(option) {
    // Remove active class from all options
    themeOptions.forEach(opt => opt.classList.remove('active'));
    // Add active class to the selected option
    option.classList.add('active');

    // Set theme and dark mode
    const theme = option.getAttribute('data-theme');
    const dark = option.getAttribute('data-dark') === 'true';
    localStorage.setItem('themeStyle', theme);
    localStorage.setItem('theme', dark ? 'dark' : 'light');
    applyTheme(theme, dark);

    // Update checkmarks (handled by CSS, but force repaint for accessibility)
    themeOptions.forEach(opt => {
      const check = opt.querySelector('.theme-check');
      if (check) check.setAttribute('aria-hidden', !opt.classList.contains('active'));
    });
  }
  
  function applyTheme(theme, dark) {
    // Remove all theme classes
    document.body.classList.remove(
      'dark-theme', 
      'cloudflare-theme', 
      'cloudflare-dark-theme', 
      'gitlab-theme', 
      'gitlab-dark-theme',
      'github-theme',
      'github-dark-theme',
      'vscode-theme',
      'vscode-dark-theme',
      'material-theme',
      'material-dark-theme',
      'obsidian-theme',
      'obsidian-dark-theme'
    );
    
    // Apply the selected theme
    if (theme === 'default') {
      if (dark) {
        document.body.classList.add('dark-theme');
      }
    } else if (theme === 'cloudflare') {
      if (dark) {
        document.body.classList.add('cloudflare-dark-theme');
      } else {
        document.body.classList.add('cloudflare-theme');
      }
    } else if (theme === 'gitlab') {
      if (dark) {
        document.body.classList.add('gitlab-dark-theme');
      } else {
        document.body.classList.add('gitlab-theme');
      }
    } else if (theme === 'github') {
      if (dark) {
        document.body.classList.add('github-dark-theme');
      } else {
        document.body.classList.add('github-theme');
      }
    } else if (theme === 'vscode') {
      if (dark) {
        document.body.classList.add('vscode-dark-theme');
      } else {
        document.body.classList.add('vscode-theme');
      }
    } else if (theme === 'material') {
      if (dark) {
        document.body.classList.add('material-dark-theme');
      } else {
        document.body.classList.add('material-theme');
      }
    } else if (theme === 'obsidian') {
      if (dark) {
        document.body.classList.add('obsidian-dark-theme');
      } else {
        document.body.classList.add('obsidian-theme');
      }
    }
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
  
  // Make showError available globally for multi-diff.js
  window.showError = showError;
  
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
  
  // Make showSuccess available globally for multi-diff.js
  window.showSuccess = showSuccess;
  
  // Make fileUrlConfig available globally for multi-diff.js
  window.fileUrlConfig = fileUrlConfig;
  
  function toggleFilenameBar() {
    if (filenameBar) {
      filenameBar.classList.toggle('collapsed');
      
      // Update the toggle button icon
      const toggleBtn = document.querySelector('.toggle-filename-btn');
      if (toggleBtn) {
        const icon = toggleBtn.querySelector('i');
        if (filenameBar.classList.contains('collapsed')) {
          icon.className = 'fas fa-angle-down';
          toggleBtn.title = 'Show filename bar';
        } else {
          icon.className = 'fas fa-angle-up';
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
            
            // Update the global fileUrlConfig
            window.fileUrlConfig = fileUrlConfig;
            
            // Update the global fileUrlConfig
            window.fileUrlConfig = fileUrlConfig;
            
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
            const multiTabBtn = document.querySelector('.tab-btn[data-tab="multi-files"]');
            const serverTabContent = document.getElementById('server-files-tab');
            const localTabContent = document.getElementById('local-files-tab');
            const multiTabContent = document.getElementById('multi-files-tab');
            
            // Convert tabsVisible to array format for easier checking
            let visibleTabs = [];
            const tabsVisible = data.ui.TABS.VISIBLE;
            
            if (tabsVisible === 'all' || tabsVisible === 'both') {
              visibleTabs = ['server', 'local', 'multiple'];
            } else if (Array.isArray(tabsVisible)) {
              // Convert any 'multiple' to the correct internal name
              visibleTabs = tabsVisible.map(tab => tab === 'multiple' ? 'multiple' : tab);
            } else {
              visibleTabs = [tabsVisible];
            }
            
            // Map tab names to their elements
            const tabMap = {
              'server': { btn: serverTabBtn, content: serverTabContent },
              'local': { btn: localTabBtn, content: localTabContent },
              'multiple': { btn: multiTabBtn, content: multiTabContent }
            };
            
            // Hide all tabs first
            Object.values(tabMap).forEach(tab => {
              if (tab.btn) tab.btn.classList.add('hidden');
              if (tab.content) tab.content.classList.add('hidden');
            });
            
            // Show only the visible tabs
            let firstVisibleTab = null;
            visibleTabs.forEach(tabName => {
              const tab = tabMap[tabName];
              if (tab && tab.btn) {
                tab.btn.classList.remove('hidden');
                if (!firstVisibleTab) firstVisibleTab = tabName;
              }
            });
            
            // If only one tab is visible, make it active and hide the tabs container
            if (visibleTabs.length === 1 && firstVisibleTab) {
              const tab = tabMap[firstVisibleTab];
              if (tab.btn) tab.btn.classList.add('active');
              if (tab.content) tab.content.classList.remove('hidden');
              
              // Hide the tabs container if only one tab is visible
              if (tabsContainer) tabsContainer.classList.add('hidden');
            } 
            // If multiple tabs are visible
            else if (visibleTabs.length > 1) {
              // Make the first tab active
              if (firstVisibleTab) {
                const tab = tabMap[firstVisibleTab];
                if (tab.btn) tab.btn.classList.add('active');
                if (tab.content) tab.content.classList.remove('hidden');
              }
              
              // Check if switching is allowed
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