-- Migration: Add latitude and longitude columns to core tables
-- Tables: municipios, liderancas, assessores

-- Municipios
ALTER TABLE municipios 
ADD COLUMN IF NOT EXISTS latitude FLOAT8,
ADD COLUMN IF NOT EXISTS longitude FLOAT8;

-- Lideranças
ALTER TABLE liderancas 
ADD COLUMN IF NOT EXISTS latitude FLOAT8,
ADD COLUMN IF NOT EXISTS longitude FLOAT8;

-- Assessores
ALTER TABLE assessores 
ADD COLUMN IF NOT EXISTS latitude FLOAT8,
ADD COLUMN IF NOT EXISTS longitude FLOAT8;

-- Create indexes for performance if needed
CREATE INDEX IF NOT EXISTS idx_municipios_coordinates ON municipios (latitude, longitude);
CREATE INDEX IF NOT EXISTS idx_liderancas_coordinates ON liderancas (latitude, longitude);
CREATE INDEX IF NOT EXISTS idx_assessores_coordinates ON assessores (latitude, longitude);
