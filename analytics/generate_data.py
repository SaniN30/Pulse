import os
import random
from datetime import datetime, timedelta
from decimal import Decimal

import numpy as np
import pandas as pd
from dotenv import load_dotenv
from faker import Faker
from sqlalchemy import create_engine, text


# ============================================================
# CONFIGURATION
# ============================================================

load_dotenv()

DATABASE_URL = os.getenv("DATABASE_URL")

if not DATABASE_URL:
    raise RuntimeError(
        "DATABASE_URL is not configured. "
        "Create a .env file in the project root."
    )

SEED = 42

NUM_USERS = 50000
NUM_PRODUCTS = 5000
NUM_SESSIONS = 150000
NUM_ORDERS = 50000

START_DATE = datetime(2025, 1, 1)
END_DATE = datetime(2026, 6, 30)

fake = Faker("en_IN")
Faker.seed(SEED)
random.seed(SEED)
np.random.seed(SEED)


# ============================================================
# DATABASE
# ============================================================

engine = create_engine(DATABASE_URL)


# ============================================================
# HELPERS
# ============================================================

def random_date(start, end):
    delta = end - start
    return start + timedelta(
        seconds=random.randint(0, int(delta.total_seconds()))
    )


def weighted_choice(options, probabilities):
    return np.random.choice(options, p=probabilities)


# ============================================================
# CATEGORIES
# ============================================================

def generate_categories():
    categories = [
        "Electronics",
        "Fashion",
        "Home",
        "Beauty",
        "Sports",
        "Books",
        "Grocery",
    ]

    df = pd.DataFrame({
        "category_name": categories
    })

    df.to_sql(
        "categories",
        engine,
        if_exists="append",
        index=False,
        method="multi"
    )

    print(f"Inserted {len(df):,} categories")


# ============================================================
# USERS
# ============================================================

def generate_users():
    channels = [
        "Organic Search",
        "Paid Search",
        "Social Media",
        "Email",
        "Referral",
        "Direct",
    ]

    channel_probs = [
        0.28,
        0.18,
        0.20,
        0.10,
        0.09,
        0.15,
    ]

    age_groups = [
        "18-24",
        "25-34",
        "35-44",
        "45-54",
        "55+",
    ]

    countries = [
        "India",
        "United States",
        "United Kingdom",
        "UAE",
        "Singapore",
    ]

    rows = []

    for _ in range(NUM_USERS):
        signup = random_date(
            START_DATE,
            END_DATE - timedelta(days=30)
        )

        rows.append({
            "signup_date": signup.date(),
            "country": weighted_choice(
                countries,
                [0.72, 0.10, 0.07, 0.06, 0.05]
            ),
            "city": fake.city(),
            "age_group": weighted_choice(
                age_groups,
                [0.18, 0.38, 0.24, 0.14, 0.06]
            ),
            "gender": weighted_choice(
                ["Male", "Female", "Other"],
                [0.48, 0.48, 0.04]
            ),
            "acquisition_channel": weighted_choice(
                channels,
                channel_probs
            ),
        })

    df = pd.DataFrame(rows)

    df.to_sql(
        "users",
        engine,
        if_exists="append",
        index=False,
        method="multi",
        chunksize=5000
    )

    print(f"Inserted {len(df):,} users")


# ============================================================
# PRODUCTS
# ============================================================

def generate_products():
    categories = pd.read_sql(
        "SELECT category_id, category_name FROM categories",
        engine
    )

    category_names = categories["category_name"].tolist()

    brands = [
        "Nova",
        "Apex",
        "UrbanX",
        "Prime",
        "Vertex",
        "Zenith",
        "Pulse",
        "Orbit",
        "Nexus",
        "Vibe",
    ]

    rows = []

    for i in range(NUM_PRODUCTS):
        category = random.choice(category_names)

        category_ranges = {
            "Electronics": (1000, 100000),
            "Fashion": (300, 15000),
            "Home": (500, 30000),
            "Beauty": (200, 8000),
            "Sports": (500, 25000),
            "Books": (150, 3000),
            "Grocery": (50, 5000),
        }

        low, high = category_ranges[category]

        price = round(
            random.uniform(low, high),
            2
        )

        margin = random.uniform(0.12, 0.45)

        cost = round(
            price * (1 - margin),
            2
        )

        rows.append({
            "category_id": int(
                categories.loc[
                    categories["category_name"] == category,
                    "category_id"
                ].iloc[0]
            ),
            "product_name": f"{brand if (brand := random.choice(brands)) else 'Brand'} {fake.word().title()} {i+1}",
            "brand": brand,
            "price": price,
            "cost": cost,
            "rating": round(
                np.clip(
                    np.random.normal(4.0, 0.6),
                    1,
                    5
                ),
                2
            ),
        })

    df = pd.DataFrame(rows)

    df.to_sql(
        "products",
        engine,
        if_exists="append",
        index=False,
        method="multi",
        chunksize=5000
    )

    print(f"Inserted {len(df):,} products")


