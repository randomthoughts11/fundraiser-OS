-- Initial migration for Fundraise OS
-- Enable extensions
CREATE EXTENSION IF NOT EXISTS "pgcrypto";

-- Prisma will manage tables via migrate; this file documents manual extensions
-- pgvector can be enabled when available:
-- CREATE EXTENSION IF NOT EXISTS vector;
