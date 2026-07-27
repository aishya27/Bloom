import express from "express";
import path from "path";
import { createServer as createViteServer } from "vite";
import { GoogleGenAI } from "@google/genai";
import dotenv from "dotenv";
import fs from "fs";
import webPush from "web-push";

dotenv.config();

const DB_FILE = path.join(process.cwd(), "bloom-db.json");

// Helper to load database
function loadDB() {
  if (!fs.existsSync(DB_FILE)) {
    return { users: {}, userData: {} };
  }
  try {
    const raw = fs.readFileSync(DB_FILE, "utf-8");
    return JSON.parse(raw);
  } catch (err) {
    console.error("Error reading database file, returning empty", err);
    return { users: {}, userData: {} };
  }
}

// Helper to save database
function saveDB(data: any) {
  try {
    fs.writeFileSync(DB_FILE, JSON.stringify(data, null, 2), "utf-8");
  } catch (err) {
    console.error("Error writing database file", err);
  }
}

// Hand-crafted fallback solutions in case Gemini API is not configured or fails
function getFallbackSolution(habit: string, reason: string, lang: string = "en"): string {
  const trigger = reason ? `"${reason}"` : "this trigger";

  if (lang === "ms") {
    return `### 🩺 Nasihat Pakar Penghentian Nikotin

**Punca**: ${trigger} ialah respons otomatik kognitif yang biasa.

**🎯 Tindakan Masa Hadapan**:
Apabila ${trigger} berlaku lagi pada masa depan, tetapkan pelan: *"Saya akan serta-merta mengambil 3 nafas dalam dan mengunyah gula-gula getah tanpa gula."* Ini memutus gelung ketagihan automatik.

🌿 *Setiap tindakan pra-rancang mengukuhkan kebebasan nikotin anda!*`;
  }

  if (lang === "zh") {
    return `### 🩺 戒烟与尼古丁戒断专家建议

**临床洞察**：因 ${trigger} 产生欲望是常见的神经反射。

**🎯 未来预防策略**：
下次当 ${trigger} 再次出现时，请提前预设替代行为：“立即进行 3 次深呼吸并使用无糖口香糖替代。” 这能有效切断脑部自动吸烟习惯回路。

🌿 *提前预设替代行为将帮助您逐步建立无烟未来！*`;
  }

  if (lang === "ko") {
    return `### 🩺 금연 전문가 자문

**임상 인사이트**: ${trigger}(은)는 뇌의 자동적 욕구 반응입니다.

**🎯 미래 예방 행동**:
향후 ${trigger} 상황이 오면 미리 대체 행동을 약속하세요: *"즉시 깊은 호흡 3회를 하고 무설탕 껌을 씹는다."* 이 사전 계획이 욕구 고리를 차단합니다.

🌿 *사전 계획된 대체 행동이 지속적 금연을 완성합니다!*`;
  }

  return `### 🩺 Clinical Cessation Advisory

**Insight**: Cravings triggered by ${trigger} are standard neural habit responses.

**🎯 Future Action**:
When ${trigger} occurs in the future, pre-commit to a substitute action: *"Immediately take 3 deep abdominal breaths and chew mint gum."* This breaks the automatic craving loop before it starts.

🌿 *Pre-planned routines rewire your brain for lasting nicotine independence!*`;
}

