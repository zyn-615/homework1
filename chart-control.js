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
    background: #ffffff;
    border-radius: 12px;
    box-shadow: 0 4px 12px rgba(0, 0, 0, 0.1);
    max-width: 600px;
  }
  
  .input-group {
    display: flex;
    gap: 12px;
    margin-bottom: 1rem;
  }
  input, select {
    padding: 0.6rem 1rem;
    border: 2px solid #ddd;
    border-radius: 6px;
    flex: 1;
    font-size: 1rem;
    font-family: var(--chart-font);
    transition: border-color 0.3s, box-shadow 0.3s;
  }
  input:focus, select:focus {
    border-color: #2563EB;
    box-shadow: 0 0 5px rgba(37, 99, 235, 0.3);
    outline: none;
  }
  button {
    padding: 0.6rem 1.2rem;
    background: #1E3A8A;
    color: white;
    border: none;
    border-radius: 6px;
    cursor: pointer;
    font-size: 1rem;
    font-family: var(--chart-font);
    transition: background 0.3s, transform 0.2s;
  }
  button:hover {
    background: #2563EB;
    transform: scale(1.05);
  }
  .button-group {
    display: flex;
    justify-content: center;
    margin-top: 1rem;
  }
  .data-list {
    margin: 1rem 0;
    border-radius: 6px;
    max-height: 200px;
    overflow-y: auto;
    background: #F3F4F6;
    padding: 0.5rem;
    border: 2px solid #E5E7EB;
  }
  .data-item {
    display: flex;
    justify-content: space-between;
    align-items: center;
    padding: 0.8rem;
    border-bottom: 1px solid #ddd;
    font-family: var(--chart-font);
    background: #ffffff;
    border-radius: 6px;
    margin: 4px 0;
    transition: background 0.3s, box-shadow 0.3s;
  }
  .data-item:hover {
    background: #E0E7FF;
    box-shadow: 0 2px 6px rgba(0, 0, 0, 0.1);
  }
  .data-item:last-child {
    border-bottom: none;
  }
  .delete-btn {
    background: #DC2626;
    color: white;
    padding: 0.4rem 0.8rem;
    border-radius: 4px;
    cursor: pointer;
    transition: background 0.3s, transform 0.2s;
  }
  .delete-btn:hover {
    background: #B91C1C;
    transform: scale(1.1);
  }
  .chart-container {
    display: flex;
    justify-content: center;
    margin-top: 1rem;
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
    <!-- 新增选择图表类型的下拉菜单 -->
    <select class="chart-type">
      <option value="pie">饼状图</option>
      <option value="bar">柱状图</option>
    </select>
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
    this.echarts = null; // 用于存储动态加载的 ECharts
    this.attachShadow({ mode: 'open' });
    this.shadowRoot.appendChild(template.content.cloneNode(true));
  }

  async connectedCallback() {
    try {
      // 动态加载 ECharts
      await import('https://cdnjs.cloudflare.com/ajax/libs/echarts/5.4.3/echarts.min.js');
      this.echarts = window.echarts; // 由于 import 不能直接加载 UMD 模块，需要从 window 取出

      // 初始化图表
      this.chartInstance = this.echarts.init(this.shadowRoot.querySelector('.chart'));

      this.shadowRoot.querySelector('.add-btn').addEventListener('click', () => this.addDataItem());
      this.shadowRoot.querySelector('.render-btn').addEventListener('click', () => this.renderChart());
      this.shadowRoot.querySelector('.data-list').addEventListener('click', e => {
        if (e.target.classList.contains('delete-btn')) {
          this.deleteDataItem(e.target.dataset.index);
        }
      });
    } catch (error) {
      console.error('ECharts 加载失败:', error);
    }
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
    if (!this.echarts || !this.chartInstance) {
      console.error('ECharts 未加载成功，无法渲染图表');
      return;
    }
    
    // 获取用户选择的图表类型
    const chartType = this.shadowRoot.querySelector('.chart-type').value;
    
    const colors = [
      '#FFB3BA', '#BAFFC9', '#BAE1FF', '#FFD8B1',
      '#E6C9FF', '#B4F8C8', '#FBE7C6', '#D8E2DC',
      '#A0E7E5', '#FFC7C7'
    ];
    
    let option = {
      tooltip: {
        trigger: 'item'
      }
    };
    
    if (chartType === 'pie') {
      option.series = [{
        type: 'pie',
        radius: ['40%', '70%'], // 设定内外半径，避免标签遮挡
        center: ['50%', '50%'],
        data: this.tempDataStorage.map((item, index) => ({
          value: item.value,
          name: item.category,
          itemStyle: {
            color: colors[index % colors.length]
          }
        })),
        label: {
          show: true,
          position: 'outside', // 让标签显示在饼图外部
          formatter: '{b}', // 只显示名称，不显示数值
          fontSize: 14,
          overflow: 'break', // 防止文本被省略
          rich: {
            name: {
              fontSize: 14,
              color: '#333'
            }
          }
        },
        labelLine: {
          show: true, // 连接线，提升可读性
          length: 15,  // 第一段线长
          length2: 10  // 第二段线长
        },
        emphasis: {
          itemStyle: {
            shadowBlur: 10,
            shadowColor: 'rgba(0, 0, 0, 0.5)'
          }
        },
        animationType: 'scale',
        animationEasing: 'elasticOut'
      }];
    } else if (chartType === 'bar') {
      // 柱状图配置
      option.xAxis = {
        type: 'category',
        data: this.tempDataStorage.map(item => item.category),
        axisLabel: {
          interval: 0,
          rotate: 30
        }
      };
      option.yAxis = {
        type: 'value'
      };
      option.series = [{
        type: 'bar',
        data: this.tempDataStorage.map((item, index) => ({
          value: item.value,
          itemStyle: {
            color: colors[index % colors.length]
          }
        })),
        label: {
          show: true,
          position: 'top',
          fontSize: 14
        },
        animationEasing: 'elasticOut'
      }];
    }
    
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
