import express from "express";
import path from "path";
import { createServer as createViteServer } from "vite";
import { GoogleGenAI } from "@google/genai";
import dotenv from "dotenv";
import mysql from "mysql2/promise";
import jwt from "jsonwebtoken";

dotenv.config();

const app = express();
const PORT = 3000;
const JWT_SECRET = process.env.JWT_SECRET || "rahasia_negara_101";

app.use(express.json());

// MySQL Connection Pool
const pool = mysql.createPool({
  host: process.env.DB_HOST || "localhost",
  user: process.env.DB_USER || "root",
  password: process.env.DB_PASSWORD || "mrrk271003",
  database: process.env.DB_NAME || "time101_db",
  waitForConnections: true,
  connectionLimit: 10,
  queueLimit: 0
});

// Define basic structural schemas
interface ScheduleItem {
  id: string;
  title: string;
  category: 'sekolah' | 'ibadah' | 'tidur' | 'bangun' | 'belajar' | 'bermain' | 'parent_increment';
  description: string;
  startTime: string;
  endTime: string;
  day: 'Hari ini' | 'Senin - Jumat' | 'Setiap Hari';
  completed: boolean;
  reward: number;
  locked: boolean;
  parentQuest: boolean;
}

const FALLBACK_QUOTES = [
  { text: "Kunci keberhasilan adalah kedisiplinan dan menghargai setiap detik waktu kita.", author: "Asisten Time 101" },
  { text: "Menyelesaikan sholat tepat waktu melatih fokus, kedamaian hati, dan keteraturan hidup.", author: "Asisten Time 101" },
  { text: "Tidur malam tepat waktu pukul 21:30 adalah cara terbaik menyayangi tubuhmu agar besok segar bersekolah!", author: "Asisten Time 101" },
  { text: "Misi tambahan dari orang tua adalah kesempatan emas membuktikan bahwa kamu adalah anak yang mandiri dan berbakti.", author: "Asisten Time 101" },
  { text: "Kedisiplinan hari ini adalah permata keberhasilan kamu di masa depan. Semangat belajar!", author: "Asisten Time 101" }
];

const DEFAULT_SCHEDULES: ScheduleItem[] = [
  { id: "sys_sholat_subuh", title: "Ibadah Sholat Subuh", category: "ibadah", description: "Melaksanakan sholat Subuh tepat waktu agar hati tenang.", startTime: "05:00", endTime: "05:30", day: "Setiap Hari", completed: false, reward: 25, locked: true, parentQuest: false },
  { id: "sys_alarm_bangun", title: "Bangun Pagi & Matikan Alarm", category: "bangun", description: "Bangun tidur jam 05:30 dan matikan alarm dengan semangat!", startTime: "05:30", endTime: "05:40", day: "Setiap Hari", completed: false, reward: 10, locked: true, parentQuest: false },
  { id: "sys_siap_sekolah", title: "Persiapan Sekolah (Mandi, Sarapan)", category: "bangun", description: "Persiapan mandiri sebelum berangkat: mandi segar, sarapan sehat.", startTime: "05:40", endTime: "07:15", day: "Senin - Jumat", completed: false, reward: 30, locked: true, parentQuest: false },
  { id: "sys_berangkat_sekolah", title: "Berangkat Sekolah Tepat Waktu", category: "sekolah", description: "Kewajiban utama bersekolah untuk masa depan cerah.", startTime: "07:15", endTime: "07:30", day: "Senin - Jumat", completed: false, reward: 20, locked: true, parentQuest: false },
  { id: "sys_belajar_sekolah", title: "Belajar di Sekolah", category: "sekolah", description: "Sesi wajib menuntut ilmu di kelas.", startTime: "07:30", endTime: "14:30", day: "Senin - Jumat", completed: false, reward: 0, locked: true, parentQuest: false },
  { id: "sys_sholat_dzuhur", title: "Ibadah Sholat Dzuhur", category: "ibadah", description: "Melaksanakan sholat Dzuhur berjamaah.", startTime: "12:00", endTime: "12:30", day: "Setiap Hari", completed: false, reward: 25, locked: true, parentQuest: false },
  { id: "sys_sholat_ashar", title: "Ibadah Sholat Ashar", category: "ibadah", description: "Melaksanakan sholat Ashar tepat waktu.", startTime: "15:30", endTime: "16:00", day: "Setiap Hari", completed: false, reward: 25, locked: true, parentQuest: false },
  { id: "sys_sholat_maghrib", title: "Ibadah Sholat Maghrib", category: "ibadah", description: "Membaca Al-Qur'an setelah sholat Maghrib bersama keluarga.", startTime: "18:00", endTime: "18:30", day: "Setiap Hari", completed: false, reward: 25, locked: true, parentQuest: false },
  { id: "sys_sholat_isya", title: "Ibadah Sholat Isya", category: "ibadah", description: "Melaksanakan sholat Isya menyempurnakan hari.", startTime: "19:15", endTime: "19:45", day: "Setiap Hari", completed: false, reward: 25, locked: true, parentQuest: false },
  { id: "sys_tidur", title: "Tidur Malam Cukup", category: "tidur", description: "Mulai tidur malam pukul 21:30 agar bangun segar bugar besok pagi.", startTime: "21:30", endTime: "05:00", day: "Setiap Hari", completed: false, reward: 10, locked: true, parentQuest: false },
  { id: "parent_1", title: "Rapikan Meja Belajar", category: "parent_increment", description: "Merapikan buku sekolah, pensil, dan lap meja hingga bersih.", startTime: "16:00", endTime: "16:30", day: "Hari ini", completed: false, reward: 20, locked: false, parentQuest: true },
  { id: "parent_2", title: "Menyiram Tanaman", category: "parent_increment", description: "Menyiram tanaman hias di teras rumah agar segar.", startTime: "16:45", endTime: "17:00", day: "Hari ini", completed: false, reward: 15, locked: false, parentQuest: true }
];

