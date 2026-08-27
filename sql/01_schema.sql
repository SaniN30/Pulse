-- ============================================================
-- PRODUCTPULSE
-- E-COMMERCE PRODUCT & BUSINESS ANALYTICS PLATFORM
-- PostgreSQL 17
-- ============================================================

-- Clean rebuild during development
DROP TABLE IF EXISTS experiment_assignments CASCADE;
DROP TABLE IF EXISTS experiments CASCADE;
DROP TABLE IF EXISTS returns CASCADE;
DROP TABLE IF EXISTS payments CASCADE;
DROP TABLE IF EXISTS order_items CASCADE;
DROP TABLE IF EXISTS orders CASCADE;
DROP TABLE IF EXISTS events CASCADE;
DROP TABLE IF EXISTS sessions CASCADE;
DROP TABLE IF EXISTS products CASCADE;
DROP TABLE IF EXISTS categories CASCADE;
DROP TABLE IF EXISTS users CASCADE;

-- ============================================================
-- USERS
-- ============================================================

CREATE TABLE users (
    user_id BIGSERIAL PRIMARY KEY,
    signup_date DATE NOT NULL,
    country VARCHAR(100) NOT NULL,
    city VARCHAR(100) NOT NULL,
    age_group VARCHAR(20) NOT NULL,
    gender VARCHAR(20),
    acquisition_channel VARCHAR(50) NOT NULL,
    created_at TIMESTAMP NOT NULL DEFAULT CURRENT_TIMESTAMP,

    CONSTRAINT chk_user_age_group
        CHECK (age_group IN (
            '18-24',
            '25-34',
            '35-44',
            '45-54',
            '55+'
        ))
);

-- ============================================================
-- PRODUCT CATEGORIES
-- ============================================================

CREATE TABLE categories (
    category_id SERIAL PRIMARY KEY,
    category_name VARCHAR(100) NOT NULL UNIQUE,
    created_at TIMESTAMP NOT NULL DEFAULT CURRENT_TIMESTAMP
);

-- ============================================================
-- PRODUCTS
-- ============================================================

CREATE TABLE products (
    product_id BIGSERIAL PRIMARY KEY,
    category_id INTEGER NOT NULL,
    product_name VARCHAR(255) NOT NULL,
    brand VARCHAR(100) NOT NULL,
    price NUMERIC(12,2) NOT NULL,
    cost NUMERIC(12,2) NOT NULL,
    rating NUMERIC(3,2),
    created_at TIMESTAMP NOT NULL DEFAULT CURRENT_TIMESTAMP,

    CONSTRAINT fk_products_category
        FOREIGN KEY (category_id)
        REFERENCES categories(category_id),

    CONSTRAINT chk_product_price
        CHECK (price >= 0),

    CONSTRAINT chk_product_cost
        CHECK (cost >= 0),

    CONSTRAINT chk_product_margin
        CHECK (cost <= price),

    CONSTRAINT chk_product_rating
        CHECK (rating IS NULL OR (rating >= 0 AND rating <= 5))
);

-- ============================================================
-- SESSIONS
-- ============================================================

CREATE TABLE sessions (
    session_id BIGSERIAL PRIMARY KEY,
    user_id BIGINT NOT NULL,
    session_start TIMESTAMP NOT NULL,
    session_end TIMESTAMP,
    device_type VARCHAR(30) NOT NULL,
    operating_system VARCHAR(50) NOT NULL,
    traffic_source VARCHAR(50) NOT NULL,

    CONSTRAINT fk_sessions_user
        FOREIGN KEY (user_id)
        REFERENCES users(user_id),

    CONSTRAINT chk_session_dates
        CHECK (
            session_end IS NULL
            OR session_end >= session_start
        )
);

-- ============================================================
-- EVENTS
-- ============================================================

