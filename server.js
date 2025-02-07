// server.js
const express = require('express');
const cors = require('cors');
const axios = require('axios');
require('dotenv').config();

const app = express();
app.use(cors());
app.use(express.json());

// 大模型服务配置（示例使用OpenAI API）
const AI_SERVICE_URL = 'https://api.siliconflow.cn/v1/chat/completions';
const AI_API_KEY = sk-gujavyfzigosfcmoyoaukefecuuexucjcxznbvijvakqmdoa;

app.post('/api/recommend', async (req, res) => {
    try {
        const { score, province, subjects, interests } = req.body;
        
        // 构造大模型提示词
        const prompt = `作为高考志愿填报专家，请根据以下信息给出建议：
- 分数：${score}
- 省份：${province}
- 选科：${subjects.join(',')}
- 兴趣：${interests || '无'}
请按JSON格式返回5个推荐院校和专业，包含school、major、description字段`;

        // 调用大模型API
        const response = await axios.post(AI_SERVICE_URL, {
            model: "Qwen/Qwen2-7B-Instruct",
            messages: [{
                role: "user",
                content: prompt
            }],
            temperature: 0.7
        }, {
            headers: {
                'Authorization': `Bearer ${AI_API_KEY}`,
                'Content-Type': 'application/json'
            }
        });

        // 解析大模型返回结果
        const content = response.data.choices[0].message.content;
        const recommendations = parseRecommendations(content);
        
        res.json({ recommendations });
    } catch (error) {
        console.error('Error:', error);
        res.status(500).json({ error: '服务器错误' });
    }
});

function parseRecommendations(content) {
    try {
        // 尝试解析JSON内容
        const startIndex = content.indexOf('[');
        const endIndex = content.lastIndexOf(']') + 1;
        return JSON.parse(content.slice(startIndex, endIndex));
    } catch (e) {
        // 备用解析逻辑
        return content.split('\n')
            .filter(line => line.trim())
            .map(line => {
                const [schoolMajor, description] = line.split('-');
                const [school, major] = schoolMajor.split('：');
                return {
                    school: school.replace('学校：', '').trim(),
                    major: major.trim(),
                    description: description.trim()
                };
            });
    }
}

const PORT = process.env.PORT || 3000;
app.listen(PORT, () => {
    console.log(`Server running on port ${PORT}`);
});