async function initDB() {
  try {
    const connection = await mysql.createConnection({
      host: process.env.DB_HOST || "localhost",
      user: process.env.DB_USER || "root",
      password: process.env.DB_PASSWORD || "mrrk271003",
    });
    await connection.query("CREATE DATABASE IF NOT EXISTS `time101_db`;");
    await connection.end();

    // Create tables
    await pool.query(`
      CREATE TABLE IF NOT EXISTS parents (
        id INT AUTO_INCREMENT PRIMARY KEY,
        username VARCHAR(50) UNIQUE NOT NULL,
        password VARCHAR(255) NOT NULL
      )
    `);

    await pool.query(`
      CREATE TABLE IF NOT EXISTS children (
        id INT AUTO_INCREMENT PRIMARY KEY,
        device_id VARCHAR(255) UNIQUE NOT NULL,
        gender VARCHAR(20) DEFAULT 'cewe',
        level INT DEFAULT 1,
        exp INT DEFAULT 0,
        maxExp INT DEFAULT 1000,
        streak INT DEFAULT 0,
        streakClaimedToday BOOLEAN DEFAULT FALSE,
        avatarMood VARCHAR(50) DEFAULT 'netral',
        avatarAction VARCHAR(50) DEFAULT 'idle',
        badges JSON,
        completedCount INT DEFAULT 0
      )
    `);

    try {
      await pool.query("ALTER TABLE children ADD COLUMN unique_code VARCHAR(20) UNIQUE;");
    } catch (e: any) {
      if (e.code !== 'ER_DUP_FIELDNAME') {
        console.error("Error adding unique_code column", e);
      }
    }

    try {
      await pool.query("ALTER TABLE children ADD COLUMN gender VARCHAR(20) DEFAULT 'cewe';");
    } catch (e: any) {
      if (e.code !== 'ER_DUP_FIELDNAME') {
        console.error("Error adding gender column", e);
      }
    }

    // Initialize unique_code for existing children that don't have one
    const [childrenWithoutCode]: any = await pool.query("SELECT id FROM children WHERE unique_code IS NULL");
    for (const child of childrenWithoutCode) {
      const uniqueCode = Math.random().toString(36).substring(2, 8).toUpperCase();
      await pool.query("UPDATE children SET unique_code = ? WHERE id = ?", [uniqueCode, child.id]);
    }

    await pool.query(`
      CREATE TABLE IF NOT EXISTS parent_children (
        parent_id INT,
        child_id INT,
        PRIMARY KEY (parent_id, child_id),
        FOREIGN KEY (parent_id) REFERENCES parents(id) ON DELETE CASCADE,
        FOREIGN KEY (child_id) REFERENCES children(id) ON DELETE CASCADE
      )
    `);

    await pool.query(`
      CREATE TABLE IF NOT EXISTS master_schedules (
        id VARCHAR(255) PRIMARY KEY,
        title VARCHAR(255),
        category VARCHAR(50),
        description TEXT,
        startTime VARCHAR(10),
        endTime VARCHAR(10),
        day VARCHAR(50),
        reward INT,
        locked BOOLEAN,
        parentQuest BOOLEAN
      )
    `);

    await pool.query(`
      CREATE TABLE IF NOT EXISTS quotes (
        id INT AUTO_INCREMENT PRIMARY KEY,
        text TEXT NOT NULL,
        author VARCHAR(100) NOT NULL
      )
    `);

    await pool.query(`
      CREATE TABLE IF NOT EXISTS schedules (
        db_id INT AUTO_INCREMENT PRIMARY KEY,
        id VARCHAR(255) NOT NULL,
        child_id INT NOT NULL,
        title VARCHAR(255),
        category VARCHAR(50),
        description TEXT,
        startTime VARCHAR(10),
        endTime VARCHAR(10),
        day VARCHAR(50),
        completed BOOLEAN DEFAULT FALSE,
        reward INT,
        locked BOOLEAN,
        parentQuest BOOLEAN,
        FOREIGN KEY (child_id) REFERENCES children(id) ON DELETE CASCADE,
        UNIQUE KEY unique_schedule (child_id, id)
      )
    `);

    // Insert default parent
    const [parentRows]: any = await pool.query(`SELECT * FROM parents WHERE username = 'admin'`);
    if (parentRows.length === 0) {
      await pool.query(`INSERT INTO parents (username, password) VALUES ('admin', 'admin123')`);
    }

    // Seed master schedules
    const [masterRows]: any = await pool.query(`SELECT COUNT(*) as cnt FROM master_schedules`);
    if (masterRows[0].cnt === 0) {
      for (const s of DEFAULT_SCHEDULES) {
        await pool.query(
          `INSERT INTO master_schedules (id, title, category, description, startTime, endTime, day, reward, locked, parentQuest)
           VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?, ?)`,
          [s.id, s.title, s.category, s.description, s.startTime, s.endTime, s.day, s.reward, s.locked, s.parentQuest]
        );
      }
    }

    // Seed quotes
    const [quoteRows]: any = await pool.query(`SELECT COUNT(*) as cnt FROM quotes`);
    if (quoteRows[0].cnt === 0) {
      for (const q of FALLBACK_QUOTES) {
        await pool.query(`INSERT INTO quotes (text, author) VALUES (?, ?)`, [q.text, q.author]);
      }
    }

    console.log("Database initialized successfully.");
  } catch (err) {
    console.error("Failed to initialize database:", err);
  }
}

