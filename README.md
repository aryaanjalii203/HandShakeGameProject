# ⚡ PLAYFORGE — Real-Time Multiplayer Web Gaming Platform

PlayForge is a full-featured, browser-based gaming arena featuring **15 playable arcade games**, real-time authoritative multiplayer physics (60Hz), responsive mobile/desktop controls, Poki-style theater mode, and a modern web/e-commerce style authentication system.

---

## 🎮 Included Games (15 Total)

| Game | Mode | Description |
| :--- | :--- | :--- |
| **Cyber Pong** | 1v1 / AI | Neon laser paddle combat with curve physics |
| **Neon Drift** | Multi / Solo | High-speed neon drift racer with boost pads |
| **Battle Grid** | Multi / Solo | Tron-style light trail survival arena |
| **Space Raiders** | Co-Op / Solo | Retro bullet-hell space invasion defense |
| **Color Clash** | Multi / Solo | Real-time territory paint battle |
| **Survival Arena** | Multi / Solo | Rotating laser sweeper & hazard dodge survival |
| **Tank Arena 2099** | Multi / Solo | Bouncing laser cannon tank duels |
| **Pixel Soccer** | Multi / Solo | Fast-paced 2D physics soccer showdown |
| **Maze Hunters** | Multi / Solo | Asymmetrical stealth labyrinth hunt |
| **Treasure Rush** | Multi / Solo | Diamond collecting sprint with power-ups |
| **Word Blitz** | Multi / Solo | High-speed anagram word unscrambler race |
| **Mini Golf Chaos** | Multi / Solo | Multiplayer putting course with moving obstacles |
| **Memory Wars** | Multi / Solo | Holographic card pair matching race |
| **Tower Defenders** | Co-Op / Solo | Tactical turret placement lane defense |
| **Quick Draw 2099** | 1v1 / Solo | Sub-millisecond western cyber reflex duel |

---

## 🚀 Quick Start Locally

### Prerequisites
- Node.js (v18 or higher)
- npm (v9 or higher)

### 1. Install Dependencies
```bash
# Install root, server, and frontend packages
npm run install:all
```

### 2. Run in Development Mode
```bash
npm run dev
```
- **Frontend App**: `http://localhost:5173` (or `http://localhost:3001` when built)
- **Multiplayer Backend**: `http://localhost:3001`

---

## 📦 How to Push to GitHub

1. Open your terminal in this project root (`D:\playforge`).
2. Initialize Git and commit all files:
```bash
git init
git add .
git commit -m "feat: complete PlayForge gaming platform with 15 games and auth"
```
3. Create a new repository on [GitHub](https://github.com/new).
4. Link and push your repository:
```bash
git branch -M main
git remote add origin https://github.com/<YOUR_USERNAME>/playforge.git
git push -u origin main
```

---

## ☁️ How to Deploy on Vercel (Frontend)

1. Go to [Vercel](https://vercel.com) and click **"Add New Project"**.
2. Select your imported GitHub repository (`playforge`).
3. Set **Root Directory** to `frontend` (or keep root).
4. Framework Preset: **Vite**.
5. Build Command: `npm run build`.
6. Output Directory: `dist`.
7. Click **Deploy**! 🚀

> **Note**: For multiplayer live lobbies across the internet, deploy the `server/` directory on a free Node.js host such as [Render](https://render.com), [Railway](https://railway.app), or [Fly.io], and set `VITE_SERVER_URL` in your Vercel Environment Variables.

---

## 🛡️ License
MIT License. Built for high-performance browser gaming.
