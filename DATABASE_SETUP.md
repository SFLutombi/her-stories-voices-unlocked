# Database Setup Instructions

## 🗄️ **Enhanced Profile & Credits System**

This document explains how to set up the new database schema for the enhanced profile functionality, including wallet information, pseudonyms, and earnings tracking.

## 📋 **Prerequisites**

- Supabase project set up
- Access to Supabase SQL Editor
- Basic understanding of SQL

## 🚀 **Step-by-Step Setup**

### **1. Run the Database Schema Updates**

Copy and paste the entire contents of `database_schema_updates.sql` into your Supabase SQL Editor and run it.

**Important:** Run this in your Supabase project's SQL Editor, not in your local development environment.

### **2. What the Schema Creates**

#### **New Tables:**
- **`author_profiles`** - Detailed author information including earnings and statistics
- **`transactions`** - Track all credit transactions between users
- **`user_credits`** - Manage user credit balances (everyone starts with 0)

#### **Enhanced Tables:**
- **`profiles`** - Added wallet info, pseudonym, and earnings tracking

#### **Database Functions:**
- **`update_user_credits()`** - Safely update user credit balances
- **`update_author_earnings()`** - Track author earnings and update statistics

### **3. Row Level Security (RLS)**

The schema automatically enables RLS on new tables:
- Users can only see their own data
- Authors can only access their own profiles
- Transactions are visible to both sender and receiver

### **4. Verify Setup**

After running the SQL, you should see:
- New tables in your Supabase dashboard
- RLS policies enabled
- Database functions created

## 🔧 **Testing the Setup**

### **Test User Credits:**
```sql
-- Check if user credits table exists
SELECT * FROM user_credits LIMIT 5;

-- Verify RLS is working
-- This should only show your own credits when logged in
SELECT * FROM user_credits;
```

### **Test Author Profiles:**
```sql
-- Check if author profiles table exists
SELECT * FROM author_profiles LIMIT 5;
```

## 🎯 **Key Features Enabled**

### **For All Users:**
- ✅ Credit balance tracking (starts at 0)
- ✅ Transaction history
- ✅ Wallet information storage
- ✅ Pseudonym support

### **For Authors:**
- ✅ Earnings tracking
- ✅ Story/chapter statistics
- ✅ Reader count tracking
- ✅ Impact percentage tracking

### **For the Platform:**
- ✅ Secure credit transactions
- ✅ Audit trail for all payments
- ✅ Blockchain transaction hash storage
- ✅ Performance optimized with indexes

## 🚨 **Important Notes**

1. **Everyone starts with 0 credits** - This is intentional for the platform economy
2. **RLS is enabled by default** - Users can only access their own data
3. **Credit transactions are atomic** - Either succeed completely or fail completely
4. **Author earnings are automatically tracked** - No manual intervention needed

## 🔍 **Troubleshooting**

### **Common Issues:**

#### **"Table doesn't exist" error:**
- Make sure you ran the SQL in the correct Supabase project
- Check that you have the necessary permissions

#### **RLS errors:**
- Verify that RLS policies were created successfully
- Check that users are properly authenticated

#### **Function errors:**
- Ensure the RPC functions were created
- Check function parameters match the expected types

### **Need Help?**
- Check Supabase logs for detailed error messages
- Verify your database connection
- Ensure all SQL commands executed successfully

## 📈 **Next Steps**

After setup:
1. Test the profile creation flow
2. Verify credit transactions work
3. Check that author earnings are tracked
4. Test the Profile page functionality

## 🎉 **You're All Set!**

Your database now supports:
- ✅ Comprehensive user profiles
- ✅ Wallet integration
- ✅ Credit system
- ✅ Author earnings tracking
- ✅ Transaction history
- ✅ Secure data access

The enhanced Profile page will now display all this information in a user-friendly interface!