initDB();

// Helper to get or create child based on deviceId
async function getOrCreateChild(deviceId: string) {
  if (!deviceId) throw new Error("Device ID is required");
  
  const [childRows]: any = await pool.query(`SELECT * FROM children WHERE device_id = ?`, [deviceId]);
  if (childRows.length > 0) {
    const child = childRows[0];
    // Safe parse badges — handles both JSON array and plain comma-separated strings
    if (typeof child.badges === 'string') {
      try {
        child.badges = JSON.parse(child.badges);
      } catch {
        // Fallback: plain text like "alarm_off,sholat_rajin"
        child.badges = child.badges.split(',').map((b: string) => b.trim()).filter(Boolean);
        // Fix in DB too
        await pool.query(`UPDATE children SET badges = ? WHERE id = ?`, [JSON.stringify(child.badges), child.id]);
      }
    }
    if (!Array.isArray(child.badges)) child.badges = [];
    child.streakClaimedToday = !!child.streakClaimedToday;
    return child;
  }

  // Create new child
  const uniqueCode = Math.random().toString(36).substring(2, 8).toUpperCase();
  const initialBadges = JSON.stringify(["alarm_off", "sholat_rajin"]);
  const defaultGender = Math.random() > 0.5 ? 'cewe' : 'lanang';
  const [insertRes]: any = await pool.query(
    `INSERT INTO children (device_id, unique_code, badges, gender) VALUES (?, ?, ?, ?)`,
    [deviceId, uniqueCode, initialBadges, defaultGender]
  );
  const childId = insertRes.insertId;

  // Insert default schedules
  const [masterSchedules]: any = await pool.query(`SELECT * FROM master_schedules`);
  for (const s of masterSchedules) {
    await pool.query(
      `INSERT INTO schedules (id, child_id, title, category, description, startTime, endTime, day, completed, reward, locked, parentQuest)
       VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?)`,
      [s.id, childId, s.title, s.category, s.description, s.startTime, s.endTime, s.day, false, s.reward, s.locked, s.parentQuest]
    );
  }

  const [newChildRows]: any = await pool.query(`SELECT * FROM children WHERE id = ?`, [childId]);
  const newChild = newChildRows[0];
  newChild.badges = JSON.parse(newChild.badges);
  newChild.streakClaimedToday = !!newChild.streakClaimedToday;
  return newChild;
}

