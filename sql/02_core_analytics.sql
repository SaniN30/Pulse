-- ============================================================
-- PRODUCTPULSE - CORE ANALYTICS
-- ============================================================

-- ============================================================
-- 1. EXECUTIVE KPI SUMMARY
-- ============================================================

SELECT
    COUNT(DISTINCT o.order_id) AS total_orders,
    COUNT(DISTINCT o.user_id) AS purchasing_customers,
    ROUND(SUM(o.total_amount), 2) AS gross_revenue,
    ROUND(AVG(o.total_amount), 2) AS average_order_value,
    ROUND(
        SUM(o.total_amount) /
        NULLIF(COUNT(DISTINCT o.order_id), 0),
        2
    ) AS calculated_aov
FROM orders o
WHERE o.order_status NOT IN ('cancelled');


-- ============================================================
-- 2. MONTHLY REVENUE TREND
-- ============================================================

SELECT
    DATE_TRUNC('month', order_date)::DATE AS month,
    COUNT(*) AS orders,
    ROUND(SUM(total_amount), 2) AS revenue,
    ROUND(AVG(total_amount), 2) AS average_order_value
FROM orders
WHERE order_status NOT IN ('cancelled')
GROUP BY 1
ORDER BY 1;


-- ============================================================
-- 3. REVENUE BY PRODUCT CATEGORY
-- ============================================================

SELECT
    c.category_name,
    COUNT(DISTINCT o.order_id) AS orders,
    SUM(oi.quantity) AS units_sold,
    ROUND(SUM(
        (oi.unit_price * oi.quantity) - oi.discount
    ), 2) AS product_revenue
FROM order_items oi
JOIN orders o
    ON oi.order_id = o.order_id
JOIN products p
    ON oi.product_id = p.product_id
JOIN categories c
    ON p.category_id = c.category_id
WHERE o.order_status NOT IN ('cancelled')
GROUP BY c.category_name
ORDER BY product_revenue DESC;


-- ============================================================
-- 4. CATEGORY PROFITABILITY
-- ============================================================

SELECT
    c.category_name,

    ROUND(
        SUM(
            (
                oi.unit_price * oi.quantity
            ) - oi.discount
        ),
        2
    ) AS revenue,

    ROUND(
        SUM(
            (
                (oi.unit_price - p.cost) * oi.quantity
            ) - oi.discount
        ),
        2
    ) AS estimated_gross_profit,

    ROUND(
        100.0 *
        SUM(
            (
                (oi.unit_price - p.cost) * oi.quantity
            ) - oi.discount
        )
        /
        NULLIF(
            SUM(
                (oi.unit_price * oi.quantity) - oi.discount
            ),
            0
        ),
        2
    ) AS gross_margin_percent

FROM order_items oi

JOIN orders o
    ON oi.order_id = o.order_id

JOIN products p
    ON oi.product_id = p.product_id

JOIN categories c
    ON p.category_id = c.category_id

WHERE o.order_status NOT IN ('cancelled')

GROUP BY c.category_name

ORDER BY estimated_gross_profit DESC;


-- ============================================================
-- 5. TOP 20 PRODUCTS BY REVENUE
-- ============================================================

SELECT
    p.product_id,
    p.product_name,
    p.brand,
    c.category_name,

    SUM(oi.quantity) AS units_sold,

    ROUND(
        SUM(
            (oi.unit_price * oi.quantity)
            - oi.discount
        ),
        2
    ) AS revenue

FROM order_items oi

JOIN orders o
    ON oi.order_id = o.order_id

JOIN products p
    ON oi.product_id = p.product_id

JOIN categories c
    ON p.category_id = c.category_id

WHERE o.order_status NOT IN ('cancelled')

GROUP BY
    p.product_id,
    p.product_name,
    p.brand,
    c.category_name

ORDER BY revenue DESC

LIMIT 20;


-- ============================================================
-- 6. PAYMENT FAILURE ANALYSIS
-- ============================================================

