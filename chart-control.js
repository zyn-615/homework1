const template = document.createElement('template');
template.innerHTML = `
<style>
  :host {
    display: block;
    --chart-size: 400px;
    --chart-font: 'Segoe UI', sans-serif;
    --chart-border: 20px solid #e0e0e0;
    width: 90vw;
  }
  
  .control-panel {
    margin: 2rem 0;
    padding: 1.5rem;
    background: #ffffff;
    border-radius: 12px;
    box-shadow: 0 4px 12px rgba(0, 0, 0, 0.1);
    width: 100%;
  }
  
  .input-group {
    display: flex;
    gap: 8px;
    margin-bottom: 1rem;
  }
  
  input, select {
    padding: 0.1rem 0.5rem;
    border: 2px solid #ddd;
    border-radius: 2px;
    flex: 1;
    font-size: 0.9rem;
    font-family: var(--chart-font);
    transition: border-color 0.3s, box-shadow 0.3s;
    height: 1.8rem;
  }
  
  input:focus, select:focus {
    border-color: #2563EB;
    box-shadow: 0 0 5px rgba(37, 99, 235, 0.3);
    outline: none;
  }
  
  button {
    padding: 0.2rem 1rem;
    background: #1E3A8A;
    color: white;
    border: none;
    border-radius: 3px;
    cursor: pointer;
    font-size: 0.9rem;
    font-family: var(--chart-font);
    transition: background 0.3s, transform 0.2s;
    height: 2rem;
    line-height: 1.6rem;
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
    transition: all 0.3s ease;
  }
  
  .data-item:hover {
    background: #E0E7FF;
    box-shadow: 0 2px 6px rgba(0, 0, 0, 0.1);
    transform: translateY(-2px);
  }
  
  .data-item:last-child {
    border-bottom: none;
  }
  
  .data-info {
    display: grid;
    grid-template-columns: 1fr 1fr;
    gap: 10px;
    width: 80%;
  }
  
  .data-category, .data-value {
    padding: 4px 8px;
    border-radius: 4px;
    transition: background-color 0.2s;
  }
  
  .data-category {
    background-color: #EFF6FF;
    font-weight: 500;
  }
  
  .data-value {
    background-color: #F0FDF4;
    text-align: right;
    font-weight: 600;
  }
  
  .data-item:hover .data-category {
    background-color: #DBEAFE;
  }
  
  .data-item:hover .data-value {
    background-color: #DCFCE7;
  }
  
  .delete-btn {
    background: #DC2626;
    color: white;
    padding: 0.2rem 0.5rem;
    border-radius: 3px;
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

// 定义自定义元素类
class ChartControl extends HTMLElement {
  // 构造函数
  constructor() {
    super();
    this.tempDataStorage = [];    // 临时数据存储数组
    this.chartInstance = null;    // ECharts实例
    this.echarts = null;          // ECharts库引用
    this._shadowRoot = this.attachShadow({ mode: 'open' }); // 创建Shadow DOM
    this._shadowRoot.appendChild(template.content.cloneNode(true)); // 克隆模板到Shadow DOM
  }

  // 元素连接到DOM时调用
  async connectedCallback() {
    try {
      // 动态加载ECharts库
      await import('https://cdnjs.cloudflare.com/ajax/libs/echarts/5.4.3/echarts.min.js');
      this.echarts = window.echarts; // 获取ECharts引用
      // 初始化图表实例
      this.chartInstance = this.echarts.init(this._shadowRoot.querySelector('.chart'));
      
      // 添加按钮点击事件监听
      this._shadowRoot.querySelector('.add-btn').addEventListener('click', () => this.addDataItem());
      // 生成图表按钮点击事件监听
      this._shadowRoot.querySelector('.render-btn').addEventListener('click', () => this.renderChart());
      
      // 数据列表点击事件（处理删除）
      this._shadowRoot.querySelector('.data-list').addEventListener('click', e => {
        if (e.target.classList.contains('delete-btn')) {
          this.deleteDataItem(e.target.dataset.index);
        }
      });
      
      // 数据项鼠标悬停高亮图表
      this._shadowRoot.querySelector('.data-list').addEventListener('mouseover', e => {
        const dataItem = e.target.closest('.data-item');
        if (dataItem && this.chartInstance) {
          const index = parseInt(dataItem.dataset.index);
          this.highlightChartItem(index);
        }
      });
      
      // 鼠标移出时重置高亮
      this._shadowRoot.querySelector('.data-list').addEventListener('mouseout', e => {
        if (this.chartInstance) {
          this.resetChartHighlight();
        }
      });
    } catch (error) {
      console.error('ECharts 加载失败:', error); // 加载失败时输出错误
    }
  }
  
  // 高亮图表中的指定项
  highlightChartItem(index) {
    if (!this.chartInstance) return;
    
    const chartType = this._shadowRoot.querySelector('.chart-type').value;
    if (chartType === 'pie') {
      this.chartInstance.dispatchAction({
        type: 'highlight',
        seriesIndex: 0,
        dataIndex: index
      });
    } else if (chartType === 'bar') {
      this.chartInstance.dispatchAction({
        type: 'highlight',
        seriesIndex: 0,
        dataIndex: index
      });
    }
  }
  
  // 重置图表高亮状态
  resetChartHighlight() {
    if (!this.chartInstance) return;
    
    this.chartInstance.dispatchAction({
      type: 'downplay'
    });
  }

  // 添加数据项
  addDataItem() {
    const categoryInput = this._shadowRoot.querySelector('.category');
    const valueInput = this._shadowRoot.querySelector('.value');
    
    // 检查输入是否为空
    if (!categoryInput.value || !valueInput.value) return;
    
    // 添加数据到临时存储
    this.tempDataStorage.push({
      category: categoryInput.value,
      value: parseFloat(valueInput.value)
    });
    
    this.updateDataList(); // 更新数据列表显示
    // 清空输入框
    categoryInput.value = '';
    valueInput.value = '';
  }

  // 渲染图表
  renderChart() {
    if (!this.echarts || !this.chartInstance) {
      console.error('ECharts 未加载成功，无法渲染图表');
      return;
    }
    
    const chartType = this._shadowRoot.querySelector('.chart-type').value;
    
    // 定义颜色数组
    const colors = [
      '#BAE1FF', '#BAFFC9', '#FFB3BA', '#FFD8B1',
      '#E6C9FF', '#B4F8C8', '#FBE7C6', '#D8E2DC',
      '#A0E7E5', '#FFC7C7'
    ];
    
    // 图表基础配置
    let option = {
      tooltip: {
        trigger: 'item',
        formatter: '{a} <br/>{b}: {c} ({d}%)' // 工具提示格式
      }
    };
    
    // 根据图表类型配置选项
    if (chartType === 'pie') {
      option.series = [{
        name: '数据分布',
        type: 'pie',
        radius: ['40%', '70%'],    // 饼图内外半径
        center: ['50%', '50%'],    // 居中
        data: this.tempDataStorage.map((item, index) => ({
          value: item.value,
          name: item.category,
          itemStyle: {
            color: colors[index % colors.length] // 循环使用颜色
          }
        })),
        label: {
          show: true,
          position: 'outside',
          formatter: '{b}',
          textStyle: {
            fontSize: 14
          }
        },
        labelLine: {
          show: true,
          length: 15,
          length2: 10
        },
        emphasis: {
          itemStyle: {
            shadowBlur: 10,
            shadowColor: 'rgba(0, 0, 0, 0.5)',
            shadowOffsetX: 0,
            shadowOffsetY: 0,
            borderWidth: 2,
            borderColor: '#fff'
          },
          scale: true
        },
        animationType: 'scale',
        animationEasing: 'elasticOut'
      }];
    } else if (chartType === 'bar') {
      option.xAxis = {
        type: 'category',
        data: this.tempDataStorage.map(item => item.category),
        axisLabel: {
          interval: 0,
          rotate: 30             // 标签旋转30度
        }
      };
      option.yAxis = {
        type: 'value'
      };
      option.series = [{
        name: '数据值',
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
          textStyle: {
            fontSize: 14
          }
        },
        emphasis: {
          itemStyle: {
            shadowBlur: 10,
            shadowColor: 'rgba(0, 0, 0, 0.5)',
            borderWidth: 1,
            borderColor: '#fff'
          }
        },
        animationEasing: 'elasticOut'
      }];
    }
    
    // 设置图表选项并渲染
    this.chartInstance.setOption(option, true);
  }

  // 删除数据项
  deleteDataItem(index) {
    this.tempDataStorage.splice(index, 1); // 从数组中移除指定项
    this.updateDataList(); // 更新显示
    if (this.tempDataStorage.length > 0) this.renderChart(); // 如果还有数据则重新渲染
  }

  // 更新数据列表显示
  updateDataList() {
    const dataList = this._shadowRoot.querySelector('.data-list');
    dataList.innerHTML = this.tempDataStorage
      .map((item, index) => `
        <div class="data-item" data-index="${index}">
          <div class="data-info">
            <div class="data-category">${item.category}</div>
            <div class="data-value">${item.value}</div>
          </div>
          <div class="delete-btn" data-index="${index}">删除</div>
        </div>
      `).join(''); // 生成HTML并加入列表
  }
}

// 注册自定义元素
customElements.define('chart-control', ChartControl);