# Complete Database Setup Guide

## 🎯 **Overview**

This guide provides step-by-step instructions for setting up the complete HerStories database system without conflicts. The scripts are designed to be **idempotent** (safe to run multiple times) and will handle existing objects gracefully.

## 🚨 **Important: Run Scripts in Order**

**DO NOT skip steps or run scripts out of order.** Each script builds upon the previous one and may reference tables/columns created earlier.

## 📋 **Prerequisites**

- Supabase project set up
- Access to Supabase SQL Editor
- Basic understanding of SQL
- **No existing database schema** (or backup if you do)

## 🚀 **Step-by-Step Setup**

### **Step 1: Initial Database Schema (Required First)**

**File:** `supabase/migrations/20250830142719_7cdbebdd-a286-4cc7-96ad-eb61bc2e210a.sql`

**What it does:**
- Creates basic tables: `profiles`, `stories`, `chapters`, `categories`
- Sets up initial RLS policies
- Creates basic indexes

**How to run:**
1. Go to Supabase Dashboard → SQL Editor
2. Copy the entire contents of the migration file
3. Paste and run
4. **Wait for completion** before proceeding

**Expected output:**
```
NOTICE:  Table "profiles" created
NOTICE:  Table "stories" created
NOTICE:  Table "chapters" created
NOTICE:  Table "categories" created
```

---

### **Step 2: Enhanced Profile & Credits System**

**File:** `database_schema_updates.sql`

**What it does:**
- Adds wallet columns to existing profiles table
- Creates `author_profiles`, `transactions`, `user_credits` tables
- Sets up advanced RLS policies
- Creates helper functions for credit management

**How to run:**
1. **Wait for Step 1 to complete**
2. Copy the entire contents of `database_schema_updates.sql`
3. Paste and run
4. **Wait for completion** before proceeding

**Expected output:**
```
NOTICE: Column pseudonym already exists in profiles table
NOTICE: Column wallet_address already exists in profiles table
NOTICE: Column wallet_balance already exists in profiles table
NOTICE: Column total_earnings already exists in profiles table
```

---

### **Step 3: Chapter Purchase System**

**File:** `setup_chapter_purchases.sql`

**What it does:**
- Creates `user_chapter_access` table for tracking purchases
- Ensures `wallet_balance` column exists in profiles
- Sets up purchase-specific RLS policies
- Creates welcome credits function
- Gives existing users 50 welcome credits

**How to run:**
1. **Wait for Step 2 to complete**
2. Copy the entire contents of `setup_chapter_purchases.sql`
3. Paste and run
4. **Wait for completion** before proceeding

**Expected output:**
```
NOTICE: Chapter purchase system setup completed successfully!
NOTICE: Tables created/verified: user_chapter_access, transactions
NOTICE: Policies created/verified for both tables
NOTICE: Indexes created/verified for performance
NOTICE: Welcome credits function created/verified
NOTICE: Existing users updated with welcome credits
```

---

### **Step 4: Blockchain Integration (Optional)**

**File:** `blockchain_schema_updates.sql`

**What it does:**
- Creates blockchain-related tables
- Sets up blockchain transaction tracking
- Adds blockchain event logging
- **Only run if you plan to use blockchain features**

**How to run:**
1. **Wait for Step 3 to complete**
2. Copy the entire contents of `blockchain_schema_updates.sql`
3. Paste and run
4. **Wait for completion** before proceeding

---

## 🔍 **Verification Steps**

After each step, verify the setup:

### **After Step 1:**
```sql
-- Check basic tables exist
SELECT table_name FROM information_schema.tables 
WHERE table_schema = 'public' 
AND table_name IN ('profiles', 'stories', 'chapters', 'categories');
```

### **After Step 2:**
```sql
-- Check enhanced tables exist
SELECT table_name FROM information_schema.tables 
WHERE table_schema = 'public' 
AND table_name IN ('author_profiles', 'transactions', 'user_credits');

-- Check profiles table has new columns
SELECT column_name FROM information_schema.columns 
WHERE table_name = 'profiles' 
AND column_name IN ('wallet_balance', 'pseudonym', 'wallet_address');
```

