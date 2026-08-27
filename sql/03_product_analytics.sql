-- ============================================================
-- PRODUCTPULSE
-- PRODUCT / DATA / BUSINESS ANALYTICS LAYER
-- ============================================================

-- ============================================================
-- METRIC DEFINITIONS
-- ============================================================
--
-- Revenue:
-- Sum of total_amount for non-cancelled orders.
--
-- AOV:
-- Revenue / number of non-cancelled orders.
--
-- Session Conversion:
-- Sessions containing a purchase / total sessions.
--
-- User Conversion:
-- Users with a purchase / users with at least one session.
--
-- Funnel Conversion:
-- Users reaching a funnel stage / users reaching the
-- previous funnel stage.
--
-- Gross Profit:
-- Revenue - estimated product cost.
--
-- Return Rate:
-- Returned order items / sold order items.
--
-- ============================================================


-- ============================================================
-- 1. EXECUTIVE KPI SUMMARY
-- ============================================================

SELECT

    COUNT(DISTINCT o.order_id) AS total_orders,

    COUNT(DISTINCT o.user_id) AS purchasing_customers,

    ROUND(
        SUM(o.total_amount),
        2
    ) AS total_revenue,

    ROUND(
        AVG(o.total_amount),
        2
    ) AS average_order_value,

    ROUND(
        SUM(o.total_amount)
        /
        NULLIF(
            COUNT(DISTINCT o.user_id),
            0
        ),
        2
    ) AS revenue_per_customer,

    ROUND(
        100.0 *
        COUNT(DISTINCT o.user_id)
        /
        NULLIF(
            (SELECT COUNT(*) FROM users),
            0
        ),
        2
    ) AS customer_purchase_rate

FROM orders o

WHERE o.order_status NOT IN ('cancelled');


-- ============================================================
-- 2. REVENUE TREND BY MONTH
-- ============================================================

SELECT

    DATE_TRUNC(
        'month',
        o.order_date
    )::DATE AS month,

    COUNT(*) AS orders,

    COUNT(
        DISTINCT o.user_id
    ) AS customers,

    ROUND(
        SUM(o.total_amount),
        2
    ) AS revenue,

    ROUND(
        AVG(o.total_amount),
        2
    ) AS average_order_value

FROM orders o

WHERE o.order_status NOT IN ('cancelled')

GROUP BY 1

ORDER BY 1;


-- ============================================================
-- 3. MONTH-OVER-MONTH REVENUE GROWTH
-- ============================================================

WITH monthly_revenue AS (

    SELECT

        DATE_TRUNC(
            'month',
            order_date
        )::DATE AS month,

        SUM(total_amount) AS revenue

    FROM orders

    WHERE order_status NOT IN ('cancelled')

    GROUP BY 1

)

SELECT

    month,

    ROUND(
        revenue,
        2
    ) AS revenue,

    ROUND(
        LAG(revenue)
        OVER (
            ORDER BY month
        ),
        2
    ) AS previous_month_revenue,

    ROUND(
        100.0 *
        (
            revenue
            -
            LAG(revenue)
            OVER (
                ORDER BY month
            )
        )
        /
        NULLIF(
            LAG(revenue)
            OVER (
                ORDER BY month
            ),
            0
        ),
        2
    ) AS revenue_growth_percent

FROM monthly_revenue

ORDER BY month;


-- ============================================================
-- 4. PRODUCT FUNNEL
-- ============================================================

WITH funnel AS (

    SELECT

        COUNT(
            DISTINCT user_id
        ) FILTER (
            WHERE event_name = 'page_view'
        ) AS visitors,

        COUNT(
            DISTINCT user_id
        ) FILTER (
            WHERE event_name = 'product_view'
        ) AS product_viewers,

        COUNT(
            DISTINCT user_id
        ) FILTER (
            WHERE event_name = 'add_to_cart'
        ) AS cart_users,

        COUNT(
            DISTINCT user_id
        ) FILTER (
            WHERE event_name = 'checkout_started'
        ) AS checkout_users,

        COUNT(
            DISTINCT user_id
        ) FILTER (
            WHERE event_name = 'payment_attempt'
        ) AS payment_users,

        COUNT(
            DISTINCT user_id
        ) FILTER (
            WHERE event_name = 'purchase'
        ) AS purchasers

    FROM events

)

