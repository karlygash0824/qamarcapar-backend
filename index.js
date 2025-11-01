


import express from "express";
import cors from "cors";
import dotenv from "dotenv";
import fetch from "node-fetch";
import pg from "pg";

dotenv.config();

const app = express();


// 🌍 CORS баптау (frontend-пен байланыс үшін)
app.use(
  cors({
    origin: [
      "https://qamarcapar-frontend.vercel.app", // Vercel сайты
      "http://localhost:5173", // жергілікті тест
    ],
    methods: ["GET", "POST"],
    allowedHeaders: ["Content-Type"],
  })
);

app.use(express.json());




// PostgreSQL баптау
const pool = new pg.Pool({
  connectionString: process.env.DATABASE_URL,
});

// Telegram token мен chat id
const TOKEN = process.env.TELEGRAM_TOKEN;
const CHAT_ID = process.env.CHAT_ID;

// 🕋 1️⃣ Байланыс формасы (Contact)
app.post("/api/contact", async (req, res) => {
  const { name, phone, message } = req.body;

  const text = `
📩 Жаңа байланыс формасы:
👤 Аты: ${name}
📞 Телефон: ${phone}
💬 Хабарлама: ${message || "жоқ"}
`;

  const url = `https://api.telegram.org/bot${TOKEN}/sendMessage`;

  try {
    await fetch(url, {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ chat_id: CHAT_ID, text }),
    });

    // ✅ Түзетілген жер:
    res.status(200).json({ success: true, message: "Telegram-ға жіберілді ✅" });
  } catch (error) {
    console.error("❌ Contact қатесі:", error);
    res.status(500).json({ success: false, error: "Хабарлама жіберілмеді ❌" });
  }
});

// 🧾 2️⃣ Умра пакеттеріне тіркелу (Packages form)
app.post("/api/register", async (req, res) => {
  console.log("Форма мәліметі келді:", req.body);
  const { name, phone, package: selectedPackage } = req.body;

  if (!name || !phone || !selectedPackage) {
    return res
      .status(400)
      .json({ success: false, message: "Барлық өрістерді толтырыңыз!" });
  }

  const text = `
🕋 Умра пакеті бойынша жаңа тіркелу:
👤 Аты: ${name}
📞 Телефон: ${phone}
🎁 Таңдалған пакет: ${selectedPackage}
`;

  const url = `https://api.telegram.org/bot${TOKEN}/sendMessage`;

  try {
    // 1️⃣ Telegram-ға хабар жіберу
    await fetch(url, {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ chat_id: CHAT_ID, text }),
    });

    // 2️⃣ PostgreSQL-ге сақтау
    await pool.query(
      'INSERT INTO public.umra_requests (name, phone, "package", created_at) VALUES ($1, $2, $3, NOW())',
      [name, phone, selectedPackage]
    );

    // ✅ Түзетілген жер:
    res.status(200).json({ success: true, message: "Тіркелу сәтті аяқталды ✅" });
  } catch (error) {
    console.error("❌ Register қатесі:", error);
    res.status(500).json({ success: false, error: "Сервер қатесі ❌" });
  }
});

// Базамен байланыс тексеру
pool.query("SELECT NOW()", (err, result) => {
  if (err) {
    console.error("❌ Database connection error:", err);
  } else {
    console.log("✅ Database connected successfully:", result.rows[0]);
  }
});

// Серверді іске қосу
const PORT = process.env.PORT || 5000;
app.get("/", (req, res) => {
  res.send("Server is running...");
});

app.listen(PORT, () =>
  console.log(`✅ Server is running on port ${PORT}`)
);
