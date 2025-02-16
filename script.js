let myChart = null;

// 初始化图表
function initChart() {
  if (!myChart) {
    const chartDom = document.getElementById("chartContainer");
    myChart = echarts.init(chartDom);

    // 监听窗口大小变化
    window.addEventListener("resize", function () {
      myChart.resize();
    });
  }
}

// 配置API信息
const API_CONFIG = {
  url: "https://api.siliconflow.cn/v1/chat/completions",
  token: "sk-gujavyfzigosfcmoyoaukefecuuexucjcxznbvijvakqmdoa",
};

// 提示词模板
const promptTemplates = {
  line: `请分析以下文本,提取折线图数据并按如下格式返回:
  {
    "title": "图表标题",
    "xAxis": ["x轴类别1", "x轴类别2",...], 
    "series": [
      {
        "name": "数据系列名称",
        "data": [数值1, 数值2,...]
      }
    ]
  }`,

  bar: `请分析以下文本,提取柱状图数据并按如下格式返回:
  {
    "title": "图表标题",
    "xAxis": ["x轴类别1", "x轴类别2",...],
    "series": [
      {
        "name": "数据系列名称", 
        "data": [数值1, 数值2,...]
      }
    ]
  }`,

  pie: `请分析以下文本,提取饼图数据并按如下格式返回:
  {
    "title": "图表标题",
    "series": [
      {
        "name": "名称1",
        "value": 数值1
      },
      {
        "name": "名称2", 
        "value": 数值2
      }
    ]
  }`,
};

// 清空所有内容
function clearAll() {
  document.getElementById("inputText").value = "";
  document.getElementById("extractedData").value = "";
  document.getElementById("generatedCode").value = "";

  if (myChart) {
    myChart.clear();
  }
}

// 全屏切换
function toggleFullscreen() {
  const chartContainer = document.getElementById("chartContainer");

  if (!document.fullscreenElement) {
    chartContainer.requestFullscreen().catch((err) => {
      alert(`全屏显示错误: ${err.message}`);
    });
  } else {
    document.exitFullscreen();
  }
}

// 导出图表为图片
function exportChart() {
  if (!myChart) {
    alert("没有可导出的图表");
    return;
  }

  const url = myChart.getDataURL({
    type: "png",
    pixelRatio: 2,
  });

  const link = document.createElement("a");
  link.download = `chart_${new Date().getTime()}.png`;
  link.href = url;
  document.body.appendChild(link);
  link.click();
  document.body.removeChild(link);
}

// 复制到剪贴板
async function copyToClipboard() {
  if (!myChart) {
    alert("没有可复制的图表");
    return;
  }

  try {
    const url = myChart.getDataURL({
      type: "png",
      pixelRatio: 2,
    });

    const response = await fetch(url);
    const blob = await response.blob();

    await navigator.clipboard.write([
      new ClipboardItem({
        "image/png": blob,
      }),
    ]);

    alert("图表已复制到剪贴板");
  } catch (err) {
    console.error("复制失败:", err);
    alert("复制失败,请查看控制台了解详情");
  }
}

// 分析文本
async function analyzeText() {
  const inputText = document.getElementById("inputText").value;
  if (!inputText.trim()) {
    alert("请输入要分析的文本");
    return;
  }

  const chartType = document.getElementById("chartType").value;
  const loadingEl = document.getElementById("loading");

  loadingEl.style.display = "inline";

  try {
    const prompt = promptTemplates[chartType] + `\n文本内容:\n${inputText}`;

    const response = await axios.post(
      API_CONFIG.url,
      {
        model: "deepseek-ai/DeepSeek-R1-Distill-Qwen-7B",
        messages: [
          {
            role: "user",
            content: prompt,
          },
        ],
        stream: false,
        max_tokens: 1024,
        temperature: 0.3,
        top_p: 0.8,
        frequency_penalty: 0.2,
      },
      {
        headers: {
          Authorization: `Bearer ${API_CONFIG.token}`,
          "Content-Type": "application/json",
        },
      }
    );

    let extractedData = response.data.choices[0].message.content;

    try {
      extractedData = extractedData.substring(
        extractedData.indexOf("{"),
        extractedData.lastIndexOf("}") + 1
      );

      const chartData = JSON.parse(extractedData);

      document.getElementById("extractedData").value = JSON.stringify(
        chartData,
        null,
        2
      );

      const chartCode = generateChartCode(chartData, chartType);
      document.getElementById("generatedCode").value = chartCode;

      // 初始化并渲染图表
      initChart();
      eval(chartCode);
    } catch (parseError) {
      console.error("JSON解析错误:", parseError);
      document.getElementById("extractedData").value =
        "数据格式错误,无法解析为JSON: " + extractedData;
    }
  } catch (error) {
    console.error("API调用错误:", error);
    alert("处理过程中发生错误,请查看控制台了解详情。");
  } finally {
    loadingEl.style.display = "none";
  }
}

// 生成图表代码
function generateChartCode(data, chartType) {
  const baseOptions = {
    title: {
      text: data.title || "",
    },
    tooltip: {
      trigger: chartType === "pie" ? "item" : "axis",
    },
    legend: {
      orient: "vertical",
      left: "right",
    },
  };

  let specificOptions = {};

  if (chartType === "line" || chartType === "bar") {
    specificOptions = {
      xAxis: {
        type: "category",
        data: data.xAxis,
      },
      yAxis: {
        type: "value",
      },
      series: data.series.map((series) => ({
        name: series.name,
        type: chartType,
        data: series.data,
      })),
    };
  } else if (chartType === "pie") {
    specificOptions = {
      series: [
        {
          type: "pie",
          radius: "50%",
          data: data.series,
        },
      ],
    };
  }

  const chartOptions = {
    ...baseOptions,
    ...specificOptions,
  };

  return `
    const chartDom = document.getElementById('chartContainer');
    const myChart = echarts.init(chartDom);
    const option = ${JSON.stringify(chartOptions, null, 2)};
    myChart.setOption(option);
  `;
}

// 刷新图表
function refreshChart() {
  const chartCode = document.getElementById("generatedCode").value;
  if (chartCode.trim()) {
    try {
      initChart();
      eval(chartCode);
    } catch (error) {
      console.error("刷新图表时出错:", error);
      alert("刷新图表时发生错误,请查看控制台了解详情。");
    }
  } else {
    alert("没有可刷新的代码,请先生成图表代码。");
  }
}

// 初始化图表实例
initChart();