# ============================================================
# SESSIONS
# ============================================================

def generate_sessions():
    users = pd.read_sql(
        "SELECT user_id FROM users",
        engine
    )

    devices = [
        "Mobile",
        "Desktop",
        "Tablet",
    ]

    operating_systems = [
        "Android",
        "iOS",
        "Windows",
        "macOS",
        "Linux",
    ]

    traffic_sources = [
        "Organic Search",
        "Paid Search",
        "Social Media",
        "Email",
        "Referral",
        "Direct",
    ]

    rows = []

    for _ in range(NUM_SESSIONS):
        user_id = int(
            users.sample(1).iloc[0]["user_id"]
        )

        start = random_date(
            START_DATE,
            END_DATE
        )

        duration = random.randint(30, 3600)

        device = weighted_choice(
            devices,
            [0.58, 0.37, 0.05]
        )

        if device == "Mobile":
            os = weighted_choice(
                ["Android", "iOS"],
                [0.65, 0.35]
            )
        elif device == "Desktop":
            os = weighted_choice(
                ["Windows", "macOS", "Linux"],
                [0.72, 0.23, 0.05]
            )
        else:
            os = weighted_choice(
                ["Android", "iOS"],
                [0.55, 0.45]
            )

        source = weighted_choice(
            traffic_sources,
            [0.28, 0.18, 0.20, 0.10, 0.09, 0.15]
        )

        rows.append({
            "user_id": user_id,
            "session_start": start,
            "session_end": start + timedelta(seconds=duration),
            "device_type": device,
            "operating_system": os,
            "traffic_source": source,
        })

    df = pd.DataFrame(rows)

    df.to_sql(
        "sessions",
        engine,
        if_exists="append",
        index=False,
        method="multi",
        chunksize=5000
    )

    print(f"Inserted {len(df):,} sessions")


# ============================================================
# ORDERS + ITEMS + PAYMENTS
# ============================================================

def generate_orders():
    users = pd.read_sql(
        "SELECT user_id FROM users",
        engine
    )

    products = pd.read_sql(
        "SELECT product_id, price, cost FROM products",
        engine
    )

    payment_methods = [
        "UPI",
        "Credit Card",
        "Debit Card",
        "Net Banking",
        "Wallet",
        "COD",
    ]

    order_rows = []
    item_rows = []
    payment_rows = []

    for order_number in range(NUM_ORDERS):

        user_id = int(
            users.sample(1).iloc[0]["user_id"]
        )

        order_date = random_date(
            START_DATE,
            END_DATE
        )

        item_count = random.randint(1, 4)

        subtotal = Decimal("0")

        selected_products = products.sample(
            item_count,
            replace=False
        )

        for _, product in selected_products.iterrows():

            quantity = random.randint(1, 3)

            unit_price = Decimal(
                str(round(float(product["price"]), 2))
            )

            discount = Decimal(
                str(round(
                    float(unit_price) *
                    random.uniform(0, 0.20),
                    2
                ))
            )

            subtotal += (
                unit_price * quantity
            ) - discount

            item_rows.append({
                "order_number": order_number,
                "product_id": int(product["product_id"]),
                "quantity": quantity,
                "unit_price": unit_price,
                "discount": discount,
            })

        discount_total = Decimal(
            str(round(
                float(subtotal) *
                random.uniform(0, 0.10),
                2
            ))
        )

        shipping = Decimal(
            str(random.choice([0, 0, 49, 79, 99]))
        )

        tax = (
            subtotal -
            discount_total
        ) * Decimal("0.18")

        total = (
            subtotal -
            discount_total +
            shipping +
            tax
        )

        status = weighted_choice(
            [
                "delivered",
                "shipped",
                "confirmed",
                "cancelled",
                "returned",
            ],
            [0.68, 0.10, 0.08, 0.08, 0.06]
        )

        order_rows.append({
            "order_number": order_number,
            "user_id": user_id,
            "order_date": order_date,
            "order_status": status,
            "subtotal": subtotal,
            "discount": discount_total,
            "shipping_cost": shipping,
            "tax": tax,
            "total_amount": total,
        })

    orders_df = pd.DataFrame(order_rows)

    orders_df.to_sql(
        "orders",
        engine,
        if_exists="append",
        index=False,
        method="multi",
        chunksize=5000
    )

    # Retrieve generated order IDs
    db_orders = pd.read_sql(
        """
        SELECT order_id, user_id, order_date, total_amount
        FROM orders
        ORDER BY order_id
        """,
        engine
    )

    item_df = pd.DataFrame(item_rows)

    item_df = item_df.merge(
        db_orders.reset_index(drop=True)
        .reset_index()
        .rename(columns={"index": "order_number"}),
        on="order_number"
    )

    item_df = item_df[
        [
            "order_id",
            "product_id",
            "quantity",
            "unit_price",
            "discount",
        ]
    ]

    item_df.to_sql(
        "order_items",
        engine,
        if_exists="append",
        index=False,
        method="multi",
        chunksize=5000
    )

    for _, order in db_orders.iterrows():

        method = random.choice(
            payment_methods
        )

        # Deliberately create payment friction.
        failure_probability = 0.04

        if method == "UPI":
            failure_probability = 0.07

        if method == "Credit Card":
            failure_probability = 0.03

        payment_status = (
            "failed"
            if random.random() < failure_probability
            else "success"
        )

        payment_rows.append({
            "order_id": int(order["order_id"]),
            "payment_method": method,
            "payment_status": payment_status,
            "payment_amount": order["total_amount"],
            "payment_date": order["order_date"],
        })

    payment_df = pd.DataFrame(payment_rows)

    payment_df.to_sql(
        "payments",
        engine,
        if_exists="append",
        index=False,
        method="multi",
        chunksize=5000
    )

    print(f"Inserted {len(db_orders):,} orders")
    print(f"Inserted {len(item_df):,} order items")
    print(f"Inserted {len(payment_df):,} payments")


