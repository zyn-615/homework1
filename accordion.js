class BaseElement extends HTMLElement {
  constructor() {
      super();
      this._connected = false;
  }
  
  connectedCallback() {
      if (!this._connected) {
          this.initialize();
          this._connected = true;
      }
  }
  
  initialize() {
      // 由子类实现
  }
}

// 折叠面板主组件
class XAccordion extends BaseElement {
  constructor() {
      super();
      this._expandedItems = new Set();
      this._observer = null;
  }
  
  get mode() {
      return this.getAttribute('mode') || 'single';
  }
  
  set mode(value) {
      this.setAttribute('mode', value);
  }
  
  static get observedAttributes() {
      return ['mode'];
  }
  
  attributeChangedCallback(name, oldValue, newValue) {
      if (name === 'mode' && oldValue !== newValue && this._connected) {
          // 如果从多重模式切换到单一模式，需要关闭除第一个以外的所有展开项
          if (newValue === 'single' && this._expandedItems.size > 1) {
              // 保留第一个展开的项
              const firstItem = this._expandedItems.values().next().value;
              
              // 关闭其他所有项
              for (const item of this._expandedItems) {
                  if (item !== firstItem) {
                      item.collapse();
                  }
              }
              
              // 清空集合并添加第一个项
              this._expandedItems.clear();
              if (firstItem) {
                  this._expandedItems.add(firstItem);
              }
          }
      }
  }
  
  initialize() {
      // 监听项目展开/折叠事件
      this.addEventListener('accordion-item-expand', this._handleItemExpand.bind(this));
      this.addEventListener('accordion-item-collapse', this._handleItemCollapse.bind(this));
      
      // 观察子项目的添加和删除
      this._observer = new MutationObserver(this._handleDOMChanges.bind(this));
      this._observer.observe(this, { childList: true });
  }
  
  disconnectedCallback() {
      if (this._observer) {
          this._observer.disconnect();
          this._observer = null;
      }
  }
  
  _handleDOMChanges(mutations) {
      for (const mutation of mutations) {
          if (mutation.type === 'childList') {
              // 处理移除的节点
              for (const node of mutation.removedNodes) {
                  if (node instanceof XAccordionItem && this._expandedItems.has(node)) {
                      this._expandedItems.delete(node);
                  }
              }
          }
      }
  }
  
  _handleItemExpand(event) {
      // 确保事件是直接子项发出的，不处理嵌套accordion的事件
      const expandingItem = event.target;
      if (expandingItem.parentElement !== this) return;
      
      // 添加到展开项集合
      this._expandedItems.add(expandingItem);
      
      // 单一模式下关闭其他项
      if (this.mode === 'single' && this._expandedItems.size > 1) {
          for (const item of this._expandedItems) {
              if (item !== expandingItem) {
                  item.collapse();
              }
          }
      }
  }
  
  _handleItemCollapse(event) {
      const collapsingItem = event.target;
      if (collapsingItem.parentElement !== this) return;
      
      // 从展开项集合中移除
      this._expandedItems.delete(collapsingItem);
  }
}

// 折叠项组件
class XAccordionItem extends BaseElement {
  constructor() {
      super();
      this._expanded = false;
      this._header = null;
      this._panel = null;
  }
  
  get expanded() {
      return this._expanded;
  }
  
  initialize() {
      this._header = this.querySelector('x-accordion-header');
      this._panel = this.querySelector('x-accordion-panel');
      
      if (!this._header || !this._panel) return;
      
      // 设置ARIA属性
      this._header.setAttribute('role', 'button');
      this._header.setAttribute('aria-expanded', 'false');
      this._header.setAttribute('tabindex', '0');
      
      // 设置面板ID和关联
      const panelId = `panel-${this._generateId()}`;
      this._panel.setAttribute('id', panelId);
      this._header.setAttribute('aria-controls', panelId);
      
      // 添加点击和键盘事件
      this._header.addEventListener('click', this._toggle.bind(this));
      this._header.addEventListener('keydown', this._handleKeyDown.bind(this));
      
      // 如果已设置展开属性，初始时展开
      if (this.hasAttribute('expanded')) {
          this.expand();
      }
  }
  
  _generateId() {
      return Math.random().toString(36).substring(2, 11);
  }
  