SELECT
    payment_method,

    COUNT(*) AS payment_attempts,

    COUNT(*) FILTER (
        WHERE payment_status = 'success'
    ) AS successful_payments,

    COUNT(*) FILTER (
        WHERE payment_status = 'failed'
    ) AS failed_payments,

    ROUND(
        100.0 *
        COUNT(*) FILTER (
            WHERE payment_status = 'failed'
        )
        /
        NULLIF(COUNT(*), 0),
        2
    ) AS failure_rate_percent

FROM payments

GROUP BY payment_method

ORDER BY failure_rate_percent DESC;


-- ============================================================
-- 7. ACQUISITION CHANNEL PERFORMANCE
-- ============================================================

SELECT
    u.acquisition_channel,

    COUNT(DISTINCT u.user_id) AS customers,

    COUNT(DISTINCT o.order_id) AS orders,

    ROUND(
        SUM(
            CASE
                WHEN o.order_status NOT IN ('cancelled')
                THEN o.total_amount
                ELSE 0
            END
        ),
        2
    ) AS revenue,

    ROUND(
        AVG(
            CASE
                WHEN o.order_status NOT IN ('cancelled')
                THEN o.total_amount
            END
        ),
        2
    ) AS average_order_value

FROM users u

LEFT JOIN orders o
    ON u.user_id = o.user_id

GROUP BY u.acquisition_channel

ORDER BY revenue DESC;


-- ============================================================
-- 8. DAILY ACTIVE USERS
-- ============================================================

SELECT
    event_timestamp::DATE AS activity_date,
    COUNT(DISTINCT user_id) AS daily_active_users
FROM events
GROUP BY 1
ORDER BY 1;


-- ============================================================
-- 9. PRODUCT FUNNEL
-- ============================================================

WITH funnel AS (

    SELECT
        COUNT(DISTINCT user_id)
        FILTER (
            WHERE event_name = 'page_view'
        ) AS visitors,

        COUNT(DISTINCT user_id)
        FILTER (
            WHERE event_name = 'product_view'
        ) AS product_viewers,

        COUNT(DISTINCT user_id)
        FILTER (
            WHERE event_name = 'add_to_cart'
        ) AS cart_users,

        COUNT(DISTINCT user_id)
        FILTER (
            WHERE event_name = 'checkout_started'
        ) AS checkout_users,

        COUNT(DISTINCT user_id)
        FILTER (
            WHERE event_name = 'purchase'
        ) AS purchasers

    FROM events

)

SELECT
    visitors,
    product_viewers,
    cart_users,
    checkout_users,
    purchasers,

    ROUND(
        100.0 * product_viewers / NULLIF(visitors, 0),
        2
    ) AS view_rate,

    ROUND(
        100.0 * cart_users / NULLIF(product_viewers, 0),
        2
    ) AS add_to_cart_rate,

    ROUND(
        100.0 * checkout_users / NULLIF(cart_users, 0),
        2
    ) AS checkout_rate,

    ROUND(
        100.0 * purchasers / NULLIF(checkout_users, 0),
        2
    ) AS purchase_rate

FROM funnel;


-- ============================================================
-- 10. DEVICE PERFORMANCE
-- ============================================================

SELECT
    s.device_type,

    COUNT(DISTINCT s.session_id) AS sessions,

    COUNT(DISTINCT s.user_id) AS users,

    COUNT(DISTINCT e.event_id)
        FILTER (
            WHERE e.event_name = 'purchase'
        ) AS purchase_events,

    ROUND(
        100.0 *
        COUNT(DISTINCT e.event_id)
        FILTER (
            WHERE e.event_name = 'purchase'
        )
        /
        NULLIF(COUNT(DISTINCT s.session_id), 0),
        2
    ) AS session_conversion_percent

FROM sessions s

LEFT JOIN events e
    ON s.session_id = e.session_id

GROUP BY s.device_type

ORDER BY session_conversion_percent DESC;


-- ============================================================
-- 11. RETURN RATE BY CATEGORY
-- ============================================================