SELECT

    visitors,

    product_viewers,

    cart_users,

    checkout_users,

    payment_users,

    purchasers,

    ROUND(
        100.0 *
        product_viewers
        /
        NULLIF(
            visitors,
            0
        ),
        2
    ) AS view_rate_percent,

    ROUND(
        100.0 *
        cart_users
        /
        NULLIF(
            product_viewers,
            0
        ),
        2
    ) AS add_to_cart_rate_percent,

    ROUND(
        100.0 *
        checkout_users
        /
        NULLIF(
            cart_users,
            0
        ),
        2
    ) AS checkout_rate_percent,

    ROUND(
        100.0 *
        payment_users
        /
        NULLIF(
            checkout_users,
            0
        ),
        2
    ) AS payment_attempt_rate_percent,

    ROUND(
        100.0 *
        purchasers
        /
        NULLIF(
            payment_users,
            0
        ),
        2
    ) AS purchase_rate_percent

FROM funnel;


-- ============================================================
-- 5. FUNNEL DROP-OFF ANALYSIS
-- ============================================================

WITH funnel AS (

    SELECT

        COUNT(
            DISTINCT user_id
        ) FILTER (
            WHERE event_name = 'page_view'
        ) AS visitors,

        COUNT(
            DISTINCT user_id
        ) FILTER (
            WHERE event_name = 'product_view'
        ) AS product_viewers,

        COUNT(
            DISTINCT user_id
        ) FILTER (
            WHERE event_name = 'add_to_cart'
        ) AS cart_users,

        COUNT(
            DISTINCT user_id
        ) FILTER (
            WHERE event_name = 'checkout_started'
        ) AS checkout_users,

        COUNT(
            DISTINCT user_id
        ) FILTER (
            WHERE event_name = 'payment_attempt'
        ) AS payment_users,

        COUNT(
            DISTINCT user_id
        ) FILTER (
            WHERE event_name = 'purchase'
        ) AS purchasers

    FROM events

),

stages AS (

    SELECT
        1 AS stage_order,
        'Visitors' AS stage,
        visitors AS users
    FROM funnel

    UNION ALL

    SELECT
        2,
        'Product Viewers',
        product_viewers
    FROM funnel

    UNION ALL

    SELECT
        3,
        'Add To Cart',
        cart_users
    FROM funnel

    UNION ALL

    SELECT
        4,
        'Checkout Started',
        checkout_users
    FROM funnel

    UNION ALL

    SELECT
        5,
        'Payment Attempt',
        payment_users
    FROM funnel

    UNION ALL

    SELECT
        6,
        'Purchasers',
        purchasers
    FROM funnel

)

SELECT

    stage_order,

    stage,

    users,

    LAG(users)
    OVER (
        ORDER BY stage_order
    ) AS previous_stage_users,

    ROUND(
        100.0 *
        (
            users
            -
            LAG(users)
            OVER (
                ORDER BY stage_order
            )
        )
        /
        NULLIF(
            LAG(users)
            OVER (
                ORDER BY stage_order
            ),
            0
        ),
        2
    ) AS stage_change_percent

FROM stages

ORDER BY stage_order;


-- ============================================================
-- 6. DEVICE PERFORMANCE
-- ============================================================

WITH session_metrics AS (

    SELECT

        s.session_id,

        s.user_id,

        s.device_type,

        s.operating_system,

        s.traffic_source,

        MAX(
            CASE
                WHEN e.event_name = 'product_view'
                THEN 1
                ELSE 0
            END
        ) AS viewed_product,

        MAX(
            CASE
                WHEN e.event_name = 'add_to_cart'
                THEN 1
                ELSE 0
            END
        ) AS added_to_cart,

        MAX(
            CASE
                WHEN e.event_name = 'checkout_started'
                THEN 1
                ELSE 0
            END
        ) AS checkout_started,

        MAX(
            CASE
                WHEN e.event_name = 'purchase'
                THEN 1
                ELSE 0
            END
        ) AS purchased

    FROM sessions s

    LEFT JOIN events e
        ON s.session_id = e.session_id

    GROUP BY

        s.session_id,
        s.user_id,
        s.device_type,
        s.operating_system,
        s.traffic_source

)

SELECT

    device_type,

    COUNT(*) AS sessions,

    COUNT(*) FILTER (
        WHERE viewed_product = 1
    ) AS product_view_sessions,

    COUNT(*) FILTER (
        WHERE added_to_cart = 1
    ) AS cart_sessions,

    COUNT(*) FILTER (
        WHERE checkout_started = 1
    ) AS checkout_sessions,

    COUNT(*) FILTER (
        WHERE purchased = 1
    ) AS purchase_sessions,

    ROUND(
        100.0 *
        COUNT(*) FILTER (
            WHERE purchased = 1
        )
        /
        NULLIF(
            COUNT(*),
            0
        ),
        2
    ) AS session_conversion_percent

