// 自定义Web组件: markdown-renderer
class MarkdownRenderer extends HTMLElement {
  constructor() {
      super();
      
      // 创建Shadow DOM以隔离样式
      this.attachShadow({ mode: 'open' });
      
      // 初始化缩放级别
      this.zoomLevel = 1.0;
      
      // 创建工具栏
      this.toolbar = document.createElement('div');
      this.toolbar.className = 'toolbar';
      
      // 创建内容容器
      this.contentContainer = document.createElement('div');
      this.contentContainer.className = 'markdown-content';
      
      // 创建编辑器容器（初始隐藏）
      this.editorContainer = document.createElement('div');
      this.editorContainer.className = 'editor-container';
      this.editorContainer.style.display = 'none';
      
      // 创建编辑区
      this.editor = document.createElement('textarea');
      this.editor.className = 'markdown-editor';
      this.editorContainer.appendChild(this.editor);
      
      // 初始化历史记录堆栈用于撤销和前进功能
      this.historyStack = [];
      this.currentHistoryIndex = -1;
      
      // 引入KaTeX样式到Shadow DOM中
      const katexStyle = document.createElement('link');
      katexStyle.rel = 'stylesheet';
      katexStyle.href = 'https://cdn.jsdelivr.net/npm/katex@0.16.9/dist/katex.min.css';
      katexStyle.integrity = 'sha384-n8MVd4RsNIU0tAv4ct0nTaAbDJwPJzDEaqSD1odI+WdtXRGWt2kTvGFasHpSy3SV';
      katexStyle.crossOrigin = 'anonymous';
      
      // 添加基本样式
      const style = document.createElement('style');
      style.textContent = `
          :host {
              display: block;
              border: 1px solid #ddd;
              border-radius: 4px;
              margin: 10px 0;
              font-family: -apple-system, BlinkMacSystemFont, "Segoe UI", Helvetica, Arial, sans-serif;
          }
          
          .toolbar {
              display: flex;
              padding: 8px;
              background-color: #f5f5f5;
              border-bottom: 1px solid #ddd;
              border-top-left-radius: 4px;
              border-top-right-radius: 4px;
              position: sticky;
              top: 0;
              z-index: 10;
          }
          
          .toolbar button {
              margin-right: 5px;
              background-color: #fff;
              border: 1px solid #ddd;
              border-radius: 3px;
              padding: 5px 10px;
              cursor: pointer;
              font-size: 14px;
              display: flex;
              align-items: center;
              justify-content: center;
          }
          
          .toolbar button:hover {
              background-color: #f0f0f0;
          }
          
          .toolbar button.active {
              background-color: #e6f7ff;
              border-color: #1890ff;
              color: #1890ff;
          }
          
          .toolbar button:disabled {
              opacity: 0.5;
              cursor: not-allowed;
          }
          
          .toolbar .separator {
              width: 1px;
              background-color: #ddd;
              margin: 0 8px;
              height: 24px;
          }
          
          .toolbar .spacer {
              flex-grow: 1;
          }
          
          .markdown-content {
              padding: 20px;
              line-height: 1.6;
              color: #24292e;
              overflow-wrap: break-word;
              transition: transform 0.2s ease;
              min-height: 100px;
          }
          
          .editor-container {
              padding: 10px;
              background-color: #f8f9fa;
          }
          
          .markdown-editor {
              width: 100%;
              min-height: 300px;
              padding: 10px;
              font-family: "SFMono-Regular", Consolas, "Liberation Mono", Menlo, monospace;
              font-size: 14px;
              line-height: 1.5;
              border: 1px solid #ddd;
              border-radius: 3px;
              resize: vertical;
          }
          
          .markdown-content code:not(.hljs) {
              background-color: rgba(27, 31, 35, 0.05);
              border-radius: 3px;
              font-family: "SFMono-Regular", Consolas, "Liberation Mono", Menlo, monospace;
              font-size: 85%;
              padding: 0.2em 0.4em;
          }
          
          .markdown-content pre {
              background-color: #f6f8fa;
              border-radius: 3px;
              font-size: 85%;
              line-height: 1.45;
              overflow: auto;
              padding: 16px;
          }
          
          .markdown-content h1 { font-size: 2em; margin-top: 1.5em; }
          .markdown-content h2 { font-size: 1.5em; margin-top: 1.5em; }
          .markdown-content h3 { font-size: 1.25em; margin-top: 1.5em; }
          .markdown-content h4 { font-size: 1em; margin-top: 1.5em; }
          .markdown-content h5 { font-size: 0.875em; margin-top: 1.5em; }
          .markdown-content h6 { font-size: 0.85em; margin-top: 1.5em; }
          
          .markdown-content blockquote {
              border-left: 4px solid #dfe2e5;
              color: #6a737d;
              margin: 1em 0;
              padding: 0 1em;
          }
          
          .markdown-content table {
              border-collapse: collapse;
              border-spacing: 0;
              display: block;
              overflow: auto;
              width: 100%;
              margin: 1em 0;
          }
          
          .markdown-content table th,
          .markdown-content table td {
              border: 1px solid #dfe2e5;
              padding: 6px 13px;
          }
          
          .markdown-content table tr {
              background-color: #fff;
              border-top: 1px solid #c6cbd1;
          }
          
          .markdown-content table tr:nth-child(2n) {
              background-color: #f6f8fa;
          }
          
          .markdown-content img {
              max-width: 100%;
              box-sizing: border-box;
          }
          
          .markdown-content hr {
              background-color: #e1e4e8;
              border: 0;
              height: 0.25em;
              margin: 24px 0;
              padding: 0;
          }
          
          .math-block {
              overflow-x: auto;
              margin: 1em 0;
          }
          
          .button-icon {
              width: 16px;
              height: 16px;
              margin-right: 4px;
          }
          
          @media (max-width: 768px) {
              .toolbar button span {
                  display: none;
              }
              
              .toolbar button .button-icon {
                  margin-right: 0;
              }
          }
      `;
      
      // 将样式和组件添加到Shadow DOM
      this.shadowRoot.appendChild(katexStyle);
      this.shadowRoot.appendChild(style);
      this.shadowRoot.appendChild(this.toolbar);
      this.shadowRoot.appendChild(this.contentContainer);
      this.shadowRoot.appendChild(this.editorContainer);
      
      // 配置marked
      this._configureMarked();
      
      // 创建工具栏
      this._createToolbar();
      
      // 添加编辑器事件监听
      this.editor.addEventListener('input', () => {
          // 将当前状态添加到历史记录
          this._saveToHistory();
          this.markdownContent = this.editor.value;
          this._renderContent();
          this._updateHistoryButtonsState();
      });
      
      // 添加键盘快捷键监听
      this.editor.addEventListener('keydown', (e) => {
          // 检测Ctrl+Z (Windows/Linux) 或 Cmd+Z (Mac)
          if ((e.ctrlKey || e.metaKey) && e.key === 'z' && !e.shiftKey) {
              e.preventDefault();
              this._undo();
          }
          // 检测Ctrl+Y 或 Ctrl+Shift+Z 或 Cmd+Shift+Z (Mac)
          else if (((e.ctrlKey || e.metaKey) && e.key === 'y') || 
                  ((e.ctrlKey || e.metaKey) && e.shiftKey && e.key === 'z')) {
              e.preventDefault();
              this._redo();
          }
      });
  }
  
