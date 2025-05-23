// Minimal JS for view-file.html: theming, file loading, tab activation

document.addEventListener('DOMContentLoaded', () => {
  // --- Theme Handling ---
  const themeToggle = document.getElementById('theme-toggle-checkbox');
  const themeSelectorBtn = document.getElementById('theme-selector-btn');
  const themeSelectorDropdown = document.getElementById('theme-selector-dropdown');
  const themeOptions = document.querySelectorAll('.theme-option');

  // Get theme from URL parameters, localStorage, or system
  const urlParams = new URLSearchParams(window.location.search);
  const urlTheme = urlParams.get('theme');
  let [themeStyle, themeMode] = (urlTheme || '').split('-');
  
  // If URL theme is specified, use it. Otherwise fall back to localStorage or system preferences
  let currentTheme = themeStyle || localStorage.getItem('themeStyle') || 'default';
  let isDarkMode = themeMode === 'dark' || 
    localStorage.getItem('theme') === 'dark' ||
    (window.matchMedia('(prefers-color-scheme: dark)').matches && !localStorage.getItem('theme'));

  function applyTheme(theme, dark) {
    // Remove all theme classes first (match main app logic)
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
      'obsidian-dark-theme',
      'editor-theme',
      'editor-dark-theme'
    );

    // Update URL with current theme if it was specified in URL
    const urlParams = new URLSearchParams(window.location.search);
    if (urlParams.has('theme')) {
      const newThemeParam = `${theme}-${dark ? 'dark' : 'light'}`;
      urlParams.set('theme', newThemeParam);
      const newUrl = `${window.location.pathname}?${urlParams.toString()}`;
      window.history.replaceState({}, '', newUrl);
    }
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
    } else if (theme === 'editor') {
      if (dark) {
        document.body.classList.add('editor-dark-theme');
      } else {
        document.body.classList.add('editor-theme');
      }
    }
    document.body.setAttribute('data-theme', theme);
    document.body.setAttribute('data-dark', dark ? 'true' : 'false');
    localStorage.setItem('themeStyle', theme);
    localStorage.setItem('theme', dark ? 'dark' : 'light');
    themeToggle.checked = dark;
    // Highlight selected theme in dropdown
    themeOptions.forEach(option => {
      const t = option.getAttribute('data-theme');
      const d = option.getAttribute('data-dark') === 'true';
      if (t === theme && d === dark) {
        option.classList.add('selected', 'active');
        const check = option.querySelector('.theme-check');
        if (check) check.setAttribute('aria-hidden', 'false');
      } else {
        option.classList.remove('selected', 'active');
        const check = option.querySelector('.theme-check');
        if (check) check.setAttribute('aria-hidden', 'true');
      }
    });
  }

  // Initial theme
  applyTheme(currentTheme, isDarkMode);
  themeToggle.checked = isDarkMode;

  // Theme toggle (dark/light)
  themeToggle.addEventListener('change', () => {
    isDarkMode = themeToggle.checked;
    applyTheme(currentTheme, isDarkMode);
  });

  // Theme selector dropdown (use 'show' class for consistency)
  themeSelectorBtn.addEventListener('click', (e) => {
    e.stopPropagation();
    themeSelectorDropdown.classList.toggle('show');
    // Mark the current theme as active
    themeOptions.forEach(option => {
      const t = option.getAttribute('data-theme');
      const d = option.getAttribute('data-dark') === 'true';
      if (t === currentTheme && d === isDarkMode) {
        option.classList.add('selected');
      } else {
        option.classList.remove('selected');
      }
    });
  });
  document.addEventListener('click', (e) => {
    if (themeSelectorDropdown.classList.contains('show') &&
        !themeSelectorBtn.contains(e.target) &&
        !themeSelectorDropdown.contains(e.target)) {
      themeSelectorDropdown.classList.remove('show');
    }
  });
  themeOptions.forEach(option => {
    option.addEventListener('click', () => {
      currentTheme = option.getAttribute('data-theme');
      isDarkMode = option.getAttribute('data-dark') === 'true';
      applyTheme(currentTheme, isDarkMode);
      themeSelectorDropdown.classList.remove('show');
    });
  });

  // --- File Loading ---
  const params = new URLSearchParams(window.location.search);
  const file = params.get('file');
  const filenameEl = document.getElementById('file-view-filename');
  const headingEl = document.getElementById('file-view-heading');
  const ideGutter = document.getElementById('ide-gutter');
  const ideCode = document.getElementById('ide-code');
  filenameEl.textContent = file || 'No file selected';
  if (headingEl) headingEl.textContent = file || 'No file selected';

  function renderFileWithLineNumbers(text) {
    const lines = text.split('\n');
    ideGutter.innerHTML = '';
    ideCode.innerHTML = '';
    
    const codeContainer = document.createElement('div');
    codeContainer.className = 'code-container';
    const gutterContainer = document.createElement('div');
    gutterContainer.className = 'gutter-container';
    
    let lineNumber = 1;
    for (let i = 0; i < lines.length; i++) {
      const line = lines[i];
      const nextLine = i < lines.length - 1 ? lines[i + 1] : null;
      
      if (line.startsWith('-') && nextLine && nextLine.startsWith('+')) {
        // Handle deletion followed by addition (replacement)
        const ln = document.createElement('div');
        ln.textContent = lineNumber++;
        ln.className = 'ide-linenum deletion';
        gutterContainer.appendChild(ln);
        
        const codeLine = document.createElement('div');
        codeLine.textContent = line;
        codeLine.className = 'ide-codeline deletion';
        codeContainer.appendChild(codeLine);
        
        const codeLineAdd = document.createElement('div');
        codeLineAdd.textContent = nextLine;
        codeLineAdd.className = 'ide-codeline addition';
        codeContainer.appendChild(codeLineAdd);
        i++; // Skip the next line since we've handled it
        continue;
      }
      
      if (line.startsWith('+') || !line.startsWith('-')) {
        const ln = document.createElement('div');
        ln.textContent = lineNumber++;
        ln.className = 'ide-linenum';
        if (line.startsWith('+')) ln.classList.add('addition');
        gutterContainer.appendChild(ln);
      }
      
      const codeLine = document.createElement('div');
      codeLine.textContent = line;
      codeLine.className = 'ide-codeline';
      if (line.startsWith('+')) codeLine.classList.add('addition');
      else if (line.startsWith('-')) codeLine.classList.add('deletion');
      codeContainer.appendChild(codeLine);
    }
    
    ideGutter.appendChild(gutterContainer);
    ideCode.appendChild(codeContainer);
    
    // Add scroll synchronization
    ideCode.addEventListener('scroll', () => {
      ideGutter.scrollTop = ideCode.scrollTop;
    });
  }

  if (file) {
    fetch(`/api/file?file=${encodeURIComponent(file)}`)
      .then(res => res.ok ? res.text() : Promise.reject('Failed to load file'))
      .then(text => {
        renderFileWithLineNumbers(text);
      })
      .catch(err => {
        renderFileWithLineNumbers(err);
      });
  } else {
    renderFileWithLineNumbers('No file specified.');
  }

  // --- Tab Activation (future-proof) ---
  const tabBtns = document.querySelectorAll('.tab-btn');
  const tabContents = document.querySelectorAll('.tab-content');
  tabBtns.forEach(btn => {
    btn.addEventListener('click', () => {
      tabBtns.forEach(b => b.classList.remove('active'));
      tabContents.forEach(tc => tc.classList.remove('active'));
      btn.classList.add('active');
      const tab = btn.dataset.tab;
      const tabContent = document.getElementById(`${tab}-tab`);
      if (tabContent) tabContent.classList.add('active');
    });
  });

  // Download and Share functionality
  const downloadBtn = document.getElementById('file-download-btn');
  const shareBtn = document.getElementById('file-share-btn');

  function downloadFile() {
    const file = params.get('file');
    if (!file) return;

    fetch(`/api/file?file=${encodeURIComponent(file)}`)
      .then(res => res.ok ? res.blob() : Promise.reject('Failed to load file'))
      .then(blob => {
        const url = window.URL.createObjectURL(blob);
        const a = document.createElement('a');
        a.style.display = 'none';
        a.href = url;
        // Extract filename from path
        const filename = file.split('/').pop();
        a.download = filename;
        document.body.appendChild(a);
        a.click();
        window.URL.revokeObjectURL(url);
        document.body.removeChild(a);
      })
      .catch(err => {
        console.error('Failed to download file:', err);
        // Show error toast if it exists
        const errorToast = document.getElementById('error-toast');
        const errorMessage = document.getElementById('error-message');
        if (errorToast && errorMessage) {
          errorMessage.textContent = 'Failed to download file';
          errorToast.classList.remove('hidden');
          setTimeout(() => errorToast.classList.add('hidden'), 3000);
        }
      });
  }

  function shareFile() {
    const url = window.location.href;
    // Use Web Share API if available
    if (navigator.share) {
      navigator.share({
        title: 'View File in Diffie',
        url: url
      }).catch(err => {
        console.error('Failed to share:', err);
        fallbackShare();
      });
    } else {
      fallbackShare();
    }
  }

  function fallbackShare() {
    // Fallback to copying to clipboard
    navigator.clipboard.writeText(window.location.href).then(() => {
      // Show success toast if it exists
      const successToast = document.getElementById('success-toast');
      const successMessage = document.getElementById('success-message');
      if (successToast && successMessage) {
        successMessage.textContent = 'Link copied to clipboard';
        successToast.classList.remove('hidden');
        setTimeout(() => successToast.classList.add('hidden'), 3000);
      }
    }).catch(err => {
      console.error('Failed to copy:', err);
    });
  }

  if (downloadBtn) {
    downloadBtn.addEventListener('click', downloadFile);
  }

  if (shareBtn) {
    shareBtn.addEventListener('click', shareFile);
  }
});