async function getSchedules(childId: number, overrideDay?: number) {
  const [schedules]: any = await pool.query(`SELECT * FROM schedules WHERE child_id = ?`, [childId]);
  const dayOfWeek = overrideDay !== undefined ? overrideDay : new Date().getDay();
  const isWeekend = dayOfWeek === 0 || dayOfWeek === 6;

  return schedules
    .filter((s: any) => {
      // 'Senin - Jumat' → hanya tampil hari kerja
      if (s.day === 'Senin - Jumat' && isWeekend) return false;
      return true;
    })
    .map((s: any) => ({
      ...s,
      completed: !!s.completed,
      locked: !!s.locked,
      parentQuest: !!s.parentQuest
    }));
}

// Return ALL schedules without day filter (for parent view)
async function getAllSchedules(childId: number) {
  const [schedules]: any = await pool.query(`SELECT * FROM schedules WHERE child_id = ?`, [childId]);
  return schedules.map((s: any) => ({
    ...s,
    completed: !!s.completed,
    locked: !!s.locked,
    parentQuest: !!s.parentQuest
  }));
}


// Middleware for auth
const authenticateParent = (req: any, res: any, next: any) => {
  const authHeader = req.headers.authorization;
  if (!authHeader) return res.status(401).json({ error: "Unauthorized" });

  const token = authHeader.split(" ")[1];
  jwt.verify(token, JWT_SECRET, (err: any, user: any) => {
    if (err) return res.status(403).json({ error: "Invalid token" });
    req.user = user;
    next();
  });
};

// --- API Endpoints ---

app.post("/api/auth/parent", async (req, res) => {
  const { username, password } = req.body;
  try {
    const [rows]: any = await pool.query(`SELECT * FROM parents WHERE username = ? AND password = ?`, [username, password]);
    if (rows.length > 0) {
      const token = jwt.sign({ id: rows[0].id, username: rows[0].username }, JWT_SECRET, { expiresIn: '1d' });
      res.json({ success: true, token });
    } else {
      res.status(401).json({ success: false, error: "Username atau password salah" });
    }
  } catch (err) {
    res.status(500).json({ error: "Internal server error" });
  }
});

// Get linked children for a parent
app.get("/api/parent/children", authenticateParent, async (req: any, res) => {
  const parentId = req.user.id;
  try {
    const [rows]: any = await pool.query(`
      SELECT c.* FROM children c
      JOIN parent_children pc ON c.id = pc.child_id
      WHERE pc.parent_id = ?
    `, [parentId]);
    
    const children = rows.map((child: any) => ({
      ...child,
      badges: typeof child.badges === 'string' ? JSON.parse(child.badges) : child.badges,
      streakClaimedToday: !!child.streakClaimedToday
    }));
    
    res.json({ success: true, children });
  } catch (err) {
    res.status(500).json({ error: "Database error" });
  }
});

