import express from "express";
import { createServer as createViteServer } from "vite";
import Database from "better-sqlite3";
import bcrypt from "bcryptjs";
import jwt from "jsonwebtoken";
import { exec } from "child_process";
import { promisify } from "util";
import path from "path";
import fs from "fs";

const execAsync = promisify(exec);
const app = express();
const PORT = 3000;
const JWT_SECRET = "rpx-panel-secret-key-123";

app.use(express.json());

// Database Initialization
const db = new Database("data/database.db");
db.pragma("journal_mode = WAL");

// Create tables
db.exec(`
  CREATE TABLE IF NOT EXISTS users (
    id INTEGER PRIMARY KEY AUTOINCREMENT,
    username TEXT UNIQUE,
    password TEXT,
    role TEXT DEFAULT 'user',
    ram_quota INTEGER DEFAULT 4096,
    cpu_quota INTEGER DEFAULT 4,
    disk_quota INTEGER DEFAULT 40,
    created_at DATETIME DEFAULT CURRENT_TIMESTAMP
  );

  CREATE TABLE IF NOT EXISTS nodes (
    id INTEGER PRIMARY KEY AUTOINCREMENT,
    name TEXT UNIQUE,
    ip TEXT,
    api_key TEXT,
    status TEXT DEFAULT 'offline',
    is_local INTEGER DEFAULT 0,
    created_at DATETIME DEFAULT CURRENT_TIMESTAMP
  );

  CREATE TABLE IF NOT EXISTS containers (
    id INTEGER PRIMARY KEY AUTOINCREMENT,
    name TEXT UNIQUE,
    node_id INTEGER,
    user_id INTEGER,
    os TEXT,
    ram INTEGER,
    cpu INTEGER,
    disk INTEGER,
    status TEXT DEFAULT 'stopped',
    ip_address TEXT,
    created_at DATETIME DEFAULT CURRENT_TIMESTAMP,
    FOREIGN KEY(node_id) REFERENCES nodes(id),
    FOREIGN KEY(user_id) REFERENCES users(id)
  );

  CREATE TABLE IF NOT EXISTS port_forwards (
    id INTEGER PRIMARY KEY AUTOINCREMENT,
    container_id INTEGER,
    public_port INTEGER,
    private_port INTEGER,
    protocol TEXT DEFAULT 'tcp',
    FOREIGN KEY(container_id) REFERENCES containers(id)
  );

  CREATE TABLE IF NOT EXISTS packages (
    id INTEGER PRIMARY KEY AUTOINCREMENT,
    name TEXT UNIQUE,
    ram INTEGER,
    cpu INTEGER,
    disk INTEGER,
    bandwidth INTEGER
  );
`);

// Create default admin if not exists
const adminExists = db.prepare("SELECT * FROM users WHERE username = 'admin'").get();
if (!adminExists) {
  const hashedPassword = bcrypt.hashSync("admin123", 10);
  db.prepare("INSERT INTO users (username, password, role) VALUES (?, ?, ?)").run("admin", hashedPassword, "admin");
}

// Create local node if not exists
const localNodeExists = db.prepare("SELECT * FROM nodes WHERE is_local = 1").get();
if (!localNodeExists) {
  db.prepare("INSERT INTO nodes (name, ip, is_local, status) VALUES (?, ?, ?, ?)").run("Local Node", "127.0.0.1", 1, "online");
}

// Middleware: Auth
const authenticate = (req: any, res: any, next: any) => {
  const token = req.headers.authorization?.split(" ")[1];
  if (!token) return res.status(401).json({ error: "Unauthorized" });
  try {
    (req as any).user = jwt.verify(token, JWT_SECRET);
    next();
  } catch (e) {
    res.status(401).json({ error: "Invalid token" });
  }
};

const isAdmin = (req: any, res: any, next: any) => {
  if ((req as any).user.role !== "admin") return res.status(403).json({ error: "Forbidden" });
  next();
};

// --- API Routes ---

// Auth
app.post("/api/auth/login", (req, res) => {
  const { username, password } = req.body;
  const user: any = db.prepare("SELECT * FROM users WHERE username = ?").get(username);
  if (user && bcrypt.compareSync(password, user.password)) {
    const token = jwt.sign({ id: user.id, username: user.username, role: user.role }, JWT_SECRET);
    res.json({ token, user: { id: user.id, username: user.username, role: user.role } });
  } else {
    res.status(401).json({ error: "Invalid credentials" });
  }
});

// Dashboard Stats
app.get("/api/stats", authenticate, (req, res) => {
  const totalContainers = db.prepare("SELECT COUNT(*) as count FROM containers").get() as any;
  const activeContainers = db.prepare("SELECT COUNT(*) as count FROM containers WHERE status = 'running'").get() as any;
  const totalNodes = db.prepare("SELECT COUNT(*) as count FROM nodes").get() as any;
  const totalUsers = db.prepare("SELECT COUNT(*) as count FROM users").get() as any;
  
  res.json({
    containers: totalContainers.count,
    active: activeContainers.count,
    nodes: totalNodes.count,
    users: totalUsers.count
  });
});

// Nodes
app.get("/api/nodes", authenticate, (req, res) => {
  const nodes = db.prepare("SELECT * FROM nodes").all();
  res.json(nodes);
});

app.post("/api/nodes", authenticate, isAdmin, (req, res) => {
  const { name, ip, api_key } = req.body;
  try {
    db.prepare("INSERT INTO nodes (name, ip, api_key) VALUES (?, ?, ?)").run(name, ip, api_key);
    res.json({ success: true });
  } catch (e: any) {
    res.status(400).json({ error: e.message });
  }
});

