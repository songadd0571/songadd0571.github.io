const express = require('express');
const axios = require('axios');
const app = express();
const port = 3000;

// 中间件
app.use(express.json());
app.use(express.static('public'));

// AI模型配置（示例使用OpenAI API）
const AI_API_KEY = 'sk-gujavyfzigosfcmoyoaukefecuuexucjcxznbvijvakqmdoa';
const AI_ENDPOINT = 'https://api.siliconflow.cn/v1/chat/completions';

// 大学数据库示例
const universities = {
    '理科': [
        { name: '清华大学', score: 680, region: '北京' },
        { name: '浙江大学', score: 650, region: '浙江' }
    ],
    '文科': [
        { name: '北京大学', score: 670, region: '北京' },
        { name: '复旦大学', score: 660, region: '上海' }
    ]
};

// 路由处理
app.post('/api/recommend', async (req, res) => {
    try {
        const { score, subject, interest, region } = req.body;
        
        // 1. 基础筛选
        const filtered = universities[subject]
            .filter(u => u.score <= score)
            .filter(u => region ? u.region.includes(region) : true);
        
        // 2. 调用AI模型生成建议
        const prompt = `作为高考志愿填报专家，请根据以下信息给出建议：
        分数: ${score}分
        科目: ${subject}
        兴趣: ${interest || "无特别