// Link a child to a parent using unique_code
app.post("/api/parent/link_child", authenticateParent, async (req: any, res) => {
  const parentId = req.user.id;
  const { unique_code } = req.body;
  if (!unique_code) return res.status(400).json({ error: "Kode unik wajib diisi" });

  try {
    const [childRows]: any = await pool.query(`SELECT id FROM children WHERE unique_code = ?`, [unique_code.toUpperCase()]);
    if (childRows.length === 0) {
      return res.status(404).json({ error: "Anak dengan kode tersebut tidak ditemukan" });
    }
    const childId = childRows[0].id;
    
    const [linkRows]: any = await pool.query(`SELECT * FROM parent_children WHERE parent_id = ? AND child_id = ?`, [parentId, childId]);
    if (linkRows.length > 0) {
      return res.status(400).json({ error: "Anak ini sudah terhubung ke akun Anda" });
    }

    await pool.query(`INSERT INTO parent_children (parent_id, child_id) VALUES (?, ?)`, [parentId, childId]);
    res.json({ success: true, message: "Berhasil terhubung dengan anak" });
  } catch (err) {
    res.status(500).json({ error: "Database error" });
  }
});

// Load current full state for a child
app.get("/api/db", async (req, res) => {
  const deviceId = req.headers['x-device-id'] as string;
  if (!deviceId) return res.status(400).json({ error: "Device ID required" });

  // showAll=true → return all schedules without day filter (for parent view)
  const showAll = req.query.showAll === 'true';
  // Optional debug day override from query param (0=Minggu ... 6=Sabtu)
  const debugDay = req.query.debugDay !== undefined ? Number(req.query.debugDay) : undefined;

  try {
    const child = await getOrCreateChild(deviceId);
    const schedules = showAll
      ? await getAllSchedules(child.id)       // parent: no day filter
      : await getSchedules(child.id, debugDay); // child: filtered by day
    res.json({ child, schedules });
  } catch (err) {
    res.status(500).json({ error: "Database error" });
  }
});

// Update child profile statistics or mood
app.post("/api/child", async (req, res) => {
  const deviceId = req.headers['x-device-id'] as string;
  if (!deviceId) return res.status(400).json({ error: "Device ID required" });

  try {
    const child = await getOrCreateChild(deviceId);
    const updates = req.body;
    console.log("RECEIVED UPDATES:", updates);
    
    // Merge updates
    const level = updates.level !== undefined ? updates.level : child.level;
    const exp = updates.exp !== undefined ? updates.exp : child.exp;
    const maxExp = updates.maxExp !== undefined ? updates.maxExp : child.maxExp;
    const streakClaimedToday = updates.streakClaimedToday !== undefined ? updates.streakClaimedToday : child.streakClaimedToday;
    const gender = updates.gender !== undefined ? updates.gender : child.gender;
    console.log("UPDATING TO GENDER:", gender);
    
    // Recalculate avatar mood on compliance
    const schedules = await getSchedules(child.id);
    const completedToday = schedules.filter((s: any) => s.completed).length;
    const totalToday = schedules.length;
    const activeRate = totalToday > 0 ? completedToday / totalToday : 1;

    let avatarMood = child.avatarMood;
    if (activeRate >= 0.75) avatarMood = "semangat";
    else if (activeRate >= 0.45) avatarMood = "netral";
    else avatarMood = "lelah";

    await pool.query(
      `UPDATE children SET level=?, exp=?, maxExp=?, streakClaimedToday=?, avatarMood=?, gender=? WHERE id=?`,
      [level, exp, maxExp, streakClaimedToday, avatarMood, gender, child.id]
    );

    const updatedChild = await getOrCreateChild(deviceId);
    res.json(updatedChild);
  } catch (err) {
    res.status(500).json({ error: "Database error" });
  }
});

// Add a Parent Increment Task / Side-Quest
app.post("/api/schedule", authenticateParent, async (req, res) => {
  const deviceId = req.headers['x-device-id'] as string;
  if (!deviceId) return res.status(400).json({ error: "Device ID required" });

  try {
    const child = await getOrCreateChild(deviceId);
    const newItem: ScheduleItem = {
      id: `parent_\${Date.now()}`,
      title: req.body.title || "Tugas Tanpa Nama",
      category: "parent_increment",
      description: req.body.description || "Tugas tambahan dari Orang Tua",
      startTime: req.body.startTime || "16:00",
      endTime: req.body.endTime || "16:30",
      day: "Hari ini",
      completed: false,
      reward: Number(req.body.reward) || 15,
      locked: false,
      parentQuest: true
    };
    
    await pool.query(
      `INSERT INTO schedules (id, child_id, title, category, description, startTime, endTime, day, completed, reward, locked, parentQuest)
       VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?)`,
      [newItem.id, child.id, newItem.title, newItem.category, newItem.description, newItem.startTime, newItem.endTime, newItem.day, newItem.completed, newItem.reward, newItem.locked, newItem.parentQuest]
    );
    
    res.json({ success: true, item: newItem });
  } catch (err) {
    res.status(500).json({ error: "Database error" });
  }
});

