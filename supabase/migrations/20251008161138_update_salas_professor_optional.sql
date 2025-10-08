/*
  # Tornar professor_id opcional

  1. Alterações
    - Permitir professor_id como NULL na tabela salas
    - Isso permite criar salas sem necessariamente ter um ID de professor UUID válido
*/

ALTER TABLE salas ALTER COLUMN professor_id DROP NOT NULL;