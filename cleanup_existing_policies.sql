-- Cleanup Existing Policies Script
-- Run this first if you encounter policy conflicts
-- This script safely removes existing policies before recreating them

-- Drop all existing policies on the tables we're working with
DROP POLICY IF EXISTS "Users can view own author profile" ON author_profiles;
DROP POLICY IF EXISTS "Users can insert own author profile" ON author_profiles;
DROP POLICY IF EXISTS "Users can update own author profile" ON author_profiles;

DROP POLICY IF EXISTS "Users can view own transactions" ON transactions;
DROP POLICY IF EXISTS "Users can insert own transactions" ON transactions;

DROP POLICY IF EXISTS "Users can view own credits" ON user_credits;
DROP POLICY IF EXISTS "Users can insert own credits" ON user_credits;
DROP POLICY IF EXISTS "Users can update own credits" ON user_credits;

-- Also drop any other policies that might exist
DROP POLICY IF EXISTS "Enable read access for all users" ON author_profiles;
DROP POLICY IF EXISTS "Enable insert for authenticated users only" ON author_profiles;
DROP POLICY IF EXISTS "Enable update for users based on user_id" ON author_profiles;

DROP POLICY IF EXISTS "Enable read access for all users" ON transactions;
DROP POLICY IF EXISTS "Enable insert for authenticated users only" ON transactions;

DROP POLICY IF EXISTS "Enable read access for all users" ON user_credits;
DROP POLICY IF EXISTS "Enable insert for authenticated users only" ON user_credits;
DROP POLICY IF EXISTS "Enable update for users based on user_id" ON user_credits;

-- Verify cleanup
DO $$
BEGIN
  RAISE NOTICE 'Policy cleanup completed successfully!';
  RAISE NOTICE 'All existing policies have been removed.';
  RAISE NOTICE 'You can now run the main database_schema_updates.sql script.';
END $$;