  _toggle() {
      if (this._expanded) {
          this.collapse();
      } else {
          this.expand();
      }
  }
  
  _handleKeyDown(event) {
      switch (event.key) {
          case 'Enter':
          case ' ':
              event.preventDefault();
              this._toggle();
              break;
          case 'ArrowDown':
              event.preventDefault();
              this._focusNextHeader();
              break;
          case 'ArrowUp':
              event.preventDefault();
              this._focusPrevHeader();
              break;
          case 'Home':
              event.preventDefault();
              this._focusFirstHeader();
              break;
          case 'End':
              event.preventDefault();
              this._focusLastHeader();
              break;
      }
  }
  
  _focusNextHeader() {
      const parent = this.parentElement;
      const items = Array.from(parent.querySelectorAll(':scope > x-accordion-item'));
      const currentIndex = items.indexOf(this);
      const nextItem = items[currentIndex + 1];
      
      if (nextItem) {
          const nextHeader = nextItem.querySelector('x-accordion-header');
          if (nextHeader) nextHeader.focus();
      }
  }
  
  _focusPrevHeader() {
      const parent = this.parentElement;
      const items = Array.from(parent.querySelectorAll(':scope > x-accordion-item'));
      const currentIndex = items.indexOf(this);
      const prevItem = items[currentIndex - 1];
      
      if (prevItem) {
          const prevHeader = prevItem.querySelector('x-accordion-header');
          if (prevHeader) prevHeader.focus();
      }
  }
  
  _focusFirstHeader() {
      const parent = this.parentElement;
      const firstItem = parent.querySelector(':scope > x-accordion-item');
      if (firstItem) {
          const header = firstItem.querySelector('x-accordion-header');
          if (header) header.focus();
      }
  }
  
  _focusLastHeader() {
      const parent = this.parentElement;
      const items = parent.querySelectorAll(':scope > x-accordion-item');
      const lastItem = items[items.length - 1];
      if (lastItem) {
          const header = lastItem.querySelector('x-accordion-header');
          if (header) header.focus();
      }
  }
  
  expand() {
      if (this._expanded) return;
      
      this._expanded = true;
      this.setAttribute('expanded', '');
      this._header.setAttribute('aria-expanded', 'true');
      
      // 获取面板内容的真实高度
      const panelInner = this._panel.querySelector('x-accordion-panel-inner');
      const contentHeight = panelInner.offsetHeight;
      
      // 应用动画
      this._panel.style.height = `${contentHeight}px`;
      
      // 触发展开事件通知父accordion
      const event = new CustomEvent('accordion-item-expand', {
          bubbles: true,
          detail: { item: this }
      });
      this.dispatchEvent(event);
  }
  
  collapse() {
      if (!this._expanded) return;
      
      this._expanded = false;
      this.removeAttribute('expanded');
      this._header.setAttribute('aria-expanded', 'false');
      
      // 获取当前高度以便流畅过渡
      const currentHeight = this._panel.offsetHeight;
      this._panel.style.height = `${currentHeight}px`;
      
      // 强制浏览器重绘
      this._panel.offsetHeight;
      
      // 过渡到高度0
      this._panel.style.height = '0';
      
      // 触发折叠事件
      const event = new CustomEvent('accordion-item-collapse', {
          bubbles: true,
          detail: { item: this }
      });
      this.dispatchEvent(event);
  }
}

// 面板头部组件
class XAccordionHeader extends BaseElement {
  initialize() {
      // 基础设置已在父组件中完成
  }
}

// 内容面板组件
class XAccordionPanel extends BaseElement {
  initialize() {
      // 设置ARIA角色
      this.setAttribute('role', 'region');
      
      // 确保初始状态为隐藏
      this.style.height = '0';
  }
}

// 面板内容包装组件
class XAccordionPanelInner extends BaseElement {
  initialize() {
      // 仅用于样式和内部高度计算
  }
}

// 注册自定义元素
customElements.define('x-accordion', XAccordion);
customElements.define('x-accordion-item', XAccordionItem);
customElements.define('x-accordion-header', XAccordionHeader);
customElements.define('x-accordion-panel', XAccordionPanel);
customElements.define('x-accordion-panel-inner', XAccordionPanelInner);