CREATE TABLE events (
    event_id BIGSERIAL PRIMARY KEY,
    session_id BIGINT NOT NULL,
    user_id BIGINT NOT NULL,
    event_timestamp TIMESTAMP NOT NULL,
    event_name VARCHAR(50) NOT NULL,
    product_id BIGINT,
    page VARCHAR(100),

    CONSTRAINT fk_events_session
        FOREIGN KEY (session_id)
        REFERENCES sessions(session_id),

    CONSTRAINT fk_events_user
        FOREIGN KEY (user_id)
        REFERENCES users(user_id),

    CONSTRAINT fk_events_product
        FOREIGN KEY (product_id)
        REFERENCES products(product_id),

    CONSTRAINT chk_event_name
        CHECK (event_name IN (
            'page_view',
            'product_view',
            'search',
            'add_to_cart',
            'remove_from_cart',
            'checkout_started',
            'payment_attempt',
            'purchase'
        ))
);

-- ============================================================
-- ORDERS
-- ============================================================

CREATE TABLE orders (
    order_id BIGSERIAL PRIMARY KEY,
    user_id BIGINT NOT NULL,
    order_date TIMESTAMP NOT NULL,
    order_status VARCHAR(30) NOT NULL,
    subtotal NUMERIC(12,2) NOT NULL,
    discount NUMERIC(12,2) NOT NULL DEFAULT 0,
    shipping_cost NUMERIC(12,2) NOT NULL DEFAULT 0,
    tax NUMERIC(12,2) NOT NULL DEFAULT 0,
    total_amount NUMERIC(12,2) NOT NULL,

    CONSTRAINT fk_orders_user
        FOREIGN KEY (user_id)
        REFERENCES users(user_id),

    CONSTRAINT chk_order_status
        CHECK (order_status IN (
            'pending',
            'confirmed',
            'shipped',
            'delivered',
            'cancelled',
            'returned'
        )),

    CONSTRAINT chk_order_subtotal
        CHECK (subtotal >= 0),

    CONSTRAINT chk_order_discount
        CHECK (discount >= 0),

    CONSTRAINT chk_order_shipping
        CHECK (shipping_cost >= 0),

    CONSTRAINT chk_order_tax
        CHECK (tax >= 0),

    CONSTRAINT chk_order_total
        CHECK (total_amount >= 0)
);

-- ============================================================
-- ORDER ITEMS
-- ============================================================

CREATE TABLE order_items (
    order_item_id BIGSERIAL PRIMARY KEY,
    order_id BIGINT NOT NULL,
    product_id BIGINT NOT NULL,
    quantity INTEGER NOT NULL,
    unit_price NUMERIC(12,2) NOT NULL,
    discount NUMERIC(12,2) NOT NULL DEFAULT 0,

    CONSTRAINT fk_order_items_order
        FOREIGN KEY (order_id)
        REFERENCES orders(order_id)
        ON DELETE CASCADE,

    CONSTRAINT fk_order_items_product
        FOREIGN KEY (product_id)
        REFERENCES products(product_id),

    CONSTRAINT chk_order_item_quantity
        CHECK (quantity > 0),

    CONSTRAINT chk_order_item_price
        CHECK (unit_price >= 0),

    CONSTRAINT chk_order_item_discount
        CHECK (discount >= 0)
);

-- ============================================================
-- PAYMENTS
-- ============================================================

CREATE TABLE payments (
    payment_id BIGSERIAL PRIMARY KEY,
    order_id BIGINT NOT NULL,
    payment_method VARCHAR(30) NOT NULL,
    payment_status VARCHAR(30) NOT NULL,
    payment_amount NUMERIC(12,2) NOT NULL,
    payment_date TIMESTAMP NOT NULL,

    CONSTRAINT fk_payments_order
        FOREIGN KEY (order_id)
        REFERENCES orders(order_id),

    CONSTRAINT chk_payment_method
        CHECK (payment_method IN (
            'UPI',
            'Credit Card',
            'Debit Card',
            'Net Banking',
            'Wallet',
            'COD'
        )),

    CONSTRAINT chk_payment_status
        CHECK (payment_status IN (
            'success',
            'failed',
            'pending',
            'refunded'
        )),

    CONSTRAINT chk_payment_amount
        CHECK (payment_amount >= 0)
);