  connectedCallback() {
      // 获取初始Markdown内容
      this.markdownContent = this.textContent.trim();
      
      // 清空元素原始内容，避免重复显示
      while (this.firstChild) {
          this.removeChild(this.firstChild);
      }
      
      // 渲染内容
      this._renderContent();
      
      // 设置编辑器初始内容
      this.editor.value = this.markdownContent;
      
      // 初始化历史记录
      this._saveToHistory();
      this._updateHistoryButtonsState();
  }
  
  // 创建工具栏
  _createToolbar() {
      // 编辑按钮
      const editButton = this._createButton('编辑', 'edit', () => {
          const isEditing = this.editorContainer.style.display !== 'none';
          if (isEditing) {
              // 保存并退出编辑
              this.editorContainer.style.display = 'none';
              this.contentContainer.style.display = 'block';
              editButton.innerHTML = this._getIconSvg('edit') + '<span>编辑</span>';
              this.markdownContent = this.editor.value;
              this._renderContent();
          } else {
              // 进入编辑模式
              this.editorContainer.style.display = 'block';
              this.contentContainer.style.display = 'none';
              editButton.innerHTML = this._getIconSvg('save') + '<span>保存</span>';
              this.editor.focus();
          }
      });
      this.toolbar.appendChild(editButton);
      
      // 分隔符
      this.toolbar.appendChild(this._createSeparator());
      
      // 撤销按钮
      this.undoButton = this._createButton('', 'undo', () => this._undo());
      this.undoButton.disabled = true; // 初始禁用
      this.toolbar.appendChild(this.undoButton);
      
      // 前进按钮
      this.redoButton = this._createButton('', 'redo', () => this._redo());
      this.redoButton.disabled = true; // 初始禁用
      this.toolbar.appendChild(this.redoButton);
      
      // 分隔符
      this.toolbar.appendChild(this._createSeparator());
      
      // 格式化工具
      this.toolbar.appendChild(this._createFormatButton('', 'bold', '**', '**'));
      this.toolbar.appendChild(this._createFormatButton('', 'italic', '*', '*'));
      this.toolbar.appendChild(this._createFormatButton('', 'code', '`', '`'));
      this.toolbar.appendChild(this._createFormatButton('', 'link', '[', '](url)'));
      this.toolbar.appendChild(this._createFormatButton('', 'quote', '> ', ''));
      
      // 分隔符
      this.toolbar.appendChild(this._createSeparator());
      
      // 数学公式
      this.toolbar.appendChild(this._createFormatButton('', 'math-inline', '$', '$'));
      this.toolbar.appendChild(this._createFormatButton('', 'math-block', '$$\n', '\n$$'));
      
      // 分隔符
      this.toolbar.appendChild(this._createSeparator());
      
      // 插入标题
      this.toolbar.appendChild(this._createFormatButton('', 'heading', '## ', ''));
      
      // 插入列表
      this.toolbar.appendChild(this._createFormatButton('', 'list-ul', '- ', ''));
      this.toolbar.appendChild(this._createFormatButton('', 'list-ol', '1. ', ''));
      
      // 空白填充
      const spacer = document.createElement('div');
      spacer.className = 'spacer';
      this.toolbar.appendChild(spacer);
      
      // 缩放控制
      const zoomOutButton = this._createButton('', 'zoom-out', () => this._zoom(-0.1));
      const zoomResetButton = this._createButton('', 'zoom-reset', () => this._resetZoom());
      const zoomInButton = this._createButton('', 'zoom-in', () => this._zoom(0.1));
      
      this.toolbar.appendChild(zoomOutButton);
      this.toolbar.appendChild(zoomResetButton);
      this.toolbar.appendChild(zoomInButton);
  }
  
