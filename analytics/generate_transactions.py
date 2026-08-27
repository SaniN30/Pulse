import os
import random
from decimal import Decimal

import numpy as np
import pandas as pd
from dotenv import load_dotenv
from sqlalchemy import create_engine, text


# ============================================================
# CONFIG
# ============================================================

load_dotenv()

DATABASE_URL = os.getenv("DATABASE_URL")

if not DATABASE_URL:
    raise RuntimeError(
        "DATABASE_URL is not configured. "
        "Create a .env file in the project root."
    )

SEED = 42
NUM_ORDERS = 50_000

random.seed(SEED)
np.random.seed(SEED)

engine = create_engine(
    DATABASE_URL,
    pool_pre_ping=True
)


# ============================================================
# HELPERS
# ============================================================

def money(value):
    return Decimal(str(round(float(value), 2)))


# ============================================================
# MAIN
# ============================================================

def generate_transactions():

    print("=" * 60)
    print("PRODUCTPULSE TRANSACTION GENERATOR")
    print("=" * 60)

    # --------------------------------------------------------
    # Safety check
    # --------------------------------------------------------

    existing_orders = pd.read_sql(
        "SELECT COUNT(*) AS count FROM orders",
        engine
    ).iloc[0]["count"]

    if int(existing_orders) > 0:
        raise RuntimeError(
            f"Orders table already contains "
            f"{int(existing_orders):,} rows. "
            f"Stopping to prevent duplicates."
        )

    # --------------------------------------------------------
    # Load existing dimensions
    # --------------------------------------------------------

    print("\nLoading users and products...")

    users = pd.read_sql(
        """
        SELECT user_id
        FROM users
        ORDER BY user_id
        """,
        engine
    )

    products = pd.read_sql(
        """
        SELECT
            product_id,
            price,
            cost
        FROM products
        ORDER BY product_id
        """,
        engine
    )

    if users.empty:
        raise RuntimeError("users table is empty.")

    if products.empty:
        raise RuntimeError("products table is empty.")

    print(f"Loaded {len(users):,} users.")
    print(f"Loaded {len(products):,} products.")

    # --------------------------------------------------------
    # Configuration
    # --------------------------------------------------------

    payment_methods = [
        "UPI",
        "Credit Card",
        "Debit Card",
        "Net Banking",
        "Wallet",
        "COD",
    ]

    payment_probabilities = [
        0.38,
        0.25,
        0.15,
        0.08,
        0.07,
        0.07,
    ]

    order_statuses = [
        "delivered",
        "shipped",
        "confirmed",
        "cancelled",
        "returned",
    ]

    order_status_probabilities = [
        0.68,
        0.10,
        0.08,
        0.08,
        0.06,
    ]

    return_reasons = [
        "Damaged",
        "Wrong Product",
        "Poor Quality",
        "Changed Mind",
        "Size Issue",
        "Not as Expected",
    ]

    start_date = pd.Timestamp("2025-01-01")
    end_date = pd.Timestamp("2026-06-30")

    total_seconds = int(
        (end_date - start_date).total_seconds()
    )

    # ========================================================
    # GENERATE ORDERS
    # ========================================================

    print("\nGenerating orders...")

    order_rows = []
    item_rows = []

    for order_number in range(NUM_ORDERS):

        user_id = int(
            users.iloc[
                random.randrange(len(users))
            ]["user_id"]
        )

        random_seconds = random.randint(
            0,
            total_seconds
        )

        order_date = (
            start_date
            + pd.Timedelta(seconds=random_seconds)
        ).to_pydatetime()

        item_count = random.randint(1, 4)

        selected_products = products.sample(
            n=item_count,
            replace=False,
            random_state=SEED + order_number
        )

        subtotal = Decimal("0")

        temporary_items = []

        for _, product in selected_products.iterrows():

            product_id = int(product["product_id"])

            quantity = int(
                random.randint(1, 3)
            )

            unit_price = money(
                product["price"]
            )

            item_discount = money(
                float(unit_price)
                * random.uniform(0, 0.15)
            )

            line_total = (
                unit_price * quantity
            ) - item_discount

            subtotal += line_total

            temporary_items.append({
                "product_id": product_id,
                "quantity": quantity,
                "unit_price": unit_price,
                "discount": item_discount,
            })

        order_discount = money(
            float(subtotal)
            * random.uniform(0, 0.10)
        )

        shipping_cost = Decimal(
            str(
                random.choice([
                    0,
                    0,
                    49,
                    79,
                    99,
                ])
            )
        )

        taxable_amount = (
            subtotal - order_discount
        )

        tax = (
            taxable_amount
            * Decimal("0.18")
        ).quantize(
            Decimal("0.01")
        )

        total_amount = (
            taxable_amount
            + shipping_cost
            + tax
        )

        # IMPORTANT:
        # Convert numpy scalar to native Python str.
        order_status = str(
            np.random.choice(
                order_statuses,
                p=order_status_probabilities
            )
        )

        order_rows.append({
            "order_number": int(order_number),
            "user_id": int(user_id),
            "order_date": order_date,
            "order_status": order_status,
            "subtotal": subtotal,
            "discount": order_discount,
            "shipping_cost": shipping_cost,
            "tax": tax,
            "total_amount": total_amount,
        })

        for item in temporary_items:

            item_rows.append({
                "order_number": int(order_number),
                "product_id": int(item["product_id"]),
                "quantity": int(item["quantity"]),
                "unit_price": item["unit_price"],
                "discount": item["discount"],
            })

    orders_df = pd.DataFrame(order_rows)
    items_df = pd.DataFrame(item_rows)

    print(
        f"Generated {len(orders_df):,} orders."
    )

    print(
        f"Generated {len(items_df):,} order items."
    )

    # ========================================================
    # CREATE STAGING TABLE
    # ========================================================

    print("\nCreating order staging table...")

    with engine.begin() as connection:

        connection.execute(
            text(
                "DROP TABLE IF EXISTS orders_staging"
            )
        )

        connection.execute(
            text(
                """
                CREATE TABLE orders_staging (
                    order_number INTEGER NOT NULL,
                    user_id BIGINT NOT NULL,
                    order_date TIMESTAMP NOT NULL,
                    order_status VARCHAR(30) NOT NULL,
                    subtotal NUMERIC(12,2) NOT NULL,
                    discount NUMERIC(12,2) NOT NULL,
                    shipping_cost NUMERIC(12,2) NOT NULL,
                    tax NUMERIC(12,2) NOT NULL,
                    total_amount NUMERIC(12,2) NOT NULL
                )
                """
            )
        )

    # ========================================================
    # INSERT STAGING DATA
    # ========================================================

    print("Inserting orders into staging table...")

    # Explicitly convert data types to native Python objects.
    staging_df = orders_df.copy()

    staging_df["order_number"] = (
        staging_df["order_number"]
        .astype(int)
    )

    staging_df["user_id"] = (
        staging_df["user_id"]
        .astype(int)
    )

    staging_df["order_status"] = (
        staging_df["order_status"]
        .astype(str)
    )

    staging_df["subtotal"] = (
        staging_df["subtotal"]
        .apply(lambda x: float(x))
    )

    staging_df["discount"] = (
        staging_df["discount"]
        .apply(lambda x: float(x))
    )

    staging_df["shipping_cost"] = (
        staging_df["shipping_cost"]
        .apply(lambda x: float(x))
    )

    staging_df["tax"] = (
        staging_df["tax"]
        .apply(lambda x: float(x))
    )

    staging_df["total_amount"] = (
        staging_df["total_amount"]
        .apply(lambda x: float(x))
    )

    staging_df.to_sql(
        "orders_staging",
        engine,
        if_exists="append",
        index=False,
        method="multi",
        chunksize=1000
    )

    print("Staging insert successful.")

    # ========================================================
    # MOVE ORDERS INTO REAL TABLE
    # ========================================================

    print("Moving orders into orders table...")

    with engine.begin() as connection:

        connection.execute(
            text(
                """
                INSERT INTO orders (
                    user_id,
                    order_date,
                    order_status,
                    subtotal,
                    discount,
                    shipping_cost,
                    tax,
                    total_amount
                )
                SELECT
                    user_id,
                    order_date,
                    order_status,
                    subtotal,
                    discount,
                    shipping_cost,
                    tax,
                    total_amount
                FROM orders_staging
                ORDER BY order_number
                """
            )
        )

    # ========================================================
    # VERIFY ORDERS
    # ========================================================

    order_count = pd.read_sql(
        "SELECT COUNT(*) AS count FROM orders",
        engine
    ).iloc[0]["count"]

    print(
        f"Orders now in database: {int(order_count):,}"
    )

    if int(order_count) != NUM_ORDERS:
        raise RuntimeError(
            "Order count verification failed."
        )

    # ========================================================
    # MAP ORDER IDs
    # ========================================================

    db_orders = pd.read_sql(
        """
        SELECT
            order_id,
            user_id,
            order_date,
            order_status,
            total_amount
        FROM orders
        ORDER BY order_id
        """,
        engine
    )

    order_mapping = pd.DataFrame({
        "order_number": orders_df[
            "order_number"
        ].astype(int).values,

        "order_id": db_orders[
            "order_id"
        ].astype(int).values,
    })

    items_df = items_df.merge(
        order_mapping,
        on="order_number",
        how="left"
    )

    if items_df["order_id"].isna().any():
        raise RuntimeError(
            "Order ID mapping failed."
        )

    # ========================================================
    # INSERT ORDER ITEMS
    # ========================================================

    print("\nInserting order items...")

    items_to_insert = items_df[
        [
            "order_id",
            "product_id",
            "quantity",
            "unit_price",
            "discount",
        ]
    ].copy()

    items_to_insert["order_id"] = (
        items_to_insert["order_id"]
        .astype(int)
    )

    items_to_insert["product_id"] = (
        items_to_insert["product_id"]
        .astype(int)
    )

    items_to_insert["quantity"] = (
        items_to_insert["quantity"]
        .astype(int)
    )

    items_to_insert["unit_price"] = (
        items_to_insert["unit_price"]
        .apply(lambda x: float(x))
    )

    items_to_insert["discount"] = (
        items_to_insert["discount"]
        .apply(lambda x: float(x))
    )

    items_to_insert.to_sql(
        "order_items",
        engine,
        if_exists="append",
        index=False,
        method="multi",
        chunksize=1000
    )

    print(
        f"Inserted {len(items_to_insert):,} order items."
    )

    # ========================================================
    # PAYMENTS
    # ========================================================

    print("\nGenerating payments...")

    payment_rows = []

    for _, order in db_orders.iterrows():

        payment_method = str(
            np.random.choice(
                payment_methods,
                p=payment_probabilities
            )
        )

        if payment_method == "UPI":
            failure_probability = 0.075
        elif payment_method == "Credit Card":
            failure_probability = 0.035
        elif payment_method == "Debit Card":
            failure_probability = 0.045
        elif payment_method == "Net Banking":
            failure_probability = 0.055
        elif payment_method == "Wallet":
            failure_probability = 0.04
        else:
            failure_probability = 0.02

        payment_status = (
            "failed"
            if random.random() < failure_probability
            else "success"
        )

        payment_rows.append({
            "order_id": int(order["order_id"]),
            "payment_method": payment_method,
            "payment_status": payment_status,
            "payment_amount": float(
                order["total_amount"]
            ),
            "payment_date": order["order_date"],
        })

    payments_df = pd.DataFrame(
        payment_rows
    )

    payments_df.to_sql(
        "payments",
        engine,
        if_exists="append",
        index=False,
        method="multi",
        chunksize=1000
    )

    print(
        f"Inserted {len(payments_df):,} payments."
    )

    # ========================================================
    # RETURNS
    # ========================================================

    print("\nGenerating returns...")

    returned_orders = db_orders[
        db_orders["order_status"] == "returned"
    ]

    return_rows = []

    if not returned_orders.empty:

        returned_order_ids = set(
            returned_orders[
                "order_id"
            ].astype(int)
        )

        returned_items = items_to_insert[
            items_to_insert["order_id"].isin(
                returned_order_ids
            )
        ]

        for _, item in returned_items.iterrows():

            matching_order = returned_orders[
                returned_orders["order_id"]
                == item["order_id"]
            ].iloc[0]

            return_date = (
                matching_order["order_date"]
                + pd.Timedelta(
                    days=random.randint(3, 30)
                )
            )

            refund_amount = (
                float(item["unit_price"])
                * int(item["quantity"])
            )

            return_rows.append({
                "order_id": int(
                    item["order_id"]
                ),
                "product_id": int(
                    item["product_id"]
                ),
                "return_date": return_date,
                "return_reason": str(
                    random.choice(
                        return_reasons
                    )
                ),
                "refund_amount": round(
                    refund_amount,
                    2
                ),
            })

    if return_rows:

        returns_df = pd.DataFrame(
            return_rows
        )

        returns_df.to_sql(
            "returns",
            engine,
            if_exists="append",
            index=False,
            method="multi",
            chunksize=1000
        )

        print(
            f"Inserted {len(returns_df):,} returns."
        )

    else:

        print("No returned orders found.")

    # ========================================================
    # CLEAN STAGING TABLE
    # ========================================================

    with engine.begin() as connection:

        connection.execute(
            text(
                "DROP TABLE IF EXISTS orders_staging"
            )
        )

    # ========================================================
    # FINAL VALIDATION
    # ========================================================

    print("\n" + "=" * 60)
    print("FINAL VALIDATION")
    print("=" * 60)

    validation = pd.read_sql(
        """
        SELECT 'orders' AS table_name, COUNT(*) AS row_count
        FROM orders

        UNION ALL

        SELECT 'order_items', COUNT(*)
        FROM order_items

        UNION ALL

        SELECT 'payments', COUNT(*)
        FROM payments

        UNION ALL

        SELECT 'returns', COUNT(*)
        FROM returns

        ORDER BY table_name
        """,
        engine
    )

    print(validation.to_string(index=False))

    print("\n" + "=" * 60)
    print("TRANSACTION DATA GENERATION COMPLETE")
    print("=" * 60)


if __name__ == "__main__":
    generate_transactions()