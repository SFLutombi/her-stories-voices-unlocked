# 📚 HerStories — A Blockchain Marketplace for Women's Voices

South African women's stories, whether novels, survival stories, or life lessons, are often undervalued or silenced. HerStories lets women publish, share, and monetize their words one chapter at a time.

## 🎬 Demo Video

👉 [Watch Demo](#)  
👉 [Live App](#)

## 💡 Why It Matters (Impact)

- **Women writers earn directly from readers**, no publishers taking 70%
- **Survivors of GBV can share anonymously** and still receive support
- **Micro-pricing (chapters for cents)** makes knowledge and stories accessible to low-income readers
- **Turns storytelling into a sustainable economy** of women's voices

## 🏆 How We Meet Judging Criteria

### **Impact on SA Women**
- Every chapter sold means a woman's voice is heard and valued
- Direct, affordable payments → real income for women in townships, rural areas, or without access to publishers

### **Technical Skill & Scalability**
- Readers and authors see transactions happen live — building trust in a system that can't be gamed
- Blockchain handles thousands of transactions per second, enabling chapter-level payments at national scale

### **Clear Blockchain Use Case**
- A story's value is preserved and fairly rewarded
- Smart contracts enforce royalties → zero chance of exploitation. Payments are verifiable and tamper-proof

### **Creative Use of Blockchain Tools**
- Transparency means readers know their money is empowering women, not enriching a platform
- MetaMask + blockchain explorer power instant payouts and visible proof of support

## ⚡ Why Blockchain Makes This Possible

HerStories is only viable because blockchain technology removes the exact barriers that killed similar attempts with traditional payment systems.

**Tiny, fast payments** - Traditional payment systems fail at small payments (fees > content cost). With blockchain, a 5c chapter purchase actually works.

**Low fees & instant settlement** - Payments arrive in real-time, giving authors confidence that their words are valued immediately.

**Transparency without middlemen** - Every transaction is traceable on the blockchain, so readers and authors trust the system without needing a platform "cut."

**Cross-border reach** - Remove barriers for authors and readers across Africa, where traditional payment rails fail.

👉 **Blockchain isn't just powering HerStories — it's opening doors for features we haven't even built yet.**

## 🚀 Growth Potential

The world has seen platforms like Wattpad, Medium, or even Patreon give writers exposure — but all are limited by platform cuts, borders, and high transaction costs.

- **Wattpad** - writers get readers, but little or no income
- **Medium** - tied to subscriptions, mostly US/Europe focused
- **Patreon** - payments blocked in many African countries, high fees cut creators' earnings

👉 **HerStories, powered by blockchain, breaks these borders:**

- **Cross-border micro-payments** - a reader in Lagos or Nairobi can support a writer in Johannesburg instantly
- **Zero middlemen** - 100% of the chapter price goes to the woman who wrote it
- **Ultra-low fees** - even a 3c chapter purchase makes sense economically

This isn't just scaling within South Africa — it's a continent-wide storytelling economy waiting to emerge.

## 🔄 System Overview

```
Reader → Chapter Purchase → Smart Contract → Blockchain Payment → Author Wallet
```

## 👨‍💻 Developer Guide

### 🚀 Quickstart

```bash
# Clone repo
git clone https://github.com/your-repo/her-stories-voices-unlocked.git
cd her-stories-voices-unlocked

# Install dependencies
npm install

# Set up environment variables
cp .env.example .env.local
# Edit .env.local with your Supabase and blockchain credentials

# Run dev server
npm run dev
```

### 📋 Smart Contract Structure

**HerStoriesStory.sol**
- `publishChapter()` - Uploads metadata & sets price
- `buyChapter()` - Handles micro-payment & access rights
- `distributeFunds()` - Sends payment to author (+ optional NGO)

**HerStoriesCredits.sol**
- Credit system for chapter purchases
- Token-based economy

**HerStoriesPayment.sol**
- Payment processing and distribution
- Multi-signature security

**HerStoriesIntegration.sol**
- Integration layer between contracts
- Cross-contract communication

### 🔧 Deployment (Blockchain)

```bash
# Compile contracts
cd contracts
npm install
npx hardhat compile

# Deploy to testnet
npx hardhat deploy --network testnet

# Deploy to mainnet
npx hardhat deploy --network mainnet
```

### ⚙️ Environment Variables

Create `.env.local` file:

```env
# Supabase
VITE_SUPABASE_URL=your_supabase_url
VITE_SUPABASE_ANON_KEY=your_supabase_anon_key

# Blockchain
VITE_ETHEREUM_NETWORK=mainnet
VITE_CONTRACT_ADDRESSES={"story":"0x...","credits":"0x...","payment":"0x..."}

# IPFS (Optional)
VITE_IPFS_GATEWAY=https://ipfs.io/ipfs/
```

### 🔌 API Endpoints

- `POST /api/publish` - Upload new chapter metadata
- `POST /api/buy` - Execute smart contract purchase
- `GET /api/chapters/:id` - Fetch chapter details
- `GET /api/author/:wallet` - View author's works

### 🤝 Contributing Guide

#### **Getting Started**
```bash
git clone https://github.com/your-username/her-stories-voices-unlocked.git
cd her-stories-voices-unlocked
npm install
cp .env.example .env.local
npm run dev
```

#### **Common Contributions**

**Testing Smart Contracts** - Run tests in `contracts/` directory:
```bash
cd contracts
npx hardhat test
# Or test specific file
npx hardhat test test/YourContract.test.js
```

**Adding Smart Contracts** - Create in `contracts/` directory:
```solidity
// SPDX-License-Identifier: MIT
pragma solidity ^0.8.0;

contract NewContract {
    // Your logic here
}
```

#### **Submitting Changes**
```bash
git checkout -b feature/your-feature
git add . && git commit -m "feat: description"
git push origin feature/your-feature
# Create Pull Request
```

**Guidelines**: Use TypeScript, Tailwind CSS, Shadcn/ui components, and conventional commits.

## 🌟 How You Can Help

HerStories has abstracted away the crypto complexity. Readers pay seamlessly, authors receive seamlessly — all powered by blockchain under the hood.

You can:

- **Contribute code** - add features like group royalties, safe spaces for survivors, richer publishing tools
- **Publish stories** - earn from your words without needing a publisher
- **Become a reader** - for just a few cents, you support women directly
- **Partner with us** - NGOs, educators, and cultural groups can plug into this model immediately

👉 **For authors, this means new income streams. For readers, it means affordable access. For partners, it means scalable impact with proof.**

The problems that held back digital storytelling — high fees, platform exploitation, cross-border friction — are now solved through blockchain technology.

## 📄 License

MIT License © 2025 HerStories
