import os
import random
from datetime import timedelta

import numpy as np
import pandas as pd
from dotenv import load_dotenv
from sqlalchemy import create_engine


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

# We already have 150,000 sessions.
MAX_SESSIONS = 150_000

random.seed(SEED)
np.random.seed(SEED)

engine = create_engine(
    DATABASE_URL,
    pool_pre_ping=True
)


# ============================================================
# EVENT INSERTION HELPER
# ============================================================

def insert_events(df):
    """
    Insert events into PostgreSQL in manageable batches.
    Explicitly converts Pandas / NumPy values to native
    Python values before insertion.
    """

    if df.empty:
        return

    df = df.copy()

    df["session_id"] = (
        df["session_id"]
        .astype(int)
    )

    df["user_id"] = (
        df["user_id"]
        .astype(int)
    )

    df["event_name"] = (
        df["event_name"]
        .astype(str)
    )

    df["product_id"] = df["product_id"].apply(
        lambda x: None
        if pd.isna(x)
        else int(x)
    )

    df["page"] = df["page"].apply(
        lambda x: None
        if pd.isna(x)
        else str(x)
    )

    df.to_sql(
        "events",
        engine,
        if_exists="append",
        index=False,
        method="multi",
        chunksize=2000
    )


# ============================================================
# MAIN EVENT GENERATOR
# ============================================================

