// Minimal JS for view-file.html: theming, file loading, tab activation

document.addEventListener('DOMContentLoaded', () => {
  // --- Theme Handling ---
  const themeToggle = document.getElementById('theme-toggle-checkbox');
  const themeSelectorBtn = document.getElementById('theme-selector-btn');
  const themeSelectorDropdown = document.getElementById('theme-selector-dropdown');
  const themeOptions = document.querySelectorAll('.theme-option');

  // Get theme from localStorage or system
  let currentTheme = localStorage.getItem('themeStyle') || 'default';
  let isDarkMode = localStorage.getItem('theme') === 'dark' ||
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
        option.classList.add('selected');
      } else {
        option.classList.remove('selected');
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
    
    // Create a container for code lines to set proper height
    const codeContainer = document.createElement('div');
    codeContainer.className = 'code-container';
    
    // Create a container for line numbers to match height
    const gutterContainer = document.createElement('div');
    gutterContainer.className = 'gutter-container';
    
    lines.forEach((line, idx) => {
      const ln = document.createElement('div');
      ln.textContent = idx + 1;
      ln.className = 'ide-linenum';
      gutterContainer.appendChild(ln);
      
      const codeLine = document.createElement('div');
      // Preserve whitespace and tabs
      codeLine.textContent = line || '\u200b';
      codeLine.className = 'ide-codeline';
      codeContainer.appendChild(codeLine);
    });
    
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
});
