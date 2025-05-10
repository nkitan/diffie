document.addEventListener('DOMContentLoaded', () => {
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
  const loadingIndicator = document.querySelector('.loading-indicator');
  const emptyState = document.querySelector('.empty-state');
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
  themeToggle.addEventListener('change', toggleTheme);
  toastClose.addEventListener('click', () => errorToast.classList.add('hidden'));
  document.querySelector('#success-toast .toast-close').addEventListener('click', () => {
    document.getElementById('success-toast').classList.add('hidden');
  });

  // Check for saved theme preference
  if (localStorage.getItem('theme') === 'dark' || 
      (window.matchMedia('(prefers-color-scheme: dark)').matches && !localStorage.getItem('theme'))) {
    document.body.classList.add('dark-theme');
    themeToggle.checked = true;
  }

  // Functions

  function checkUrlParams() {
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

    // Update URL with query parameters
    const url = new URL(window.location);
    url.searchParams.set('file1', file1Path);
    url.searchParams.set('file2', file2Path);
    url.searchParams.set('mode', 'server');
    window.history.pushState({}, '', url);

    // Update file names
    file1NameEl.textContent = getFileName(file1Path);
    file2NameEl.textContent = getFileName(file2Path);

    // Show loading indicator
    loadingIndicator.classList.remove('hidden');
    emptyState.classList.add('hidden');
    diffView.classList.add('hidden');
    unifiedView.classList.add('hidden');

    // Fetch diff from API
    fetch(`/api/diff?file1=${encodeURIComponent(file1Path)}&file2=${encodeURIComponent(file2Path)}`)
      .then(response => {
        if (!response.ok) {
          return response.json().then(data => {
            throw new Error(data.error || 'Failed to generate diff');
          });
        }
        return response.json();
      })
      .then(data => {
        renderDiff(data.diff);
        loadingIndicator.classList.add('hidden');
        
        // Set active view mode
        if (diffContent.classList.contains('side-by-side')) {
          diffView.classList.remove('hidden');
        } else {
          unifiedView.classList.remove('hidden');
        }
      })
      .catch(error => {
        loadingIndicator.classList.add('hidden');
        emptyState.classList.remove('hidden');
        showError(error.message);
      });
  }
  
  function compareLocalFiles() {
    if (!file1Upload.files.length || !file2Upload.files.length) {
      showError('Please select both files');
      return;
    }
    
    const file1 = file1Upload.files[0];
    const file2 = file2Upload.files[0];
    
    // Update file names
    file1NameEl.textContent = file1.name;
    file2NameEl.textContent = file2.name;
    
    // Show loading indicator
    loadingIndicator.classList.remove('hidden');
    emptyState.classList.add('hidden');
    diffView.classList.add('hidden');
    unifiedView.classList.add('hidden');
    
    // Read files
    Promise.all([
      readFileAsText(file1),
      readFileAsText(file2)
    ])
      .then(([file1Content, file2Content]) => {
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
        
        // Set active view mode
        if (diffContent.classList.contains('side-by-side')) {
          diffView.classList.remove('hidden');
        } else {
          unifiedView.classList.remove('hidden');
        }
      })
      .catch(error => {
        loadingIndicator.classList.add('hidden');
        emptyState.classList.remove('hidden');
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

  function renderDiff(diffText) {
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

    for (let i = 0; i < lines.length; i++) {
      const line = lines[i];
      
      // Skip header lines
      if (inHeader && (line.startsWith('---') || line.startsWith('+++') || line.startsWith('diff') || line.startsWith('index'))) {
        continue;
      }
      
      // Check for hunk header
      if (line.startsWith('@@')) {
        inHeader = false;
        
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
        appendLine(file1Content, file1LineNumber, line.substring(1), 'deletion');
      } else if (line.startsWith('+')) {
        // Addition - only in file2
        file2LineNumber++;
        additions++;
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

  function toggleTheme() {
    document.body.classList.toggle('dark-theme');
    localStorage.setItem('theme', document.body.classList.contains('dark-theme') ? 'dark' : 'light');
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
});