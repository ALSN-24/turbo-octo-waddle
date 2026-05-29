-- =============================================================================
-- Retail CRM v3 — MySQL 8.0+ schema
-- Run: mysql -u root -p < scripts/001_create_tables_mysql.sql
--
-- IMPORTANT: This script does NOT seed any user accounts.
-- Create your first admin account by running the setup script:
--   npx tsx scripts/create-admin.ts
-- =============================================================================

CREATE DATABASE IF NOT EXISTS retail_crm CHARACTER SET utf8mb4 COLLATE utf8mb4_unicode_ci;
USE retail_crm;

-- -----------------------------------------------------------------------------
-- Customers
-- -----------------------------------------------------------------------------
CREATE TABLE IF NOT EXISTS customers (
  id           CHAR(36)     NOT NULL DEFAULT (UUID()),
  name         VARCHAR(255) NOT NULL,
  email        VARCHAR(255) NOT NULL,
  phone        VARCHAR(50)  DEFAULT NULL,
  address      TEXT         DEFAULT NULL,
  member_since DATETIME     NOT NULL DEFAULT CURRENT_TIMESTAMP,
  created_at   DATETIME     NOT NULL DEFAULT CURRENT_TIMESTAMP,
  updated_at   DATETIME     NOT NULL DEFAULT CURRENT_TIMESTAMP ON UPDATE CURRENT_TIMESTAMP,
  PRIMARY KEY (id),
  UNIQUE KEY uq_customers_email (email),
  KEY idx_customers_name (name)
) ENGINE=InnoDB;

-- -----------------------------------------------------------------------------
-- Products
-- -----------------------------------------------------------------------------
CREATE TABLE IF NOT EXISTS products (
  id                  CHAR(36)      NOT NULL DEFAULT (UUID()),
  name                VARCHAR(255)  NOT NULL,
  sku                 VARCHAR(100)  NOT NULL,
  category            VARCHAR(100)  NOT NULL,
  price               DECIMAL(10,2) NOT NULL,
  stock               INT           NOT NULL DEFAULT 0,
  low_stock_threshold INT           NOT NULL DEFAULT 10,
  description         TEXT          DEFAULT NULL,
  status              ENUM('active','inactive') NOT NULL DEFAULT 'active',
  created_at          DATETIME      NOT NULL DEFAULT CURRENT_TIMESTAMP,
  updated_at          DATETIME      NOT NULL DEFAULT CURRENT_TIMESTAMP ON UPDATE CURRENT_TIMESTAMP,
  PRIMARY KEY (id),
  UNIQUE KEY uq_products_sku (sku),
  KEY idx_products_category (category),
  KEY idx_products_status (status),
  KEY idx_products_stock (stock)
) ENGINE=InnoDB;

-- -----------------------------------------------------------------------------
-- Orders
-- -----------------------------------------------------------------------------
CREATE TABLE IF NOT EXISTS orders (
  id          CHAR(36)      NOT NULL DEFAULT (UUID()),
  customer_id CHAR(36)      DEFAULT NULL,
  status      ENUM('pending','processing','completed','cancelled') NOT NULL DEFAULT 'pending',
  total       DECIMAL(10,2) NOT NULL DEFAULT 0.00,
  created_at  DATETIME      NOT NULL DEFAULT CURRENT_TIMESTAMP,
  updated_at  DATETIME      NOT NULL DEFAULT CURRENT_TIMESTAMP ON UPDATE CURRENT_TIMESTAMP,
  PRIMARY KEY (id),
  KEY idx_orders_customer_id (customer_id),
  KEY idx_orders_status (status),
  KEY idx_orders_created_at (created_at),
  KEY idx_orders_customer_date (customer_id, created_at),
  CONSTRAINT fk_orders_customer
    FOREIGN KEY (customer_id) REFERENCES customers (id) ON DELETE SET NULL
) ENGINE=InnoDB;

-- -----------------------------------------------------------------------------
-- Order items
-- -----------------------------------------------------------------------------
CREATE TABLE IF NOT EXISTS order_items (
  id         CHAR(36)      NOT NULL DEFAULT (UUID()),
  order_id   CHAR(36)      NOT NULL,
  product_id CHAR(36)      DEFAULT NULL,
  quantity   INT           NOT NULL DEFAULT 1,
  price      DECIMAL(10,2) NOT NULL,
  created_at DATETIME      NOT NULL DEFAULT CURRENT_TIMESTAMP,
  PRIMARY KEY (id),
  KEY idx_order_items_order_id (order_id),
  KEY idx_order_items_product_id (product_id),
  CONSTRAINT fk_order_items_order
    FOREIGN KEY (order_id)   REFERENCES orders   (id) ON DELETE CASCADE,
  CONSTRAINT fk_order_items_product
    FOREIGN KEY (product_id) REFERENCES products (id) ON DELETE SET NULL
) ENGINE=InnoDB;

-- -----------------------------------------------------------------------------
-- Users  (application authentication -- passwords hashed with bcrypt)
-- -----------------------------------------------------------------------------
CREATE TABLE IF NOT EXISTS users (
  id            CHAR(36)     NOT NULL DEFAULT (UUID()),
  email         VARCHAR(255) NOT NULL,
  password_hash VARCHAR(255) NOT NULL,
  name          VARCHAR(255) DEFAULT NULL,
  created_at    DATETIME     NOT NULL DEFAULT CURRENT_TIMESTAMP,
  updated_at    DATETIME     NOT NULL DEFAULT CURRENT_TIMESTAMP ON UPDATE CURRENT_TIMESTAMP,
  PRIMARY KEY (id),
  UNIQUE KEY uq_users_email (email)
) ENGINE=InnoDB;
