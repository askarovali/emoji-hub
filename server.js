require('dotenv').config();
const express = require('express');
const axios = require('axios');
const path = require('path');

const app = express();
// чтобы req.body автоматически парсился в JSON
app.use(express.json());

// 1) Прокси для списка эмодзи
app.get('/api/emoji', async (req, res) => {
    try {
        const response = await axios.get('https://emojihub.yurace.pro/api/all');
        res.json(response.data);
    } catch (err) {
        console.error('Emoji API error:', err);
        res.status(500).json({ error: 'Emoji API error' });
    }
});

// 2) Генерация описания moodboard через ChatGPT
app.post('/api/moodboard', async (req, res) => {
    const ids = req.body.ids;
    if (!Array.isArray(ids)) {
        return res.status(400).json({ error: 'Expected { ids: [] } in body' });
    }

    const prompt = `Describe the overall mood of these emojis: ${ids.join(', ')}`;
    try {
        const aiRes = await axios.post(
            'https://api.openai.com/v1/chat/completions',
            {
                model: 'gpt-3.5-turbo',
                messages: [{ role: 'user', content: prompt }],
            },
            {
                headers: {
                    'Content-Type': 'application/json',
                    Authorization: `Bearer ${process.env.OPENAI_KEY}`
                }
            }
        );
        const description = aiRes.data.choices[0].message.content;
        res.json({ description });
    } catch (err) {
        console.error('LLM API error:', err.response?.data || err.message);
        res.status(500).json({ error: 'LLM API error' });
    }
});

// 3) Mixed-Emoji Generator через DALL·E Images API
app.post('/api/mix', async (req, res) => {
    const ids = req.body.ids;
    if (!Array.isArray(ids) || ids.length === 0) {
        return res.status(400).json({ error: 'Expected non-empty { ids: [] } in body' });
    }

    const prompt = `Create a single emoji-style icon that creatively blends these emojis together: ${ids.join(', ')}.`;
    try {
        const imgRes = await axios.post(
            'https://api.openai.com/v1/images/generations',
            {
                prompt,
                n: 1,
                size: '512x512'
            },
            {
                headers: {
                    'Content-Type': 'application/json',
                    Authorization: `Bearer ${process.env.OPENAI_KEY}`
                }
            }
        );
        const imageUrl = imgRes.data.data[0].url;
        res.json({ imageUrl });
    } catch (err) {
        console.error('Mix generation error:', err.response?.data || err.message);
        res.status(500).json({ error: 'Mix generation error' });
    }
});

// 4) Статика
app.use(express.static(path.join(__dirname, 'public')));

// 5) Запуск
const PORT = process.env.PORT || 3000;
app.listen(PORT, () => {
    console.log(`🚀 Server running at http://localhost:${PORT}`);
});