# ============================================================
# RETURNS
# ============================================================

def generate_returns():
    orders = pd.read_sql(
        """
        SELECT
            oi.order_id,
            oi.product_id,
            oi.quantity,
            oi.unit_price,
            o.order_date,
            o.order_status
        FROM order_items oi
        JOIN orders o
            ON oi.order_id = o.order_id
        WHERE o.order_status = 'returned'
        """,
        engine
    )

    reasons = [
        "Damaged",
        "Wrong Product",
        "Poor Quality",
        "Changed Mind",
        "Size Issue",
        "Not as Expected",
    ]

    rows = []

    for _, order in orders.iterrows():

        refund = float(
            order["unit_price"]
        ) * int(order["quantity"])

        rows.append({
            "order_id": int(order["order_id"]),
            "product_id": int(order["product_id"]),
            "return_date": order["order_date"] + timedelta(
                days=random.randint(3, 30)
            ),
            "return_reason": random.choice(reasons),
            "refund_amount": round(refund, 2),
        })

    if rows:
        df = pd.DataFrame(rows)

        df.to_sql(
            "returns",
            engine,
            if_exists="append",
            index=False,
            method="multi",
            chunksize=5000
        )

        print(f"Inserted {len(df):,} returns")


# ============================================================
# EXPERIMENTS
# ============================================================

def generate_experiments():
    experiments = pd.DataFrame([
        {
            "experiment_name": "Checkout Redesign",
            "start_date": "2026-04-01",
            "end_date": "2026-05-15",
            "primary_metric": "purchase_conversion",
            "status": "completed",
        },
        {
            "experiment_name": "Product Recommendation Widget",
            "start_date": "2026-05-20",
            "end_date": "2026-06-30",
            "primary_metric": "add_to_cart_rate",
            "status": "completed",
        },
    ])

    experiments.to_sql(
        "experiments",
        engine,
        if_exists="append",
        index=False,
        method="multi"
    )

    users = pd.read_sql(
        "SELECT user_id FROM users",
        engine
    )

    experiment_ids = pd.read_sql(
        "SELECT experiment_id FROM experiments",
        engine
    )

    rows = []

    for experiment_id in experiment_ids[
        "experiment_id"
    ]:

        sampled_users = users.sample(
            min(15000, len(users)),
            random_state=SEED + int(experiment_id)
        )

        for _, user in sampled_users.iterrows():

            variant = random.choice([
                "control",
                "variant_a"
            ])

            rows.append({
                "experiment_id": int(experiment_id),
                "user_id": int(user["user_id"]),
                "variant": variant,
                "assigned_at": random_date(
                    START_DATE,
                    END_DATE
                ),
            })

    df = pd.DataFrame(rows)

    df.to_sql(
        "experiment_assignments",
        engine,
        if_exists="append",
        index=False,
        method="multi",
        chunksize=5000
    )

    print(
        f"Inserted {len(df):,} experiment assignments"
    )


# ============================================================
# MAIN
# ============================================================

def main():

    print("=" * 60)
    print("PRODUCTPULSE DATA GENERATION")
    print("=" * 60)

    generate_categories()
    generate_users()
    generate_products()
    generate_sessions()
    generate_orders()
    generate_returns()
    generate_experiments()

    print("=" * 60)
    print("DATA GENERATION COMPLETE")
    print("=" * 60)


if __name__ == "__main__":
    main()