  // 创建按钮
  _createButton(text, iconName, clickHandler) {
      const button = document.createElement('button');
      button.type = 'button';
      button.innerHTML = this._getIconSvg(iconName) + `<span>${text}</span>`;
      button.addEventListener('click', clickHandler);
      return button;
  }
  
  // 创建格式化按钮
  _createFormatButton(text, iconName, prefix, suffix) {
      return this._createButton(text, iconName, () => {
          this._formatText(prefix, suffix);
      });
  }
  
  // 创建分隔符
  _createSeparator() {
      const separator = document.createElement('div');
      separator.className = 'separator';
      return separator;
  }
  
  // 获取图标SVG
  _getIconSvg(iconName) {
      const icons = {
          'edit': '<svg xmlns="http://www.w3.org/2000/svg" width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round" class="button-icon"><path d="M11 4H4a2 2 0 0 0-2 2v14a2 2 0 0 0 2 2h14a2 2 0 0 0 2-2v-7"></path><path d="M18.5 2.5a2.121 2.121 0 0 1 3 3L12 15l-4 1 1-4 9.5-9.5z"></path></svg>',
          'save': '<svg xmlns="http://www.w3.org/2000/svg" width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round" class="button-icon"><path d="M19 21H5a2 2 0 0 1-2-2V5a2 2 0 0 1 2-2h11l5 5v11a2 2 0 0 1-2 2z"></path><polyline points="17 21 17 13 7 13 7 21"></polyline><polyline points="7 3 7 8 15 8"></polyline></svg>',
          'undo': '<svg xmlns="http://www.w3.org/2000/svg" width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round" class="button-icon"><path d="M3 7v6h6"></path><path d="M21 17a9 9 0 0 0-9-9 9 9 0 0 0-6 2.3L3 13"></path></svg>',
          'redo': '<svg xmlns="http://www.w3.org/2000/svg" width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round" class="button-icon"><path d="M21 7v6h-6"></path><path d="M3 17a9 9 0 0 1 9-9 9 9 0 0 1 6 2.3l3 2.7"></path></svg>',
          'bold': '<svg xmlns="http://www.w3.org/2000/svg" width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round" class="button-icon"><path d="M6 4h8a4 4 0 0 1 4 4 4 4 0 0 1-4 4H6z"></path><path d="M6 12h9a4 4 0 0 1 4 4 4 4 0 0 1-4 4H6z"></path></svg>',
          'italic': '<svg xmlns="http://www.w3.org/2000/svg" width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round" class="button-icon"><line x1="19" y1="4" x2="10" y2="4"></line><line x1="14" y1="20" x2="5" y2="20"></line><line x1="15" y1="4" x2="9" y2="20"></line></svg>',
          'code': '<svg xmlns="http://www.w3.org/2000/svg" width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round" class="button-icon"><polyline points="16 18 22 12 16 6"></polyline><polyline points="8 6 2 12 8 18"></polyline></svg>',
          'link': '<svg xmlns="http://www.w3.org/2000/svg" width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round" class="button-icon"><path d="M10 13a5 5 0 0 0 7.54.54l3-3a5 5 0 0 0-7.07-7.07l-1.72 1.71"></path><path d="M14 11a5 5 0 0 0-7.54-.54l-3 3a5 5 0 0 0 7.07 7.07l1.71-1.71"></path></svg>',
          'quote': '<svg xmlns="http://www.w3.org/2000/svg" width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round" class="button-icon"><path d="M21 15a2 2 0 0 1-2 2H7l-4 4V5a2 2 0 0 1 2-2h14a2 2 0 0 1 2 2z"></path></svg>',
          'heading': '<svg xmlns="http://www.w3.org/2000/svg" width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round" class="button-icon"><path d="M6 12h12"></path><path d="M6 20V4"></path><path d="M18 20V4"></path></svg>',
          'list-ul': '<svg xmlns="http://www.w3.org/2000/svg" width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round" class="button-icon"><line x1="8" y1="6" x2="21" y2="6"></line><line x1="8" y1="12" x2="21" y2="12"></line><line x1="8" y1="18" x2="21" y2="18"></line><line x1="3" y1="6" x2="3.01" y2="6"></line><line x1="3" y1="12" x2="3.01" y2="12"></line><line x1="3" y1="18" x2="3.01" y2="18"></line></svg>',
          'list-ol': '<svg xmlns="http://www.w3.org/2000/svg" width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round" class="button-icon"><line x1="10" y1="6" x2="21" y2="6"></line><line x1="10" y1="12" x2="21" y2="12"></line><line x1="10" y1="18" x2="21" y2="18"></line><path d="M4 6h1v4"></path><path d="M4 10h2"></path><path d="M6 18H4c0-1 2-2 2-3s-1-1.5-2-1"></path></svg>',
          'math-inline': '<svg xmlns="http://www.w3.org/2000/svg" width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round" class="button-icon"><line x1="4" y1="9" x2="20" y2="9"></line><line x1="4" y1="15" x2="20" y2="15"></line><line x1="10" y1="3" x2="8" y2="21"></line><line x1="16" y1="3" x2="14" y2="21"></line></svg>',
          'math-block': '<svg xmlns="http://www.w3.org/2000/svg" width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round" class="button-icon"><rect x="3" y="3" width="18" height="18" rx="2" ry="2"></rect><line x1="9" y1="9" x2="15" y2="15"></line><line x1="15" y1="9" x2="9" y2="15"></line><line x1="6" y1="12" x2="18" y2="12"></line></svg>',
          'zoom-in': '<svg xmlns="http://www.w3.org/2000/svg" width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round" class="button-icon"><circle cx="11" cy="11" r="8"></circle><line x1="21" y1="21" x2="16.65" y2="16.65"></line><line x1="11" y1="8" x2="11" y2="14"></line><line x1="8" y1="11" x2="14" y2="11"></line></svg>',
          'zoom-out': '<svg xmlns="http://www.w3.org/2000/svg" width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round" class="button-icon"><circle cx="11" cy="11" r="8"></circle><line x1="21" y1="21" x2="16.65" y2="16.65"></line><line x1="8" y1="11" x2="14" y2="11"></line></svg>',
          'zoom-reset': '<svg xmlns="http://www.w3.org/2000/svg" width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round" class="button-icon"><circle cx="12" cy="12" r="10"></circle><line x1="8" y1="12" x2="16" y2="12"></line><line x1="12" y1="16" x2="12" y2="8"></line></svg>'
      };
      
      return icons[iconName] || '';
  }
  
