import { supabase } from '@/integrations/supabase/client';

export interface CreditTransaction {
  from_user_id: string;
  to_user_id: string;
  story_id?: string;
  chapter_id?: string;
  amount: number;
  transaction_type: 'purchase' | 'tip' | 'donation';
}

export interface UserCreditBalance {
  balance: number;
  total_earned: number;
  total_spent: number;
}

/**
 * Get user's current credit balance
 */
export const getUserCredits = async (userId: string): Promise<UserCreditBalance | null> => {
  try {
    console.log('Getting credits for user:', userId);
    
    const { data, error } = await supabase
      .from('user_credits')
      .select('balance, total_earned, total_spent')
      .eq('user_id', userId)
      .single();

    if (error) {
      console.error('Error fetching user credits:', error);
      if (error.code === 'PGRST116') {
        console.log('No credits found for user, will create default');
        return null;
      }
      return null;
    }

    console.log('Credits found:', data);
    return data;
  } catch (error) {
    console.error('Error in getUserCredits:', error);
    return null;
  }
};

/**
 * Add credits to user's balance (for earnings)
 */
export const addCredits = async (userId: string, amount: number): Promise<boolean> => {
  try {
    const { error } = await supabase
      .from('user_credits')
      .upsert({
        user_id: userId,
        balance: amount,
        total_earned: amount,
        total_spent: 0
      }, {
        onConflict: 'user_id'
      });

    if (error) {
      console.error('Error adding credits:', error);
      return false;
    }

    // Update balance by adding to existing
    const { error: updateError } = await supabase.rpc('update_user_credits', {
      user_id_param: userId,
      amount: amount,
      operation: 'add'
    });

    if (updateError) {
      console.error('Error updating credits via RPC:', updateError);
      // Fallback to manual update
      const { data: currentCredits } = await supabase
        .from('user_credits')
        .select('balance, total_earned')
        .eq('user_id', userId)
        .single();

      if (currentCredits) {
        const { error: fallbackError } = await supabase
          .from('user_credits')
          .update({
            balance: currentCredits.balance + amount,
            total_earned: currentCredits.total_earned + amount,
            updated_at: new Date().toISOString()
          })
          .eq('user_id', userId);

        if (fallbackError) {
          console.error('Fallback credit update failed:', fallbackError);
          return false;
        }
      }
    }

    return true;
  } catch (error) {
    console.error('Error in addCredits:', error);
    return false;
  }
};

/**
 * Deduct credits from user's balance (for purchases)
 */
export const deductCredits = async (userId: string, amount: number): Promise<boolean> => {
  try {
    const { data: currentCredits, error: fetchError } = await supabase
      .from('user_credits')
      .select('balance')
      .eq('user_id', userId)
      .single();

    if (fetchError) {
      console.error('Error fetching current credits:', fetchError);
      return false;
    }

    if (!currentCredits || currentCredits.balance < amount) {
      console.error('Insufficient credits');
      return false;
    }

    const { error } = await supabase.rpc('update_user_credits', {
      user_id_param: userId,
      amount: amount,
      operation: 'subtract'
    });

    if (error) {
      console.error('Error deducting credits via RPC:', error);
      // Fallback to manual update
      const { error: fallbackError } = await supabase
        .from('user_credits')
        .update({
          balance: currentCredits.balance - amount,
          total_spent: currentCredits.balance + amount,
          updated_at: new Date().toISOString()
        })
        .eq('user_id', userId);

      if (fallbackError) {
        console.error('Fallback credit deduction failed:', fallbackError);
        return false;
      }
    }

    return true;
  } catch (error) {
    console.error('Error in deductCredits:', error);
    return false;
  }
};

/**
 * Process a credit transaction between users
 */
export const processTransaction = async (transaction: CreditTransaction): Promise<boolean> => {
  try {
    // Start a transaction
    const { error: transactionError } = await supabase
      .from('transactions')
      .insert({
        from_user_id: transaction.from_user_id,
        to_user_id: transaction.to_user_id,
        story_id: transaction.story_id,
        chapter_id: transaction.chapter_id,
        amount: transaction.amount,
        transaction_type: transaction.transaction_type,
        status: 'completed',
        completed_at: new Date().toISOString()
      });

    if (transactionError) {
      console.error('Error creating transaction record:', transactionError);
      return false;
    }

    // Deduct credits from sender
    if (transaction.from_user_id) {
      const deductionSuccess = await deductCredits(transaction.from_user_id, transaction.amount);
      if (!deductionSuccess) {
        console.error('Failed to deduct credits from sender');
        return false;
      }
    }

    // Add credits to receiver
    const additionSuccess = await addCredits(transaction.to_user_id, transaction.amount);
    if (!additionSuccess) {
      console.error('Failed to add credits to receiver');
      return false;
    }

    // Update author earnings if this is a purchase or tip
    if (transaction.transaction_type === 'purchase' || transaction.transaction_type === 'tip') {
      const { error: authorUpdateError } = await supabase.rpc('update_author_earnings', {
        author_user_id: transaction.to_user_id,
        amount: transaction.amount
      });

      if (authorUpdateError) {
        console.error('Error updating author earnings:', authorUpdateError);
        // Don't fail the transaction for this, just log it
      }
    }

    return true;
  } catch (error) {
    console.error('Error in processTransaction:', error);
    return false;
  }
};

/**
 * Get user's transaction history
 */
export const getTransactionHistory = async (userId: string, limit: number = 20): Promise<any[]> => {
  try {
    const { data, error } = await supabase
      .from('transactions')
      .select('*')
      .or(`from_user_id.eq.${userId},to_user_id.eq.${userId}`)
      .order('created_at', { ascending: false })
      .limit(limit);

    if (error) {
      console.error('Error fetching transaction history:', error);
      return [];
    }

    return data || [];
  } catch (error) {
    console.error('Error in getTransactionHistory:', error);
    return [];
  }
};

/**
 * Initialize user credits (set to 0 for new users)
 */
export const initializeUserCredits = async (userId: string): Promise<boolean> => {
  try {
    const { error } = await supabase
      .from('user_credits')
      .insert({
        user_id: userId,
        balance: 0.00,
        total_earned: 0.00,
        total_spent: 0.00
      });

    if (error && error.code !== '23505') { // Ignore duplicate key errors
      console.error('Error initializing user credits:', error);
      return false;
    }

    return true;
  } catch (error) {
    console.error('Error in initializeUserCredits:', error);
    return false;
  }
};
