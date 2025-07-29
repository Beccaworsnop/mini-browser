// ignore this fully it's about my AI friendo backend side , the server is working but i'm to broke to afford the API 
require('dotenv').config();


const express = require('express');
const cors = require('cors');
const fetch = (...args) => import('node-fetch').then(({default: fetch}) => fetch(...args));
const app = express();
const PORT = 5000;


app.use(cors());
app.use(express.json());

app.get('/', (req, res) => {
  res.send('Server is alive! 🚀');
});

app.post('/api/chat', async (req, res) => {
  const { message } = req.body;
  console.log("📩 Received message from frontend:", message);

  try {
    const response = await fetch('https://api.openai.com/v1/chat/completions', {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
        'Authorization': `Bearer ${process.env.OPENAI_KEY}`,
      },
      body: JSON.stringify({
        model: "gpt-3.5-turbo",
        messages: [{ role: "user", content: message }],
        max_tokens: 500
      })
    });

    const data = await response.json();
    console.log("🤖 Response from OpenAI:", JSON.stringify(data, null, 2));

    res.json({ reply: data.choices?.[0]?.message?.content || "No reply from GPT." });

  } catch (err) {
    console.error("❌ OpenAI API error:", err.message);
    res.status(500).json({ error: err.message });
  }
});

app.listen(PORT, () => {
  console.log(`⚙️ Backend server running at http://localhost:${PORT}`);
  console.log(`OpenAI Key configured: ${process.env.OPENAI_KEY ? 'Yes' : 'No'}`);
});