  // 撤销功能
  _undo() {
      if (this.currentHistoryIndex > 0) {
          this.currentHistoryIndex--;
          const previousState = this.historyStack[this.currentHistoryIndex];
          this.editor.value = previousState;
          this.markdownContent = previousState;
          this._renderContent();
          this._updateHistoryButtonsState();
      }
  }
  
  // 前进功能
  _redo() {
      if (this.currentHistoryIndex < this.historyStack.length - 1) {
          this.currentHistoryIndex++;
          const nextState = this.historyStack[this.currentHistoryIndex];
          this.editor.value = nextState;
          this.markdownContent = nextState;
          this._renderContent();
          this._updateHistoryButtonsState();
      }
  }
  
  // 更新撤销和前进按钮状态
  _updateHistoryButtonsState() {
      if (this.undoButton) {
          this.undoButton.disabled = this.currentHistoryIndex <= 0;
      }
      
      if (this.redoButton) {
          this.redoButton.disabled = this.currentHistoryIndex >= this.historyStack.length - 1;
      }
  }
  
  // 保存到历史记录
  _saveToHistory() {
      const currentValue = this.editor.value;
      
      // 如果当前值与历史记录中最新的状态不同
      if (this.historyStack.length === 0 || currentValue !== this.historyStack[this.currentHistoryIndex]) {
          // 如果我们在历史记录中间进行了编辑，删除之后的历史记录
          if (this.currentHistoryIndex < this.historyStack.length - 1) {
              this.historyStack = this.historyStack.slice(0, this.currentHistoryIndex + 1);
          }
          
          // 将当前状态添加到历史记录
          this.historyStack.push(currentValue);
          
          // 如果历史记录过长，删除最旧的记录
          const maxHistoryLength = 50;
          if (this.historyStack.length > maxHistoryLength) {
              this.historyStack.shift();
          } else {
              this.currentHistoryIndex++;
          }
      }
  }
  
