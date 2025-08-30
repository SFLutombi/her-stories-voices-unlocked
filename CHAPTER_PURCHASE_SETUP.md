# Chapter Purchase System Setup

## 🎯 **Overview**

The chapter purchase system allows readers to buy chapters using credits instead of requiring blockchain wallets. This makes it much easier for users to get started and test the system.

## 🚀 **Quick Setup**

### **1. Run Database Setup**

Copy and paste the contents of `setup_chapter_purchases.sql` into your Supabase SQL Editor and run it. This will:

- Create necessary tables for tracking purchases
- Set up Row Level Security (RLS) policies
- Give existing users 50 welcome credits
- Create a function for adding welcome credits

### **2. How It Works**

#### **Credit System:**
- Users start with 0 credits
- New users can claim 50 welcome credits
- Chapters cost credits (set by authors)
- Credits are stored in `profiles.wallet_balance`

#### **Purchase Flow:**
1. User views a story with paid chapters
2. If they have enough credits, they can purchase
3. Purchase creates records in `user_chapter_access` and `transactions`
4. User's credit balance is deducted
5. Author receives credits (stored in their profile)

## 📊 **Database Tables**

### **`user_chapter_access`**
Tracks which chapters each user has purchased:
- `user_id` - Who bought it
- `story_id` - Which story
- `chapter_id` - Which chapter
- `purchased_at` - When it was bought

### **`transactions`**
Records all credit movements:
- `from_user_id` - Who sent credits (NULL for system)
- `to_user_id` - Who received credits
- `amount` - How many credits
- `transaction_type` - purchase, tip, or donation

### **`profiles.wallet_balance`**
Stores each user's current credit balance.

## 🔐 **Security Features**

- **Row Level Security (RLS)** ensures users can only see their own data
- Users can only purchase chapters for themselves
- Transaction records are immutable once created
- Credit balances are updated atomically

## 🧪 **Testing the System**

### **1. Create a Test Story**
- Sign in as an author
- Create a story with a price (e.g., 10 credits per chapter)
- Add some chapters (set `is_free: false` for paid ones)

### **2. Test as a Reader**
- Sign in with a different account
- View the story - you should see locked chapters
- Click "Get Credits" to receive 50 welcome credits
- Purchase a chapter using your credits
- Read the purchased chapter

### **3. Verify Purchase**
- Check `user_chapter_access` table for your purchase
- Check `transactions` table for the transaction record
- Verify your credit balance decreased
- Verify author's earnings increased

## 🎁 **Welcome Credits System**

New users automatically get 50 credits to start with. This is handled by:

1. **Database Setup**: Existing users get 50 credits when you run the setup script
2. **New Users**: The `ProfileSetup` component creates users with 0 credits
3. **Claim Button**: Users can click "Get Credits" to receive 50 more credits

## 🔧 **Customization**

### **Change Welcome Credit Amount**
Edit the `welcomeCredits` variable in `ChapterReader.tsx`:

```typescript
const welcomeCredits = 100; // Change from 50 to 100
```

### **Add Credit Purchase System**
You can extend this to allow users to buy credits with real money:

1. Integrate with Stripe/PayPal
2. Create a credits purchase page
3. Update the `addCredits` function in `credits.ts`

### **Add Credit Earning System**
Authors can earn credits when readers purchase their chapters:

1. Update author profiles when chapters are sold
2. Show earnings in author dashboard
3. Allow authors to withdraw credits

## 🚨 **Troubleshooting**

### **"Table doesn't exist" errors**
Make sure you've run the `setup_chapter_purchases.sql` script in Supabase.

### **"Permission denied" errors**
Check that RLS policies are properly set up and users are authenticated.

### **Credits not updating**
Verify that the `profiles.wallet_balance` column exists and has the correct data type.

### **Purchase not working**
Check the browser console for errors and verify all database tables exist.

## 🔮 **Future Enhancements**

1. **Credit Packages**: Sell credits in bundles (100, 500, 1000)
2. **Subscription Model**: Monthly credit allowance
3. **Referral System**: Give credits for referring friends
4. **Achievement System**: Reward users with credits for engagement
5. **Blockchain Integration**: Optional blockchain-based credits for advanced users

## 📞 **Support**

If you encounter issues:

1. Check the browser console for error messages
2. Verify database tables exist in Supabase
3. Ensure RLS policies are properly configured
4. Check that users are properly authenticated

The system is designed to be simple and reliable, so most issues can be resolved by checking the database setup and authentication state.
