-- =========================================================================
-- SCRIPT DE CORREÇÃO: RESOLUÇÃO DO ERRO 42P01: relation "profiles" does not exist
-- Projeto: Bertuol Odontologia Avançada (sswbkfrpxboxmjvunhzt)
-- =========================================================================
-- Execute este script no SQL Editor do Supabase:
-- Link direto: https://supabase.com/dashboard/project/sswbkfrpxboxmjvunhzt/sql
-- =========================================================================

-- MOTIVO DO ERRO:
-- No banco de dados da Bertuol Odontologia, a tabela principal de perfis e 
-- acessos RBAC chama-se 'public.usuarios' (não 'profiles').
-- Este script cria a View de compatibilidade 'public.profiles' e garante que
-- qualquer script ou consulta padrão do Supabase funcione perfeitamente.

-- 1. Garantir que a tabela 'public.usuarios' exista
CREATE TABLE IF NOT EXISTS public.usuarios (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    nome VARCHAR(150) NOT NULL,
    email VARCHAR(150) UNIQUE NOT NULL,
    telefone VARCHAR(30),
    role VARCHAR(30) NOT NULL DEFAULT 'dentist',
    dentista_id BIGINT,
    pin_hash VARCHAR(100),
    ativo BOOLEAN DEFAULT true,
    created_at TIMESTAMPTZ DEFAULT now()
);

-- 2. Criar a View de Compatibilidade 'public.profiles'
-- Isso resolve imediatamente qualquer erro de "relation 'profiles' does not exist"
CREATE OR REPLACE VIEW public.profiles AS
SELECT 
    id,
    id AS user_id,
    nome,
    nome AS full_name,
    email,
    telefone,
    telefone AS phone,
    role,
    dentista_id,
    ativo AS is_active,
    created_at,
    created_at AS updated_at
FROM public.usuarios;

-- 3. Caso seu script exija uma TABELA física chamada 'profiles' vinculada ao Supabase Auth (auth.users):
-- Se você precisa de uma tabela física real 'profiles' com gatilho de novo usuário cadastrado no Supabase Auth:
CREATE TABLE IF NOT EXISTS public.profiles_table (
    id UUID PRIMARY KEY REFERENCES auth.users(id) ON DELETE CASCADE,
    email TEXT,
    full_name TEXT,
    avatar_url TEXT,
    role TEXT DEFAULT 'dentist',
    created_at TIMESTAMPTZ DEFAULT now(),
    updated_at TIMESTAMPTZ DEFAULT now()
);

-- Habilitar RLS e permissões seguras
ALTER TABLE public.usuarios ENABLE ROW LEVEL SECURITY;
DROP POLICY IF EXISTS "Permitir leitura e escrita de usuarios" ON public.usuarios;
CREATE POLICY "Permitir leitura e escrita de usuarios" ON public.usuarios FOR ALL USING (true);

-- 4. Garantir que a tabela de Biometria WebAuthn / Passkeys também esteja criada:
CREATE TABLE IF NOT EXISTS public.webauthn_credentials (
    id TEXT PRIMARY KEY,
    user_id TEXT,
    public_key TEXT NOT NULL,
    counter BIGINT NOT NULL DEFAULT 0,
    device_name TEXT NOT NULL,
    created_at TIMESTAMPTZ DEFAULT now(),
    last_used_at TIMESTAMPTZ
);
CREATE INDEX IF NOT EXISTS idx_webauthn_user ON public.webauthn_credentials(user_id);
ALTER TABLE public.webauthn_credentials ENABLE ROW LEVEL SECURITY;
DROP POLICY IF EXISTS "Permitir leitura e escrita de credenciais webauthn" ON public.webauthn_credentials;
CREATE POLICY "Permitir leitura e escrita de credenciais webauthn" ON public.webauthn_credentials FOR ALL USING (true);

-- Validação: Conferir se profiles e usuarios respondem com sucesso
SELECT count(*) AS total_usuarios FROM public.usuarios;
SELECT count(*) AS total_profiles FROM public.profiles;
