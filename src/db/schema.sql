-- Database Schema for Volunteer OS (Minimalist Redesign)
-- Run this in the Supabase SQL Editor

-- Enable UUID extension if not enabled
CREATE EXTENSION IF NOT EXISTS "uuid-ossp";

-- Drop existing tables if they exist
DROP TABLE IF EXISTS public.knowledge_base CASCADE;
DROP TABLE IF EXISTS public.check_ins CASCADE;
DROP TABLE IF EXISTS public.tasks CASCADE;
DROP TABLE IF EXISTS public.projects CASCADE;
DROP TABLE IF EXISTS public.users CASCADE;

-- 1. Users Table (Linked to Supabase Auth)
CREATE TABLE public.users (
    id UUID PRIMARY KEY REFERENCES auth.users(id) ON DELETE CASCADE,
    role TEXT NOT NULL CHECK (role IN ('admin', 'manager', 'volunteer')) DEFAULT 'volunteer',
    full_name TEXT NOT NULL,
    telegram_id BIGINT UNIQUE,
    phone TEXT UNIQUE,
    rating NUMERIC(3, 2) DEFAULT 5.00 CHECK (rating >= 0.00 AND rating <= 5.00),
    created_at TIMESTAMP WITH TIME ZONE DEFAULT timezone('utc'::text, now()) NOT NULL
);

-- 2. Projects Table
CREATE TABLE public.projects (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    title TEXT NOT NULL,
    description TEXT,
    status TEXT NOT NULL CHECK (status IN ('planning', 'active', 'completed')) DEFAULT 'planning',
    start_date TIMESTAMP WITH TIME ZONE,
    end_date TIMESTAMP WITH TIME ZONE,
    created_at TIMESTAMP WITH TIME ZONE DEFAULT timezone('utc'::text, now()) NOT NULL
);

-- 3. Tasks Table
CREATE TABLE public.tasks (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    project_id UUID REFERENCES public.projects(id) ON DELETE CASCADE NOT NULL,
    assigned_to UUID REFERENCES public.users(id) ON DELETE SET NULL,
    title TEXT NOT NULL,
    deadline TIMESTAMP WITH TIME ZONE NOT NULL,
    status TEXT NOT NULL CHECK (status IN ('pending', 'accepted', 'completed')) DEFAULT 'pending',
    is_overdue BOOLEAN NOT NULL DEFAULT false,
    created_at TIMESTAMP WITH TIME ZONE DEFAULT timezone('utc'::text, now()) NOT NULL
);

-- 4. Check_ins Table (Micro-reports / Check-ins)
CREATE TABLE public.check_ins (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    user_id UUID REFERENCES public.users(id) ON DELETE CASCADE NOT NULL,
    project_id UUID REFERENCES public.projects(id) ON DELETE SET NULL,
    text_report TEXT NOT NULL,
    hours NUMERIC(5, 2) NOT NULL CHECK (hours >= 0.00),
    created_at TIMESTAMP WITH TIME ZONE DEFAULT timezone('utc'::text, now()) NOT NULL
);

-- 5. Knowledge Base Table
CREATE TABLE public.knowledge_base (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    category TEXT NOT NULL,
    title TEXT NOT NULL,
    content TEXT NOT NULL, -- Markdown content
    file_url TEXT,         -- URL to storage attachments
    created_at TIMESTAMP WITH TIME ZONE DEFAULT timezone('utc'::text, now()) NOT NULL
);

-- Enable RLS for all tables
ALTER TABLE public.users ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.projects ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.tasks ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.check_ins ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.knowledge_base ENABLE ROW LEVEL SECURITY;

-- ================= RLS Policies =================

-- 1. Users policies
CREATE POLICY "Users read permissions" ON public.users 
    FOR SELECT TO authenticated USING (true);

CREATE POLICY "Users write permissions" ON public.users 
    FOR ALL TO authenticated USING (
        (SELECT role FROM public.users WHERE id = auth.uid()) = 'admin'
    );

-- 2. Projects policies
CREATE POLICY "Projects select permissions" ON public.projects 
    FOR SELECT TO authenticated USING (true);

CREATE POLICY "Projects write permissions" ON public.projects 
    FOR ALL TO authenticated USING (
        (SELECT role FROM public.users WHERE id = auth.uid()) IN ('admin', 'manager')
    );

-- 3. Tasks policies
CREATE POLICY "Tasks select permissions" ON public.tasks 
    FOR SELECT TO authenticated USING (true);

CREATE POLICY "Tasks write permissions" ON public.tasks 
    FOR ALL TO authenticated USING (
        (SELECT role FROM public.users WHERE id = auth.uid()) IN ('admin', 'manager')
    );

-- 4. Check-ins policies
CREATE POLICY "Checkins select permissions" ON public.check_ins 
    FOR SELECT TO authenticated USING (
        (SELECT role FROM public.users WHERE id = auth.uid()) IN ('admin', 'manager') OR user_id = auth.uid()
    );

CREATE POLICY "Checkins insert permissions" ON public.check_ins 
    FOR INSERT TO authenticated WITH CHECK (
        user_id = auth.uid()
    );

-- 5. Knowledge Base policies
CREATE POLICY "KB select permissions" ON public.knowledge_base 
    FOR SELECT TO authenticated USING (true);

CREATE POLICY "KB write permissions" ON public.knowledge_base 
    FOR ALL TO authenticated USING (
        (SELECT role FROM public.users WHERE id = auth.uid()) IN ('admin', 'manager')
    );