// Add a Custom Task created by the Child
app.post("/api/child/schedule", async (req, res) => {
  const deviceId = req.headers['x-device-id'] as string;
  if (!deviceId) return res.status(400).json({ error: "Device ID required" });

  try {
    const child = await getOrCreateChild(deviceId);
    const newItem: ScheduleItem = {
      id: `child_\${Date.now()}`,
      title: req.body.title || "Agendaku Sendiri",
      category: "bermain", // default category for custom child tasks
      description: req.body.description || "Tugas tambahan yang kubuat sendiri",
      startTime: req.body.startTime || "16:00",
      endTime: req.body.endTime || "16:30",
      day: "Hari ini",
      completed: false,
      reward: 10, // default reward for custom child tasks
      locked: false,
      parentQuest: false
    };
    
    await pool.query(
      `INSERT INTO schedules (id, child_id, title, category, description, startTime, endTime, day, completed, reward, locked, parentQuest)
       VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?)`,
      [newItem.id, child.id, newItem.title, newItem.category, newItem.description, newItem.startTime, newItem.endTime, newItem.day, newItem.completed, newItem.reward, newItem.locked, newItem.parentQuest]
    );
    
    res.json({ success: true, item: newItem });
  } catch (err) {
    res.status(500).json({ error: "Database error" });
  }
});

// Complete a schedule or Parent Quest and claim EXP
app.post("/api/schedule/complete", async (req, res) => {
  const deviceId = req.headers['x-device-id'] as string;
  if (!deviceId) return res.status(400).json({ error: "Device ID required" });
  
  const { id } = req.body;
  try {
    const child = await getOrCreateChild(deviceId);
    const [scheduleRows]: any = await pool.query(`SELECT * FROM schedules WHERE id = ? AND child_id = ?`, [id, child.id]);
    
    if (scheduleRows.length === 0) {
      return res.status(404).json({ error: "Jadwal tidak ditemukan" });
    }

    const item = scheduleRows[0];
    if (item.completed) {
      return res.json({ success: false, message: "Jadwal sudah diselesaikan sebelumnya" });
    }

    // Set as completed
    await pool.query(`UPDATE schedules SET completed = TRUE WHERE db_id = ?`, [item.db_id]);
    
    let completedCount = child.completedCount + 1;
    let exp = child.exp + item.reward;
    let level = child.level;
    let maxExp = child.maxExp;
    let leveledUp = false;
    let badges = [...child.badges];

    if (exp >= maxExp) {
      level += 1;
      exp = exp - maxExp;
      maxExp = Math.floor(1000 + (level * 100));
      leveledUp = true;

      if (!badges.includes("master_disiplin") && level >= 13) {
        badges.push("master_disiplin");
      }
    }

    // Evaluate badges
    const schedules = await getSchedules(child.id);
    const completedList = schedules.filter((s: any) => s.completed);
    
    const prayerCount = completedList.filter((s: any) => s.category === "ibadah").length;
    if (prayerCount >= 4 && !badges.includes("sholat_rajin")) {
      badges.push("sholat_rajin");
    }

    const parentCount = completedList.filter((s: any) => s.category === "parent_increment").length;
    if (parentCount >= 3 && !badges.includes("anak_berbakti")) {
      badges.push("anak_berbakti");
    }

    const totalCount = schedules.length;
    const rate = completedList.length / totalCount;
    let avatarMood = child.avatarMood;
    if (rate >= 0.75) avatarMood = "semangat";
    else if (rate >= 0.45) avatarMood = "netral";
    else avatarMood = "lelah";

    await pool.query(
      `UPDATE children SET exp=?, level=?, maxExp=?, completedCount=?, badges=?, avatarMood=? WHERE id=?`,
      [exp, level, maxExp, completedCount, JSON.stringify(badges), avatarMood, child.id]
    );

    const updatedChild = await getOrCreateChild(deviceId);
    res.json({
      success: true,
      item: { ...item, completed: true },
      child: updatedChild,
      leveledUp
    });
  } catch (err) {
    res.status(500).json({ error: "Database error" });
  }
});

