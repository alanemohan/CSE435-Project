-- Add complaint status tracking
ALTER TABLE public.analysis_history 
ADD COLUMN IF NOT EXISTS status TEXT DEFAULT NULL,
ADD COLUMN IF NOT EXISTS status_updated_at TIMESTAMP WITH TIME ZONE DEFAULT NULL;

-- Create scam patterns table for crowd-sourced learning (hash-based)
CREATE TABLE IF NOT EXISTS public.scam_patterns (
  id UUID NOT NULL DEFAULT gen_random_uuid() PRIMARY KEY,
  pattern_hash TEXT NOT NULL,
  pattern_type TEXT NOT NULL,
  similarity_count INTEGER NOT NULL DEFAULT 1,
  risk_category TEXT,
  first_seen_at TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT now(),
  last_seen_at TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT now(),
  UNIQUE(pattern_hash)
);

-- Enable RLS for scam_patterns
ALTER TABLE public.scam_patterns ENABLE ROW LEVEL SECURITY;

-- Anyone can read patterns (anonymous public data)
CREATE POLICY "Anyone can view scam patterns"
ON public.scam_patterns FOR SELECT
USING (true);

-- Only authenticated users can contribute patterns
CREATE POLICY "Authenticated users can insert patterns"
ON public.scam_patterns FOR INSERT
TO authenticated
WITH CHECK (true);

-- Create user vulnerability profiles table
CREATE TABLE IF NOT EXISTS public.vulnerability_profiles (
  id UUID NOT NULL DEFAULT gen_random_uuid() PRIMARY KEY,
  user_id UUID NOT NULL,
  scam_exposure_count INTEGER NOT NULL DEFAULT 0,
  most_common_scam_type TEXT,
  risk_level TEXT DEFAULT 'low',
  vulnerable_categories JSONB DEFAULT '[]'::jsonb,
  safety_score INTEGER DEFAULT 100,
  last_analyzed_at TIMESTAMP WITH TIME ZONE,
  personalized_warnings JSONB DEFAULT '[]'::jsonb,
  created_at TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT now(),
  updated_at TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT now(),
  UNIQUE(user_id)
);

-- Enable RLS for vulnerability_profiles
ALTER TABLE public.vulnerability_profiles ENABLE ROW LEVEL SECURITY;

-- Users can only see their own profile
CREATE POLICY "Users can view their own vulnerability profile"
ON public.vulnerability_profiles FOR SELECT
USING (auth.uid() = user_id);

CREATE POLICY "Users can insert their own vulnerability profile"
ON public.vulnerability_profiles FOR INSERT
WITH CHECK (auth.uid() = user_id);

CREATE POLICY "Users can update their own vulnerability profile"
ON public.vulnerability_profiles FOR UPDATE
USING (auth.uid() = user_id);

-- Add trigger for updated_at on vulnerability_profiles
CREATE TRIGGER update_vulnerability_profiles_updated_at
BEFORE UPDATE ON public.vulnerability_profiles
FOR EACH ROW
EXECUTE FUNCTION public.update_updated_at_column();

-- Add policy for updating analysis_history status
CREATE POLICY "Users can update their own analysis status"
ON public.analysis_history FOR UPDATE
USING (auth.uid() = user_id);