  // 格式化所选文本
  _formatText(prefix, suffix) {
      const editor = this.editor;
      const start = editor.selectionStart;
      const end = editor.selectionEnd;
      const selectedText = editor.value.substring(start, end);
      const beforeText = editor.value.substring(0, start);
      const afterText = editor.value.substring(end);
      
      // 将当前状态添加到历史记录
      this._saveToHistory();
      
      // 更新文本
      const newText = beforeText + prefix + selectedText + suffix + afterText;
      editor.value = newText;
      
      // 更新光标位置
      if (selectedText.length === 0) {
          // 无选中文本时，将光标放在前缀后面
          editor.selectionStart = editor.selectionEnd = start + prefix.length;
      } else {
          // 有选中文本时，保持选择该文本
          editor.selectionStart = start + prefix.length;
          editor.selectionEnd = end + prefix.length;
      }
      
      // 触发input事件以更新内容
      editor.dispatchEvent(new Event('input'));
      
      // 保持焦点在编辑器
      editor.focus();
  }
  
  // 配置marked解析器
  _configureMarked() {
      // 创建自定义渲染器，处理数学公式
      const renderer = new marked.Renderer();
      
      // 保存原始的段落渲染方法
      const originalParagraph = renderer.paragraph.bind(renderer);
      
      // 自定义段落渲染，处理块级数学公式
      renderer.paragraph = (text) => {
          // 检查是否为 $$ 包围的数学公式
          if (text.startsWith('$$') && text.endsWith('$$')) {
              const formula = text.slice(2, -2).trim();
              try {
                  const html = katex.renderToString(formula, {
                      displayMode: true,
                      throwOnError: false
                  });
                  return `<div class="math-block">${html}</div>`;
              } catch (e) {
                  console.error('KaTeX rendering error:', e);
                  return `<div class="math-block error">数学公式渲染错误: ${e.message}</div>`;
              }
          }
          return originalParagraph(text);
      };
      
      // 配置marked选项
      marked.setOptions({
          renderer: renderer,
          headerIds: true,
          gfm: true,
          breaks: false,
          pedantic: false,
          sanitize: false,
          smartLists: true,
          smartypants: false,
          xhtml: false
      });
  }
  
