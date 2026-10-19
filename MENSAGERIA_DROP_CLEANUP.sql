-- =========================================================================
-- SCRIPT DE LIMPEZA / DROP (Caso queira remover do database errado)
-- =========================================================================
-- Execute este script no SQL Editor do banco ONDE VOCÊ CRIOU POR ENGANO:

DROP TABLE IF EXISTS public.conversation_events CASCADE;
DROP TABLE IF EXISTS public.conversation_participants CASCADE;
DROP TABLE IF EXISTS public.messages CASCADE;
DROP TABLE IF EXISTS public.conversations CASCADE;
