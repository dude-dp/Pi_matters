# $\pi$ Matters &middot; The Autonomous Library of Pi

Autonomous discovery of natural language and readable text hidden within the infinite base-16 and binary digits of $\pi$, powered by the **Bailey–Borwein–Plouffe (BBP)** formula, **Hono**, and **Cloudflare Workers Free Tier**.

---

## 🌌 Mathematical Foundation

$\pi$ is an irrational, transcendental number. Because it never settles into a repeating pattern, its digits form an infinite stream containing every possible finite sequence of numbers — a mathematical equivalent to Jorge Luis Borges' *Library of Babel*.

### The BBP Spigot Formula
Discovered in 1995, the Bailey–Borwein–Plouffe formula computes the $n$-th fractional hexadecimal digit of $\pi$ directly without needing to calculate any preceding digits:

$$\pi = \sum_{k=0}^{\infty} \frac{1}{16^k} \left( \frac{4}{8k+1} - \frac{2}{8k+4} - \frac{1}{8k+5} - \frac{1}{8k+6} \right)$$

- **Hexadecimal to Binary**: Each hex digit translates directly into exactly 4 binary bits ($0\text{x}0 \dots 0\text{xF} \to 0000_2 \dots 1111_2$).
- **Binary to ASCII**: Bytes (8-bit sequences) map to character space ($0\text{x}00 \dots 0\text{xFF}$).
- **Bit-Shift Scanning**: Scans across 8 sliding bit offsets ($0 \dots 7$) to detect words regardless of byte-alignment boundaries.

---

## ⚡ Tech Stack

- **Backend**: [Hono](https://hono.dev/) on Cloudflare Workers
- **Autonomy**: Cloudflare Workers Cron Triggers (`*/5 * * * *`)
- **Storage**: Cloudflare D1 (Serverless SQLite, Free Tier: 100k writes/day, 5M reads/day)
- **Frontend**: Vanilla HTML5, Modern CSS (Glassmorphism, dark mode, responsive), Vanilla JavaScript
- **Testing**: [Vitest](https://vitest.dev/) unit tests for BBP correctness and word discovery

---

## 🚀 Local Development

### 1. Install Dependencies
```bash
npm install
```

### 2. Run Unit Tests
```bash
npm test
```

### 3. Initialize Local D1 Database
```bash
npm run db:migrate:local
```

### 4. Start Local Development Server
```bash
npm run dev
```
Open [http://localhost:8787](http://localhost:8787) in your browser.

---

## ☁️ Deployment to Cloudflare Free Tier

### 1. Create your remote D1 Database
```bash
npx wrangler d1 create pi-db
```
Wrangler will output a `database_id` (e.g., `xxxxxxxx-xxxx-xxxx-xxxx-xxxxxxxxxxxx`).
Update the `database_id` in [wrangler.jsonc](file:///home/dudedp/Pi_matters/wrangler.jsonc).

### 2. Apply Migration to Remote D1
```bash
npm run db:migrate:remote
```

### 3. Deploy Worker & Frontend
```bash
npm run deploy
```

Once deployed, your Cloudflare Worker will run continuously in the background, mining new digits of $\pi$ every 5 minutes and updating the Library of $\pi$ autonomously.
