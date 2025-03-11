class MarkdownArea extends HTMLElement {
  constructor() {
    super();
    const shadow = this.attachShadow({ mode: 'open' });
    
    // 添加KaTeX和编辑器样式到Shadow DOM
    const style = document.createElement('style');
    style.textContent = `
      /* 整体容器样式 */
      :host {
        display: block;
        font-family: -apple-system, BlinkMacSystemFont, "Segoe UI", Roboto, "Helvetica Neue", Arial, sans-serif;
        --primary-color: #5eb2f2;
        --toolbar-bg: #f8f9fa;
        --border-color: #e0e0e0;
        --hover-color: #eaf5ff;
      }
      
      /* 内联KaTeX核心样式 */
      .katex { font: normal 1.21em KaTeX_Main, Times New Roman, serif !important; }
      .katex .base { white-space: pre-wrap; }
      
      /* 工具栏样式 */
      .toolbar {
        display: flex;
        flex-wrap: wrap;
        background-color: var(--toolbar-bg);
        border: 1px solid var(--border-color);
        border-bottom: none;
        padding: 6px;
        border-radius: 4px 4px 0 0;
      }
      
      .toolbar-group {
        display: flex;
        margin-right: 12px;
        align-items: center;
      }
      
      .toolbar-separator {
        width: 1px;
        background-color: var(--border-color);
        height: 24px;
        margin: 0 8px;
      }
      
      .toolbar-button {
        background: none;
        border: 1px solid transparent;
        border-radius: 3px;
        padding: 4px 8px;
        margin: 0 2px;
        cursor: pointer;
        font-size: 14px;
        display: flex;
        align-items: center;
        justify-content: center;
        color: #555;
        min-width: 28px;
        height: 28px;
        transition: all 0.2s;
      }
      
      .toolbar-button:hover {
        background-color: var(--hover-color);
        border-color: var(--border-color);
      }
      
      .toolbar-button svg {
        width: 16px;
        height: 16px;
        fill: currentColor;
      }
      
      .toolbar-zoom {
        display: flex;
        align-items: center;
      }
      
      .zoom-level {
        margin: 0 6px;
        font-size: 13px;
        min-width: 40px;
        text-align: center;
      }
      
      /* 编辑器容器样式 */
      .editor-container {
        display: flex;
        gap: 12px;
        position: relative;
      }
      
      #editor, #preview {
        width: 100%;
        min-height: 300px;
        padding: 15px;
        border: 1px solid var(--border-color);
        border-radius: 0 0 4px 4px;
        box-sizing: border-box;
        transition: font-size 0.2s;
      }
      
      #editor {
        font-family: 'SFMono-Regular', Consolas, 'Liberation Mono', Menlo, monospace;
        font-size: 14px;
        line-height: 1.5;
        resize: vertical;
        tab-size: 2;
        overflow-y: auto;
      }
      
      #preview {
        background-color: #fff;
        overflow-y: auto;
        line-height: 1.6;
      }
      
      /* Markdown渲染样式 */
      #preview h1, #preview h2, #preview h3 {
        margin-top: 1.5em;
        margin-bottom: 0.5em;
        border-bottom: 1px solid var(--border-color);
        padding-bottom: 0.3em;
      }
      
      #preview code {
        background-color: #f6f8fa;
        padding: 0.2em 0.4em;
        border-radius: 3px;
        font-family: 'SFMono-Regular', Consolas, 'Liberation Mono', Menlo, monospace;
        font-size: 0.9em;
      }
      
      #preview pre code {
        display: block;
        padding: 16px;
        overflow: auto;
        line-height: 1.45;
      }
      
      #preview blockquote {
        padding: 0 1em;
        color: #6a737d;
        border-left: 0.25em solid #dfe2e5;
        margin: 0 0 16px 0;
      }
      
      #preview table {
        border-collapse: collapse;
        width: 100%;
        margin-bottom: 16px;
      }
      
      #preview table th, #preview table td {
        border: 1px solid #dfe2e5;
        padding: 6px 13px;
      }
      
      #preview table tr:nth-child(2n) {
        background-color: #f6f8fa;
      }
      
      /* 调整编辑器大小时的样式 */
      .resizing {
        cursor: ns-resize;
        user-select: none;
      }
    `;

    // 创建工具栏
    const toolbar = document.createElement('div');
    toolbar.className = 'toolbar';
    toolbar.innerHTML = `
      <div class="toolbar-group">
        <button class="toolbar-button" title="加粗" data-action="bold">
          <svg viewBox="0 0 24 24"><path d="M15.6 11.8c.97-.67 1.65-1.77 1.65-2.8 0-2.21-1.79-4-4-4H8v14h5.9c2.21 0 4-1.79 4-4 0-1.23-.56-2.33-1.4-3.07zM10 7h3c.55 0 1 .45 1 1s-.45 1-1 1h-3V7zm3.5 10H10v-2h3.5c.55 0 1 .45 1 1s-.45 1-1 1z"/></svg>
        </button>
        <button class="toolbar-button" title="斜体" data-action="italic">
          <svg viewBox="0 0 24 24"><path d="M10 5v2h2.5l-3.5 10H6v2h8v-2h-2.5l3.5-10H18V5z"/></svg>
        </button>
        <button class="toolbar-button" title="代码" data-action="code">
          <svg viewBox="0 0 24 24"><path d="M9.4 16.6L4.8 12l4.6-4.6L8 6l-6 6 6 6 1.4-1.4zm5.2 0l4.6-4.6-4.6-4.6L16 6l6 6-6 6-1.4-1.4z"/></svg>
        </button>
      </div>
      
      <div class="toolbar-separator"></div>
      
      <div class="toolbar-group">
        <button class="toolbar-button" title="标题" data-action="heading">
          <svg viewBox="0 0 24 24"><path d="M3 17h18v2H3zm0-6h18v2H3zm0-6h18v2H3z"/></svg>
        </button>
        <button class="toolbar-button" title="列表" data-action="list">
          <svg viewBox="0 0 24 24"><path d="M4 10.5c-.83 0-1.5.67-1.5 1.5s.67 1.5 1.5 1.5 1.5-.67 1.5-1.5-.67-1.5-1.5-1.5zm0-6c-.83 0-1.5.67-1.5 1.5S3.17 7.5 4 7.5 5.5 6.83 5.5 6 4.83 4.5 4 4.5zm0 12c-.83 0-1.5.68-1.5 1.5s.68 1.5 1.5 1.5 1.5-.68 1.5-1.5-.67-1.5-1.5-1.5zM7 19h14v-2H7v2zm0-6h14v-2H7v2zm0-8v2h14V5H7z"/></svg>
        </button>
        <button class="toolbar-button" title="引用" data-action="quote">
          <svg viewBox="0 0 24 24"><path d="M7.17 17c.51 0 .98-.29 1.2-.74l1.42-2.84c.14-.28.21-.58.21-.89V8c0-.55-.45-1-1-1H5c-.55 0-1 .45-1 1v4c0 .55.45 1 1 1h2l-1.03 2.06c-.45.89.2 1.94 1.2 1.94zm10 0c.51 0 .98-.29 1.2-.74l1.42-2.84c.14-.28.21-.58.21-.89V8c0-.55-.45-1-1-1h-4c-.55 0-1 .45-1 1v4c0 .55.45 1 1 1h2l-1.03 2.06c-.45.89.2 1.94 1.2 1.94z"/></svg>
        </button>
      </div>
      
      <div class="toolbar-separator"></div>
      
      <div class="toolbar-group">
        <button class="toolbar-button" title="行内公式" data-action="inline-math">
          <span>分数</span>
        </button>
        <button class="toolbar-button" title="块级公式" data-action="block-math">
          <span>积分</span>
        </button>
      </div>
      
      <div class="toolbar-separator"></div>
      
      <div class="toolbar-group toolbar-zoom">
        <button class="toolbar-button" title="缩小字体" data-action="zoom-out">
          <svg viewBox="0 0 24 24"><path d="M15.5 14h-.79l-.28-.27C15.41 12.59 16 11.11 16 9.5 16 5.91 13.09 3 9.5 3S3 5.91 3 9.5 5.91 16 9.5 16c1.61 0 3.09-.59 4.23-1.57l.27.28v.79l5 4.99L20.49 19l-4.99-5zm-6 0C7.01 14 5 11.99 5 9.5S7.01 5 9.5 5 14 7.01 14 9.5 11.99 14 9.5 14zM7 9h5v1H7z"/></svg>
        </button>
        <span class="zoom-level">100%</span>
        <button class="toolbar-button" title="放大字体" data-action="zoom-in">
          <svg viewBox="0 0 24 24"><path d="M15.5 14h-.79l-.28-.27C15.41 12.59 16 11.11 16 9.5 16 5.91 13.09 3 9.5 3S3 5.91 3 9.5 5.91 16 9.5 16c1.61 0 3.09-.59 4.23-1.57l.27.28v.79l5 4.99L20.49 19l-4.99-5zm-6 0C7.01 14 5 11.99 5 9.5S7.01 5 9.5 5 14 7.01 14 9.5 11.99 14 9.5 14z"/><path d="M12 10h-2v2H9v-2H7V9h2V7h1v2h2z"/></svg>
        </button>
      </div>
    `;

    // 创建编辑器容器
    const container = document.createElement('div');
    container.className = 'editor-container';
    container.innerHTML = `
      <textarea id="editor" placeholder="在此输入Markdown文本..."></textarea>
      <div id="preview"></div>
    `;

    shadow.appendChild(style);
    shadow.appendChild(toolbar);
    shadow.appendChild(container);
    
    this._initialize();
  }

  async _initialize() {
    await this._loadDependencies();
    this._setupEditor();
    this._setupToolbar();
    this._loadContent();
  }

  _loadDependencies() {
    return new Promise((resolve) => {
      const check = () => {
        if (window.marked && window.katex && window.renderMathInElement) resolve();
        else setTimeout(check, 50);
      };
      check();
    });
  }

  _setupEditor() {
    const editor = this.shadowRoot.getElementById('editor');
    const preview = this.shadowRoot.getElementById('preview');
    let isRendering = false;
    this._zoomLevel = 100;

    // 设置默认高度
    const defaultHeight = 300;
    editor.style.height = `${defaultHeight}px`;
    preview.style.height = `${defaultHeight}px`;

    // 创建独立渲染器实例
    const renderOptions = {
      delimiters: [
        { left: '$$', right: '$$', display: true },
        { left: '$', right: '$', display: false }
      ],
      strict: false,
      output: 'html',
    };

    // 带锁的渲染函数
    const safeRender = () => {
      if (isRendering) return;
      isRendering = true;
      
      try {
        preview.innerHTML = marked.parse(editor.value);
        
        // 使用局部渲染公式
        renderMathInElement(preview, {
          ...renderOptions,
          ignoredElements: (element) => !preview.contains(element)
        });
      } catch (error) {
        console.error('Rendering error:', error);
      } finally {
        isRendering = false;
      }
    };

    // 优化输入处理
    let renderTimer;
    editor.addEventListener('input', () => {
      clearTimeout(renderTimer);
      renderTimer = setTimeout(safeRender, 250);
    });
    
    // 同步滚动
    editor.addEventListener('scroll', () => {
      const percentage = editor.scrollTop / (editor.scrollHeight - editor.clientHeight);
      preview.scrollTop = percentage * (preview.scrollHeight - preview.clientHeight);
    });

    // 为编辑器添加Tab键处理
    editor.addEventListener('keydown', (e) => {
      if (e.key === 'Tab') {
        e.preventDefault();
        const start = editor.selectionStart;
        const end = editor.selectionEnd;
        
        // 插入两个空格作为Tab
        editor.value = editor.value.substring(0, start) + '  ' + editor.value.substring(end);
        editor.selectionStart = editor.selectionEnd = start + 2;
      }
    });

    this._renderFunction = safeRender;
  }
  
  _setupToolbar() {
    const editor = this.shadowRoot.getElementById('editor');
    const zoomLevelEl = this.shadowRoot.querySelector('.zoom-level');
    
    // 设置工具栏按钮事件
    this.shadowRoot.querySelectorAll('.toolbar-button').forEach(button => {
      button.addEventListener('click', () => {
        const action = button.dataset.action;
        
        switch (action) {
          case 'bold':
            this._insertText('**', '**', '粗体文本');
            break;
          case 'italic':
            this._insertText('*', '*', '斜体文本');
            break;
          case 'code':
            this._insertText('`', '`', '代码');
            break;
          case 'heading':
            this._insertLine('## ', '标题');
            break;
          case 'list':
            this._insertLine('- ', '列表项');
            break;
          case 'quote':
            this._insertLine('> ', '引用文本');
            break;
          case 'inline-math':
            this._insertText('$', '$', '\\frac{a}{b}');
            break;
          case 'block-math':
            this._insertText('$', '$', '\\int f(x)dx');
            break;
          case 'zoom-in':
            if (this._zoomLevel < 200) {
              this._zoomLevel += 10;
              this._updateZoom();
            }
            break;
          case 'zoom-out':
            if (this._zoomLevel > 60) {
              this._zoomLevel -= 10;
              this._updateZoom();
            }
            break;
        }
      });
    });
  }
  
  _updateZoom() {
    const a = 0;
    const b = 10;
    const editor = this.shadowRoot.getElementById('editor');
    const preview = this.shadowRoot.getElementById('preview');
    const zoomLevelEl = this.shadowRoot.querySelector('.zoom-level');
    
    const fontSize = 14 * (this._zoomLevel / 100);
    editor.style.fontSize = `${fontSize}px`;
    preview.style.fontSize = `${fontSize}px`;
    zoomLevelEl.textContent = `${this._zoomLevel}%`;
  }
  
  _insertText(before, after, placeholder) {
    const editor = this.shadowRoot.getElementById('editor');
    const start = editor.selectionStart;
    const end = editor.selectionEnd;
    const selectedText = editor.value.substring(start, end);
    const replacement = selectedText || placeholder;
    
    editor.value = editor.value.substring(0, start) + before + replacement + after + editor.value.substring(end);
    
    if (!selectedText) {
      editor.selectionStart = start + before.length;
      editor.selectionEnd = start + before.length + placeholder.length;
    } else {
      editor.selectionStart = start + before.length;
      editor.selectionEnd = start + before.length + selectedText.length;
    }
    
    editor.focus();
    setTimeout(() => this._renderFunction(), 100);
  }
  
  _insertLine(prefix, placeholder) {
    const editor = this.shadowRoot.getElementById('editor');
    const start = editor.selectionStart;
    const end = editor.selectionEnd;
    const selectedText = editor.value.substring(start, end);
    
    // 检查选定文本前面是否需要添加换行符
    let insertBefore = prefix;
    if (start > 0 && editor.value.charAt(start - 1) !== '\n') {
      insertBefore = '\n' + insertBefore;
    }
    
    // 处理多行
    if (selectedText.includes('\n')) {
      const lines = selectedText.split('\n');
      const newLines = lines.map(line => prefix + line).join('\n');
      editor.value = editor.value.substring(0, start) + newLines + editor.value.substring(end);
      editor.selectionStart = start;
      editor.selectionEnd = start + newLines.length;
    } else {
      // 单行
      const replacement = selectedText || placeholder;
      editor.value = editor.value.substring(0, start) + insertBefore + replacement + editor.value.substring(end);
      
      if (!selectedText) {
        editor.selectionStart = start + insertBefore.length;
        editor.selectionEnd = start + insertBefore.length + placeholder.length;
      } else {
        editor.selectionStart = start + insertBefore.length;
        editor.selectionEnd = start + insertBefore.length + selectedText.length;
      }
    }
    
    editor.focus();
    setTimeout(() => this._renderFunction(), 100);
  }

  _loadContent() {
    const script = this.querySelector('script[type="text/markdown"]');
    let a = 0;
    if (script) {
      this.shadowRoot.getElementById('editor').value = script.textContent.trim();
      setTimeout(() => this._renderFunction(), 100);
    }
  }
}

customElements.define('markdown-area', MarkdownArea);