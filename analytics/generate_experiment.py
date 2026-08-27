import os
import random
from math import sqrt

import pandas as pd
from dotenv import load_dotenv
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

random.seed(SEED)

engine = create_engine(
    DATABASE_URL,
    pool_pre_ping=True
)


# ============================================================
# EXPERIMENT DEFINITION
# ============================================================
#
# Experiment:
# UPI Payment Recovery Improvement
#
# CONTROL:
# Existing payment failure experience.
#
# TREATMENT:
# Improved recovery experience:
# - clearer failure message
# - retry payment CTA
# - alternative payment suggestion
# - checkout state preserved
#
# PRIMARY METRIC:
# Payment recovery rate
#
# Definition:
# Users experiencing a failed UPI payment who subsequently
# complete a purchase.
#
# ============================================================


def calculate_proportion_ci(
    successes,
    total,
    confidence=0.95
):
    """
    Approximate 95% confidence interval for a proportion.
    """

    if total == 0:
        return 0.0, 0.0

    p = successes / total

    z = 1.96

    margin = (
        z
        * sqrt(
            p * (1 - p) / total
        )
    )

    return (
        p - margin,
        p + margin
    )


def two_proportion_z_test(
    success_a,
    total_a,
    success_b,
    total_b
):
    """
    Two-proportion z-test.

    Returns:
        z statistic
        approximate two-sided p-value
    """

    if total_a == 0 or total_b == 0:
        return 0.0, 1.0

    p_a = success_a / total_a
    p_b = success_b / total_b

    pooled = (
        success_a + success_b
    ) / (
        total_a + total_b
    )

    standard_error = sqrt(
        pooled
        * (1 - pooled)
        * (
            1 / total_a
            + 1 / total_b
        )
    )

    if standard_error == 0:
        return 0.0, 1.0

    z = (
        p_b - p_a
    ) / standard_error

    # Normal CDF approximation using erf.
    from math import erf

    cdf = 0.5 * (
        1
        + erf(
            abs(z) / sqrt(2)
        )
    )

    p_value = 2 * (
        1 - cdf
    )

    return z, p_value


# ============================================================
# MAIN
# ============================================================

