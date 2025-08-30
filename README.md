# HerStories - Voices Unlocked

A decentralized storytelling platform where women's voices are amplified through blockchain technology and community support.

## 🚀 **Quick Start**

### **Prerequisites**
- Node.js 18+ 
- Supabase account
- MetaMask wallet (for blockchain features)

### **Installation**
```bash
# Clone the repository
git clone https://github.com/your-username/her-stories-voices-unlocked.git
cd her-stories-voices-unlocked

# Install dependencies
npm install

# Set up environment variables
cp .env.example .env.local
# Edit .env.local with your Supabase and blockchain credentials

# Start development server
npm run dev
```

## 🗄️ **Database Setup (IMPORTANT!)**

**⚠️ CRITICAL: You MUST set up the database before running the application!**

The database setup is **multi-step** and must be run in the correct order to avoid conflicts.

### **📖 Complete Setup Guide**
See **[DATABASE_SETUP_COMPLETE.md](./DATABASE_SETUP_COMPLETE.md)** for detailed, step-by-step instructions.

### **🚨 Quick Setup Order**
1. **Initial Schema** → `supabase/migrations/20250830142719_7cdbebdd-a286-4cc7-96ad-eb61bc2e210a.sql`
2. **Enhanced Profiles** → `database_schema_updates.sql`
3. **Chapter Purchases** → `setup_chapter_purchases.sql`
4. **Blockchain (Optional)** → `blockchain_schema_updates.sql`

**DO NOT skip steps or run out of order!**

### **🔧 Database Setup Commands**
```bash
# 1. Go to Supabase Dashboard → SQL Editor
# 2. Copy and paste each script in order
# 3. Wait for each to complete before proceeding
# 4. Verify setup with provided test queries
```

## 🌟 **Features**

### **Core Functionality**
- **User Authentication** - Secure signup/login with Supabase Auth
- **Story Creation** - Rich text editor for creating and editing stories
- **Chapter Management** - Organize stories into chapters with free/paid options
- **Credit System** - Purchase chapters using platform credits
- **Author Profiles** - Professional author profiles with earnings tracking

### **Blockchain Integration**
- **Smart Contracts** - Ethereum-based story ownership and payments
- **MetaMask Integration** - Seamless wallet connection
- **Decentralized Storage** - IPFS integration for story content
- **Token Economics** - HSC (HerStories Credits) token system

### **Community Features**
- **Story Discovery** - Browse and discover new stories
- **Reader Engagement** - Like, comment, and support authors
- **Impact Tracking** - Percentage of earnings go to women's shelters
- **Author Support** - Direct tipping and chapter purchases

## 🏗️ **Architecture**

### **Frontend**
- **React 18** with TypeScript
- **Vite** for fast development and building
- **Tailwind CSS** for styling
- **Shadcn/ui** for UI components
- **React Router** for navigation

### **Backend**
- **Supabase** for authentication and database
- **PostgreSQL** with Row Level Security (RLS)
- **Real-time subscriptions** for live updates

### **Blockchain**
- **Ethereum** smart contracts (Solidity)
- **MetaMask** wallet integration
- **IPFS** for decentralized content storage

## 📁 **Project Structure**

```
her-stories-voices-unlocked/
├── src/
│   ├── components/          # React components
│   ├── pages/              # Page components
│   ├── contexts/           # React contexts
│   ├── hooks/              # Custom hooks
│   ├── integrations/       # External service integrations
│   ├── services/           # Business logic services
│   ├── types/              # TypeScript type definitions
│   └── utils/              # Utility functions
├── contracts/              # Smart contract source code
├── supabase/               # Database migrations and config
├── public/                 # Static assets
└── docs/                   # Documentation
```

## 🔐 **Environment Variables**

Create a `.env.local` file with:

```env
# Supabase
VITE_SUPABASE_URL=your_supabase_url
VITE_SUPABASE_ANON_KEY=your_supabase_anon_key

# Blockchain (Optional)
VITE_ETHEREUM_NETWORK=mainnet
VITE_CONTRACT_ADDRESSES={"story":"0x...","credits":"0x...","payment":"0x..."}

# IPFS (Optional)
VITE_IPFS_GATEWAY=https://ipfs.io/ipfs/
```

## 🧪 **Testing**

### **Unit Tests**
```bash
npm run test
```

### **Integration Tests**
```bash
npm run test:integration
```

### **E2E Tests**
```bash
npm run test:e2e
```

## 🚀 **Deployment**

### **Frontend (Vercel/Netlify)**
```bash
npm run build
# Deploy dist/ folder
```

### **Smart Contracts**
```bash
cd contracts
npm run deploy:mainnet
```

### **Database**
- Supabase automatically handles database deployment
- Run migrations in production environment

## 🤝 **Contributing**

1. Fork the repository
2. Create a feature branch (`git checkout -b feature/amazing-feature`)
3. Commit your changes (`git commit -m 'Add amazing feature'`)
4. Push to the branch (`git push origin feature/amazing-feature`)
5. Open a Pull Request

### **Development Guidelines**
- Follow TypeScript best practices
- Use conventional commit messages
- Write tests for new features
- Update documentation as needed

## 📚 **Documentation**

- **[Database Setup](./DATABASE_SETUP_COMPLETE.md)** - Complete database setup guide
- **[Smart Contract Integration](./SMART_CONTRACT_INTEGRATION.md)** - Blockchain setup details
- **[API Reference](./docs/API.md)** - Backend API documentation
- **[Component Library](./docs/COMPONENTS.md)** - UI component documentation

## 🐛 **Troubleshooting**

### **Common Issues**

#### **Database Connection Errors**
- Verify Supabase credentials in `.env.local`
- Check database setup completion
- Ensure RLS policies are configured

#### **Blockchain Integration Issues**
- Verify MetaMask is installed and connected
- Check network configuration
- Ensure smart contracts are deployed

#### **Build Errors**
- Clear `node_modules` and reinstall
- Check Node.js version compatibility
- Verify TypeScript compilation

### **Getting Help**
1. Check the [Issues](../../issues) page
2. Review the troubleshooting guides
3. Join our [Discord community](link-to-discord)
4. Create a detailed issue report

## 📄 **License**

This project is licensed under the MIT License - see the [LICENSE](LICENSE) file for details.

## 🙏 **Acknowledgments**

- **Supabase** for the amazing backend platform
- **Ethereum Foundation** for blockchain technology
- **OpenZeppelin** for secure smart contract libraries
- **Shadcn/ui** for beautiful UI components
- **Vite** for the fast build tooling

## 🌟 **Support the Project**

If you find this project helpful, please consider:

- ⭐ Starring the repository
- 🐛 Reporting bugs and issues
- 💡 Suggesting new features
- 🤝 Contributing code or documentation
- 💰 Supporting development through donations

---

**Made with ❤️ by the HerStories team**