FROM session_metrics

GROUP BY device_type

ORDER BY session_conversion_percent DESC;


-- ============================================================
-- 7. OPERATING SYSTEM PERFORMANCE
-- ============================================================

SELECT

    s.operating_system,

    COUNT(
        DISTINCT s.session_id
    ) AS sessions,

    COUNT(
        DISTINCT e.user_id
    ) FILTER (
        WHERE e.event_name = 'purchase'
    ) AS purchasing_users,

    ROUND(
        100.0 *
        COUNT(
            DISTINCT e.user_id
        ) FILTER (
            WHERE e.event_name = 'purchase'
        )
        /
        NULLIF(
            COUNT(
                DISTINCT s.user_id
            ),
            0
        ),
        2
    ) AS user_conversion_percent

FROM sessions s

LEFT JOIN events e
    ON s.session_id = e.session_id

GROUP BY s.operating_system

ORDER BY user_conversion_percent DESC;


-- ============================================================
-- 8. ACQUISITION CHANNEL PERFORMANCE
-- ============================================================

WITH channel_users AS (

    SELECT

        u.user_id,

        u.acquisition_channel

    FROM users u

),

channel_orders AS (

    SELECT

        u.acquisition_channel,

        COUNT(
            DISTINCT o.order_id
        ) AS orders,

        COUNT(
            DISTINCT o.user_id
        ) AS purchasing_users,

        SUM(
            o.total_amount
        ) AS revenue

    FROM users u

    JOIN orders o
        ON u.user_id = o.user_id

    WHERE o.order_status NOT IN ('cancelled')

    GROUP BY u.acquisition_channel

)

SELECT

    cu.acquisition_channel,

    COUNT(
        DISTINCT cu.user_id
    ) AS total_users,

    COALESCE(
        co.purchasing_users,
        0
    ) AS purchasing_users,

    COALESCE(
        co.orders,
        0
    ) AS orders,

    ROUND(
        COALESCE(
            co.revenue,
            0
        ),
        2
    ) AS revenue,

    ROUND(
        100.0 *
        COALESCE(
            co.purchasing_users,
            0
        )
        /
        NULLIF(
            COUNT(
                DISTINCT cu.user_id
            ),
            0
        ),
        2
    ) AS conversion_percent,

    ROUND(
        COALESCE(
            co.revenue,
            0
        )
        /
        NULLIF(
            COUNT(
                DISTINCT cu.user_id
            ),
            0
        ),
        2
    ) AS revenue_per_acquired_user

FROM channel_users cu

LEFT JOIN channel_orders co
    ON cu.acquisition_channel
       = co.acquisition_channel

GROUP BY

    cu.acquisition_channel,

    co.purchasing_users,

    co.orders,

    co.revenue

ORDER BY revenue DESC;


-- ============================================================
-- 9. CATEGORY PERFORMANCE
-- ============================================================

