class MarkdownArea extends HTMLElement {
  constructor() {
    super();
    const shadow = this.attachShadow({ mode: 'open' });
    
    // 添加KaTeX样式到Shadow DOM
    const style = document.createElement('style');
    style.textContent = `
      /* 内联KaTeX核心样式 */
      .katex { font: normal 1.21em KaTeX_Main, Times New Roman, serif !important; }
      .katex .base { white-space: pre-wrap; }
      /* 其他原有样式... */
      .editor-container { display: flex; gap: 20px; }
      #editor, #preview { 
        width: 100%; 
        min-height: 200px;
        padding: 15px;
        border: 1px solid #ddd;
      }
    `;

    // 创建容器
    const container = document.createElement('div');
    container.className = 'editor-container';
    container.innerHTML = `
      <textarea id="editor"></textarea>
      <div id="preview"></div>
    `;

    shadow.appendChild(style);
    shadow.appendChild(container);
    
    this._initialize();
  }

  async _initialize() {
    await this._loadDependencies();
    this._setupRenderer();
    this._loadContent();
  }

  _loadDependencies() {
    return new Promise((resolve) => {
      const check = () => {
        if (window.marked && window.katex) resolve();
        else setTimeout(check, 50);
      };
      check();
    });
  }

  _setupRenderer() {
    const editor = this.shadowRoot.getElementById('editor');
    const preview = this.shadowRoot.getElementById('preview');
    let isRendering = false;

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
      
      preview.innerHTML = marked.parse(editor.value);
      
      // 清理已有公式渲染
      const mathElements = preview.querySelectorAll('.katex');
      mathElements.forEach(el => el.remove());
      
      // 使用局部渲染
      renderMathInElement(preview, {
        ...renderOptions,
        ignoredElements: (element) => !preview.contains(element)
      });
      
      isRendering = false;
    };

    // 优化输入处理
    let renderTimer;
    editor.addEventListener('input', () => {
      clearTimeout(renderTimer);
      renderTimer = setTimeout(safeRender, 250);
    });
  }

  _loadContent() {
    const script = this.querySelector('script[type="text/markdown"]');
    if (script) {
      this.shadowRoot.getElementById('editor').value = script.textContent;
      setTimeout(() => this._setupRenderer(), 100);
    }
  }
}

customElements.define('markdown-area', MarkdownArea);