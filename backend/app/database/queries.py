# ============================================================
# PRODUCTPULSE DATABASE QUERIES
# ============================================================
#
# Read-only analytical SQL used by the ProductPulse services.
#
# Architecture:
#
# API Route
#     ↓
# Service
#     ↓
# Query
#     ↓
# PostgreSQL
#
# ============================================================


# ============================================================
# OVERVIEW
# ============================================================

OVERVIEW_QUERY = """
    SELECT

        COUNT(
            DISTINCT o.order_id
        ) AS total_orders,

        COUNT(
            DISTINCT o.user_id
        ) AS purchasing_customers,

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
            100.0
            *
            COUNT(DISTINCT o.user_id)
            /
            NULLIF(
                (
                    SELECT COUNT(*)
                    FROM users
                ),
                0
            ),
            2
        ) AS customer_purchase_rate

    FROM orders o

    WHERE o.order_status NOT IN ('cancelled')
"""


# ============================================================
# REVENUE TREND
# ============================================================

REVENUE_QUERY = """
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

    ORDER BY 1
"""


# ============================================================
# CONVERSION FUNNEL
# ============================================================

FUNNEL_QUERY = """
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
            100.0
            *
            product_viewers
            /
            NULLIF(visitors, 0),
            2
        ) AS view_rate_percent,

        ROUND(
            100.0
            *
            cart_users
            /
            NULLIF(product_viewers, 0),
            2
        ) AS add_to_cart_rate_percent,

        ROUND(
            100.0
            *
            checkout_users
            /
            NULLIF(cart_users, 0),
            2
        ) AS checkout_rate_percent,

        ROUND(
            100.0
            *
            payment_users
            /
            NULLIF(checkout_users, 0),
            2
        ) AS payment_attempt_rate_percent,

        ROUND(
            100.0
            *
            purchasers
            /
            NULLIF(payment_users, 0),
            2
        ) AS purchase_rate_percent

    FROM funnel
"""


# ============================================================
# DEVICE PERFORMANCE
# ============================================================

DEVICE_QUERY = """
    WITH session_metrics AS (

        SELECT

            s.session_id,

            s.device_type,

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

            s.device_type
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
            100.0
            *
            COUNT(*) FILTER (
                WHERE purchased = 1
            )
            /
            NULLIF(COUNT(*), 0),
            2
        ) AS conversion_percent

    FROM session_metrics

    GROUP BY device_type

    ORDER BY conversion_percent DESC
"""


# ============================================================
# PAYMENT PERFORMANCE
# ============================================================

PAYMENT_QUERY = """
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
            100.0
            *
            COUNT(*) FILTER (
                WHERE payment_status = 'failed'
            )
            /
            NULLIF(COUNT(*), 0),
            2
        ) AS failure_rate_percent

    FROM payments

    GROUP BY payment_method

    ORDER BY failure_rate_percent DESC
"""


# ============================================================
# CATEGORY PERFORMANCE
# ============================================================

CATEGORY_QUERY = """
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
            100.0
            *
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

    ORDER BY revenue DESC
"""


# ============================================================
# PRODUCT PERFORMANCE
# ============================================================

PRODUCT_QUERY = """
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

    LIMIT :limit
"""


# ============================================================
# CUSTOMER ACQUISITION
# ============================================================

ACQUISITION_QUERY = """
    SELECT

        u.acquisition_channel,

        COUNT(
            DISTINCT u.user_id
        ) AS users,

        COUNT(
            DISTINCT o.user_id
        ) AS purchasing_users,

        COUNT(
            DISTINCT o.order_id
        ) AS orders,

        ROUND(
            COALESCE(
                SUM(o.total_amount),
                0
            ),
            2
        ) AS revenue,

        ROUND(
            100.0
            *
            COUNT(DISTINCT o.user_id)
            /
            NULLIF(
                COUNT(DISTINCT u.user_id),
                0
            ),
            2
        ) AS conversion_percent,

        ROUND(
            COALESCE(
                SUM(o.total_amount),
                0
            )
            /
            NULLIF(
                COUNT(DISTINCT u.user_id),
                0
            ),
            2
        ) AS revenue_per_user

    FROM users u

    LEFT JOIN orders o
        ON u.user_id = o.user_id

        AND o.order_status NOT IN ('cancelled')

    GROUP BY u.acquisition_channel

    ORDER BY revenue DESC
"""


# ============================================================
# CUSTOMER SEGMENTATION
# ============================================================
#
# IMPORTANT:
# We use an intermediate CTE so that the calculated
# customer_segment alias can safely be used for ordering.
#
# ============================================================

CUSTOMER_SEGMENT_QUERY = """
    WITH customer_orders AS (

        SELECT

            user_id,

            COUNT(*) AS order_count,

            SUM(total_amount) AS revenue

        FROM orders

        WHERE order_status NOT IN ('cancelled')

        GROUP BY user_id
    ),

    segmented_customers AS (

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

            CASE

                WHEN order_count = 1
                    THEN 1

                WHEN order_count BETWEEN 2 AND 3
                    THEN 2

                WHEN order_count BETWEEN 4 AND 6
                    THEN 3

                ELSE 4

            END AS segment_order,

            revenue

        FROM customer_orders
    )

    SELECT

        customer_segment,

        COUNT(*) AS customers,

        ROUND(
            SUM(revenue),
            2
        ) AS revenue,

        ROUND(
            AVG(revenue),
            2
        ) AS average_customer_revenue

    FROM segmented_customers

    GROUP BY

        customer_segment,

        segment_order

    ORDER BY

        segment_order
"""


# ============================================================
# REPEAT PURCHASE RATE
# ============================================================

REPEAT_RATE_QUERY = """
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
            100.0
            *
            COUNT(*) FILTER (
                WHERE order_count >= 2
            )
            /
            NULLIF(COUNT(*), 0),
            2
        ) AS repeat_purchase_rate_percent

    FROM customer_orders
"""


# ============================================================
# UPI RECOVERY EXPERIMENT
# ============================================================

EXPERIMENT_QUERY = """
    SELECT

        experiment_group,

        COUNT(*) AS failed_payments,

        COUNT(*) FILTER (
            WHERE recovered = TRUE
        ) AS recovered_payments,

        ROUND(
            100.0
            *
            COUNT(*) FILTER (
                WHERE recovered = TRUE
            )
            /
            NULLIF(COUNT(*), 0),
            2
        ) AS recovery_rate_percent,

        ROUND(
            SUM(recovered_revenue),
            2
        ) AS recovered_revenue

    FROM experiment_upi_recovery

    GROUP BY experiment_group

    ORDER BY experiment_group
"""