// Delete a schedule — orang tua bisa hapus semua jadwal (termasuk yang terkunci)
app.delete("/api/schedule/:id", authenticateParent, async (req, res) => {
  const deviceId = req.headers['x-device-id'] as string;
  if (!deviceId) return res.status(400).json({ error: "Device ID required" });
  
  const { id } = req.params;
  try {
    const child = await getOrCreateChild(deviceId);
    const [scheduleRows]: any = await pool.query(`SELECT * FROM schedules WHERE id = ? AND child_id = ?`, [id, child.id]);
    
    if (scheduleRows.length > 0) {
      await pool.query(`DELETE FROM schedules WHERE db_id = ?`, [scheduleRows[0].db_id]);
      return res.json({ success: true });
    }
    res.status(404).json({ error: "Jadwal tidak ditemukan" });
  } catch (err) {
    res.status(500).json({ error: "Database error" });
  }
});

// Update (edit) jadwal — orang tua bisa edit semua jadwal
app.put("/api/schedule/:id", authenticateParent, async (req, res) => {
  const deviceId = req.headers['x-device-id'] as string;
  if (!deviceId) return res.status(400).json({ error: "Device ID required" });
  
  const { id } = req.params;
  const { title, description, startTime, endTime, reward, day } = req.body;
  try {
    const child = await getOrCreateChild(deviceId);
    const [scheduleRows]: any = await pool.query(`SELECT * FROM schedules WHERE id = ? AND child_id = ?`, [id, child.id]);
    
    if (scheduleRows.length === 0) {
      return res.status(404).json({ error: "Jadwal tidak ditemukan" });
    }

    const s = scheduleRows[0];
    await pool.query(
      `UPDATE schedules SET title=?, description=?, startTime=?, endTime=?, reward=?, day=? WHERE db_id=?`,
      [
        title ?? s.title,
        description ?? s.description,
        startTime ?? s.startTime,
        endTime ?? s.endTime,
        reward ?? s.reward,
        day ?? s.day,
        s.db_id
      ]
    );
    
    res.json({ success: true });
  } catch (err) {
    res.status(500).json({ error: "Database error" });
  }
});

// Reset simulation states
app.post("/api/reset", async (req, res) => {
  const deviceId = req.headers['x-device-id'] as string;
  if (!deviceId) return res.status(400).json({ error: "Device ID required" });

  try {
    const child = await getOrCreateChild(deviceId);
    
    // Reset schedules
    await pool.query(`UPDATE schedules SET completed = FALSE WHERE child_id = ?`, [child.id]);
    // Delete non-default parent increments
    await pool.query(`DELETE FROM schedules WHERE child_id = ? AND id LIKE 'parent_%' AND id NOT IN ('parent_1', 'parent_2')`, [child.id]);
    
    await pool.query(
      `UPDATE children SET level = 1, exp = 0, maxExp = 1000, streak = 0, streakClaimedToday = FALSE, badges = '[]', completedCount = 0, avatarMood = 'netral', avatarAction = 'idle' WHERE id = ?`,
      [child.id]
    );

    const updatedChild = await getOrCreateChild(deviceId);
    const schedules = await getSchedules(child.id);
    res.json({ child: updatedChild, schedules });
  } catch (err) {
    res.status(500).json({ error: "Database error" });
  }
});