### **After Step 3:**
```sql
-- Check purchase system tables exist
SELECT table_name FROM information_schema.tables 
WHERE table_schema = 'public' 
AND table_name IN ('user_chapter_access');

-- Check welcome credits function exists
SELECT routine_name FROM information_schema.routines 
WHERE routine_name = 'add_welcome_credits';
```

---

## 🚨 **Common Issues & Solutions**

### **"Table already exists" errors**
- **Solution:** This is normal! The scripts use `CREATE TABLE IF NOT EXISTS`
- **Action:** Continue with the script - it will skip existing tables

### **"Column already exists" errors**
- **Solution:** This is normal! The scripts handle existing columns gracefully
- **Action:** Continue with the script - it will skip existing columns

### **"Policy already exists" errors**
- **Solution:** This is normal! The scripts drop and recreate policies
- **Action:** Continue with the script - it will handle existing policies

### **"Function already exists" errors**
- **Solution:** This is normal! The scripts use `CREATE OR REPLACE`
- **Action:** Continue with the script - it will update existing functions

---

## 🧪 **Testing the Complete System**

### **1. Test User Registration**
- Sign up a new user
- Verify they get a profile record
- Check they start with 0 credits

### **2. Test Welcome Credits**
- Sign in as a new user
- Go to a story with paid chapters
- Click "Get Credits" button
- Verify they receive 50 credits

### **3. Test Chapter Purchase**
- Create a story with paid chapters
- Sign in as a different user
- Purchase a chapter using credits
- Verify purchase records are created

### **4. Test Database Records**
```sql
-- Check user has credits
SELECT wallet_balance FROM profiles WHERE user_id = 'your-user-id';

-- Check purchase record
SELECT * FROM user_chapter_access WHERE user_id = 'your-user-id';

-- Check transaction record
SELECT * FROM transactions WHERE to_user_id = 'your-user-id';
```

---

## 🔧 **Customization Options**

### **Change Welcome Credit Amount**
Edit the `welcomeCredits` variable in `ChapterReader.tsx`:
```typescript
const welcomeCredits = 100; // Change from 50 to 100
```

### **Modify Chapter Prices**
Update the `price_per_chapter` field in stories table:
```sql
UPDATE stories SET price_per_chapter = 25 WHERE id = 'story-id';
```

### **Add More Credit Types**
Extend the `transaction_type` check constraint:
```sql
ALTER TABLE transactions DROP CONSTRAINT transactions_transaction_type_check;
ALTER TABLE transactions ADD CONSTRAINT transactions_transaction_type_check 
CHECK (transaction_type IN ('purchase', 'tip', 'donation', 'bonus', 'refund'));
```

---

## 📊 **Final Database Structure**

After running all scripts, you'll have:

### **Core Tables:**
- `profiles` - User profiles with wallet balance
- `stories` - Story metadata and pricing
- `chapters` - Chapter content and free/paid status
- `categories` - Story categories

### **Enhanced Tables:**
- `author_profiles` - Author-specific information
- `user_credits` - Detailed credit tracking
- `transactions` - All credit movements
- `user_chapter_access` - Chapter purchase tracking

### **Blockchain Tables (if Step 4 run):**
- `blockchain_transactions` - Blockchain transaction tracking
- `blockchain_events` - Smart contract events

---

## 🆘 **Need Help?**

### **Check Script Order**
Ensure you ran scripts in the exact order specified above.

### **Verify Prerequisites**
Make sure your Supabase project is properly set up and accessible.

### **Check Console Output**
Look for `NOTICE` messages indicating successful completion.

### **Review Error Messages**
Most errors are informational and can be safely ignored.

### **Contact Support**
If you continue having issues, check the browser console and database logs for specific error details.

---

## 🎉 **Success Indicators**

You'll know everything is working when:

✅ All scripts run without critical errors  
✅ Verification queries return expected results  
✅ Users can sign up and get profiles  
✅ Welcome credits system works  
✅ Chapter purchases function properly  
✅ Database records are created correctly  
✅ No permission/access errors occur  

**Congratulations! Your HerStories database is fully set up and ready to use! 🚀**