  // 渲染内容
  _renderContent() {
      // 如果没有内容，不进行渲染
      if (!this.markdownContent) return;
      
      // 使用marked解析Markdown
      const html = marked.parse(this.markdownContent);
      this.contentContainer.innerHTML = html;
      
      // 渲染行内数学公式
      this._renderInlineMath();
      
      // 应用当前缩放级别
      this._applyZoom();
  }
  
  // 渲染行内数学公式
  _renderInlineMath() {
      renderMathInElement(this.contentContainer, {
          delimiters: [
              { left: '$$', right: '$$', display: true },
              { left: '$', right: '$', display: false },
              { left: '\\(', right: '\\)', display: false },
              { left: '\\[', right: '\\]', display: true }
          ],
          throwOnError: false,
          // 避免二次渲染，不处理已经由KaTeX处理过的元素
          ignoredTags: ["script", "noscript", "style", "textarea", "pre", "code", "annotation", "annotation-xml", ".math-block"]
      });
  }
  
  // 缩放内容
  _zoom(factor) {
      this.zoomLevel = Math.max(0.5, Math.min(2.0, this.zoomLevel + factor));
      this._applyZoom();
  }
  
  // 重置缩放
  _resetZoom() {
      this.zoomLevel = 1.0;
      this._applyZoom();
  }
  
  // 应用缩放
  _applyZoom() {
      this.contentContainer.style.transform = `scale(${this.zoomLevel})`;
      this.contentContainer.style.transformOrigin = 'top left';
  }
  
  disconnectedCallback() {
      // 清理资源
  }
}

// 定义自定义元素
customElements.define('markdown-renderer', MarkdownRenderer);