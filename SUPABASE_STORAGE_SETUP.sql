-- =========================================================================
-- SCRIPT DE CRIAÇÃO DO BUCKET 'rewards' NO SUPABASE STORAGE
-- Projeto: Bertuol Odontologia Avançada (sswbkfrpxboxmjvunhzt)
-- =========================================================================
-- Execute este script no SQL Editor do Supabase para ativar o Bucket 'rewards'
-- Link direto: https://supabase.com/dashboard/project/sswbkfrpxboxmjvunhzt/sql
-- =========================================================================

-- 1. Criação do Bucket 'rewards' público
INSERT INTO storage.buckets (id, name, public, file_size_limit, allowed_mime_types)
VALUES (
  'rewards',
  'rewards',
  true,
  20971520, -- Limite de 20 MB por arquivo
  ARRAY['image/png', 'image/jpeg', 'image/jpg', 'image/webp', 'image/svg+xml', 'image/gif']
)
ON CONFLICT (id) DO UPDATE 
SET 
  public = true,
  file_size_limit = 20971520,
  allowed_mime_types = ARRAY['image/png', 'image/jpeg', 'image/jpg', 'image/webp', 'image/svg+xml', 'image/gif'];

-- 2. Habilitação de Leitura Pública para imagens dos prêmios
DROP POLICY IF EXISTS "Public Access Rewards" ON storage.objects;
CREATE POLICY "Public Access Rewards"
ON storage.objects FOR SELECT
USING (bucket_id = 'rewards');

-- 3. Habilitação de Upload para o Bucket 'rewards'
DROP POLICY IF EXISTS "Allow Upload Rewards" ON storage.objects;
CREATE POLICY "Allow Upload Rewards"
ON storage.objects FOR INSERT
WITH CHECK (bucket_id = 'rewards');

-- 4. Habilitação de Edição / Atualização
DROP POLICY IF EXISTS "Allow Update Rewards" ON storage.objects;
CREATE POLICY "Allow Update Rewards"
ON storage.objects FOR UPDATE
USING (bucket_id = 'rewards');

-- 5. Habilitação de Deleção
DROP POLICY IF EXISTS "Allow Delete Rewards" ON storage.objects;
CREATE POLICY "Allow Delete Rewards"
ON storage.objects FOR DELETE
USING (bucket_id = 'rewards');

-- Validação: Verificar se o bucket foi criado com sucesso
SELECT id, name, public, file_size_limit, allowed_mime_types, created_at 
FROM storage.buckets 
WHERE id = 'rewards';
