// Minimal JS for view-file.html: theming, file loading, tab activation
document.addEventListener('DOMContentLoaded', () => {
  // Initialize theme handling
  function initializeTheme() {
    const themeToggle = document.getElementById('theme-toggle-checkbox');
    const themeSelectorBtn = document.getElementById('theme-selector-btn');
    const themeSelectorDropdown = document.getElementById('theme-selector-dropdown');
    const themeOptions = document.querySelectorAll('.theme-option');

    // Make sure all theme elements exist before proceeding
    if (!themeToggle || !themeSelectorBtn || !themeSelectorDropdown || !themeOptions.length) {
      console.error('Theme elements not found');
      return;
    }

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
      // Remove all theme classes first
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

      // Update DOM state
      document.body.setAttribute('data-theme', theme);
      document.body.setAttribute('data-dark', dark ? 'true' : 'false');
      
      // Apply the selected theme
      if (theme === 'default') {
        if (dark) document.body.classList.add('dark-theme');
      } else {
        document.body.classList.add(dark ? `${theme}-dark-theme` : `${theme}-theme`);
      }

      // Update URL if theme was specified there
      if (urlParams.has('theme')) {
        const newThemeParam = `${theme}-${dark ? 'dark' : 'light'}`;
        urlParams.set('theme', newThemeParam);
        const newUrl = `${window.location.pathname}?${urlParams.toString()}`;
        window.history.replaceState({}, '', newUrl);
      }

      // Store preferences
      localStorage.setItem('themeStyle', theme);
      localStorage.setItem('theme', dark ? 'dark' : 'light');
      themeToggle.checked = dark;

      // Update dropdown state
      themeOptions.forEach(option => {
        const t = option.getAttribute('data-theme');
        const d = option.getAttribute('data-dark') === 'true';
        const isSelected = t === theme && d === dark;
        option.classList.toggle('selected', isSelected);
        option.classList.toggle('active', isSelected);
        const check = option.querySelector('.theme-check');
        if (check) check.setAttribute('aria-hidden', isSelected ? 'false' : 'true');
      });
    }

    // Initial theme application
    applyTheme(currentTheme, isDarkMode);
    themeToggle.checked = isDarkMode;

    // Theme toggle handler
    themeToggle.addEventListener('change', () => {
      isDarkMode = themeToggle.checked;
      applyTheme(currentTheme, isDarkMode);
    });

    // Theme selector handler
    themeSelectorBtn.addEventListener('click', (e) => {
      e.stopPropagation();
      themeSelectorDropdown.classList.toggle('show');
    });

    // Handle clicks outside dropdown
    document.addEventListener('click', (e) => {
      if (themeSelectorDropdown.classList.contains('show') &&
          !themeSelectorBtn.contains(e.target) &&
          !themeSelectorDropdown.contains(e.target)) {
        themeSelectorDropdown.classList.remove('show');
      }
    });

    // Theme option selection handler
    themeOptions.forEach(option => {
      option.addEventListener('click', () => {
        const newTheme = option.getAttribute('data-theme');
        const isDark = option.getAttribute('data-dark') === 'true';
        currentTheme = newTheme;
        isDarkMode = isDark;
        applyTheme(currentTheme, isDarkMode);
        themeSelectorDropdown.classList.remove('show');
      });
    });
  }

  // Initialize theme system
  initializeTheme();

  // --- File Loading ---
  const params = new URLSearchParams(window.location.search);
  const file = params.get('file');
  const filenameEl = document.getElementById('file-view-filename');
  const headingEl = document.getElementById('file-view-heading');
  const ideGutter = document.getElementById('ide-gutter');
  const ideCode = document.getElementById('ide-code');

  if (!filenameEl || !ideGutter || !ideCode) {
    console.error('Required file view elements not found');
    return;
  }

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
      if