SELECT
    c.category_name,

    COUNT(DISTINCT oi.order_item_id) AS sold_items,

    COUNT(DISTINCT r.return_id) AS returned_items,

    ROUND(
        100.0 *
        COUNT(DISTINCT r.return_id)
        /
        NULLIF(COUNT(DISTINCT oi.order_item_id), 0),
        2
    ) AS return_rate_percent

FROM order_items oi

JOIN products p
    ON oi.product_id = p.product_id

JOIN categories c
    ON p.category_id = c.category_id

JOIN orders o
    ON oi.order_id = o.order_id

LEFT JOIN returns r
    ON oi.order_id = r.order_id
    AND oi.product_id = r.product_id

WHERE o.order_status NOT IN ('cancelled')

GROUP BY c.category_name

ORDER BY return_rate_percent DESC;


-- ============================================================
-- 12. ORDER STATUS DISTRIBUTION
-- ============================================================

SELECT
    order_status,
    COUNT(*) AS orders,
    ROUND(
        100.0 * COUNT(*) /
        SUM(COUNT(*)) OVER (),
        2
    ) AS percentage_of_orders

FROM orders

GROUP BY order_status

ORDER BY orders DESC;


-- ============================================================
-- 13. HIGH VALUE CUSTOMERS
-- ============================================================

SELECT
    u.user_id,
    u.country,
    u.acquisition_channel,

    COUNT(o.order_id) AS total_orders,

    ROUND(
        SUM(o.total_amount),
        2
    ) AS lifetime_revenue,

    ROUND(
        AVG(o.total_amount),
        2
    ) AS average_order_value

FROM users u

JOIN orders o
    ON u.user_id = o.user_id

WHERE o.order_status NOT IN ('cancelled')

GROUP BY
    u.user_id,
    u.country,
    u.acquisition_channel

HAVING COUNT(o.order_id) >= 3

ORDER BY lifetime_revenue DESC

LIMIT 50;


-- ============================================================
-- 14. MONTHLY CUSTOMER RETENTION
-- ============================================================

WITH customer_months AS (

    SELECT DISTINCT
        user_id,
        DATE_TRUNC(
            'month',
            order_date
        )::DATE AS order_month

    FROM orders

    WHERE order_status NOT IN ('cancelled')

),

first_purchase AS (

    SELECT
        user_id,
        MIN(order_month) AS cohort_month

    FROM customer_months

    GROUP BY user_id

),

cohort_data AS (

    SELECT
        f.cohort_month,
        c.order_month,
        COUNT(DISTINCT c.user_id) AS customers

    FROM first_purchase f

    JOIN customer_months c
        ON f.user_id = c.user_id

    GROUP BY
        f.cohort_month,
        c.order_month

)

SELECT
    cohort_month,
    order_month,
    customers,

    (
        (
            EXTRACT(
                YEAR FROM order_month
            ) * 12
            +
            EXTRACT(
                MONTH FROM order_month
            )
        )
        -
        (
            EXTRACT(
                YEAR FROM cohort_month
            ) * 12
            +
            EXTRACT(
                MONTH FROM cohort_month
            )
        )
    )::INTEGER AS months_since_first_purchase

FROM cohort_data

ORDER BY
    cohort_month,
    order_month;


-- ============================================================
-- 15. REVENUE BY COUNTRY
-- ============================================================

SELECT
    u.country,

    COUNT(DISTINCT o.order_id) AS orders,

    COUNT(DISTINCT u.user_id) AS customers,

    ROUND(
        SUM(o.total_amount),
        2
    ) AS revenue,

    ROUND(
        SUM(o.total_amount)
        /
        NULLIF(COUNT(DISTINCT u.user_id), 0),
        2
    ) AS revenue_per_customer

FROM users u

JOIN orders o
    ON u.user_id = o.user_id

WHERE o.order_status NOT IN ('cancelled')

GROUP BY u.country

ORDER BY revenue DESC;