// Containers
app.get("/api/containers", authenticate, (req, res) => {
  let containers;
  if ((req as any).user.role === "admin") {
    containers = db.prepare(`
      SELECT c.*, n.name as node_name, u.username as owner_name 
      FROM containers c 
      JOIN nodes n ON c.node_id = n.id 
      JOIN users u ON c.user_id = u.id
    `).all();
  } else {
    containers = db.prepare(`
      SELECT c.*, n.name as node_name 
      FROM containers c 
      JOIN nodes n ON c.node_id = n.id 
      WHERE c.user_id = ?
    `).all((req as any).user.id);
  }
  res.json(containers);
});

// LXC Command Execution Helper
const runLXC = async (containerName: string, command: string) => {
  // In a real environment, this would execute lxc commands.
  // In this sandbox, we'll simulate success if the command fails.
  try {
    const { stdout } = await execAsync(`lxc ${command} ${containerName}`);
    return stdout;
  } catch (e) {
    console.warn(`LXC command failed (likely sandbox): lxc ${command} ${containerName}`);
    return "Simulated output";
  }
};

app.post("/api/containers/:id/action", authenticate, async (req, res) => {
  const { action } = req.body;
  const container: any = db.prepare("SELECT * FROM containers WHERE id = ?").get(req.params.id);
  
  if (!container) return res.status(404).json({ error: "Not found" });
  if ((req as any).user.role !== "admin" && container.user_id !== (req as any).user.id) {
    return res.status(403).json({ error: "Forbidden" });
  }

  try {
    // Simulate LXC actions
    let newStatus = container.status;
    if (action === "start") newStatus = "running";
    if (action === "stop") newStatus = "stopped";
    if (action === "restart") newStatus = "running";
    
    db.prepare("UPDATE containers SET status = ? WHERE id = ?").run(newStatus, container.id);
    res.json({ success: true, status: newStatus });
  } catch (e: any) {
    res.status(500).json({ error: e.message });
  }
});

app.post("/api/containers", authenticate, async (req, res) => {
  const { name, node_id, os, ram, cpu, disk, user_id } = req.body;
  const targetUserId = (req as any).user.role === "admin" ? (user_id || (req as any).user.id) : (req as any).user.id;

  try {
    db.prepare("INSERT INTO containers (name, node_id, user_id, os, ram, cpu, disk) VALUES (?, ?, ?, ?, ?, ?, ?)").run(
      name, node_id, targetUserId, os, ram, cpu, disk
    );
    res.json({ success: true });
  } catch (e: any) {
    res.status(400).json({ error: e.message });
  }
});

// Users
app.get("/api/users", authenticate, isAdmin, (req, res) => {
  const users = db.prepare("SELECT id, username, role, ram_quota, cpu_quota, disk_quota, created_at FROM users").all();
  res.json(users);
});

app.post("/api/users", authenticate, isAdmin, (req, res) => {
  const { username, password, role, ram_quota, cpu_quota, disk_quota } = req.body;
  const hashedPassword = bcrypt.hashSync(password, 10);
  try {
    db.prepare("INSERT INTO users (username, password, role, ram_quota, cpu_quota, disk_quota) VALUES (?, ?, ?, ?, ?, ?)").run(
      username, hashedPassword, role, ram_quota, cpu_quota, disk_quota
    );
    res.json({ success: true });
  } catch (e: any) {
    res.status(400).json({ error: e.message });
  }
});

// Port Forwarding
app.get("/api/port-forwards", authenticate, (req, res) => {
  const forwards = db.prepare(`
    SELECT pf.*, c.name as container_name 
    FROM port_forwards pf 
    JOIN containers c ON pf.container_id = c.id
    ${(req as any).user.role !== 'admin' ? 'WHERE c.user_id = ?' : ''}
  `).all((req as any).user.role !== 'admin' ? [(req as any).user.id] : []);
  res.json(forwards);
});

app.post("/api/port-forwards", authenticate, (req, res) => {
  const { container_id, public_port, private_port, protocol } = req.body;
  try {
    db.prepare("INSERT INTO port_forwards (container_id, public_port, private_port, protocol) VALUES (?, ?, ?, ?)").run(
      container_id, public_port, private_port, protocol
    );
    res.json({ success: true });
  } catch (e: any) {
    res.status(400).json({ error: e.message });
  }
});

// Packages
app.get("/api/packages", authenticate, (req, res) => {
  const packages = db.prepare("SELECT * FROM packages").all();
  res.json(packages);
});

app.post("/api/packages", authenticate, isAdmin, (req, res) => {
  const { name, ram, cpu, disk, bandwidth } = req.body;
  try {
    db.prepare("INSERT INTO packages (name, ram, cpu, disk, bandwidth) VALUES (?, ?, ?, ?, ?)").run(
      name, ram, cpu, disk, bandwidth
    );
    res.json({ success: true });
  } catch (e: any) {
    res.status(400).json({ error: e.message });
  }
});

// --- Vite Setup ---
async function startServer() {
  if (process.env.NODE_ENV !== "production") {
    const vite = await createViteServer({
      server: { middlewareMode: true },
      appType: "spa",
    });
    app.use(vite.middlewares);
  } else {
    app.use(express.static("dist"));
    app.get("*", (req, res) => res.sendFile(path.resolve("dist/index.html")));
  }

  app.listen(PORT, "0.0.0.0", () => {
    console.log(`RPX PANEL running on http://localhost:${PORT}`);
  });
}

startServer();
