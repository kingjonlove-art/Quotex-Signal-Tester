require('dotenv').config();
const express = require('express');
const app = express();

const PORT = process.env.PORT || 3000;
const API_KEY = process.env.ALPHA_VANTAGE_API_KEY;

app.use(express.json());

app.get('/', (req, res) => {
  res.send('Trading Tool Server is Running Successfully!');
});

app.get('/api/stock/:symbol', async (req, res) => {
  const symbol = req.params.symbol;

  if (!API_KEY) {
    return res.status(500).json({ error: '.env ফাইলে API Key পাওয়া যায়নি!' });
  }

  try {
    const response = await fetch(
      `https://www.alphavantage.co/query?function=TIME_SERIES_INTRADAY&symbol=${symbol}&interval=1min&apikey=${API_KEY}`
    );
    const data = await response.json();
    res.json(data);
  } catch (error) {
    res.status(500).json({ error: 'ডেটা ফেচ করতে সমস্যা হয়েছে', details: error.message });
  }
});

app.listen(PORT, () => {
  console.log(`Server running on http://localhost:${PORT}`);
});