def generate_events():

    print("=" * 60)
    print("PRODUCTPULSE BEHAVIORAL EVENT GENERATOR")
    print("=" * 60)

    # ========================================================
    # SAFETY CHECK
    # ========================================================

    existing_events = pd.read_sql(
        "SELECT COUNT(*) AS count FROM events",
        engine
    ).iloc[0]["count"]

    if int(existing_events) > 0:

        raise RuntimeError(
            f"Events table already contains "
            f"{int(existing_events):,} rows. "
            f"Stopping to prevent duplicates."
        )

    # ========================================================
    # LOAD SESSIONS
    # ========================================================

    print("\nLoading sessions...")

    # IMPORTANT:
    # MAX_SESSIONS is controlled by our own code.
    # We don't use LIMIT :limit because PostgreSQL's raw
    # driver does not understand that syntax here.

    sessions = pd.read_sql(
        f"""
        SELECT
            session_id,
            user_id,
            session_start,
            session_end,
            device_type,
            operating_system,
            traffic_source
        FROM sessions
        ORDER BY session_id
        LIMIT {MAX_SESSIONS}
        """,
        engine
    )

    if sessions.empty:

        raise RuntimeError(
            "sessions table is empty."
        )

    print(
        f"Loaded {len(sessions):,} sessions."
    )

    # ========================================================
    # LOAD PRODUCTS
    # ========================================================

    products = pd.read_sql(
        """
        SELECT
            product_id
        FROM products
        ORDER BY product_id
        """,
        engine
    )

    if products.empty:

        raise RuntimeError(
            "products table is empty."
        )

    product_ids = (
        products["product_id"]
        .astype(int)
        .tolist()
    )

    print(
        f"Loaded {len(product_ids):,} products."
    )

    # ========================================================
    # LOAD ORDERS
    # ========================================================

    orders = pd.read_sql(
        """
        SELECT
            order_id,
            user_id,
            order_date
        FROM orders
        WHERE order_status NOT IN ('cancelled')
        """,
        engine
    )

    purchaser_users = set(
        orders["user_id"]
        .astype(int)
        .tolist()
    )

    print(
        f"Loaded {len(orders):,} valid orders."
    )

    # ========================================================
    # GENERATE EVENTS
    # ========================================================

    event_rows = []

    print("\nGenerating behavioral sequences...")

    total_sessions = len(sessions)

    for index, session in sessions.iterrows():

        session_id = int(
            session["session_id"]
        )

        user_id = int(
            session["user_id"]
        )

        session_start = pd.Timestamp(
            session["session_start"]
        )

        session_end = pd.Timestamp(
            session["session_end"]
        )

        session_duration = max(
            30,
            int(
                (
                    session_end
                    - session_start
                ).total_seconds()
            )
        )

        device = str(
            session["device_type"]
        )

        operating_system = str(
            session["operating_system"]
        )

        source = str(
            session["traffic_source"]
        )

        # ====================================================
        # ENGAGEMENT
        # ====================================================

        engagement = random.random()

        # Acquisition-channel effects
        if source == "Organic Search":
            engagement += 0.08

        elif source == "Email":
            engagement += 0.12

        elif source == "Referral":
            engagement += 0.05

        elif source == "Social Media":
            engagement -= 0.05

        # Device effect
        if device == "Mobile":
            engagement -= 0.03

        engagement = max(
            0.05,
            min(1.0, engagement)
        )

        # ====================================================
        # SESSION EVENT COUNT
        # ====================================================

        if engagement < 0.25:

            event_count = random.randint(
                2,
                5
            )

        elif engagement < 0.55:

            event_count = random.randint(
                5,
                9
            )

        elif engagement < 0.80:

            event_count = random.randint(
                8,
                14
            )

        else:

            event_count = random.randint(
                12,
                20
            )

        # ====================================================
        # TIMESTAMP GENERATION
        # ====================================================

        timestamps = []

        for _ in range(event_count):

            offset = random.randint(
                0,
                session_duration
            )

            timestamps.append(
                session_start
                + timedelta(
                    seconds=offset
                )
            )

        timestamps.sort()

        # ====================================================
        # PAGE VIEW
        # ====================================================

        first_timestamp = timestamps[0]

        event_rows.append({
            "session_id": session_id,
            "user_id": user_id,
            "event_timestamp":
                first_timestamp.to_pydatetime(),
            "event_name": "page_view",
            "product_id": None,
            "page": "home",
        })

        # ====================================================
        # FIRST PRODUCT VIEW
        # ====================================================

        viewed_product = random.choice(
            product_ids
        )

        product_timestamp = (
            first_timestamp
            + timedelta(
                seconds=random.randint(
                    3,
                    25
                )
            )
        )

        # Don't allow timestamp to go beyond session end.
        if product_timestamp > session_end:

            product_timestamp = session_end

        event_rows.append({
            "session_id": session_id,
            "user_id": user_id,
            "event_timestamp":
                product_timestamp.to_pydatetime(),
            "event_name": "product_view",
            "product_id": int(
                viewed_product
            ),
            "page": "product",
        })

        # ====================================================
        # SEARCH
        # ====================================================

        search_probability = 0.30

        if source == "Organic Search":
            search_probability = 0.40

        elif source == "Social Media":
            search_probability = 0.22

        if random.random() < search_probability:

            search_timestamp = (
                product_timestamp
                + timedelta(
                    seconds=random.randint(
                        3,
                        20
                    )
                )
            )

            if search_timestamp <= session_end:

                event_rows.append({
                    "session_id": session_id,
                    "user_id": user_id,
                    "event_timestamp":
                        search_timestamp.to_pydatetime(),
                    "event_name": "search",
                    "product_id": None,
                    "page": "search",
                })

                # ------------------------------------------------
                # Search -> Product View
                # ------------------------------------------------

                if random.random() < 0.70:

                    viewed_product = random.choice(
                        product_ids
                    )

                    search_product_timestamp = (
                        search_timestamp
                        + timedelta(
                            seconds=random.randint(
                                3,
                                20
                            )
                        )
                    )

                    if (
                        search_product_timestamp
                        <= session_end
                    ):

                        event_rows.append({
                            "session_id":
                                session_id,
                            "user_id":
                                user_id,
                            "event_timestamp":
                                search_product_timestamp
                                .to_pydatetime(),
                            "event_name":
                                "product_view",
                            "product_id":
                                int(
                                    viewed_product
                                ),
                            "page":
                                "product",
                        })

                        product_timestamp = (
                            search_product_timestamp
                        )

        # ====================================================
        # ADD TO CART
        # ====================================================

        cart_probability = 0.18

        if engagement > 0.70:
            cart_probability = 0.32

        if source == "Email":
            cart_probability += 0.05

        elif source == "Social Media":
            cart_probability -= 0.03

        cart_probability = max(
            0.05,
            min(
                0.60,
                cart_probability
            )
        )

        added_to_cart = (
            random.random()
            < cart_probability
        )

        if added_to_cart:

            cart_timestamp = (
                product_timestamp
                + timedelta(
                    seconds=random.randint(
                        5,
                        60
                    )
                )
            )

            if cart_timestamp <= session_end:

                event_rows.append({
                    "session_id":
                        session_id,
                    "user_id":
                        user_id,
                    "event_timestamp":
                        cart_timestamp
                        .to_pydatetime(),
                    "event_name":
                        "add_to_cart",
                    "product_id":
                        int(
                            viewed_product
                        ),
                    "page":
                        "product",
                })

                # ================================================
                # REMOVE FROM CART
                # ================================================

                if random.random() < 0.12:

                    remove_timestamp = (
                        cart_timestamp
                        + timedelta(
                            seconds=random.randint(
                                5,
                                90
                            )
                        )
                    )

                    if (
                        remove_timestamp
                        <= session_end
                    ):

                        event_rows.append({
                            "session_id":
                                session_id,
                            "user_id":
                                user_id,
                            "event_timestamp":
                                remove_timestamp
                                .to_pydatetime(),
                            "event_name":
                                "remove_from_cart",
                            "product_id":
                                int(
                                    viewed_product
                                ),
                            "page":
                                "cart",
                        })

                    added_to_cart = False

                # ================================================
                # CHECKOUT
                # ================================================

                checkout_probability = 0.55

                if device == "Mobile":
                    checkout_probability = 0.48

                if engagement > 0.75:
                    checkout_probability += 0.10

                if random.random() < checkout_probability:

                    checkout_timestamp = (
                        cart_timestamp
                        + timedelta(
                            seconds=random.randint(
                                10,
                                120
                            )
                        )
                    )

                    if (
                        checkout_timestamp
                        <= session_end
                    ):

                        event_rows.append({
                            "session_id":
                                session_id,
                            "user_id":
                                user_id,
                            "event_timestamp":
                                checkout_timestamp
                                .to_pydatetime(),
                            "event_name":
                                "checkout_started",
                            "product_id":
                                int(
                                    viewed_product
                                ),
                            "page":
                                "checkout",
                        })

                        # ========================================
                        # PAYMENT ATTEMPT
                        # ========================================

                        payment_probability = 0.72

                        # Deliberate mobile friction
                        if device == "Mobile":
                            payment_probability = 0.64

                        if operating_system == "Android":
                            payment_probability -= 0.03

                        if source == "Email":
                            payment_probability += 0.05

                        payment_probability = max(
                            0.30,
                            min(
                                0.95,
                                payment_probability
                            )
                        )

                        if (
                            random.random()
                            < payment_probability
                        ):

                            payment_timestamp = (
                                checkout_timestamp
                                + timedelta(
                                    seconds=random.randint(
                                        5,
                                        60
                                    )
                                )
                            )

                            if (
                                payment_timestamp
                                <= session_end
                            ):

                                event_rows.append({
                                    "session_id":
                                        session_id,
                                    "user_id":
                                        user_id,
                                    "event_timestamp":
                                        payment_timestamp
                                        .to_pydatetime(),
                                    "event_name":
                                        "payment_attempt",
                                    "product_id":
                                        int(
                                            viewed_product
                                        ),
                                    "page":
                                        "payment",
                                })

                                # ====================================
                                # PURCHASE
                                # ====================================

                                purchase_probability = 0.76

                                if device == "Mobile":
                                    purchase_probability = 0.69

                                if operating_system == "Android":
                                    purchase_probability -= 0.04

                                # Returning purchasers have stronger
                                # purchase intent.
                                if user_id in purchaser_users:
                                    purchase_probability += 0.08

                                purchase_probability = max(
                                    0.25,
                                    min(
                                        0.95,
                                        purchase_probability
                                    )
                                )

                                if (
                                    random.random()
                                    < purchase_probability
                                ):

                                    purchase_timestamp = (
                                        payment_timestamp
                                        + timedelta(
                                            seconds=random.randint(
                                                2,
                                                30
                                            )
                                        )
                                    )

                                    if (
                                        purchase_timestamp
                                        <= session_end
                                    ):

                                        event_rows.append({
                                            "session_id":
                                                session_id,
                                            "user_id":
                                                user_id,
                                            "event_timestamp":
                                                purchase_timestamp
                                                .to_pydatetime(),
                                            "event_name":
                                                "purchase",
                                            "product_id":
                                                int(
                                                    viewed_product
                                                ),
                                            "page":
                                                "confirmation",
                                        })

        # ====================================================
        # PROGRESS
        # ====================================================

        if (
            (index + 1) % 10_000 == 0
        ):

            print(
                f"Processed "
                f"{index + 1:,} / "
                f"{total_sessions:,} sessions..."
            )

    # ========================================================
    # CREATE DATAFRAME
    # ========================================================

    events_df = pd.DataFrame(
        event_rows
    )

    print(
        f"\nGenerated "
        f"{len(events_df):,} events."
    )

    if events_df.empty:

        raise RuntimeError(
            "No events were generated."
        )

    # ========================================================
    # SORT
    # ========================================================

    events_df = events_df.sort_values(
        [
            "session_id",
            "event_timestamp"
        ]
    ).reset_index(drop=True)

    # ========================================================
    # INSERT
    # ========================================================

    print(
        "\nInserting events into PostgreSQL..."
    )

    insert_events(
        events_df
    )

    # ========================================================
    # VALIDATION
    # ========================================================

    print(
        "\n" + "=" * 60
    )

    print(
        "EVENT VALIDATION"
    )

    print(
        "=" * 60
    )

    event_count = pd.read_sql(
        """
        SELECT COUNT(*) AS count
        FROM events
        """,
        engine
    ).iloc[0]["count"]

    print(
        f"Events in database: "
        f"{int(event_count):,}"
    )

    if int(event_count) != len(events_df):

        raise RuntimeError(
            "Event count mismatch."
        )

    # ========================================================
    # INVALID SESSION CHECK
    # ========================================================

    invalid_sessions = pd.read_sql(
        """
        SELECT COUNT(*) AS count
        FROM events e
        LEFT JOIN sessions s
            ON e.session_id = s.session_id
        WHERE s.session_id IS NULL
        """,
        engine
    ).iloc[0]["count"]

    # ========================================================
    # INVALID USER CHECK
    # ========================================================

    invalid_users = pd.read_sql(
        """
        SELECT COUNT(*) AS count
        FROM events e
        LEFT JOIN users u
            ON e.user_id = u.user_id
        WHERE u.user_id IS NULL
        """,
        engine
    ).iloc[0]["count"]

    # ========================================================
    # INVALID PRODUCT CHECK
    # ========================================================

    invalid_products = pd.read_sql(
        """
        SELECT COUNT(*) AS count
        FROM events e
        LEFT JOIN products p
            ON e.product_id = p.product_id
        WHERE e.product_id IS NOT NULL
          AND p.product_id IS NULL
        """,
        engine
    ).iloc[0]["count"]

    print(
        f"Invalid sessions: "
        f"{int(invalid_sessions):,}"
    )

    print(
        f"Invalid users: "
        f"{int(invalid_users):,}"
    )

    print(
        f"Invalid products: "
        f"{int(invalid_products):,}"
    )

    if (
        int(invalid_sessions) > 0
        or int(invalid_users) > 0
        or int(invalid_products) > 0
    ):

        raise RuntimeError(
            "Event integrity validation failed."
        )

    # ========================================================
    # EVENT DISTRIBUTION
    # ========================================================

    distribution = pd.read_sql(
        """
        SELECT
            event_name,
            COUNT(*) AS events
        FROM events
        GROUP BY event_name
        ORDER BY events DESC
        """,
        engine
    )

    print(
        "\nEvent distribution:"
    )

    print(
        distribution.to_string(
            index=False
        )
    )

    # ========================================================
    # FINAL MESSAGE
    # ========================================================

    print(
        "\n" + "=" * 60
    )

    print(
        "EVENT GENERATION COMPLETE"
    )

    print(
        "=" * 60
    )


# ============================================================
# ENTRY POINT
# ============================================================

if __name__ == "__main__":

    generate_events()