
-- Adicionar coluna 'origem' na tabela 'agenda'
ALTER TABLE agenda 
ADD COLUMN origem text DEFAULT 'Alê Portela';

-- Atualizar eventos existentes para ter um valor padrão
UPDATE agenda 
SET origem = 'Alê Portela' 
WHERE origem IS NULL;