def generate_experiment():

    print("=" * 60)
    print("PRODUCTPULSE EXPERIMENT GENERATOR")
    print("=" * 60)

    # ========================================================
    # CHECK FOR EXISTING EXPERIMENT TABLE
    # ========================================================

    existing_table = pd.read_sql(
        """
        SELECT COUNT(*)
        FROM information_schema.tables
        WHERE table_schema = 'public'
          AND table_name = 'experiment_upi_recovery'
        """,
        engine
    ).iloc[0, 0]

    if int(existing_table) > 0:

        raise RuntimeError(
            "experiment_upi_recovery already exists. "
            "Drop it manually if you want to regenerate."
        )

    # ========================================================
    # IDENTIFY UPI PAYMENT ATTEMPTS
    # ========================================================

    print("\nLoading UPI payment attempts...")

    upi_payments = pd.read_sql(
        """
        SELECT

            p.payment_id,

            p.order_id,

            p.payment_status,

            p.payment_date,

            o.user_id,

            o.total_amount

        FROM payments p

        JOIN orders o
            ON p.order_id = o.order_id

        WHERE p.payment_method = 'UPI'

        ORDER BY p.payment_id
        """,
        engine
    )

    if upi_payments.empty:

        raise RuntimeError(
            "No UPI payments found."
        )

    print(
        f"Loaded "
        f"{len(upi_payments):,} UPI payment attempts."
    )

    # ========================================================
    # FAILED UPI PAYMENTS
    # ========================================================

    failed = upi_payments[
        upi_payments["payment_status"]
        == "failed"
    ].copy()

    print(
        f"Failed UPI attempts: "
        f"{len(failed):,}"
    )

    if failed.empty:

        raise RuntimeError(
            "No failed UPI payments available "
            "for experiment analysis."
        )

    # ========================================================
    # EXPERIMENT ASSIGNMENT
    # ========================================================
    #
    # Random assignment:
    #
    # 50% Control
    # 50% Treatment
    #
    # Assignment is performed at user level so that a user
    # remains in the same experiment group.
    #
    # ========================================================

    print(
        "\nAssigning users to experiment groups..."
    )

    unique_users = (
        failed["user_id"]
        .astype(int)
        .unique()
        .tolist()
    )

    random.shuffle(
        unique_users
    )

    midpoint = len(unique_users) // 2

    control_users = set(
        unique_users[:midpoint]
    )

    treatment_users = set(
        unique_users[midpoint:]
    )

    failed["experiment_group"] = (
        failed["user_id"]
        .apply(
            lambda user_id:
                "control"
                if int(user_id)
                in control_users
                else "treatment"
        )
    )

    # ========================================================
    # SIMULATE RECOVERY OUTCOME
    # ========================================================
    #
    # We need to create a realistic experimental outcome.
    #
    # CONTROL:
    #  ~12% recovery
    #
    # TREATMENT:
    #  ~16% recovery
    #
    # This represents a 4 percentage-point absolute lift.
    #
    # IMPORTANT:
    # These are synthetic experimental outcomes.
    # ========================================================

    print(
        "Simulating payment recovery outcomes..."
    )

    recovery_rows = []

    for _, row in failed.iterrows():

        group = str(
            row["experiment_group"]
        )

        if group == "control":

            recovery_probability = 0.12

        else:

            recovery_probability = 0.16

        recovered = (
            random.random()
            < recovery_probability
        )

        recovery_rows.append({

            "payment_id":
                int(row["payment_id"]),

            "order_id":
                int(row["order_id"]),

            "user_id":
                int(row["user_id"]),

            "experiment_group":
                group,

            "original_payment_status":
                "failed",

            "recovered":
                bool(recovered),

            "recovered_revenue":
                float(
                    row["total_amount"]
                )
                if recovered
                else 0.0,

            "experiment_date":
                row["payment_date"],
        })

    experiment_df = pd.DataFrame(
        recovery_rows
    )

    # ========================================================
    # CREATE TABLE
    # ========================================================

    print(
        "\nCreating experiment table..."
    )

    with engine.begin() as connection:

        connection.execute(
            text(
                """
                CREATE TABLE experiment_upi_recovery (
                    experiment_id BIGSERIAL PRIMARY KEY,

                    payment_id BIGINT NOT NULL,

                    order_id BIGINT NOT NULL,

                    user_id BIGINT NOT NULL,

                    experiment_group VARCHAR(20) NOT NULL,

                    original_payment_status VARCHAR(20) NOT NULL,

                    recovered BOOLEAN NOT NULL,

                    recovered_revenue NUMERIC(14,2) NOT NULL,

                    experiment_date TIMESTAMP
                )
                """
            )
        )

    # ========================================================
    # INSERT EXPERIMENT DATA
    # ========================================================

    print(
        "Inserting experiment observations..."
    )

    experiment_df.to_sql(
        "experiment_upi_recovery",
        engine,
        if_exists="append",
        index=False,
        method="multi",
        chunksize=1000
    )

    print(
        f"Inserted "
        f"{len(experiment_df):,} observations."
    )

    # ========================================================
    # EXPERIMENT SUMMARY
    # ========================================================

    summary = pd.read_sql(
        """
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
                NULLIF(
                    COUNT(*),
                    0
                ),
                2
            ) AS recovery_rate_percent,

            ROUND(
                SUM(
                    recovered_revenue
                ),
                2
            ) AS recovered_revenue

        FROM experiment_upi_recovery

        GROUP BY experiment_group

        ORDER BY experiment_group
        """,
        engine
    )

    print(
        "\n" + "=" * 60
    )

    print(
        "EXPERIMENT SUMMARY"
    )

    print(
        "=" * 60
    )

    print(
        summary.to_string(
            index=False
        )
    )

    # ========================================================
    # EXTRACT GROUP VALUES
    # ========================================================

    control = summary[
        summary["experiment_group"]
        == "control"
    ].iloc[0]

    treatment = summary[
        summary["experiment_group"]
        == "treatment"
    ].iloc[0]

    control_total = int(
        control["failed_payments"]
    )

    treatment_total = int(
        treatment["failed_payments"]
    )

    control_success = int(
        control["recovered_payments"]
    )

    treatment_success = int(
        treatment["recovered_payments"]
    )

    control_rate = (
        control_success
        / control_total
    )

    treatment_rate = (
        treatment_success
        / treatment_total
    )

    # ========================================================
    # ABSOLUTE LIFT
    # ========================================================

    absolute_lift = (
        treatment_rate
        - control_rate
    )

    # ========================================================
    # RELATIVE LIFT
    # ========================================================

    relative_lift = (
        absolute_lift
        / control_rate
    )

    # ========================================================
    # CONFIDENCE INTERVALS
    # ========================================================

    control_ci_low, control_ci_high = (
        calculate_proportion_ci(
            control_success,
            control_total
        )
    )

    treatment_ci_low, treatment_ci_high = (
        calculate_proportion_ci(
            treatment_success,
            treatment_total
        )
    )

    # ========================================================
    # STATISTICAL TEST
    # ========================================================

    z_stat, p_value = (
        two_proportion_z_test(
            control_success,
            control_total,
            treatment_success,
            treatment_total
        )
    )

    # ========================================================
    # STATISTICAL SIGNIFICANCE
    # ========================================================

    statistically_significant = (
        p_value < 0.05
    )

    # ========================================================
    # PRACTICAL SIGNIFICANCE
    # ========================================================

    practical_significance = (
        absolute_lift >= 0.02
    )

    # ========================================================
    # OUTPUT
    # ========================================================

    print(
        "\n" + "=" * 60
    )

    print(
        "STATISTICAL ANALYSIS"
    )

    print(
        "=" * 60
    )

    print(
        f"Control recovery rate: "
        f"{control_rate * 100:.2f}%"
    )

    print(
        f"Treatment recovery rate: "
        f"{treatment_rate * 100:.2f}%"
    )

    print(
        f"Absolute lift: "
        f"{absolute_lift * 100:.2f} percentage points"
    )

    print(
        f"Relative lift: "
        f"{relative_lift * 100:.2f}%"
    )

    print(
        f"Control 95% CI: "
        f"{control_ci_low * 100:.2f}% "
        f"to "
        f"{control_ci_high * 100:.2f}%"
    )

    print(
        f"Treatment 95% CI: "
        f"{treatment_ci_low * 100:.2f}% "
        f"to "
        f"{treatment_ci_high * 100:.2f}%"
    )

    print(
        f"Z-statistic: "
        f"{z_stat:.4f}"
    )

    print(
        f"P-value: "
        f"{p_value:.6f}"
    )

    print(
        f"Statistically significant: "
        f"{'YES' if statistically_significant else 'NO'}"
    )

    print(
        f"Practically significant: "
        f"{'YES' if practical_significance else 'NO'}"
    )

    # ========================================================
    # RECOMMENDATION
    # ========================================================

    print(
        "\n" + "=" * 60
    )

    print(
        "PRODUCT RECOMMENDATION"
    )

    print(
        "=" * 60
    )

    if (
        statistically_significant
        and practical_significance
    ):

        print(
            "RECOMMENDATION: SHIP"
        )

        print(
            "The improved UPI recovery flow "
            "produced a statistically and "
            "practically meaningful improvement."
        )

    elif statistically_significant:

        print(
            "RECOMMENDATION: ITERATE"
        )

        print(
            "The treatment produced a statistically "
            "significant effect, but the practical "
            "impact may be too small."
        )

    else:

        print(
            "RECOMMENDATION: DO NOT SHIP YET"
        )

        print(
            "The observed difference is not "
            "statistically significant."
        )

    print(
        "\n" + "=" * 60
    )

    print(
        "EXPERIMENT COMPLETE"
    )

    print(
        "=" * 60
    )


# ============================================================
# ENTRY POINT
# ============================================================

if __name__ == "__main__":

    generate_experiment()