SELECT

    c.category_name,

    COUNT(
        DISTINCT oi.order_id
    ) AS orders,

    SUM(
        oi.quantity
    ) AS units_sold,

    ROUND(
        SUM(
            (oi.unit_price * oi.quantity)
            - oi.discount
        ),
        2
    ) AS revenue,

    ROUND(
        SUM(
            (
                (oi.unit_price - p.cost)
                * oi.quantity
            )
            - oi.discount
        ),
        2
    ) AS estimated_gross_profit,

    ROUND(
        100.0 *
        SUM(
            (
                (oi.unit_price - p.cost)
                * oi.quantity
            )
            - oi.discount
        )
        /
        NULLIF(
            SUM(
                (oi.unit_price * oi.quantity)
                - oi.discount
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

ORDER BY revenue DESC;


-- ============================================================
-- 10. TOP PRODUCTS
-- ============================================================

SELECT

    p.product_id,

    p.product_name,

    p.brand,

    c.category_name,

    SUM(
        oi.quantity
    ) AS units_sold,

    ROUND(
        SUM(
            (oi.unit_price * oi.quantity)
            - oi.discount
        ),
        2
    ) AS revenue,

    ROUND(
        SUM(
            (
                (oi.unit_price - p.cost)
                * oi.quantity
            )
            - oi.discount
        ),
        2
    ) AS estimated_gross_profit

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
-- 11. PRODUCTS WITH HIGH VIEWS BUT LOW CONVERSION
-- ============================================================

WITH product_views AS (

    SELECT

        product_id,

        COUNT(
            DISTINCT user_id
        ) AS viewers

    FROM events

    WHERE event_name = 'product_view'

      AND product_id IS NOT NULL

    GROUP BY product_id

),

product_purchases AS (

    SELECT

        product_id,

        COUNT(
            DISTINCT o.user_id
        ) AS purchasers,

        SUM(
            oi.quantity
        ) AS units_sold,

        SUM(
            (oi.unit_price * oi.quantity)
            - oi.discount
        ) AS revenue

    FROM order_items oi

    JOIN orders o
        ON oi.order_id = o.order_id

    WHERE o.order_status NOT IN ('cancelled')

    GROUP BY product_id

)

SELECT

    p.product_id,

    p.product_name,

    c.category_name,

    COALESCE(
        pv.viewers,
        0
    ) AS viewers,

    COALESCE(
        pp.purchasers,
        0
    ) AS purchasers,

    ROUND(
        100.0 *
        COALESCE(
            pp.purchasers,
            0
        )
        /
        NULLIF(
            pv.viewers,
            0
        ),
        2
    ) AS view_to_purchase_percent,

    ROUND(
        COALESCE(
            pp.revenue,
            0
        ),
        2
    ) AS revenue

FROM products p

JOIN categories c
    ON p.category_id = c.category_id

JOIN product_views pv
    ON p.product_id = pv.product_id

LEFT JOIN product_purchases pp
    ON p.product_id = pp.product_id

WHERE pv.viewers >= 50

ORDER BY

    view_to_purchase_percent ASC,

    viewers DESC

LIMIT 30;


-- ============================================================
-- 12. PAYMENT METHOD PERFORMANCE
-- ============================================================

SELECT

    payment_method,

    COUNT(*) AS attempts,

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
        NULLIF(
            COUNT(*),
            0
        ),
        2
    ) AS failure_rate_percent

FROM payments

GROUP BY payment_method

ORDER BY failure_rate_percent DESC;


-- ============================================================
-- 13. PAYMENT FAILURE BY DEVICE
-- ============================================================

SELECT

    s.device_type,

    p.payment_status,

    COUNT(*) AS payment_attempts,

    ROUND(
        100.0 *
        COUNT(*)
        /
        SUM(
            COUNT(*)
        ) OVER (
            PARTITION BY s.device_type
        ),
        2
    ) AS percentage_within_device

FROM payments p

JOIN orders o
    ON p.order_id = o.order_id

JOIN users u
    ON o.user_id = u.user_id

JOIN sessions s
    ON u.user_id = s.user_id

GROUP BY

    s.device_type,

    p.payment_status

ORDER BY

    s.device_type,

    payment_attempts DESC;


-- ============================================================
-- 14. RETURN RATE BY CATEGORY
-- ============================================================

WITH sold_items AS (

    SELECT

        p.category_id,

        COUNT(
            DISTINCT oi.order_item_id
        ) AS sold_items

    FROM order_items oi

    JOIN orders o
        ON oi.order_id = o.order_id

    JOIN products p
        ON oi.product_id = p.product_id

    WHERE o.order_status NOT IN ('cancelled')

    GROUP BY p.category_id

),

returned_items AS (

    SELECT

        p.category_id,

        COUNT(
            DISTINCT r.return_id
        ) AS returned_items

    FROM returns r

    JOIN products p
        ON r.product_id = p.product_id

    GROUP BY p.category_id

)

SELECT

    c.category_name,

    COALESCE(
        si.sold_items,
        0
    ) AS sold_items,

    COALESCE(
        ri.returned_items,
        0
    ) AS returned_items,

    ROUND(
        100.0 *
        COALESCE(
            ri.returned_items,
            0
        )
        /
        NULLIF(
            si.sold_items,
            0
        ),
        2
    ) AS return_rate_percent

FROM categories c

LEFT JOIN sold_items si
    ON c.category_id = si.category_id

LEFT JOIN returned_items ri
    ON c.category_id = ri.category_id

ORDER BY return_rate_percent DESC;


-- ============================================================
-- 15. CUSTOMER PURCHASE FREQUENCY
-- ============================================================

WITH customer_orders AS (

    SELECT

        user_id,

        COUNT(*) AS order_count,

        SUM(total_amount) AS revenue

    FROM orders

    WHERE order_status NOT IN ('cancelled')

    GROUP BY user_id

)

SELECT

    CASE

        WHEN order_count = 1
            THEN '1 order'

        WHEN order_count BETWEEN 2 AND 3
            THEN '2-3 orders'

        WHEN order_count BETWEEN 4 AND 6
            THEN '4-6 orders'

        ELSE '7+ orders'

    END AS customer_segment,

    COUNT(*) AS customers,

    ROUND(
        SUM(revenue),
        2
    ) AS revenue,

    ROUND(
        AVG(revenue),
        2
    ) AS average_customer_revenue

FROM customer_orders

GROUP BY customer_segment

ORDER BY

    CASE customer_segment
        WHEN '1 order' THEN 1
        WHEN '2-3 orders' THEN 2
        WHEN '4-6 orders' THEN 3
        WHEN '7+ orders' THEN 4
    END;


-- ============================================================
-- 16. REPEAT PURCHASE RATE
-- ============================================================

WITH customer_orders AS (

    SELECT

        user_id,

        COUNT(*) AS order_count

    FROM orders

    WHERE order_status NOT IN ('cancelled')

    GROUP BY user_id

)

SELECT

    COUNT(*) AS purchasing_customers,

    COUNT(*) FILTER (
        WHERE order_count >= 2
    ) AS repeat_customers,

    ROUND(
        100.0 *
        COUNT(*) FILTER (
            WHERE order_count >= 2
        )
        /
        NULLIF(
            COUNT(*),
            0
        ),
        2
    ) AS repeat_purchase_rate_percent

FROM customer_orders;


-- ============================================================
-- 17. CUSTOMER LIFETIME VALUE DISTRIBUTION
-- ============================================================

WITH customer_value AS (

    SELECT

        user_id,

        COUNT(*) AS orders,

        SUM(total_amount) AS lifetime_value

    FROM orders

    WHERE order_status NOT IN ('cancelled')

    GROUP BY user_id

)

SELECT

    ROUND(
        MIN(lifetime_value),
        2
    ) AS minimum_ltv,

    ROUND(
        PERCENTILE_CONT(0.25)
        WITHIN GROUP (
            ORDER BY lifetime_value
        ),
        2
    ) AS ltv_25th_percentile,

    ROUND(
        PERCENTILE_CONT(0.50)
        WITHIN GROUP (
            ORDER BY lifetime_value
        ),
        2
    ) AS median_ltv,

    ROUND(
        PERCENTILE_CONT(0.75)
        WITHIN GROUP (
            ORDER BY lifetime_value
        ),
        2
    ) AS ltv_75th_percentile,

    ROUND(
        MAX(lifetime_value),
        2
    ) AS maximum_ltv

FROM customer_value;


-- ============================================================
-- 18. HIGH-VALUE CUSTOMER LIST
-- ============================================================

SELECT

    u.user_id,

    u.country,

    u.acquisition_channel,

    COUNT(o.order_id) AS orders,

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
-- 19. MONTHLY CUSTOMER RETENTION
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

cohort_activity AS (

    SELECT

        f.cohort_month,

        c.order_month,

        COUNT(
            DISTINCT c.user_id
        ) AS customers

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

FROM cohort_activity

ORDER BY

    cohort_month,

    order_month;


-- ============================================================
-- 20. COUNTRY PERFORMANCE
-- ============================================================

SELECT

    u.country,

    COUNT(
        DISTINCT o.order_id
    ) AS orders,

    COUNT(
        DISTINCT o.user_id
    ) AS purchasing_customers,

    ROUND(
        SUM(o.total_amount),
        2
    ) AS revenue,

    ROUND(
        AVG(o.total_amount),
        2
    ) AS average_order_value,

    ROUND(
        SUM(o.total_amount)
        /
        NULLIF(
            COUNT(
                DISTINCT o.user_id
            ),
            0
        ),
        2
    ) AS revenue_per_customer

FROM users u

JOIN orders o
    ON u.user_id = o.user_id

WHERE o.order_status NOT IN ('cancelled')

GROUP BY u.country

ORDER BY revenue DESC;


-- ============================================================
-- 21. DAILY ACTIVE USERS
-- ============================================================

SELECT

    event_timestamp::DATE AS activity_date,

    COUNT(
        DISTINCT user_id
    ) AS daily_active_users

FROM events

GROUP BY 1

ORDER BY 1;


-- ============================================================
-- 22. EVENT ENGAGEMENT BY TRAFFIC SOURCE
-- ============================================================

SELECT

    s.traffic_source,

    COUNT(
        DISTINCT s.session_id
    ) AS sessions,

    COUNT(
        DISTINCT e.user_id
    ) FILTER (
        WHERE e.event_name = 'product_view'
    ) AS product_viewers,

    COUNT(
        DISTINCT e.user_id
    ) FILTER (
        WHERE e.event_name = 'add_to_cart'
    ) AS cart_users,

    COUNT(
        DISTINCT e.user_id
    ) FILTER (
        WHERE e.event_name = 'purchase'
    ) AS purchasers

FROM sessions s

LEFT JOIN events e
    ON s.session_id = e.session_id

GROUP BY s.traffic_source

ORDER BY purchasers DESC;


-- ============================================================
-- 23. SESSIONS WITH HIGH ENGAGEMENT BUT NO PURCHASE
-- ============================================================

WITH session_activity AS (

    SELECT

        session_id,

        user_id,

        COUNT(*) AS event_count,

        BOOL_OR(
            event_name = 'product_view'
        ) AS viewed_product,

        BOOL_OR(
            event_name = 'add_to_cart'
        ) AS added_to_cart,

        BOOL_OR(
            event_name = 'checkout_started'
        ) AS checkout_started,

        BOOL_OR(
            event_name = 'purchase'
        ) AS purchased

    FROM events

    GROUP BY

        session_id,

        user_id

)

SELECT

    COUNT(*) AS high_intent_non_converting_sessions

FROM session_activity

WHERE event_count >= 8

  AND viewed_product = TRUE

  AND added_to_cart = TRUE

  AND checkout_started = TRUE

  AND purchased = FALSE;


-- ============================================================
-- 24. CHECKOUT DROP-OFF BY DEVICE
-- ============================================================

WITH checkout_sessions AS (

    SELECT

        s.session_id,

        s.device_type,

        MAX(
            CASE
                WHEN e.event_name = 'checkout_started'
                THEN 1
                ELSE 0
            END
        ) AS checkout_started,

        MAX(
            CASE
                WHEN e.event_name = 'purchase'
                THEN 1
                ELSE 0
            END
        ) AS purchased

    FROM sessions s

    LEFT JOIN events e
        ON s.session_id = e.session_id

    GROUP BY

        s.session_id,

        s.device_type

)

SELECT

    device_type,

    COUNT(*) FILTER (
        WHERE checkout_started = 1
    ) AS checkout_sessions,

    COUNT(*) FILTER (
        WHERE checkout_started = 1
          AND purchased = 1
    ) AS converted_checkouts,

    ROUND(
        100.0 *
        COUNT(*) FILTER (
            WHERE checkout_started = 1
              AND purchased = 1
        )
        /
        NULLIF(
            COUNT(*) FILTER (
                WHERE checkout_started = 1
            ),
            0
        ),
        2
    ) AS checkout_to_purchase_percent

FROM checkout_sessions

GROUP BY device_type

ORDER BY checkout_to_purchase_percent DESC;


-- ============================================================
-- 25. PRODUCT ENGAGEMENT OPPORTUNITY SCORE
-- ============================================================

WITH product_metrics AS (

    SELECT

        p.product_id,

        p.product_name,

        COUNT(
            DISTINCT e.user_id
        ) FILTER (
            WHERE e.event_name = 'product_view'
        ) AS viewers,

        COUNT(
            DISTINCT e.user_id
        ) FILTER (
            WHERE e.event_name = 'add_to_cart'
        ) AS cart_users,

        COUNT(
            DISTINCT o.user_id
        ) AS purchasers

    FROM products p

    LEFT JOIN events e
        ON p.product_id = e.product_id

    LEFT JOIN order_items oi
        ON p.product_id = oi.product_id

    LEFT JOIN orders o
        ON oi.order_id = o.order_id
        AND o.order_status NOT IN ('cancelled')

    GROUP BY

        p.product_id,

        p.product_name

)

SELECT

    product_id,

    product_name,

    viewers,

    cart_users,

    purchasers,

    ROUND(
        100.0 *
        cart_users
        /
        NULLIF(
            viewers,
            0
        ),
        2
    ) AS view_to_cart_percent,

    ROUND(
        100.0 *
        purchasers
        /
        NULLIF(
            viewers,
            0
        ),
        2
    ) AS view_to_purchase_percent

FROM product_metrics

WHERE viewers >= 50

ORDER BY

    view_to_purchase_percent ASC,

    viewers DESC

LIMIT 50;


-- ============================================================
-- END OF PRODUCTPULSE ANALYTICS
-- ============================================================