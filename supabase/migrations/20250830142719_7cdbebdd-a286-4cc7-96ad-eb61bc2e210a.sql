-- Create user profiles table
CREATE TABLE public.profiles (
  id UUID NOT NULL DEFAULT gen_random_uuid() PRIMARY KEY,
  user_id UUID NOT NULL UNIQUE REFERENCES auth.users(id) ON DELETE CASCADE,
  display_name TEXT,
  bio TEXT,
  is_anonymous BOOLEAN DEFAULT false,
  is_author BOOLEAN DEFAULT false,
  wallet_balance INTEGER DEFAULT 100, -- Starting credits
  avatar_url TEXT,
  created_at TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT now(),
  updated_at TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT now()
);

-- Create categories table
CREATE TABLE public.categories (
  id UUID NOT NULL DEFAULT gen_random_uuid() PRIMARY KEY,
  name TEXT NOT NULL UNIQUE,
  description TEXT,
  created_at TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT now()
);

-- Create stories table
CREATE TABLE public.stories (
  id UUID NOT NULL DEFAULT gen_random_uuid() PRIMARY KEY,
  author_id UUID NOT NULL REFERENCES auth.users(id) ON DELETE CASCADE,
  title TEXT NOT NULL,
  description TEXT,
  cover_image_url TEXT,
  category_id UUID REFERENCES public.categories(id),
  price_per_chapter INTEGER NOT NULL DEFAULT 5, -- Credits per chapter
  total_chapters INTEGER DEFAULT 0,
  published BOOLEAN DEFAULT false,
  is_anonymous BOOLEAN DEFAULT false,
  impact_percentage INTEGER DEFAULT 10, -- Percentage going to shelters
  created_at TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT now(),
  updated_at TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT now()
);

-- Create chapters table
CREATE TABLE public.chapters (
  id UUID NOT NULL DEFAULT gen_random_uuid() PRIMARY KEY,
  story_id UUID NOT NULL REFERENCES public.stories(id) ON DELETE CASCADE,
  chapter_number INTEGER NOT NULL,
  title TEXT NOT NULL,
  content TEXT NOT NULL,
  is_free BOOLEAN DEFAULT false, -- First chapter free
  published BOOLEAN DEFAULT false,
  created_at TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT now(),
  updated_at TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT now(),
  UNIQUE(story_id, chapter_number)
);

-- Create transactions table
CREATE TABLE public.transactions (
  id UUID NOT NULL DEFAULT gen_random_uuid() PRIMARY KEY,
  buyer_id UUID NOT NULL REFERENCES auth.users(id) ON DELETE CASCADE,
  story_id UUID NOT NULL REFERENCES public.stories(id) ON DELETE CASCADE,
  chapter_id UUID REFERENCES public.chapters(id) ON DELETE CASCADE,
  amount INTEGER NOT NULL, -- Credits spent
  transaction_type TEXT NOT NULL CHECK (transaction_type IN ('chapter', 'story', 'tip')),
  created_at TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT now()
);

-- Create purchases table to track what users have bought
CREATE TABLE public.purchases (
  id UUID NOT NULL DEFAULT gen_random_uuid() PRIMARY KEY,
  user_id UUID NOT NULL REFERENCES auth.users(id) ON DELETE CASCADE,
  story_id UUID NOT NULL REFERENCES public.stories(id) ON DELETE CASCADE,
  chapter_id UUID REFERENCES public.chapters(id) ON DELETE CASCADE,
  purchased_at TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT now(),
  UNIQUE(user_id, chapter_id)
);

-- Enable RLS on all tables
ALTER TABLE public.profiles ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.categories ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.stories ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.chapters ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.transactions ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.purchases ENABLE ROW LEVEL SECURITY;

-- RLS Policies for profiles
CREATE POLICY "Users can view all profiles" ON public.profiles FOR SELECT USING (true);
CREATE POLICY "Users can update their own profile" ON public.profiles FOR UPDATE USING (auth.uid() = user_id);
CREATE POLICY "Users can insert their own profile" ON public.profiles FOR INSERT WITH CHECK (auth.uid() = user_id);

-- RLS Policies for categories
CREATE POLICY "Categories are viewable by everyone" ON public.categories FOR SELECT USING (true);

-- RLS Policies for stories
CREATE POLICY "Published stories are viewable by everyone" ON public.stories FOR SELECT USING (published = true);
CREATE POLICY "Authors can view their own stories" ON public.stories FOR SELECT USING (auth.uid() = author_id);
CREATE POLICY "Authors can create stories" ON public.stories FOR INSERT WITH CHECK (auth.uid() = author_id);
CREATE POLICY "Authors can update their own stories" ON public.stories FOR UPDATE USING (auth.uid() = author_id);

-- RLS Policies for chapters
CREATE POLICY "Published chapters are viewable by everyone" ON public.chapters FOR SELECT USING (published = true);
CREATE POLICY "Authors can view their own chapters" ON public.chapters FOR SELECT USING (auth.uid() = (SELECT author_id FROM public.stories WHERE id = story_id));
CREATE POLICY "Authors can create chapters" ON public.chapters FOR INSERT WITH CHECK (auth.uid() = (SELECT author_id FROM public.stories WHERE id = story_id));
CREATE POLICY "Authors can update their own chapters" ON public.chapters FOR UPDATE USING (auth.uid() = (SELECT author_id FROM public.stories WHERE id = story_id));

-- RLS Policies for transactions
CREATE POLICY "Users can view their own transactions" ON public.transactions FOR SELECT USING (auth.uid() = buyer_id);
CREATE POLICY "Users can create transactions" ON public.transactions FOR INSERT WITH CHECK (auth.uid() = buyer_id);

-- RLS Policies for purchases
CREATE POLICY "Users can view their own purchases" ON public.purchases FOR SELECT USING (auth.uid() = user_id);
CREATE POLICY "Users can create purchases" ON public.purchases FOR INSERT WITH CHECK (auth.uid() = user_id);

-- Insert default categories
INSERT INTO public.categories (name, description) VALUES
('Survivor Stories', 'Stories of resilience and overcoming challenges'),
('Life Lessons', 'Wisdom and insights from lived experiences'),
('Fiction & Novels', 'Creative fiction and storytelling'),
('Poetry & Reflections', 'Poetry and personal reflections');

-- Create function to update timestamps
CREATE OR REPLACE FUNCTION public.update_updated_at_column()
RETURNS TRIGGER AS $$
BEGIN
  NEW.updated_at = now();
  RETURN NEW;
END;
$$ LANGUAGE plpgsql;

-- Create triggers for automatic timestamp updates
CREATE TRIGGER update_profiles_updated_at BEFORE UPDATE ON public.profiles FOR EACH ROW EXECUTE FUNCTION public.update_updated_at_column();
CREATE TRIGGER update_stories_updated_at BEFORE UPDATE ON public.stories FOR EACH ROW EXECUTE FUNCTION public.update_updated_at_column();
CREATE TRIGGER update_chapters_updated_at BEFORE UPDATE ON public.chapters FOR EACH ROW EXECUTE FUNCTION public.update_updated_at_column();

-- Create function to handle new user registration
CREATE OR REPLACE FUNCTION public.handle_new_user()
RETURNS TRIGGER AS $$
BEGIN
  INSERT INTO public.profiles (user_id, display_name)
  VALUES (NEW.id, NEW.raw_user_meta_data ->> 'display_name');
  RETURN NEW;
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;

-- Create trigger for new user registration
CREATE TRIGGER on_auth_user_created
  AFTER INSERT ON auth.users
  FOR EACH ROW EXECUTE FUNCTION public.handle_new_user();