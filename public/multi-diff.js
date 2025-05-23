// Multi-file comparison functionality
document.addEventListener('DOMContentLoaded', () => {
  // DOM Elements
  const addFilePairBtn = document.getElementById('add-file-pair-btn');
  const compareMultiBtn = document.getElementById('compare-multi-btn');
  const generateReportBtn = document.getElementById('generate-report-btn');
  const filePairsContainer = document.getElementById('file-pairs-container');
  const multiDiffContainer = document.getElementById('multi-diff-container');
  const singleDiffContainer = document.getElementById('single-diff-container');
  const multiDiffResults = document.getElementById('multi-diff-results');
  const diffNavigationList = document.getElementById('diff-navigation-list');
  const loadingIndicator = document.querySelector('#multi-diff-content-container .loading-indicator');
  const emptyState = document.querySelector('#multi-diff-content-container .empty-state');
  const totalFilesCount = document.getElementById('total-files-count');
  const differentFilesCount = document.getElementById('different-files-count');
  const identicalFilesCount = document.getElementById('identical-files-count');
  const totalAdditionsCount = document.getElementById('total-additions-count');
  const totalDeletionsCount = document.getElementById('total-deletions-count');
  const totalChangesCount = document.getElementById('total-changes-count');
  const showAllDiffsBtn = document.getElementById('show-all-diffs-btn');
  const showChangedDiffsBtn = document.getElementById('show-changed-diffs-btn');
  const showIdenticalDiffsBtn = document.getElementById('show-identical-diffs-btn');
  const multiSideBySideBtn = document.getElementById('multi-side-by-side-btn');
  const multiUnifiedBtn = document.getElementById('multi-unified-btn');
  const multiWordWrapBtn = document.getElementById('multi-word-wrap-btn');
  const multiLineNumbersBtn = document.getElementById('multi-line-numbers-btn');
  const multiCollapseAllBtn = document.getElementById('multi-collapse-all-btn');
  const multiExpandAllBtn = document.getElementById('multi-expand-all-btn');
  const focusModeToggle = document.getElementById('focus-mode-toggle');
  const multiFocusModeBtn = document.getElementById('multi-focus-mode-btn');
  const focusModeGenerateReportBtn = document.getElementById('focus-mode-generate-report');
  const focusModeShareBtn = document.getElementById('focus-mode-share-btn');
  const focusModeThemeToggle = document.getElementById('focus-mode-theme-toggle-checkbox');
  
  // Add CSS for file path links and identical files container
  const style = document.createElement('style');
  style.textContent = `
    .file-path-link {
      cursor: pointer;
      color: var(--primary-color);
      text-decoration: underline;
    }
    .file-path-link:hover {
      color: var(--primary-hover);
    }
    .identical-files-container {
      width: 100%;
      background-color: rgba(var(--addition-color-rgb), 0.2);
      border: 1px solid var(--addition-color);
      border-radius: var(--radius-md);
      margin: 10px 0;
    }
    .identical-files-container .no-changes-state {
      padding: 20px;
      text-align: center;
      color: var(--addition-text);
    }
    
    /* Dark theme adjustments */
    .dark-theme .identical-files-container,
    [class*="-dark-theme"] .identical-files-container {
      background-color: rgba(var(--addition-color-rgb), 0.1);
      border-color: rgba(var(--addition-color-rgb), 0.3);
    }
  `;
  document.head.appendChild(style);
  
  // State variables
  let filePairs = [];
  let diffResults = [];
  let currentViewMode = 'side-by-side';
  let wordWrapEnabled = false;
  let lineNumbersEnabled = true;
  let currentFilter = 'all';
  
  // Check for word wrap default setting from app configuration
  fetch('/api/info')
    .then(response => response.json())
    .then(data => {
      if (data.ui && data.ui.WORD_WRAP_DEFAULT === true) {
        // Enable word wrap by default
        wordWrapEnabled = true;
        multiWordWrapBtn.classList.add('active');
        
        // Apply word wrap to all diff content elements
        document.querySelectorAll('.multi-diff-results .line-content').forEach(el => {
          el.style.whiteSpace = 'pre-wrap';
        });
        
        document.querySelectorAll('.multi-diff-results .unified-diff').forEach(el => {
          el.style.whiteSpace = 'pre-wrap';
        });
        
        // Apply word wrap to the multi-diff containers
        document.querySelectorAll('.multi-diff-container, .diff-result-content').forEach(container => {
          container.classList.add('word-wrap');
        });
      }
    })
    .catch(error => {
      console.error('Error fetching app configuration:', error);
    });
  
  // Function to open file in a new tab
  function openFileInNewTab(filePath) {
    // Check if we have access to the fileUrlConfig from script.js
    if (!filePath || !window.fileUrlConfig || !window.fileUrlConfig.enabled || !window.fileUrlConfig.prefix) {
      return;
    }
    
    let path = filePath;
    
    // If using absolute paths, use the full path
    // Otherwise, use just the filename or relative path as provided
    if (!window.fileUrlConfig.useAbsolutePaths) {
      // Extract just the filename or relative path
      path = filePath;
    }
    
    // Create the full URL
    const url = window.fileUrlConfig.prefix + path;
    
    // Open in a new tab
    window.open(url, '_blank');
  }
  
  // State variables for focus mode
  let isFocusMode = false;
  
  // Event Listeners
  addFilePairBtn.addEventListener('click', addFilePair);
  compareMultiBtn.addEventListener('click', compareAllFiles);
  generateReportBtn.addEventListener('click', generateReport);
  showAllDiffsBtn.addEventListener('click', () => filterDiffs('all'));
  showChangedDiffsBtn.addEventListener('click', () => filterDiffs('changed'));
  showIdenticalDiffsBtn.addEventListener('click', () => filterDiffs('identical'));
  multiSideBySideBtn.addEventListener('click', () => setMultiViewMode('side-by-side'));
  multiUnifiedBtn.addEventListener('click', () => setMultiViewMode('unified'));
  multiWordWrapBtn.addEventListener('click', toggleMultiWordWrap);
  multiLineNumbersBtn.addEventListener('click', toggleMultiLineNumbers);
  multiCollapseAllBtn.addEventListener('click', collapseAllDiffs);
  multiExpandAllBtn.addEventListener('click', expandAllDiffs);
  focusModeToggle.addEventListener('click', toggleFocusMode);
  multiFocusModeBtn.addEventListener('click', toggleFocusMode);
  
  // Add event listener for the multi-share button
  const multiShareBtn = document.getElementById('multi-share-btn');
  if (multiShareBtn) {
    multiShareBtn.addEventListener('click', shareDiff);
  }

  // Add event listener for the focus mode generate report button
  if (focusModeGenerateReportBtn) {
    focusModeGenerateReportBtn.addEventListener('click', generateReport);
  }
  
  // Add event listener for the focus mode share button
  if (focusModeShareBtn) {
    focusModeShareBtn.addEventListener('click', shareDiff);
  }
  
  // Add event listener for the focus mode theme toggle
  if (focusModeThemeToggle) {
    // Initialize the toggle state based on current theme
    const isDarkMode = localStorage.getItem('theme') === 'dark' || 
                      (window.matchMedia('(prefers-color-scheme: dark)').matches && !localStorage.getItem('theme'));
    focusModeThemeToggle.checked = isDarkMode;
    
    // Add event listener to toggle theme
    focusModeThemeToggle.addEventListener('change', () => {
      // Call the toggleTheme function from script.js
      if (window.toggleTheme) {
        window.toggleTheme();
        
        // Update URL parameter for theme
        const url = new URL(window.location);
        const currentTheme = localStorage.getItem('themeStyle') || 'default';
        const isDark = focusModeThemeToggle.checked;
        url.searchParams.set('theme', `${currentTheme}-${isDark ? 'dark' : 'light'}`);
        window.history.pushState({}, '', url);
      } else {
        // Fallback if toggleTheme is not available
        document.body.classList.toggle('dark-theme');
        localStorage.setItem('theme', focusModeThemeToggle.checked ? 'dark' : 'light');
      }
    });
  }
  
  // Check URL parameters for focus mode
  checkFocusModeParam();
  
  // Initialize file pairs
  initializeFilePairs();
  
  // Function to initialize file pairs
  function initializeFilePairs() {
    // Clear the filePairs array
    filePairs = [];
    
    // If there are no file pairs in the DOM, add one
    if (filePairsContainer.children.length === 0) {
      addFilePair();
    } else {
      // If there are already file pairs in the DOM (from HTML or URL params), add them to our filePairs array
      document.querySelectorAll('.file-pair').forEach((pairEl, index) => {
        const pairId = parseInt(pairEl.dataset.pairId || index);
        const file1Input = pairEl.querySelector('.file1-path-multi');
        const file2Input = pairEl.querySelector('.file2-path-multi');
        
        // Add to our filePairs array
        filePairs.push({
          id: pairId,
          file1: file1Input ? file1Input.value.trim() : '',
          file2: file2Input ? file2Input.value.trim() : ''
        });
        
        // Add event listeners
        if (file1Input) {
          file1Input.addEventListener('input', (e) => {
            const pairIndex = filePairs.findIndex(pair => pair.id === pairId);
            if (pairIndex !== -1) {
              filePairs[pairIndex].file1 = e.target.value.trim();
            }
          });
        }
        
        if (file2Input) {
          file2Input.addEventListener('input', (e) => {
            const pairIndex = filePairs.findIndex(pair => pair.id === pairId);
            if (pairIndex !== -1) {
              filePairs[pairIndex].file2 = e.target.value.trim();
            }
          });
        }
        
        // Add remove button event listener
        const removePairBtn = pairEl.querySelector('.remove-pair-btn');
        if (removePairBtn) {
          removePairBtn.addEventListener('click', () => removeFilePair(pairId));
        }
      });
    }
    
    // Log the initialized file pairs for debugging
    console.log('Initialized file pairs:', filePairs);
  }
  
  // Make initializeFilePairs globally accessible
  window.initializeFilePairs = initializeFilePairs;
  
  // Functions
  function addFilePair(file1Value = '', file2Value = '') {
    const pairId = filePairs.length;
    filePairs.push({
      id: pairId,
      file1: file1Value,
      file2: file2Value
    });
    
    const filePairEl = document.createElement('div');
    filePairEl.className = 'file-pair';
    filePairEl.dataset.pairId = pairId;
    
    filePairEl.innerHTML = `
      <div class="file-pair-header">
        <span class="file-pair-title">File Pair #${pairId + 1}</span>
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
            <input type="text" class="file1-path-multi" placeholder="Enter path to first file" value="${file1Value}">
          </div>
        </div>
        <div class="file-input-group">
          <label>File 2 Path:</label>
          <div class="input-with-icon">
            <i class="fas fa-file-code"></i>
            <input type="text" class="file2-path-multi" placeholder="Enter path to second file" value="${file2Value}">
          </div>
        </div>
      </div>
    `;
    
    filePairsContainer.appendChild(filePairEl);
    
    // Add event listeners for the new pair
    const removePairBtn = filePairEl.querySelector('.remove-pair-btn');
    removePairBtn.addEventListener('click', () => removeFilePair(pairId));
    
    const file1Input = filePairEl.querySelector('.file1-path-multi');
    const file2Input = filePairEl.querySelector('.file2-path-multi');
    
    file1Input.addEventListener('input', (e) => {
      // Make sure the pair still exists in the array before updating
      const pairIndex = filePairs.findIndex(pair => pair.id === pairId);
      if (pairIndex !== -1) {
        filePairs[pairIndex].file1 = e.target.value.trim();
      }
    });
    
    file2Input.addEventListener('input', (e) => {
      // Make sure the pair still exists in the array before updating
      const pairIndex = filePairs.findIndex(pair => pair.id === pairId);
      if (pairIndex !== -1) {
        filePairs[pairIndex].file2 = e.target.value.trim();
      }
    });
    
    // Focus on the first input of the new pair if it's empty
    if (!file1Value) {
      file1Input.focus();
    }
    
    return pairId;
  }
  
  function removeFilePair(pairId) {
    const filePairEl = document.querySelector(`.file-pair[data-pair-id="${pairId}"]`);
    if (filePairEl) {
      filePairEl.remove();
      
      // Remove from the filePairs array
      filePairs = filePairs.filter(pair => pair.id !== pairId);
      
      // Update the pair numbers
      document.querySelectorAll('.file-pair').forEach((el, index) => {
        el.querySelector('.file-pair-title').textContent = `File Pair #${index + 1}`;
      });
    }
  }
  
  function compareAllFiles() {
    // Make sure filePairs is initialized
    if (!filePairs || filePairs.length === 0) {
      // Re-initialize file pairs from DOM
      initializeFilePairs();
    }
    
    // Log the current state of filePairs for debugging
    console.log('Current file pairs:', filePairs);
    
    // Get the latest values from the input fields
    document.querySelectorAll('.file-pair').forEach(pairEl => {
      const pairId = parseInt(pairEl.dataset.pairId);
      const file1Input = pairEl.querySelector('.file1-path-multi');
      const file2Input = pairEl.querySelector('.file2-path-multi');
      
      // Find the pair in our array
      const pairIndex = filePairs.findIndex(pair => pair.id === pairId);
      if (pairIndex !== -1 && file1Input && file2Input) {
        filePairs[pairIndex].file1 = file1Input.value.trim();
        filePairs[pairIndex].file2 = file2Input.value.trim();
      } else if (file1Input && file2Input) {
        // If the pair doesn't exist in our array, add it
        filePairs.push({
          id: pairId,
          file1: file1Input.value.trim(),
          file2: file2Input.value.trim()
        });
      }
    });
    
    // Validate that we have at least one file pair with both paths filled
    const validPairs = filePairs.filter(pair => pair.file1 && pair.file2);
    console.log('Valid pairs:', validPairs);
    
    if (validPairs.length === 0) {
      showError('Please add at least one file pair with both paths filled');
      return;
    }
    
    // Show loading indicator
    loadingIndicator.classList.remove('hidden');
    emptyState.classList.add('hidden');
    multiDiffResults.classList.add('hidden');
    
    // Show multi-diff container, hide single-diff container
    multiDiffContainer.classList.remove('hidden');
    singleDiffContainer.classList.add('hidden');
    
    // Prepare data for API call
    const filePairsData = validPairs.map((pair, index) => ({
      index: index, // Add index to keep track of the order
      file1: pair.file1,
      file2: pair.file2
    }));
    
    console.log('Sending data to API:', filePairsData);
    
    // Call the API
    fetch('/api/multi-diff', {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json'
      },
      body: JSON.stringify({ filePairs: filePairsData })
    })
    .then(response => {
      if (!response.ok) {
        return response.json().then(data => {
          throw new Error(data.error || 'Failed to generate diffs');
        });
      }
      return response.json();
    })
    .then(data => {
      // Store the results
      diffResults = data.results;
      
      // Render the results
      renderMultiDiffResults(diffResults, data.errors);
      
      // Hide loading indicator
      loadingIndicator.classList.add('hidden');
    })
    .catch(error => {
      loadingIndicator.classList.add('hidden');
      emptyState.classList.remove('hidden');
      // Log the actual error to console
      console.error('Error comparing files:', error.message);
      // Show a user-friendly message in the toast
      showError('Failed to compare files. Please check your file paths and try again.');
    });
  }
  
  function renderMultiDiffResults(results, errors) {
    console.log('Rendering results:', results);
    
    // Clear previous results
    multiDiffResults.innerHTML = '';
    diffNavigationList.innerHTML = '';
    
    // If there are no results, show empty state
    if (!results || results.length === 0) {
      emptyState.classList.remove('hidden');
      multiDiffResults.classList.add('hidden');
      return;
    }
    
    // Show results container
    multiDiffResults.classList.remove('hidden');
    emptyState.classList.add('hidden');
    
    // Calculate summary statistics
    let totalAdditions = 0;
    let totalDeletions = 0;
    let totalChanges = 0;
    let identicalCount = 0;
    let differentCount = 0;
    
    // Sort results by index to ensure they're in the right order
    const sortedResults = [...results].sort((a, b) => {
      return (a.index || 0) - (b.index || 0);
    });
    
    console.log('Sorted results:', sortedResults);
    
    // Render each diff result
    sortedResults.forEach((result, displayIndex) => {
      const { file1, file2, diff, identical, index } = result;
      const resultIndex = index || displayIndex;
      
      console.log(`Rendering result ${resultIndex}:`, { file1, file2, identical });
      
      // Parse the diff to get statistics
      const stats = parseDiffStats(diff);
      totalAdditions += stats.additions;
      totalDeletions += stats.deletions;
      totalChanges += stats.changes;
      
      if (identical) {
        identicalCount++;
      } else {
        differentCount++;
      }
      
      // Create navigation item
      const navItem = document.createElement('div');
      navItem.className = `navigation-item ${identical ? 'identical' : 'different'}`;
      navItem.dataset.resultIndex = resultIndex;
      navItem.innerHTML = `
        <div class="navigation-item-files">
          <i class="fas fa-file-code"></i>
          <span>
            <span class="file-path-link" data-path="${file1}" title="Click to open file in new tab">${getFileName(file1)}</span>
            ↔
            <span class="file-path-link" data-path="${file2}" title="Click to open file in new tab">${getFileName(file2)}</span>
          </span>
        </div>
        <div class="navigation-item-status ${identical ? 'status-identical' : 'status-different'}">
          ${identical ? 'Identical' : 'Different'}
        </div>
      `;
      
      // Add event listeners for file path links in the navigation item
      const navFilePathLinks = navItem.querySelectorAll('.file-path-link');
      navFilePathLinks.forEach(link => {
        link.addEventListener('click', (e) => {
          e.stopPropagation(); // Prevent triggering parent click events
          const filePath = link.getAttribute('data-path');
          openFileInNewTab(filePath);
        });
      });
      
      navItem.addEventListener('click', () => {
        // Scroll to the corresponding diff result
        const resultEl = document.querySelector(`.diff-result-item[data-result-index="${resultIndex}"]`);
        if (resultEl) {
          resultEl.scrollIntoView({ behavior: 'smooth', block: 'start' });
          
          // Highlight the navigation item
          document.querySelectorAll('.navigation-item').forEach(item => {
            item.classList.remove('active');
          });
          navItem.classList.add('active');
          
          // Expand the diff if it's collapsed
          const contentEl = resultEl.querySelector('.diff-result-content');
          if (contentEl && contentEl.classList.contains('collapsed')) {
            contentEl.classList.remove('collapsed');
            const toggleBtn = resultEl.querySelector('.toggle-diff-btn');
            if (toggleBtn) {
              toggleBtn.innerHTML = '<i class="fas fa-angle-up"></i>';
              toggleBtn.title = 'Collapse';
            }
          }
        }
      });
      
      diffNavigationList.appendChild(navItem);
      
      // Create diff result item
      const resultItem = document.createElement('div');
      resultItem.className = 'diff-result-item';
      resultItem.dataset.resultIndex = resultIndex;
      resultItem.dataset.status = identical ? 'identical' : 'different';

      // Add a resizable wrapper for each diff result content
      resultItem.innerHTML = `
        <div class="diff-result-header">
          <div class="diff-result-title">
            <div class="diff-result-files">
              <span class="file-path-link" data-path="${file1}" title="Click to open file in new tab">${getFileName(file1)}</span>
              <div class="compare-icon">
                <i class="fas fa-exchange-alt"></i>
              </div>
              <span class="file-path-link" data-path="${file2}" title="Click to open file in new tab">${getFileName(file2)}</span>
            </div>
          </div>
          <div class="diff-result-stats">
            ${!identical ? `
              <div class="stat-item additions">
                <i class="fas fa-plus-circle"></i>
                <span>${stats.additions}</span>
              </div>
              <div class="stat-item deletions">
                <i class="fas fa-minus-circle"></i>
                <span>${stats.deletions}</span>
              </div>
              <div class="stat-item changes">
                <i class="fas fa-exchange-alt"></i>
                <span>${stats.changes}</span>
              </div>
            ` : `
              <div class="stat-item">
                <i class="fas fa-equals"></i>
                <span>Files are identical</span>
              </div>
            `}
          </div>
          <div class="diff-result-actions">
            <button class="toggle-diff-btn" title="Collapse">
              <i class="fas fa-angle-up"></i>
            </button>
          </div>
        </div>
        <div class="diff-resize-wrapper">
          <div class="diff-result-content">
            ${identical ? `
              <div class="diff-content side-by-side">
                <div class="diff-view-content">
                  <div class="identical-files-container">
                    <div class="no-changes-state">
                      <i class="fas fa-equals"></i>
                      <p>Files are identical. No differences found.</p>
                    </div>
                  </div>
                </div>
              </div>
            ` : `
              <div class="diff-content ${currentViewMode}">
                ${currentViewMode === 'side-by-side' ? `
                  <div class="diff-view-content">
                    <div class="file1-content"></div>
                    <div class="file2-content"></div>
                  </div>
                ` : `
                  <pre class="unified-diff"></pre>
                `}
              </div>
            `}
          </div>
        </div>
      `;
      
      multiDiffResults.appendChild(resultItem);
      
      // Add event listener for toggle button
      const toggleBtn = resultItem.querySelector('.toggle-diff-btn');
      toggleBtn.addEventListener('click', () => {
        const contentEl = resultItem.querySelector('.diff-result-content');
        const resizeWrapper = resultItem.querySelector('.diff-resize-wrapper');
        contentEl.classList.toggle('collapsed');
        if (contentEl.classList.contains('collapsed')) {
          // Shrink the resizable window to 0 when collapsed
          if (resizeWrapper) {
            resizeWrapper.style.height = '0px';
            resizeWrapper.style.minHeight = '0px';
            resizeWrapper.style.overflow = 'hidden';
          }
        } else {
          // Remove explicit height/minHeight to allow resizing
          if (resizeWrapper) {
            resizeWrapper.style.height = '';
            resizeWrapper.style.minHeight = '';
            resizeWrapper.style.overflow = '';
          }
        }
        if (contentEl.classList.contains('collapsed')) {
          toggleBtn.innerHTML = '<i class="fas fa-angle-down"></i>';
          toggleBtn.title = 'Expand';
        } else {
          toggleBtn.innerHTML = '<i class="fas fa-angle-up"></i>';
          toggleBtn.title = 'Collapse';
        }
      });
      
      // Add event listeners for file path links
      const filePathLinks = resultItem.querySelectorAll('.file-path-link');
      filePathLinks.forEach(link => {
        link.addEventListener('click', (e) => {
          e.stopPropagation(); // Prevent triggering parent click events
          const filePath = link.getAttribute('data-path');
          openFileInNewTab(filePath);
        });
      });
      
      // Render the diff content if files are different
      if (!identical) {
        if (currentViewMode === 'side-by-side') {
          renderSideBySideDiff(diff, resultItem);
        } else {
          renderUnifiedDiff(diff, resultItem);
        }
      }
    });
    
    // Update summary statistics
    totalFilesCount.textContent = results.length;
    differentFilesCount.textContent = differentCount;
    identicalFilesCount.textContent = identicalCount;
    totalAdditionsCount.textContent = totalAdditions;
    totalDeletionsCount.textContent = totalDeletions;
    totalChangesCount.textContent = totalChanges;
    
    // Apply current filter
    filterDiffs(currentFilter);
    
    // Apply current view settings
    applyViewSettings();
    
    // Show a user-friendly message for errors
    if (errors && errors.length > 0) {
      // Log detailed errors to console
      const errorMessages = errors.map(err => `Error with pair ${err.index + 1}: ${err.error}`).join('\n');
      console.warn(`Some files could not be compared:\n${errorMessages}`);
      
      // Check if any errors are about files not found
      const fileNotFoundErrors = errors.filter(err => 
        err.error.includes('not found') || 
        err.error.includes('no such file') ||
        err.error.includes('could not be found')
      );
      
      if (fileNotFoundErrors.length > 0) {
        // Show a specific message for file not found errors
        showError(`One or more files could not be found. Please check that the file paths are correct.`);
      } else {
        // Show a generic message for other errors
        showError(`Some files could not be compared. Please check your file paths.`);
      }
    }
  }
  
  function renderSideBySideDiff(diffText, resultItem) {
    const file1Content = resultItem.querySelector('.file1-content');
    const file2Content = resultItem.querySelector('.file2-content');
    if (!file1Content || !file2Content) return;

    // In raw mode, request the original file contents from the server
    if (rawModeEnabled) {
        const file1Path = resultItem.querySelector('.file-path-link[data-path]')?.getAttribute('data-path');
        const file2Path = resultItem.querySelectorAll('.file-path-link[data-path]')?.[1]?.getAttribute('data-path');
        
        if (file1Path && file2Path) {
            // Get original file contents
            Promise.all([
                fetch(`/api/file-content?path=${encodeURIComponent(file1Path)}`),
                fetch(`/api/file-content?path=${encodeURIComponent(file2Path)}`)
            ])
            .then(responses => Promise.all(responses.map(r => r.text())))
            .then(([content1, content2]) => {
                renderRawContent(content1, file1Content);
                renderRawContent(content2, file2Content);
                
                // Apply raw mode styling
                const diffViewContent = resultItem.querySelector('.diff-view-content');
                if (diffViewContent) {
                    diffViewContent.classList.add('raw-mode');
                }
            })
            .catch(error => {
                console.error('Error fetching raw file contents:', error);
                // Fallback to diff-based rendering if fetch fails
                renderDiffContent(diffText, resultItem);
            });
            return;
        }
    }

    // Normal diff rendering for non-raw mode
    renderDiffContent(diffText, resultItem);
}

function renderDiffContent(diffText, resultItem) {
    const file1Content = resultItem.querySelector('.file1-content');
    const file2Content = resultItem.querySelector('.file2-content');
    if (!file1Content || !file2Content) return;

    file1Content.innerHTML = '';
    file2Content.innerHTML = '';

    const lines = diffText.split('\n');
    let inHeader = true;
    let file1LineNumber = 0;
    let file2LineNumber = 0;
    let currentHunk = 0;
    let skipFirstHunk = false;

    // Check if the first hunk is just a filename diff
    for (let i = 0; i < lines.length; i++) {
        if (lines[i].startsWith('@@')) {
            const nextLine = lines[i+1] || '';
            const nextNextLine = lines[i+2] || '';
            const nextNextNextLine = lines[i+3] || '';
            if (nextLine.startsWith('-') && nextNextLine.startsWith('+') && 
                (nextNextNextLine.startsWith('@@') || nextNextNextLine === '')) {
                skipFirstHunk = true;
            }
            break;
        }
    }

    // Alignment buffers
    let leftBuffer = [];
    let rightBuffer = [];

    function flushBuffers() {
        // Only add empty lines if there's a meaningful relationship between left and right
        const leftHasContent = leftBuffer.some(item => item.type !== 'empty');
        const rightHasContent = rightBuffer.some(item => item.type !== 'empty');

        // Special handling for deletions followed by a single addition
        if (leftBuffer.length > 1 && leftBuffer.every(item => item.type === 'deletion') && 
            rightBuffer.length === 1 && rightBuffer[0].type === 'addition') {
            // Don't pad with empty lines, just show deletions and the single addition aligned at top
            leftBuffer.forEach((l, i) => {
                appendLine(file1Content, l.lineNumber, l.content, l.type);
                if (i === 0) {
                    // Show the addition aligned with first deletion
                    appendLine(file2Content, rightBuffer[0].lineNumber, rightBuffer[0].content, rightBuffer[0].type);
                } else {
                    // No empty lines needed for remaining deletions
                    appendLine(file2Content, '', '', 'empty');
                }
            });
        } else {
            // Normal case: render both buffers with proper alignment
            const maxLength = Math.max(leftBuffer.length, rightBuffer.length);
            for (let i = 0; i < maxLength; i++) {
                const l = i < leftBuffer.length ? leftBuffer[i] : { type: 'empty', lineNumber: '', content: '' };
                const r = i < rightBuffer.length ? rightBuffer[i] : { type: 'empty', lineNumber: '', content: '' };
                
                appendLine(file1Content, l.lineNumber, l.content, l.type);
                appendLine(file2Content, r.lineNumber, r.content, r.type);
            }
        }

        leftBuffer = [];
        rightBuffer = [];
    }

    for (let i = 0; i < lines.length; i++) {
        const line = lines[i];
        if (inHeader && (line.startsWith('---') || line.startsWith('+++') || line.startsWith('diff') || line.startsWith('index'))) {
            continue;
        }

        if (line.startsWith('@@')) {
            inHeader = false;
            currentHunk++;
            if (skipFirstHunk && currentHunk === 1) {
                while (i < lines.length && !lines[i].startsWith('@@')) { i++; }
                i--;
                continue;
            }
            const match = line.match(/@@ -(\d+),\d+ \+(\d+),\d+ @@/);
            if (match) {
                file1LineNumber = parseInt(match[1]) - 1;
                file2LineNumber = parseInt(match[2]) - 1;
            }
            flushBuffers();
            continue;
        }

        inHeader = false;

        // Group related changes
        if (line.startsWith('-')) {
            // Look ahead for related additions
            let j = i + 1;
            let additionCount = 0;
            while (j < lines.length && lines[j].startsWith('+')) {
                additionCount++;
                j++;
            }

            // Add current deletion to left buffer
            file1LineNumber++;
            leftBuffer.push({ type: 'deletion', lineNumber: file1LineNumber, content: line.substring(1) });

            // If there are additions following, process them
            if (additionCount > 0) {
                for (let k = 0; k < additionCount; k++) {
                    i++;
                    file2LineNumber++;
                    rightBuffer.push({ type: 'addition', lineNumber: file2LineNumber, content: lines[i].substring(1) });
                }
                flushBuffers();
            }
            // For consecutive deletions, wait before flushing
            else if (!lines[i + 1]?.startsWith('-')) {
                flushBuffers();
            }
        } else if (line.startsWith('+')) {
          file2LineNumber++;
          rightBuffer.push({ type: 'addition', lineNumber: file2LineNumber, content: line.substring(1) });
          flushBuffers();
        } else if (line.startsWith(' ')) {
          file1LineNumber++;
          file2LineNumber++;
          leftBuffer.push({ type: 'context', lineNumber: file1LineNumber, content: line.substring(1) });
          rightBuffer.push({ type: 'context', lineNumber: file2LineNumber, content: line.substring(1) });
          flushBuffers();
        }
    }

    // Flush any remaining lines
    if (leftBuffer.length > 0 || rightBuffer.length > 0) {
        flushBuffers();
    }
  }
  
  function renderUnifiedDiff(diffText, resultItem) {
    const unifiedDiff = resultItem.querySelector('.unified-diff');
    if (!unifiedDiff) return;
    
    // Parse the unified diff format to skip filename diff
    const lines = diffText.split('\n');
    let skipFirstHunk = false;
    let currentHunk = 0;
    let processedDiff = '';
    
    // Check if the first hunk is just a filename diff (we want to skip it)
    for (let i = 0; i < lines.length; i++) {
      if (lines[i].startsWith('@@')) {
        // Found first hunk header
        const nextLine = lines[i+1] || '';
        const nextNextLine = lines[i+2] || '';
        const nextNextNextLine = lines[i+3] || '';
        
        // If the next two lines are just - and + and then another @@ or end of file,
        // this is likely just a filename diff
        if (nextLine.startsWith('-') && nextNextLine.startsWith('+') && 
            (nextNextNextLine.startsWith('@@') || nextNextNextLine === '')) {
          skipFirstHunk = true;
        }
        break;
      }
    }
    
    let inHeader = true;
    
    for (let i = 0; i < lines.length; i++) {
      const line = lines[i];
      
      // Skip header lines
      if (inHeader && (line.startsWith('---') || line.startsWith('+++') || line.startsWith('diff') || line.startsWith('index'))) {
        continue;
      }
      
      // Check for hunk header
      if (line.startsWith('@@')) {
        inHeader = false;
        currentHunk++;
        
        // Skip the first hunk if it's just a filename diff
        if (skipFirstHunk && currentHunk === 1) {
          // Skip until the next hunk header or end of file
          while (i < lines.length && !lines[i].startsWith('@@')) {
            i++;
          }
          i--; // Adjust for the loop increment
          continue;
        }
        
        processedDiff += line + '\n';
        continue;
      }
      
      inHeader = false;
      
      // Add the line to the processed diff
      processedDiff += line + '\n';
    }
    
    unifiedDiff.textContent = processedDiff;
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
  
  function parseDiffStats(diffText) {
    let additions = 0;
    let deletions = 0;
    
    const lines = diffText.split('\n');
    let inHeader = true;
    
    for (let i = 0; i < lines.length; i++) {
      const line = lines[i];
      
      // Skip header lines
      if (inHeader && (line.startsWith('---') || line.startsWith('+++') || line.startsWith('diff') || line.startsWith('index'))) {
        continue;
      }
      
      // Check for hunk header
      if (line.startsWith('@@')) {
        inHeader = false;
        continue;
      }
      
      // Count additions and deletions
      if (line.startsWith('+')) {
        additions++;
      } else if (line.startsWith('-')) {
        deletions++;
      }
    }
    
    return {
      additions,
      deletions,
      changes: Math.min(additions, deletions)
    };
  }
  
  function filterDiffs(filter) {
    currentFilter = filter;
    
    // Update filter buttons
    showAllDiffsBtn.classList.toggle('active', filter === 'all');
    showChangedDiffsBtn.classList.toggle('active', filter === 'changed');
    showIdenticalDiffsBtn.classList.toggle('active', filter === 'identical');
    
    // Filter diff results
    const resultItems = document.querySelectorAll('.diff-result-item');
    resultItems.forEach(item => {
      const status = item.dataset.status;
      
      if (filter === 'all' || 
          (filter === 'changed' && status === 'different') || 
          (filter === 'identical' && status === 'identical')) {
        item.style.display = '';
      } else {
        item.style.display = 'none';
      }
    });
    
    // Filter navigation items
    const navItems = document.querySelectorAll('.navigation-item');
    navItems.forEach(item => {
      const index = item.dataset.resultIndex;
      const resultItem = document.querySelector(`.diff-result-item[data-result-index="${index}"]`);
      
      if (resultItem && resultItem.style.display !== 'none') {
        item.style.display = '';
      } else {
        item.style.display = 'none';
      }
    });
  }
  
  function setMultiViewMode(mode) {
    currentViewMode = mode;
    
    // Update view mode buttons
    multiSideBySideBtn.classList.toggle('active', mode === 'side-by-side');
    multiUnifiedBtn.classList.toggle('active', mode === 'unified');
    
    // Re-render all diffs
    compareAllFiles();
  }
  
  function toggleMultiWordWrap() {
    wordWrapEnabled = !wordWrapEnabled;
    multiWordWrapBtn.classList.toggle('active', wordWrapEnabled);
    applyViewSettings();
  }
  
  function toggleMultiLineNumbers() {
    lineNumbersEnabled = !lineNumbersEnabled;
    multiLineNumbersBtn.classList.toggle('active', lineNumbersEnabled);
    applyViewSettings();
  }
  
  function applyViewSettings() {
    // Apply word wrap
    document.querySelectorAll('.multi-diff-results .line-content').forEach(el => {
      el.style.whiteSpace = wordWrapEnabled ? 'pre-wrap' : 'pre';
    });
    
    document.querySelectorAll('.multi-diff-results .unified-diff').forEach(el => {
      el.style.whiteSpace = wordWrapEnabled ? 'pre-wrap' : 'pre';
    });
    
    // Apply word wrap to the multi-diff container (equivalent to diffContent.classList.toggle('word-wrap'))
    const multiDiffContainers = document.querySelectorAll('.multi-diff-container, .diff-result-content');
    multiDiffContainers.forEach(container => {
      if (wordWrapEnabled) {
        container.classList.add('word-wrap');
      } else {
        container.classList.remove('word-wrap');
      }
    });
    
    // Apply line numbers
    document.querySelectorAll('.multi-diff-results .line-number').forEach(el => {
      el.style.display = lineNumbersEnabled ? '' : 'none';
    });
  }
  
  // Function to check URL parameters for focus mode
  function checkFocusModeParam() {
    const urlParams = new URLSearchParams(window.location.search);
    const focusParam = urlParams.get('focus');
    
    if (focusParam === 'true') {
      enableFocusMode();
    }
  }
  
  // Add functions to check URL parameters for theme and focus mode
  function checkUrlParams() {
    const urlParams = new URLSearchParams(window.location.search);
    
    // Check for theme parameter
    const themeParam = urlParams.get('theme');
    if (themeParam) {
      // Parse theme parameter (format: themeName-variant, e.g. vscode-dark)
      const [themeName, variant] = themeParam.split('-');
      const isDark = variant === 'dark';
      
      // Validate theme name
      const validThemes = ['default', 'vscode', 'github', 'gitlab', 'material', 'cloudflare', 'obsidian', 'editor'];
      
      if (validThemes.includes(themeName)) {
        // Set the theme
        localStorage.setItem('themeStyle', themeName);
        localStorage.setItem('theme', isDark ? 'dark' : 'light');
        
        // Apply theme through script.js if available
        if (window.applyTheme) {
          window.applyTheme(themeName, isDark);
        }
        
        // Update focus mode theme toggle if it exists
        if (focusModeThemeToggle) {
          focusModeThemeToggle.checked = isDark;
        }
      }
    }
  
    // Check for focus mode parameter
    const focusParam = urlParams.get('focus');
    if (focusParam === 'true') {
      enableFocusMode();
    }
  }
  
  // Function to toggle focus mode
  function toggleFocusMode() {
    if (isFocusMode) {
      disableFocusMode();
    } else {
      enableFocusMode();
    }
  }
  
  // Function to share the current diff
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
  
  // Function to enable focus mode
  function enableFocusMode() {
    document.body.classList.add('focus-mode');
    isFocusMode = true;
    
    // Update button state
    if (multiFocusModeBtn) {
      multiFocusModeBtn.classList.add('active');
      multiFocusModeBtn.title = 'Exit focus mode';
    }
    
    // Sync theme toggle state
    if (focusModeThemeToggle) {
      const isDarkMode = localStorage.getItem('theme') === 'dark' || 
                        (window.matchMedia('(prefers-color-scheme: dark)').matches && !localStorage.getItem('theme'));
      focusModeThemeToggle.checked = isDarkMode;
    }
    
    // Update URL parameter without reloading the page
    const url = new URL(window.location);
    url.searchParams.set('focus', 'true');
    window.history.pushState({}, '', url);
  }
  
  // Function to disable focus mode
  function disableFocusMode() {
    document.body.classList.remove('focus-mode');
    isFocusMode = false;
    
    // Update button state
    if (multiFocusModeBtn) {
      multiFocusModeBtn.classList.remove('active');
      multiFocusModeBtn.title = 'Enter focus mode';
    }
    
    // Update URL parameter without reloading the page
    const url = new URL(window.location);
    url.searchParams.set('focus', 'false');
    window.history.pushState({}, '', url);
  }
  
  function collapseAllDiffs() {
    document.querySelectorAll('.diff-result-content').forEach(el => {
      el.classList.add('collapsed');
      // Also shrink the resizable wrapper
      const resizeWrapper = el.closest('.diff-resize-wrapper');
      if (resizeWrapper) {
        resizeWrapper.style.height = '0px';
        resizeWrapper.style.minHeight = '0px';
        resizeWrapper.style.overflow = 'hidden';
      }
    });
    document.querySelectorAll('.toggle-diff-btn').forEach(btn => {
      btn.innerHTML = '<i class="fas fa-angle-down"></i>';
      btn.title = 'Expand';
    });
  }

  function expandAllDiffs() {
    document.querySelectorAll('.diff-result-content').forEach(el => {
      el.classList.remove('collapsed');
      // Restore the resizable wrapper
      const resizeWrapper = el.closest('.diff-resize-wrapper');
      if (resizeWrapper) {
        resizeWrapper.style.height = '';
        resizeWrapper.style.minHeight = '';
        resizeWrapper.style.overflow = '';
      }
    });
    document.querySelectorAll('.toggle-diff-btn').forEach(btn => {
      btn.innerHTML = '<i class="fas fa-angle-up"></i>';
      btn.title = 'Collapse';
    });
  }
  
  function generateReport() {
    if (diffResults.length === 0) {
      showError('No diff results to generate report from');
      return;
    }
    
    // Create a report in HTML format
    const reportContent = generateHtmlReport(diffResults);
    
    // Create a blob and open it in a new tab
    const blob = new Blob([reportContent], { type: 'text/html' });
    const url = URL.createObjectURL(blob);
    
    // Open the report in a new window
    const reportWindow = window.open(url, '_blank');
    
    // Make fileUrlConfig available to the report window
    if (reportWindow && window.fileUrlConfig) {
      reportWindow.fileUrlConfig = window.fileUrlConfig;
    }
    
    // Show success message
    showSuccess('Report opened in a new tab');
  }
  
  function generateHtmlReport(results) {
    // Calculate summary statistics
    let totalAdditions = 0;
    let totalDeletions = 0;
    let totalChanges = 0;
    let identicalCount = 0;
    let differentCount = 0;
    
    results.forEach(result => {
      const { diff, identical } = result;
      
      // Parse the diff to get statistics
      const stats = parseDiffStats(diff);
      totalAdditions += stats.additions;
      totalDeletions += stats.deletions;
      totalChanges += stats.changes;
      
      if (identical) {
        identicalCount++;
      } else {
        differentCount++;
      }
    });
    
    // Generate HTML content
    let html = `
      <!DOCTYPE html>
      <html lang="en">
      <head>
        <meta charset="UTF-8">
        <meta name="viewport" content="width=device-width, initial-scale=1.0">
        <title>Diffie Report</title>
        <link rel="stylesheet" href="https://cdnjs.cloudflare.com/ajax/libs/font-awesome/5.15.4/css/all.min.css">
        <script>
          // Define the file URL configuration
          window.fileUrlConfig = {
            enabled: ${JSON.stringify(window.fileUrlConfig ? window.fileUrlConfig.enabled : false)},
            prefix: ${JSON.stringify(window.fileUrlConfig ? window.fileUrlConfig.prefix : '')},
            useAbsolutePaths: ${JSON.stringify(window.fileUrlConfig ? window.fileUrlConfig.useAbsolutePaths : false)}
          };
          
          // Function to handle file link clicks
          function openFileLink(filePath) {
            if (!filePath) return;
            
            try {
              // First try using the embedded configuration
              if (window.fileUrlConfig && window.fileUrlConfig.enabled && window.fileUrlConfig.prefix) {
                const url = window.fileUrlConfig.prefix + filePath;
                window.open(url, '_blank');
                return;
              }
              
              // Fallback: Try to get configuration from opener window
              if (window.opener && window.opener.fileUrlConfig) {
                const openerConfig = window.opener.fileUrlConfig;
                if (openerConfig.enabled && openerConfig.prefix) {
                  const url = openerConfig.prefix + filePath;
                  window.open(url, '_blank');
                  return;
                }
              }
              
              // Last resort: Just show the filename in an alert
              console.log('Unable to open file: ' + filePath);
              alert('Unable to open file: ' + filePath + '\\n\\nFile URL configuration is not available.');
            } catch (e) {
              console.error('Error opening file:', e);
              alert('Error opening file: ' + filePath);
            }
          }
          
          // Function to scroll to an element by ID
          function scrollToElement(id) {
            const element = document.getElementById(id);
            if (element) {
              element.scrollIntoView({ behavior: 'smooth' });
            }
          }
          
          // Initialize event listeners when DOM is loaded
          document.addEventListener('DOMContentLoaded', function() {
            // Add click event listeners to all file links
            document.querySelectorAll('.file-link').forEach(function(link) {
              link.addEventListener('click', function() {
                const filePath = this.getAttribute('data-path');
                if (filePath) {
                  openFileLink(filePath);
                }
              });
            });
          });
        </script>
        <style>
          body {
            font-family: 'Segoe UI', Tahoma, Geneva, Verdana, sans-serif;
            line-height: 1.6;
            color: #333;
            max-width: 1200px;
            margin: 0 auto;
            padding: 20px;
          }
          .report-header {
            text-align: center;
            margin-bottom: 20px;
            padding-bottom: 15px;
            border-bottom: 1px solid #eaeaea;
            position: relative;
          }
          .report-title {
            font-size: 28px;
            margin-bottom: 10px;
          }
          .report-date {
            color: #666;
            font-size: 14px;
          }
          .download-btn {
            position: absolute;
            top: 0;
            right: 0;
            padding: 10px 15px;
            background-color: #3b82f6;
            color: white;
            border: none;
            border-radius: 5px;
            cursor: pointer;
            font-family: inherit;
            font-size: 14px;
            box-shadow: 0 2px 4px rgba(0, 0, 0, 0.1);
            display: flex;
            align-items: center;
            gap: 8px;
          }
          .download-btn:hover {
            background-color: #2563eb;
          }
          .summary {
            background-color: #f9f9f9;
            padding: 15px;
            border-radius: 5px;
            margin-bottom: 20px;
          }
          .summary h2 {
            margin-top: 0;
            border-bottom: 1px solid #eaeaea;
            padding-bottom: 10px;
            font-size: 20px;
          }
          .stats-container {
            display: flex;
            justify-content: space-between;
            flex-wrap: wrap;
            gap: 20px;
          }
          .stats-group {
            flex: 1;
            min-width: 250px;
          }
          .stat-item {
            margin-bottom: 10px;
            display: flex;
            align-items: center;
          }
          .stat-label {
            font-weight: bold;
            margin-right: 10px;
            min-width: 120px;
          }
          .additions {
            color: #047857;
          }
          .deletions {
            color: #b91c1c;
          }
          .changes {
            color: #92400e;
          }
          .diff-results {
            margin-top: 20px;
          }
          .diff-results h2 {
            font-size: 20px;
            margin-bottom: 15px;
          }
          .diff-item {
            margin-bottom: 25px;
            border: 1px solid #eaeaea;
            border-radius: 5px;
            overflow: hidden;
            box-shadow: 0 2px 4px rgba(0, 0, 0, 0.05);
          }
          .diff-header {
            background-color: #f3f4f6;
            padding: 12px 15px;
            border-bottom: 1px solid #eaeaea;
            display: flex;
            justify-content: space-between;
            align-items: center;
            flex-wrap: wrap;
            gap: 10px;
          }
          .diff-files {
            font-weight: bold;
            display: none; /* Hide the filename diff */
          }
          .diff-stats {
            display: flex;
            gap: 15px;
          }
          .diff-content {
            padding: 0;
            overflow-x: auto;
          }
          .diff-content pre {
            margin: 0;
            padding: 15px;
            font-family: 'Courier New', Courier, monospace;
            font-size: 14px;
            line-height: 1.5;
            white-space: pre;
          }
          .identical-message {
            padding: 15px;
            text-align: center;
            color: #047857;
            font-weight: bold;
            width: 100%;
            background-color: #f0fdf4;
            border-top: 1px solid #eaeaea;
          }
          .line-addition {
            background-color: #d1fae5;
            color: #065f46;
          }
          .line-deletion {
            background-color: #fee2e2;
            color: #991b1b;
          }
          .line.empty {
            background-color: #f9fafb;
          }
          .side-by-side-container {
            width: 100%;
            border: 1px solid #eaeaea;
            font-family: 'Courier New', Courier, monospace;
            font-size: 14px;
          }
          .side-by-side-header {
            display: flex;
            width: 100%;
            background-color: #f3f4f6;
            border-bottom: 1px solid #eaeaea;
          }
          .file-column {
            flex: 1;
            padding: 8px;
            font-weight: bold;
            text-align: center;
            border-right: 1px solid #eaeaea;
          }
          .file-column:last-child {
            border-right: none;
          }
          .file-link {
            cursor: pointer;
            color: #3b82f6;
            text-decoration: underline;
            display: inline-flex;
            align-items: center;
            gap: 5px;
            padding: 2px 4px;
            border-radius: 3px;
            transition: all 0.2s ease;
          }
          .file-link:hover {
            color: #2563eb;
            background-color: rgba(59, 130, 246, 0.1);
          }
          .file-link i {
            font-size: 0.8em;
          }
          .side-by-side-diff {
            display: flex;
            width: 100%;
          }
          .file1-content, .file2-content {
            flex: 1;
            overflow-x: auto;
            padding: 0;
            border-right: 1px solid #eaeaea;
          }
          .file2-content {
            border-right: none;
          }
          .line {
            display: flex;
            min-height: 1.5em;
          }
          .line.deletion {
            background-color: #fee2e2;
          }
          .line.addition {
            background-color: #d1fae5;
          }
          .line.empty {
            background-color: #f9fafb;
          }
          .line-number {
            min-width: 3em;
            text-align: right;
            padding: 0 0.5em;
            color: #6b7280;
            border-right: 1px solid #eaeaea;
            user-select: none;
          }
          .line-content {
            padding: 0 0.5em;
            white-space: pre;
            overflow-x: visible;
            flex: 1;
          }
          .hunk-separator {
            height: 1em;
            background-color: #f3f4f6;
            border-top: 1px solid #eaeaea;
            border-bottom: 1px solid #eaeaea;
          }
          .file-pairs-list {
            margin-top: 30px;
            padding: 15px;
            background-color: #f9f9f9;
            border-radius: 5px;
            border: 1px solid #eaeaea;
          }
          .file-pairs-list h2 {
            margin-top: 0;
            border-bottom: 1px solid #eaeaea;
            padding-bottom: 10px;
            font-size: 20px;
          }
          .file-pair-item {
            padding: 8px 0;
            border-bottom: 1px solid #eaeaea;
            display: flex;
            justify-content: space-between;
            align-items: center;
          }
          .file-pair-item:last-child {
            border-bottom: none;
          }
          .file-pair-paths {
            flex: 1;
          }
          .file-pair-status {
            padding: 3px 8px;
            border-radius: 4px;
            font-size: 12px;
            font-weight: bold;
          }
          .status-identical {
            background-color: #d1fae5;
            color: #065f46;
          }
          .status-different {
            background-color: #fee2e2;
            color: #991b1b;
          }
          .file-path {
            font-family: 'Courier New', Courier, monospace;
            font-size: 13px;
            word-break: break-all;
            padding: 4px 0;
            margin-bottom: 2px;
          }
          .file-path:hover {
            background-color: rgba(0, 0, 0, 0.02);
          }
          .nav-links {
            display: flex;
            justify-content: center;
            gap: 15px;
            margin: 20px 0;
          }
          .nav-link {
            padding: 8px 15px;
            background-color: #f3f4f6;
            border-radius: 5px;
            text-decoration: none;
            color: #4b5563;
            font-weight: 500;
            transition: all 0.2s ease;
          }
          .nav-link:hover {
            background-color: #e5e7eb;
            color: #1f2937;
          }
          .diff-navigation {
            position: sticky;
            top: 0;
            background-color: #fff;
            padding: 10px 0;
            z-index: 100;
            border-bottom: 1px solid #eaeaea;
            margin-bottom: 15px;
          }
          @media print {
            body {
              font-size: 12px;
            }
            .side-by-side-diff {
              font-size: 11px;
            }
            .line-content {
              white-space: pre-wrap;
            }
            .page-break {
              page-break-before: always;
            }
            .diff-navigation {
              display: none;
            }
          }
        </style>
      </head>
      <body>
        <div class="report-header">
          <h1 class="report-title">Diffie Comparison Report</h1>
          <div class="report-date">Generated on ${new Date().toLocaleString()}</div>
          <button class="download-btn" onclick="downloadReport()">
            <i class="fas fa-download"></i> Download Report
          </button>
        </div>
        
        <script>
          function downloadReport() {
            const a = document.createElement('a');
            a.href = window.location.href;
            a.download = 'diffie-report-${new Date().toISOString().slice(0, 10)}.html';
            document.body.appendChild(a);
            a.click();
            document.body.removeChild(a);
          }
        </script>
        
        <div class="summary">
          <h2>Summary</h2>
          <div class="stats-container">
            <div class="stats-group">
              <div class="stat-item">
                <span class="stat-label">Total File Pairs:</span>
                <span>${results.length}</span>
              </div>
              <div class="stat-item">
                <span class="stat-label">Different Files:</span>
                <span>${differentCount}</span>
              </div>
              <div class="stat-item">
                <span class="stat-label">Identical Files:</span>
                <span>${identicalCount}</span>
              </div>
            </div>
            <div class="stats-group">
              <div class="stat-item">
                <span class="stat-label additions">Additions:</span>
                <span>${totalAdditions}</span>
              </div>
              <div class="stat-item">
                <span class="stat-label deletions">Deletions:</span>
                <span>${totalDeletions}</span>
              </div>
              <div class="stat-item">
                <span class="stat-label changes">Changes:</span>
                <span>${totalChanges}</span>
              </div>
            </div>
          </div>
        </div>
        
        <div class="nav-links">
          <a href="#diff-results" class="nav-link" onclick="scrollToElement('diff-results'); return false;">
            <i class="fas fa-code-branch"></i> Diff Results
          </a>
          <a href="#file-pairs" class="nav-link" onclick="scrollToElement('file-pairs'); return false;">
            <i class="fas fa-list"></i> File Pairs List
          </a>
        </div>
        
        <div id="diff-results" class="diff-results">
          <div class="diff-navigation">
            <h2>Diff Results</h2>
          </div>
    `;
    
    // First, show only the different files
    const differentFiles = results.filter(result => !result.identical);
    
    // Add each diff result for different files
    differentFiles.forEach((result, index) => {
      const { file1, file2, diff } = result;
      const stats = parseDiffStats(diff);
      
      html += `
        <div id="diff-${index}" class="diff-item${index > 0 ? ' page-break' : ''}">
          <div class="diff-header">
            <div class="diff-files">
              ${getFileName(file1)} ↔ ${getFileName(file2)}
            </div>
            <div class="diff-stats">
              <div class="stat-item">
                <span class="additions">+${stats.additions}</span>
              </div>
              <div class="stat-item">
                <span class="deletions">-${stats.deletions}</span>
              </div>
              <div class="stat-item">
                <span class="changes">~${stats.changes}</span>
              </div>
            </div>
          </div>
          <div class="diff-content">
            <div class="side-by-side-container">
              <div class="side-by-side-header">
                <div class="file-column">
                  <span class="file-link" data-path="${file1}" title="Open file in new tab">
                    <i class="fas fa-external-link-alt"></i> ${getFileName(file1)}
                  </span>
                </div>
                <div class="file-column">
                  <span class="file-link" data-path="${file2}" title="Open file in new tab">
                    <i class="fas fa-external-link-alt"></i> ${getFileName(file2)}
                  </span>
                </div>
              </div>
              ${(() => {
                // Generate side-by-side diff content
                const sideBySideDiff = formatSideBySideDiffForReport(diff);
                return `
                  <div class="side-by-side-diff">
                    <div class="file1-content">${sideBySideDiff.file1}</div>
                    <div class="file2-content">${sideBySideDiff.file2}</div>
                  </div>
                `;
              })()}
            </div>
          </div>
        </div>
      `;
    });
    
    // Add file pairs list at the end
    html += `
        </div>
        
        <div id="file-pairs" class="file-pairs-list">
          <h2>File Pairs List</h2>
    `;
    
    // Add each file pair
    results.forEach((result, index) => {
      const { file1, file2, identical } = result;
      
      html += `
        <div class="file-pair-item">
          <div class="file-pair-paths">
            <div class="file-path">
              <span class="file-link" data-path="${file1}" title="Open file in new tab">
                <i class="fas fa-external-link-alt"></i> ${file1}
              </span>
            </div>
            <div class="file-path">
              <span class="file-link" data-path="${file2}" title="Open file in new tab">
                <i class="fas fa-external-link-alt"></i> ${file2}
              </span>
            </div>
          </div>
          <div class="file-pair-status ${identical ? 'status-identical' : 'status-different'}">
            ${identical ? 'Identical' : `<a href="#diff-${differentFiles.findIndex(d => d.file1 === file1 && d.file2 === file2)}" 
              onclick="scrollToElement('diff-${differentFiles.findIndex(d => d.file1 === file1 && d.file2 === file2)}'); return false;">Different</a>`}
          </div>
        </div>
      `;
    });
    
    html += `
        </div>
      </body>
      </html>
    `;
    
    return html;
  }
  
  function formatDiffForHtml(diff) {
    return diff
      .replace(/&/g, '&amp;')
      .replace(/</g, '&lt;')
      .replace(/>/g, '&gt;')
      .replace(/\n/g, '<br>')
      .replace(/^(\+.*?)(<br>|$)/gm, '<span class="line-addition">$1</span>$2')
      .replace(/^(-.*?)(<br>|$)/gm, '<span class="line-deletion">$1</span>$2');
  }
  
  function formatSideBySideDiffForReport(diffText) {
    let file1Html = '';
    let file2Html = '';
    
    // Parse the unified diff format
    const lines = diffText.split('\n');
    
    let inHeader = true;
    let file1LineNumber = 0;
    let file2LineNumber = 0;
    let currentHunk = 0;
    let skipFirstHunk = false;
    
    // Check if the first hunk is just a filename diff (we want to skip it)
    // Look for the pattern where there's a hunk header followed by just two lines (one - and one +)
    // that represent the filenames
    for (let i = 0; i < lines.length; i++) {
      if (lines[i].startsWith('@@')) {
        // Found first hunk header
        const nextLine = lines[i+1] || '';
        const nextNextLine = lines[i+2] || '';
        const nextNextNextLine = lines[i+3] || '';
        
        // If the next two lines are just - and + and then another @@ or end of file,
        // this is likely just a filename diff
        if (nextLine.startsWith('-') && nextNextLine.startsWith('+') && 
            (nextNextNextLine.startsWith('@@') || nextNextNextLine === '')) {
          skipFirstHunk = true;
        }
        break;
      }
    }
    
    // First pass: collect all lines and their types
    const diffLines = [];
    
    for (let i = 0; i < lines.length; i++) {
      const line = lines[i];
      
      // Skip header lines
      if (inHeader && (line.startsWith('---') || line.startsWith('+++') || line.startsWith('diff') || line.startsWith('index'))) {
        continue;
      }
      
      // Check for hunk header
      if (line.startsWith('@@')) {
        inHeader = false;
        currentHunk++;
        
        // Skip the first hunk if it's just a filename diff
        if (skipFirstHunk && currentHunk === 1) {
          // Skip until the next hunk header or end of file
          while (i < lines.length && !lines[i].startsWith('@@')) {
            i++;
          }
          i--; // Adjust for the loop increment
          continue;
        }
        
        // Extract line numbers from hunk header
        const match = line.match(/@@ -(\d+),\d+ \+(\d+),\d+ @@/);
        if (match) {
          file1LineNumber = parseInt(match[1]) - 1;
          file2LineNumber = parseInt(match[2]) - 1;
        }
        
        // Add a hunk separator
        if (diffLines.length > 0) {
          diffLines.push({ type: 'hunk-separator' });
        }
        
        continue;
      }
      
      inHeader = false;
      
      // Process diff lines
      if (line.startsWith('-')) {
        // Deletion - only in file1
        file1LineNumber++;
        diffLines.push({ 
          type: 'deletion', 
          file1Line: line.substring(1), 
          file1LineNumber: file1LineNumber 
        });
      } else if (line.startsWith('+')) {
        // Addition - only in file2
        file2LineNumber++;
        diffLines.push({ 
          type: 'addition', 
          file2Line: line.substring(1), 
          file2LineNumber: file2LineNumber 
        });
      } else if (line.startsWith(' ')) {
        // Context - in both files
        file1LineNumber++;
        file2LineNumber++;
        diffLines.push({ 
          type: 'context', 
          file1Line: line.substring(1), 
          file1LineNumber: file1LineNumber,
          file2Line: line.substring(1), 
          file2LineNumber: file2LineNumber 
        });
      }
    }
    
    // Second pass: process the lines to align additions and deletions
    let i = 0;
    while (i < diffLines.length) {
      const line = diffLines[i];
      
      if (line.type === 'hunk-separator') {
        file1Html += '<div class="hunk-separator"></div>';
        file2Html += '<div class="hunk-separator"></div>';
        i++;
        continue;
      }
      
      if (line.type === 'context') {
        // Context lines are already aligned
        file1Html += formatReportLine(line.file1LineNumber, line.file1Line, 'context');
        file2Html += formatReportLine(line.file2LineNumber, line.file2Line, 'context');
        i++;
        continue;
      }
      
      // Check if we have a deletion followed by an addition (a change)
      if (line.type === 'deletion' && 
          i + 1 < diffLines.length && 
          diffLines[i + 1].type === 'addition') {
        
        // This is a change (deletion followed by addition)
        // Align them side by side
        const deletionLine = line;
        const additionLine = diffLines[i + 1];
        
        file1Html += formatReportLine(deletionLine.file1LineNumber, deletionLine.file1Line, 'deletion');
        file2Html += formatReportLine(additionLine.file2LineNumber, additionLine.file2Line, 'addition');
        
        // Skip the next line since we've already processed it
        i += 2;
      } else if (line.type === 'deletion') {
        // Just a deletion with no matching addition
        file1Html += formatReportLine(line.file1LineNumber, line.file1Line, 'deletion');
        file2Html += '<div class="line empty"><div class="line-number"></div><div class="line-content"></div></div>';
        i++;
      } else if (line.type === 'addition') {
        // Just an addition with no matching deletion
        file1Html += '<div class="line empty"><div class="line-number"></div><div class="line-content"></div></div>';
        file2Html += formatReportLine(line.file2LineNumber, line.file2Line, 'addition');
        i++;
      } else {
        // Shouldn't get here, but just in case
        i++;
      }
    }
    
    return {
      file1: file1Html,
      file2: file2Html
    };
  }
  
  function formatReportLine(lineNumber, content, type) {
    // Escape HTML special characters
    const escapedContent = content
      .replace(/&/g, '&amp;')
      .replace(/</g, '&lt;')
      .replace(/>/g, '&gt;');
      
    return `<div class="line ${type}">
      <div class="line-number">${lineNumber}</div>
      <div class="line-content">${escapedContent}</div>
    </div>`;
  }
  
  function getFileName(path) {
    if (!path) return 'Unknown';
    return path.split('/').pop();
  }
  
  function showError(message) {
    // Use the existing error toast functionality from the main script
    const errorToast = document.getElementById('error-toast');
    const errorMessage = document.getElementById('error-message');
    
    if (errorToast && errorMessage) {
      errorMessage.textContent = message;
      errorToast.classList.remove('hidden');
      
      // Auto-hide after 5 seconds
      setTimeout(() => {
        errorToast.classList.add('hidden');
      }, 5000);
    } else {
      console.error(message);
    }
  }
  
  function showSuccess(message) {
    // Use the existing success toast functionality from the main script
    const successToast = document.getElementById('success-toast');
    const successMessage = document.getElementById('success-message');
    
    if (successToast && successMessage) {
      successMessage.textContent = message;
      successToast.classList.remove('hidden');
      
      // Auto-hide after 5 seconds
      setTimeout(() => {
        successToast.classList.add('hidden');
      }, 5000);
    } else {
      console.log(message);
    }
  }
  
  // Add collapse functionality
  const multiFileHeader = document.querySelector('.multi-file-header');
  const multiFileContainer = document.querySelector('.multi-file-container');
  const pairCount = document.querySelector('.pair-count');
  
  function updatePairCount() {
    const count = document.querySelectorAll('.file-pair').length;
    pairCount.textContent = `(${count})`;
  }
  
  multiFileHeader.addEventListener('click', () => {
    multiFileContainer.classList.toggle('collapsed');
  });
  
  // Update pair count when pairs are added or removed
  const observer = new MutationObserver(updatePairCount);
  observer.observe(filePairsContainer, { childList: true });
  
  // Initial pair count
  updatePairCount();
  
  // Raw mode state variable
  let rawModeEnabled = false;
  
  // Add raw mode button event listeners
  const rawModeBtn = document.getElementById('raw-mode-btn');
  const multiRawModeBtn = document.getElementById('multi-raw-mode-btn');
  
  if (rawModeBtn) {
    rawModeBtn.addEventListener('click', () => toggleRawMode(false));
  }
  
  if (multiRawModeBtn) {
    multiRawModeBtn.addEventListener('click', () => toggleRawMode(true));
  }
  
  function toggleRawMode(isMulti) {
    rawModeEnabled = !rawModeEnabled;
    
    const container = isMulti ? multiDiffContainer : singleDiffContainer;
    const rawModeButton = isMulti ? multiRawModeBtn : rawModeBtn;
    
    rawModeButton.classList.toggle('active', rawModeEnabled);
    
    // Toggle raw mode class on all diff view contents
    container.querySelectorAll('.diff-view-content').forEach(content => {
      content.classList.toggle('raw-mode', rawModeEnabled);
    });
    
    // If raw mode is enabled, hide empty lines and reset background colors
    if (rawModeEnabled) {
      container.querySelectorAll('.line.empty').forEach(line => {
        line.style.display = 'none';
      });
      container.querySelectorAll('.line').forEach(line => {
        line.style.background = 'none';
      });
    } else {
      // Restore normal view
      container.querySelectorAll('.line.empty').forEach(line => {
        line.style.display = '';
      });
      container.querySelectorAll('.line').forEach(line => {
        line.style.background = '';
      });
    }
  }
  
  // Modify renderSideBySideDiff to respect raw mode
  const originalRenderSideBySideDiff = renderSideBySideDiff;
  renderSideBySideDiff = function(diffText, resultItem) {
    originalRenderSideBySideDiff(diffText, resultItem);
    
    // Apply raw mode if it's enabled
    if (rawModeEnabled) {
      const diffViewContent = resultItem.querySelector('.diff-view-content');
      if (diffViewContent) {
        diffViewContent.classList.add('raw-mode');
        diffViewContent.querySelectorAll('.line.empty').forEach(line => {
          line.style.display = 'none';
        });
        diffViewContent.querySelectorAll('.line').forEach(line => {
          line.style.background = 'none';
        });
      }
    }
  };
  
  function renderRawContent(lines, resultItem, isFile1) {
    const container = isFile1 ? resultItem.querySelector('.file1-content') : resultItem.querySelector('.file2-content');
    if (!container) return;
    
    container.innerHTML = '';
    let lineNumber = 1;
    
    lines.split('\n').forEach(line => {
        // Skip diff markers
        if (line.startsWith('---') || line.startsWith('+++') || line.startsWith('@@')) {
            return;
        }
        
        // Remove diff markers if present
        const content = line.startsWith('-') || line.startsWith('+') || line.startsWith(' ') 
            ? line.substring(1) 
            : line;
            
        const lineEl = document.createElement('div');
        lineEl.className = 'line context';
        
        const lineNumberEl = document.createElement('div');
        lineNumberEl.className = 'line-number';
        lineNumberEl.textContent = lineNumber++;
        
        const lineContentEl = document.createElement('div');
        lineContentEl.className = 'line-content';
        lineContentEl.textContent = content;
        
        lineEl.appendChild(lineNumberEl);
        lineEl.appendChild(lineContentEl);
        container.appendChild(lineEl);
    });
}
});