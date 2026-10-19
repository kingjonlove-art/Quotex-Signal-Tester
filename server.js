require('dotenv').config();
const express = require('express');
const app = express();

const PORT = process.env.PORT || 3000;
const API_KEY = process.env.ALPHA_VANTAGE_API_KEY;

app.use(express.json());

let autoLearnedCache = {
  lastUpdated: null,
  latestData: {},
  status: "Initializing Auto-Learning..."
};

// অটো-লার্নিং ফাংশন (উন্নত এরর হ্যান্ডলিং সহ)
async function startAutoLearningProcess(symbol = 'IBM') {
  if (!API_KEY) {
    console.log('⚠️ API Key পাওয়া যায়নি, অটো-লার্নিং বন্ধ রয়েছে।');
    autoLearnedCache.status = "API Key Missing";
    return;
  }

  try {
    console.log(`🔄 ব্যাকগ্রাউন্ডে ${symbol} এর ডেটা আনা হচ্ছে...`);
    const response = await fetch(
      `https://www.alphavantage.co/query?function=TIME_SERIES_INTRADAY&symbol=${symbol}&interval=1min&apikey=${API_KEY}`
    );
    
    const data = await response.json();
    
    // Alpha Vantage অনেক সময় লিমি트 শেষ হলে Note বা Error মেসেজ দেয়, সেটি চেক করা
    if (data.Note || data['Error Message']) {
      console.warn('⚠️ API লিমিট বা ওয়ার্নিং পাওয়া গেছে:', data.Note || data['Error Message']);
      autoLearnedCache.status = "API Limit Reached or Error";
      return;
    }

    autoLearnedCache.latestData = data;
    autoLearnedCache.lastUpdated = new Date().toISOString();
    autoLearnedCache.status = "Active & Learning Successfully";
    
    console.log(`✅ সফলভাবে ডেটা আপডেট হয়েছে: ${autoLearnedCache.lastUpdated}`);
  } catch (error) {
    console.error('❌ ফেচ করার সময় এরর এসেছে:', error.message);
    autoLearnedCache.status = "Fetch Error: " + error.message;
  }
}

// প্রতি ৫ মিনিট পরপর অটো-রান করার লুপ
const FETCH_INTERVAL_MS = 5 * 60 * 1000;
setInterval(() => {
  startAutoLearningProcess('IBM');
}, FETCH_INTERVAL_MS);

// সার্ভার চালু হওয়ার সাথে সাথে একবার রান হবে
startAutoLearningProcess('IBM');

// --- API Routes ---

app.get('/', (req, res) => {
  res.send({
    message: 'Trading Server is Live & Running!',
    status: autoLearnedCache.status,
    lastUpdated: autoLearnedCache.lastUpdated
  });
});

app.get('/api/auto-learn-data', (req, res) => {
  res.json({
    success: true,
    data: autoLearnedCache
  });
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

app.listen(PORT, '0.0.0.0', () => {
  console.log(`🚀 Server is running on http://localhost:${PORT}`);
});
