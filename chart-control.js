// chart-control.js
const template = document.createElement('template');
template.innerHTML = `
<style>
  :host {
    display: block;
    --chart-size: 400px;
    --chart-font: 'Segoe UI', sans-serif;
    --chart-border: 2px solid #e0e0e0;
  }
  .control-panel {
    margin: 2rem 0;
    padding: 1.5rem;
    background: #f8f9fa;
    border-radius: 8px;
    box-shadow: 0 2px 8px rgba(0,0,0,0.1);
    max-width: 600px;
  }
  .input-group {
    display: flex;
    gap: 10px;
    margin-bottom: 1rem;
  }
  input {
    padding: 0.5rem;
    border: 1px solid #ddd;
    border-radius: 4px;
    flex: 1;
    font-family: var(--chart-font);
  }
  button {
    padding: 0.5rem 1rem;
    background: #4CAF50;
    color: white;
    border: none;
    border-radius: 4px;
    cursor: pointer;
    transition: opacity 0.3s;
    font-family: var(--chart-font);
  }
  button:hover {
    opacity: 0.8;
  }
  .data-list {
    margin: 1rem 0;
    border: var(--chart-border);
    border-radius: 4px;
    max-height: 200px;
    overflow-y: auto;
  }
  .data-item {
    display: flex;
    justify-content: space-between;
    align-items: center;
    padding: 0.8rem;
    border-bottom: 1px solid #eee;
    font-family: var(--chart-font);
  }
  .data-item:last-child {
    border-bottom: none;
  }
  .delete-btn {
    background: #ff6b6b;
    color: white;
    padding: 0.3rem 0.8rem;
    border-radius: 3px;
    cursor: pointer;
  }
  .chart {
    width: var(--chart-size);
    height: var(--chart-size);
  }
</style>

<div class="control-panel">
  <div class="input-group">
    <input type="text" class="category" placeholder="分类名称">
    <input type="number" class="value" placeholder="数值">
    <button class="add-btn">添加</button>
  </div>
  <div class="button-group">
    <button class="render-btn">生成图表</button>
  </div>
  <div class="data-list"></div>
</div>
<div class="chart-container">
  <div class="chart"></div>
</div>`;

class ChartControl extends HTMLElement {
  constructor() {
    super();
    this.tempDataStorage = [];
    this.chartInstance = null;
    this.attachShadow({ mode: 'open' });
    this.shadowRoot.appendChild(template.content.cloneNode(true));
  }

  connectedCallback() {
    this.chartInstance = echarts.init(this.shadowRoot.querySelector('.chart'));
    
    this.shadowRoot.querySelector('.add-btn').addEventListener('click', () => this.addDataItem());
    this.shadowRoot.querySelector('.render-btn').addEventListener('click', () => this.renderChart());
    this.shadowRoot.querySelector('.data-list').addEventListener('click', e => {
      if (e.target.classList.contains('delete-btn')) {
        this.deleteDataItem(e.target.dataset.index);
      }
    });
  }

  addDataItem() {
    const categoryInput = this.shadowRoot.querySelector('.category');
    const valueInput = this.shadowRoot.querySelector('.value');
    
    if (!categoryInput.value || !valueInput.value) return;

    this.tempDataStorage.push({
      category: categoryInput.value,
      value: parseFloat(valueInput.value)
    });

    this.updateDataList();
    categoryInput.value = '';
    valueInput.value = '';
  }

  renderChart() {
    const colors = [
      '#FFB3BA', '#BAFFC9', '#BAE1FF', '#FFD8B1',
      '#E6C9FF', '#B4F8C8', '#FBE7C6', '#D8E2DC',
      '#A0E7E5', '#FFC7C7'
    ]; // 预定义一组不同的颜色
  
    const option = {
      tooltip: {
        trigger: 'item'
      },
      series: [{
        type: 'pie',
        data: this.tempDataStorage.map((item, index) => ({
          value: item.value,
          name: item.category,
          itemStyle: {
            color: colors[index % colors.length] // 轮流使用颜色数组中的颜色
          }
        }))
      }]
    };
  
    this.chartInstance.setOption(option);
  }

  deleteDataItem(index) {
    this.tempDataStorage.splice(index, 1);
    this.updateDataList();
    if (this.tempDataStorage.length > 0) this.renderChart();
  }

  updateDataList() {
    const dataList = this.shadowRoot.querySelector('.data-list');
    dataList.innerHTML = this.tempDataStorage
      .map((item, index) => `
        <div class="data-item">
          <span>${item.category}: ${item.value}</span>
          <div class="delete-btn" data-index="${index}">删除</div>
        </div>
      `).join('');
  }
}

customElements.define('chart-control', ChartControl);
