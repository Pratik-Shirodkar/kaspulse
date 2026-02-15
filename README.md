# KasPulse 🚀

> **The Super App for Kaspa** — 7 modules spanning Data, Payments, Gaming & Governance — all powered by real Kaspa transactions.

[![Live Demo](https://img.shields.io/badge/Live-kaspulse.vercel.app-00ffff?style=for-the-badge)](https://kaspulse.vercel.app)
[![Kaspa](https://img.shields.io/badge/Kaspa-Testnet-00ffff)](https://kaspa.org)
[![Next.js 16](https://img.shields.io/badge/Next.js-16-black)](https://nextjs.org)
[![License: MIT](https://img.shields.io/badge/License-MIT-blue.svg)](LICENSE)

---

## Why KasPulse?

Most hackathon projects demonstrate one feature. **KasPulse demonstrates an entire ecosystem** — proving that Kaspa's millisecond block times enable a new class of applications where blockchain is not a bottleneck, but a superpower.

Every module uses **real wallet transactions** on Kaspa Testnet. No mocks. No simulations. Real KAS moves with every vote, every payment, every anchor.

---

## 🏆 Tracks Targeted

| Track | Modules | Prize Potential |
|-------|---------|-----------------|
| **Main Track** | All 7 modules as a unified ecosystem | Up to 35,000 KAS |
| **Payments & Commerce** | KasStream, FlashTix, KasPoint, Vending Machine | 16,500 KAS |
| **Gaming & Interactive** | KasHunter, PixelWar | 16,500 KAS |
| **Real-Time Data** | Dashboard, DAG Visualizer, AI Insights, LiveTicker | 16,500 KAS |
| **Best UX/UI** | Premium "Neon Pulse" design system | 10,000 KAS |
| **Most Creative** | 7-module super-app concept | 10,000 KAS |

---

## 🎯 The 7 Modules

### 1. 📊 Dashboard (`/dashboard`) — Real-Time Data Track
Live network analytics powered by the Kaspa REST API.

- **Live Stats**: Block height, hashrate (PH/s), KAS price, circulating supply
- **Network Health Monitor**: Block rate, throughput, latency with sparklines & alerts
- **Address Explorer**: Look up any Kaspa address for balance and transaction history
- **AI Insights Panel**: AI-generated network analysis (powered by AWS Bedrock)
- **Transaction Feed**: Live transaction stream from the network
- **Block Time Race**: Visual comparison of Kaspa vs BTC, ETH, SOL confirmation times

### 2. 🌐 DAG Visualizer (`/dashboard`) — Real-Time Data Track
Interactive 3D visualization of Kaspa's BlockDAG architecture.

- **Canvas-based rendering** of DAG block relationships
- **Real-time block arrivals** animate into the graph
- **Zoom, pan, and interact** with the DAG structure
- **Educational tooltips** explaining DAG concepts for newcomers

### 3. 💳 KasStream (`/kasstream`) — Payments & Commerce Track
A content creator platform with pay-per-view powered by Kaspa transactions.

- **Creator Mode**: Set up a stream with title, video URL, pricing, and your wallet address
- **Viewer Mode**: Pay 1 KAS to unlock and watch content — payment goes directly to the creator
- **Shareable Links**: Every stream generates a unique URL for sharing
- **Content Library**: Browse sample streams to see the platform in action
- **Earnings Dashboard**: Creators track their real-time revenue

### 4. 🗳️ Pulse Poll (`/poll`) — Governance Track
On-chain community voting where every vote is a real Kaspa transaction.

- **Create Your Own Poll**: Enter a question, two options, and your wallet address
- **Serverless Sharing**: Polls are encoded entirely in the URL — no backend needed
- **Vote by Paying**: Each vote sends 1 KAS directly to the poll creator's wallet
- **Live Results**: Animated tug-of-war bar updates in real-time
- **Live Vote Feed**: See transactions as they arrive with hash previews

### 5. 🎮 KasHunter (`/game`) — Gaming & Interactive Track
An arcade game where real Kaspa blocks drive the gameplay.

- **Live Block Events**: Game blocks spawn from actual network block arrivals
- **Canvas Game Engine**: Smooth 60fps arcade gameplay with particle effects
- **Scoring System**: Points based on block rarity and timing
- **AI Game Narrator**: Real-time commentary on your gameplay
- **High Score Persistence**: LocalStorage leaderboard
- **Touch/Keyboard/Mouse**: Works on all devices

### 6. 🎨 PixelWar (`/pixelwar`) — Gaming & Interactive Track
A collaborative pixel canvas where placing pixels costs KAS.

- **32×32 Canvas**: Each pixel placement is a Kaspa transaction
- **Color Palette**: Choose from a curated set of colors
- **Real-time Updates**: See other users' pixels appear instantly
- **Wallet Integration**: Connect your Kaspa wallet to participate

### 7. 🔒 Data Anchoring (`/anchor`) — Real-Time Data Track
Timestamp and prove the existence of any data on the Kaspa blockchain.

- **Single File Anchoring**: Hash any file and anchor it on-chain
- **Text Anchoring**: Anchor text content directly
- **Batch Anchoring**: Merkle tree-based batch proofs for multiple files
- **Proof Verification** (`/verify`): Verify any previously anchored proof
- **Proof History**: Local storage with search, export, and management

### Bonus Features
- **🔴 LiveTicker**: Global scrolling marquee showing live block arrivals and network events
- **🎵 SonicDAG**: Audio sonification of the BlockDAG — hear the chain in real-time
- **💸 KasPoint** (`/commerce`): Point-of-sale invoice generator with QR codes
- **🎫 FlashTix**: Instant ticket purchasing with Kaspa transactions
- **🤖 AI Chat**: Ask questions about Kaspa and get AI-powered answers
- **🏪 Vending Machine**: Simulated vending machine accepting KAS payments

---

## 🛠 Tech Stack

| Component | Technology |
|-----------|------------|
| Framework | Next.js 16 (App Router, Turbopack) |
| Language | TypeScript |
| Styling | Tailwind CSS 4 |
| Animations | Framer Motion |
| 3D | React Three Fiber + Drei |
| Charts | Recharts |
| QR Codes | qrcode.react |
| Icons | Lucide React |
| Crypto | CryptoJS (SHA-256 hashing) |
| AI | AWS Bedrock (Claude) |
| Wallet | Kasware / Kaspa Web Wallet |
| API | Kaspa REST API (`api.kaspa.org`) |
| Hosting | Vercel |

---

## 🚀 Quick Start

### Prerequisites
- Node.js 18+ 
- npm or yarn
- A Kaspa wallet browser extension (Kasware recommended)

### Installation

```bash
git clone https://github.com/prati21/kaspulse.git
cd kaspulse
npm install
```

### Environment Variables (Optional)

Create a `.env.local` file for AI features:

```env
# AWS Bedrock (for AI Insights & Chat)
AWS_ACCESS_KEY_ID=your_key
AWS_SECRET_ACCESS_KEY=your_secret
AWS_REGION=us-east-1
```

> **Note:** The app works fully without these — AI features will show mock data as fallback.

### Run Locally

```bash
npm run dev
```

Open [http://localhost:3000](http://localhost:3000)

### Production Build

```bash
npm run build
npm start
```

---

## 📁 Project Structure

```
src/
├── app/
│   ├── page.tsx              # Landing page (App Launcher)
│   ├── dashboard/page.tsx    # Data analytics dashboard
│   ├── commerce/page.tsx     # KasPoint POS
│   ├── kasstream/page.tsx    # Content creator platform
│   ├── poll/page.tsx         # Dynamic poll creation & voting
│   ├── game/page.tsx         # KasHunter arcade game
│   ├── pixelwar/page.tsx     # Collaborative pixel canvas
│   ├── anchor/page.tsx       # Data anchoring
│   ├── verify/page.tsx       # Proof verification
│   └── api/                  # AI endpoints (Bedrock)
├── components/
│   ├── DAGVisualizer.tsx     # Interactive BlockDAG canvas
│   ├── PulsePoll.tsx         # On-chain voting component
│   ├── BlockTimeRace.tsx     # Speed comparison visualization
│   ├── NetworkHealthMonitor.tsx
│   ├── AddressExplorer.tsx
│   ├── TransactionFeed.tsx
│   ├── AIInsightsPanel.tsx
│   ├── AIChat.tsx
│   ├── BatchAnchoring.tsx
│   ├── ProofHistory.tsx
│   ├── LiveTicker.tsx        # Global event marquee
│   ├── SonicDAG.tsx          # Audio sonification
│   ├── Header.tsx
│   ├── Footer.tsx
│   ├── WalletProvider.tsx
│   ├── WalletButton.tsx
│   └── ...
└── lib/
    ├── kaspa-api.ts          # Kaspa REST API client
    └── wallet.ts             # Wallet interaction layer
```

---

## 🎨 Design System — "Neon Pulse"

A premium dark theme designed to evoke Kaspa's speed and energy:

- **Background**: Deep space dark (`#0a0a0f`)
- **Primary**: Electric cyan (`#00FFFF`) — Kaspa's signature color
- **Secondary**: Neon purple (`#8B5CF6`)
- **Accent**: Warm orange (`#F97316`)
- **Cards**: Glassmorphic with backdrop blur and subtle borders
- **Animations**: Framer Motion transitions, canvas particles, pulse effects
- **Typography**: Geist Sans + Geist Mono (variable fonts)

---

## 🔗 Kaspa Integration Points

| Feature | Integration Type |
|---------|-----------------|
| Wallet Connect | Kasware / generic Kaspa wallet detection |
| Send Transactions | Real KAS transfers for votes, payments, pixels |
| Block Data | Live block height, hash, timestamp via REST API |
| Hashrate | Network hashrate from `api.kaspa.org` |
| Price Feed | Real-time KAS/USD price |
| Address Lookup | Balance and UTXO queries |
| Data Anchoring | SHA-256 hash embedded in transaction metadata |
| QR Payments | `kaspa:` URI scheme with amount and message |

---

## 🤝 AI Usage Disclosure

> **Required by Kaspathon rules:** This section documents all AI tool usage.

This project was developed with assistance from **AI coding tools** (Google Gemini, Claude). AI was used for:

- **Code generation**: Component scaffolding, boilerplate reduction, and rapid prototyping
- **Refactoring**: Converting inline styles to design system tokens, optimizing component structure
- **Bug fixing**: TypeScript type errors, encoding issues, layout debugging
- **Documentation**: README writing, code comments, and walkthrough generation
- **Architecture**: Suggesting component patterns (e.g., URL-based serverless polls)

### What was NOT AI-generated:
- **Core design decisions**: The 7-module super-app concept, track targeting strategy, and UX flow
- **Kaspa integration logic**: Wallet connection, transaction signing, and API client code was human-directed
- **Visual design**: Color palette, animation choices, and layout decisions

All AI-generated code was **reviewed, tested, and customized** for the specific requirements of this hackathon. The developer maintained full understanding and control of the codebase throughout development.

---

## 📋 Submission Checklist

- [x] Open source repository (GitHub)
- [x] Comprehensive README with setup instructions
- [x] AI usage clearly documented
- [x] Live demo hosted on Vercel
- [x] 7 distinct modules with real Kaspa integration
- [x] Wallet connection support (Kasware)
- [x] Real-time data from Kaspa API
- [x] Premium UX/UI design
- [ ] Demo video (3 min)
- [ ] Screenshot for thumbnail

---

## 📄 License

MIT License — see [LICENSE](LICENSE) for details.

---

<p align="center">
  Built with 💚 for <strong>Kaspathon 2026</strong> — Show Us Your Kode-Fu
</p>