async function startServer() {
  const app = express();
  const PORT = 3000;

  // Ensure VAPID keys on startup
  const startupDb = loadDB();
  if (!startupDb.vapidKeys) {
    try {
      startupDb.vapidKeys = webPush.generateVAPIDKeys();
      saveDB(startupDb);
      console.log("Generated and saved new VAPID keys on startup.");
    } catch (err) {
      console.error("Error generating VAPID keys on startup:", err);
    }
  }

  if (startupDb.vapidKeys) {
    webPush.setVapidDetails(
      "mailto:amberchai717@gmail.com",
      startupDb.vapidKeys.publicKey,
      startupDb.vapidKeys.privateKey
    );
  }

  app.use(express.json());

  // API endpoints FIRST

  // 1. SIGNUP ENDPOINT
  app.post("/api/auth/signup", (req, res) => {
    const { username, password } = req.body;
    if (!username || !password) {
      return res.status(400).json({ error: "Username and password required" });
    }

    const db = loadDB();
    const key = username.toLowerCase().trim();

    if (db.users[key]) {
      return res.status(400).json({ error: "Username already taken" });
    }

    // Save password
    db.users[key] = password;
    db.userData[key] = { logs: [], journals: [] };
    saveDB(db);

    res.json({ success: true, username: username.trim() });
  });

  // 2. LOGIN ENDPOINT
  app.post("/api/auth/login", (req, res) => {
    const { username, password } = req.body;
    if (!username || !password) {
      return res.status(400).json({ error: "Username and password required" });
    }

    const db = loadDB();
    const key = username.toLowerCase().trim();

    if (!db.users[key] || db.users[key] !== password) {
      return res.status(401).json({ error: "Invalid username or password" });
    }

    // Retrieve synced data
    const userPayload = db.userData[key] || { logs: [], journals: [], seedType: "" };
    res.json({
      success: true,
      username: username.trim(),
      logs: userPayload.logs || [],
      journals: userPayload.journals || [],
      seedType: userPayload.seedType || "",
      notificationSettings: userPayload.notificationSettings || null
    });
  });

  // 3. SYNC PUSH ENDPOINT
  app.post("/api/sync/push", (req, res) => {
    const { username, logs, journals, seedType } = req.body;
    if (!username) {
      return res.status(400).json({ error: "Username required" });
    }

    const db = loadDB();
    const key = username.toLowerCase().trim();

    if (!db.users[key]) {
      return res.status(404).json({ error: "User not found" });
    }

    // Store user data
    db.userData[key] = {
      logs: logs || [],
      journals: journals || [],
      seedType: seedType || "",
      notificationSettings: db.userData[key]?.notificationSettings || null
    };
    saveDB(db);

    res.json({ success: true });
  });

  // 4. SYNC PULL ENDPOINT
  app.post("/api/sync/pull", (req, res) => {
    const { username } = req.body;
    if (!username) {
      return res.status(400).json({ error: "Username required" });
    }

    const db = loadDB();
    const key = username.toLowerCase().trim();

    if (!db.users[key]) {
      return res.status(404).json({ error: "User not found" });
    }

    const userPayload = db.userData[key] || { logs: [], journals: [], seedType: "" };
    res.json({
      success: true,
      logs: userPayload.logs || [],
      journals: userPayload.journals || [],
      seedType: userPayload.seedType || "",
      notificationSettings: userPayload.notificationSettings || null
    });
  });

  // 5. NOTIFICATION ENDPOINTS
  app.get("/api/notifications/vapid-public-key", (req, res) => {
    const db = loadDB();
    if (db.vapidKeys && db.vapidKeys.publicKey) {
      res.json({ publicKey: db.vapidKeys.publicKey });
    } else {
      res.status(500).json({ error: "VAPID keys not configured" });
    }
  });

  app.post("/api/notifications/subscribe", (req, res) => {
    const { username, subscription, enabled, time, timezone } = req.body;
    if (!username) {
      return res.status(400).json({ error: "Username required" });
    }

    const db = loadDB();
    const key = username.toLowerCase().trim();

    if (!db.users[key]) {
      return res.status(404).json({ error: "User not found" });
    }

    if (!db.userData[key]) {
      db.userData[key] = { logs: [], journals: [] };
    }

    db.userData[key].notificationSettings = {
      enabled: enabled !== undefined ? enabled : true,
      time: time || "19:00",
      timezone: timezone || "UTC",
      subscription: subscription || db.userData[key]?.notificationSettings?.subscription || null,
      lastSentDate: db.userData[key]?.notificationSettings?.lastSentDate || ""
    };

    saveDB(db);
    res.json({ success: true, settings: db.userData[key].notificationSettings });
  });

  app.post("/api/notifications/get-settings", (req, res) => {
    const { username } = req.body;
    if (!username) {
      return res.status(400).json({ error: "Username required" });
    }

    const db = loadDB();
    const key = username.toLowerCase().trim();

    if (!db.users[key]) {
      return res.status(404).json({ error: "User not found" });
    }

    const settings = db.userData[key]?.notificationSettings || {
      enabled: false,
      time: "19:00",
      timezone: "UTC",
      subscription: null
    };

    res.json({ success: true, settings });
  });

  app.post("/api/notifications/test-send", async (req, res) => {
    const { username, subscription } = req.body;
    if (!username && !subscription) {
      return res.status(400).json({ error: "Username or subscription required" });
    }

    let sub = subscription;
    if (!sub && username) {
      const db = loadDB();
      const key = username.toLowerCase().trim();
      sub = db.userData[key]?.notificationSettings?.subscription;
    }

    if (!sub) {
      return res.status(404).json({ error: "No subscription found to test" });
    }

    const payload = JSON.stringify({
      title: "Bloom Test 🌸",
      body: "🌱 Testing, testing! Your Bloom reminders are ready to help you thrive.",
      data: { url: "/" }
    });

    try {
      await webPush.sendNotification(sub, payload);
      res.json({ success: true, message: "Test notification sent successfully" });
    } catch (err: any) {
      console.error("Error sending test notification:", err);
      res.status(500).json({ error: "Failed to send notification", details: err.message });
    }
  });

  app.post("/api/bloom-solution", async (req, res) => {
    try {
      const { habit, reason, lang } = req.body;
      if (!habit || !reason) {
        return res.status(400).json({ error: "Missing habit or reason" });
      }

      const selectedLang = lang || "en";
      const langNameMap: Record<string, string> = {
        en: "English",
        ms: "Malay (Bahasa Melayu)",
        zh: "Simplified Chinese (简体中文)",
        ko: "Korean (한국어)",
      };
      const languageName = langNameMap[selectedLang] || "English";

      const apiKey = process.env.GEMINI_API_KEY;
      if (!apiKey || apiKey === "MY_GEMINI_API_KEY" || apiKey.trim() === "") {
        console.log("Gemini API key is not configured or is default placeholder. Serving fallback advice.");
        return res.json({
          solution: getFallbackSolution(habit, reason, selectedLang),
          isFallback: true
        });
      }

      const ai = new GoogleGenAI({
        apiKey: apiKey,
        httpOptions: {
          headers: {
            'User-Agent': 'aistudio-build',
          }
        }
      });

      const prompt = `You are a certified Tobacco and Nicotine Cessation Specialist.

The user logged that they consumed "${habit}" today due to this trigger:
"${reason}"

Write a concise, high-impact clinical cessation guidance in "${languageName}".

STRICT BREVITY REQUIREMENT: The user MUST be able to read and understand the entire response in UNDER 10 SECONDS (MAX 35-45 WORDS TOTAL).

Structure:
1. **🩺 Clinical Insight**: (1 short sentence) Acknowledge "${reason}" as a recognized neural trigger.
2. **🎯 Future Action**: (1 clear, actionable sentence) Provide EXACTLY ONE specific future replacement routine when "${reason}" happens again (e.g. "When ${reason} occurs next time, pre-commit to: [1 concrete replacement action]").
3. **🌿 Specialist Note**: (1 short closing sentence) Reassure them that pre-planning rewires habits.

Keep it professional, encouraging, direct, and under 45 words. No fluff.
`;

      let systemInstruction = "You are a certified Tobacco and Nicotine Cessation Specialist. You provide expert, compassionate, concise advice under 40 words focusing on ONE clear future prevention action.";
      if (selectedLang === "ms") {
        systemInstruction = "Anda adalah Pakar Penghentian Merokok dan Nikotin bertauliah. Anda memberikan nasihat profesional yang berfokus pada SATU tindakan pencegahan masa hadapan yang jelas untuk mengatasi pencetus merokok atau vaping.";
      } else if (selectedLang === "zh") {
        systemInstruction = "您是一位持证戒烟与尼古丁戒断专家。您提供专业、富有同理心的指导，重点提供 ONE（一项）明确的未来预防策略，帮助用户克服未来的吸烟或电子烟诱因。";
      } else if (selectedLang === "ko") {
        systemInstruction = "당신은 공인 금연 및 니코틴 중단 전문가입니다. 사용자가 향후 동일한 흡연/베이핑 유발 원인을 극복할 수 있도록 단 하나의 명확한 미래 예방 행동 전략을 전문적으로 제시합니다.";
      }

      const response = await ai.models.generateContent({
        model: "gemini-3.6-flash",
        contents: prompt,
        config: {
          systemInstruction: systemInstruction,
          temperature: 0.7,
        }
      });

      const text = response.text || "I'm right here with you, and you are doing so well. Let's take it one step at a time.";
      res.json({ solution: text, isFallback: false });
    } catch (error: any) {
      console.error("Error generating solution:", error);
      res.json({
        solution: getFallbackSolution(req.body.habit || "vape", req.body.reason || "", req.body.lang || "en"),
        isFallback: true,
        error: error.message
      });
    }
  });

  // 6. URGE BUTTON COUNSELOR ENDPOINT
  app.post("/api/urge-quest", async (req, res) => {
    try {
      const { habit, reason, lang } = req.body;
      const selectedLang = lang || "en";
      const habitName = habit === "cigarettes" ? "cigarettes" : "vaping";
      const userReason = (reason || "").trim();
      const apiKey = process.env.GEMINI_API_KEY;

      if (!apiKey || apiKey === "MY_GEMINI_API_KEY" || apiKey.trim() === "") {
        return res.json({ 
          solution: getFallbackSolution(habitName, userReason, selectedLang), 
          isFallback: true 
        });
      }

      const ai = new GoogleGenAI({
        apiKey: apiKey,
        httpOptions: {
          headers: {
            'User-Agent': 'aistudio-build',
          }
        }
      });

      const langNameMap: Record<string, string> = {
        en: "English",
        ms: "Malay (Bahasa Melayu)",
        zh: "Simplified Chinese",
        ko: "Korean",
      };
      const languageName = langNameMap[selectedLang] || "English";

      const prompt = `You are a warm, empathetic quit-smoking and quit-vaping counselor and support group leader for teenagers and young adults.

The user shared why they feel an urge to ${habitName} right now:
"${userReason || "I feel a strong craving and urge to vape or smoke right now."}"

Please write a supportive, non-judgmental, and comforting counselor response in Markdown, strictly in "${languageName}".

CRITICAL BREVITY REQUIREMENT: Keep the entire response EXTREMELY SHORT so the user can read and understand it in under 10 seconds (UNDER 40 WORDS TOTAL).

Requirements:
1. 1 short comforting sentence validating their feeling (under 10 words).
2. "3 Quick Actions & Evidence:" followed by EXACTLY 3 bullet points with brief evidence of why it works (e.g. "* 🫁 **Deep Breath**: Calms vagus nerve & heart rate").
3. Conclude with 1 short encouraging scientific fact line (under 10 words).
`;

      const response = await ai.models.generateContent({
        model: "gemini-3.6-flash",
        contents: prompt,
        config: {
          temperature: 0.7,
        }
      });

      const text = response.text || getFallbackSolution(habitName, userReason, selectedLang);
      res.json({ solution: text, isFallback: false });
    } catch (error: any) {
      console.error("Error generating counselor advice:", error);
      res.json({ 
        solution: getFallbackSolution(req.body.habit || "vape", req.body.reason || "", req.body.lang || "en"), 
        isFallback: true, 
        error: error.message 
      });
    }
  });

  // Serve the Service Worker dynamically with push capability
  app.get("/sw.js", (req, res) => {
    res.setHeader("Content-Type", "application/javascript");
    res.send(`
self.addEventListener('push', function(event) {
  let data = {};
  if (event.data) {
    try {
      data = event.data.json();
    } catch (e) {
      data = { title: '🌱 Bloom Check-in', body: event.data.text() };
    }
  }

  const title = data.title || '🌱 Bloom Check-in';
  const options = {
    body: data.body || 'Time for your daily Bloom check-in! Keep your streak growing. 🌸',
    icon: '/favicon.ico',
    badge: '/favicon.ico',
    tag: 'bloom-daily-reminder',
    renotify: true,
    data: data.data || {}
  };

  event.waitUntil(
    self.registration.showNotification(title, options)
  );
});

self.addEventListener('notificationclick', function(event) {
  event.notification.close();
  event.waitUntil(
    clients.matchAll({ type: 'window', includeUncontrolled: true }).then(function(clientList) {
      for (var i = 0; i < clientList.length; i++) {
        var client = clientList[i];
        if (client.url.indexOf(self.location.origin) !== -1 && 'focus' in client) {
          return client.focus();
        }
      }
      if (clients.openWindow) {
        return clients.openWindow('/');
      }
    })
  );
});
    `);
  });

  // Background notification check-in job (every 60 seconds)
  setInterval(() => {
    try {
      const db = loadDB();
      const now = new Date();

      Object.keys(db.userData).forEach(async (usernameKey) => {
        const userPayload = db.userData[usernameKey];
        const settings = userPayload?.notificationSettings;

        if (settings && settings.enabled === true && settings.subscription) {
          const timezone = settings.timezone || "UTC";
          try {
            // Get local hour and minute in the user's specific timezone
            const options = {
              timeZone: timezone,
              hour: 'numeric',
              minute: 'numeric',
              hour12: false
            } as const;
            
            const formatter = new Intl.DateTimeFormat('en-US', options);
            const parts = formatter.formatToParts(now);
            const hourVal = parts.find(p => p.type === 'hour')?.value;
            const minVal = parts.find(p => p.type === 'minute')?.value;

            if (hourVal && minVal) {
              const localTimeStr = `${hourVal.padStart(2, "0")}:${minVal.padStart(2, "0")}`; // "HH:MM"
              
              if (localTimeStr === settings.time) {
                // Get local date in their timezone to check if already sent today
                const dateOptions = {
                  timeZone: timezone,
                  year: 'numeric',
                  month: 'numeric',
                  day: 'numeric'
                } as const;
                const dateFormatter = new Intl.DateTimeFormat('en-US', dateOptions);
                const localDateStr = dateFormatter.format(now); // e.g. "7/20/2026"

                if (settings.lastSentDate !== localDateStr) {
                  // Message choices:
                  const messages = [
                    "🌱 Time for your daily Bloom check-in!",
                    "🌸 Keep your streak growing—visit Bloom today!",
                    "💧 Take a moment to care for yourself today."
                  ];
                  const randomMsg = messages[Math.floor(Math.random() * messages.length)];

                  const payload = JSON.stringify({
                    title: "Bloom Daily Check-in 🌸",
                    body: randomMsg,
                    data: { url: "/" }
                  });

                  // Update database immediately before sending to prevent double-sends
                  settings.lastSentDate = localDateStr;
                  userPayload.notificationSettings = settings;
                  saveDB(db);

                  try {
                    await webPush.sendNotification(settings.subscription, payload);
                    console.log(`Successfully sent scheduled daily notification to user ${usernameKey}`);
                  } catch (pushErr: any) {
                    console.error(`Error sending push notification to user ${usernameKey}:`, pushErr);
                    // Handle expired subscription (410 Gone / 404 Not Found)
                    if (pushErr.statusCode === 410 || pushErr.statusCode === 404) {
                      console.log(`Subscription for user ${usernameKey} is inactive. Disabling daily reminders.`);
                      settings.enabled = false;
                      userPayload.notificationSettings = settings;
                      saveDB(db);
                    }
                  }
                }
              }
            }
          } catch (tzErr) {
            console.error(`Timezone formatting error for user ${usernameKey} with timezone ${timezone}:`, tzErr);
          }
        }
      });
    } catch (dbErr) {
      console.error("Error in background check-in timer job:", dbErr);
    }
  }, 60000); // every 1 minute

  // Vite middleware for development
  if (process.env.NODE_ENV !== "production") {
    const vite = await createViteServer({
      server: { middlewareMode: true },
      appType: "spa",
    });
    app.use(vite.middlewares);
  } else {
    const distPath = path.join(process.cwd(), 'dist');
    app.use(express.static(distPath));
    app.get('*', (req, res) => {
      res.sendFile(path.join(distPath, 'index.html'));
    });
  }

  app.listen(PORT, "0.0.0.0", () => {
    console.log(`Bloom Server running on http://localhost:${PORT}`);
  });
}

startServer();