// Restore missing system schedules without wiping EXP/progress
app.post("/api/restore-system-schedules", async (req, res) => {
  const deviceId = req.headers['x-device-id'] as string;
  if (!deviceId) return res.status(400).json({ error: "Device ID required" });

  try {
    const child = await getOrCreateChild(deviceId);

    // Get existing schedule IDs for this child
    const [existing]: any = await pool.query(
      `SELECT id FROM schedules WHERE child_id = ?`, [child.id]
    );
    const existingIds = new Set(existing.map((r: any) => r.id));

    // Re-insert any missing system schedules from DEFAULT_SCHEDULES
    let restored = 0;
    for (const s of DEFAULT_SCHEDULES) {
      if (!s.locked) continue; // only restore locked system schedules
      if (existingIds.has(s.id)) continue; // skip if already exists
      await pool.query(
        `INSERT INTO schedules (id, child_id, title, category, description, startTime, endTime, day, completed, reward, locked, parentQuest)
         VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?)`,
        [s.id, child.id, s.title, s.category, s.description, s.startTime, s.endTime, s.day, false, s.reward, s.locked, s.parentQuest]
      );
      restored++;
    }

    const schedules = await getSchedules(child.id);
    res.json({ success: true, restored, schedules });
  } catch (err) {
    console.error(err);
    res.status(500).json({ error: "Database error" });
  }
});


// Admin: Restore system schedules for ALL children at once
app.post("/api/admin/restore-all", async (req, res) => {
  try {
    const [allChildren]: any = await pool.query(`SELECT id FROM children`);
    let totalRestored = 0;

    for (const child of allChildren) {
      const [existing]: any = await pool.query(`SELECT id FROM schedules WHERE child_id = ?`, [child.id]);
      const existingIds = new Set(existing.map((r: any) => r.id));

      for (const s of DEFAULT_SCHEDULES) {
        if (!s.locked) continue;
        if (existingIds.has(s.id)) continue;
        await pool.query(
          `INSERT INTO schedules (id, child_id, title, category, description, startTime, endTime, day, completed, reward, locked, parentQuest)
           VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?)`,
          [s.id, child.id, s.title, s.category, s.description, s.startTime, s.endTime, s.day, false, s.reward, s.locked, s.parentQuest]
        );
        totalRestored++;
      }
    }

    res.json({ success: true, childrenProcessed: allChildren.length, totalRestored });
  } catch (err) {
    console.error(err);
    res.status(500).json({ error: "Database error" });
  }
});

// --- Gemini AI Quote Generator ---
app.get("/api/gemini/quote", async (req, res) => {
  const apiKey = process.env.GEMINI_API_KEY;

  const fallbackFromDB = async () => {
    const [rows]: any = await pool.query(`SELECT * FROM quotes ORDER BY RAND() LIMIT 1`);
    if (rows.length > 0) {
      return res.json({ text: rows[0].text, author: rows[0].author });
    }
    return res.json({ text: "Teruslah bersemangat!", author: "Timi" });
  };

  if (!apiKey || apiKey === "your_gemini_api_key_here") {
    return fallbackFromDB();
  }

  try {
    const ai = new GoogleGenAI({
      apiKey: apiKey,
      httpOptions: { headers: { 'User-Agent': 'aistudio-build' } }
    });

    const response = await ai.models.generateContent({
      model: "gemini-3.5-flash",
      contents: "Hasilkan 1 kutipan motivasi harian tentang manajemen waktu, ibadah sholat, atau kedisiplinan belajar untuk anak-anak sekolah dasar/menengah agar mereka rajin. Tulis dengan gaya bahasa anak-anak yang ramah, seru dan memotivasi dalam Bahasa Indonesia. Kembalikan format JSON objek dengan kunci { \"text\": \"Kutipan motivasi kata-kata di sini\", \"author\": \"Nama Tokoh Motivator Pendisiplin\" }.",
      config: { responseMimeType: "application/json" }
    });

    const parsed = JSON.parse(response.text?.trim() || "{}");
    if (parsed.text) {
      res.json(parsed);
    } else {
      throw new Error("Invalid output format from Gemini");
    }
  } catch (error) {
    console.error("Gemini AI integration failure, falling back: ", error);
    return fallbackFromDB();
  }
});

// Integrate custom Vite asset pipeline for bundling or static hosting
async function initServer() {
  if (process.env.NODE_ENV !== "production") {
    const vite = await createViteServer({
      server: { middlewareMode: true },
      appType: "spa",
    });
    app.use(vite.middlewares);
  } else {
    const distPath = path.join(process.cwd(), "dist");
    app.use(express.static(distPath));
    app.get("*", (req, res) => {
      res.sendFile(path.join(distPath, "index.html"));
    });
  }

  app.listen(PORT, "0.0.0.0", () => {
    console.log(`Time 101 Express + Vite full-stack server running on http://localhost:\${PORT}`);
  });
}

initServer();
