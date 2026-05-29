-- =============================================================================
-- Migration 002 — Add image_url column to products table
-- Run: mysql -u root -p retail_crm < scripts/002_add_image_url.sql
-- =============================================================================

ALTER TABLE products
  ADD COLUMN image_url VARCHAR(2048) NULL AFTER description;