-- ============================================================
-- RETURNS
-- ============================================================

CREATE TABLE returns (
    return_id BIGSERIAL PRIMARY KEY,
    order_id BIGINT NOT NULL,
    product_id BIGINT NOT NULL,
    return_date TIMESTAMP NOT NULL,
    return_reason VARCHAR(100) NOT NULL,
    refund_amount NUMERIC(12,2) NOT NULL,

    CONSTRAINT fk_returns_order
        FOREIGN KEY (order_id)
        REFERENCES orders(order_id),

    CONSTRAINT fk_returns_product
        FOREIGN KEY (product_id)
        REFERENCES products(product_id),

    CONSTRAINT chk_refund_amount
        CHECK (refund_amount >= 0)
);

-- ============================================================
-- EXPERIMENTS
-- ============================================================

CREATE TABLE experiments (
    experiment_id SERIAL PRIMARY KEY,
    experiment_name VARCHAR(255) NOT NULL,
    start_date DATE NOT NULL,
    end_date DATE,
    primary_metric VARCHAR(100) NOT NULL,
    status VARCHAR(30) NOT NULL DEFAULT 'running',

    CONSTRAINT chk_experiment_dates
        CHECK (end_date IS NULL OR end_date >= start_date),

    CONSTRAINT chk_experiment_status
        CHECK (status IN (
            'draft',
            'running',
            'completed'
        ))
);

-- ============================================================
-- EXPERIMENT ASSIGNMENTS
-- ============================================================

CREATE TABLE experiment_assignments (
    assignment_id BIGSERIAL PRIMARY KEY,
    experiment_id INTEGER NOT NULL,
    user_id BIGINT NOT NULL,
    variant VARCHAR(50) NOT NULL,
    assigned_at TIMESTAMP NOT NULL,

    CONSTRAINT fk_assignments_experiment
        FOREIGN KEY (experiment_id)
        REFERENCES experiments(experiment_id)
        ON DELETE CASCADE,

    CONSTRAINT fk_assignments_user
        FOREIGN KEY (user_id)
        REFERENCES users(user_id),

    CONSTRAINT uq_experiment_user
        UNIQUE (experiment_id, user_id)
);

-- ============================================================
-- INDEXES
-- ============================================================

CREATE INDEX idx_users_signup_date
    ON users(signup_date);

CREATE INDEX idx_users_acquisition_channel
    ON users(acquisition_channel);

CREATE INDEX idx_products_category
    ON products(category_id);

CREATE INDEX idx_sessions_user
    ON sessions(user_id);

CREATE INDEX idx_sessions_start
    ON sessions(session_start);

CREATE INDEX idx_events_user
    ON events(user_id);

CREATE INDEX idx_events_session
    ON events(session_id);

CREATE INDEX idx_events_timestamp
    ON events(event_timestamp);

CREATE INDEX idx_events_name
    ON events(event_name);

CREATE INDEX idx_events_product
    ON events(product_id);

CREATE INDEX idx_orders_user
    ON orders(user_id);

CREATE INDEX idx_orders_date
    ON orders(order_date);

CREATE INDEX idx_orders_status
    ON orders(order_status);

CREATE INDEX idx_order_items_order
    ON order_items(order_id);

CREATE INDEX idx_order_items_product
    ON order_items(product_id);

CREATE INDEX idx_payments_order
    ON payments(order_id);

CREATE INDEX idx_payments_status
    ON payments(payment_status);

CREATE INDEX idx_returns_order
    ON returns(order_id);

CREATE INDEX idx_returns_product
    ON returns(product_id);

CREATE INDEX idx_experiment_assignments_experiment
    ON experiment_assignments(experiment_id);

CREATE INDEX idx_experiment_assignments_user
    ON experiment_assignments(user_id);

-- ============================================================
-- END
-- ============================================================