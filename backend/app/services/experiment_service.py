from math import erf, sqrt

from sqlalchemy import text

from backend.app.database.connection import engine
from backend.app.database.queries import EXPERIMENT_QUERY


def get_experiment():

    with engine.connect() as connection:
        rows = connection.execute(
            text(EXPERIMENT_QUERY)
        ).mappings().all()

    return [dict(row) for row in rows]


def get_experiment_statistics():

    rows = get_experiment()

    if len(rows) != 2:
        raise ValueError(
            "Experiment data must contain "
            "control and treatment groups."
        )

    control = next(
        row
        for row in rows
        if row["experiment_group"] == "control"
    )

    treatment = next(
        row
        for row in rows
        if row["experiment_group"] == "treatment"
    )

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

    absolute_lift = (
        treatment_rate
        - control_rate
    )

    relative_lift = (
        absolute_lift
        / control_rate
    )

    pooled_rate = (
        control_success
        + treatment_success
    ) / (
        control_total
        + treatment_total
    )

    standard_error = sqrt(
        pooled_rate
        * (1 - pooled_rate)
        * (
            1 / control_total
            + 1 / treatment_total
        )
    )

    if standard_error == 0:
        z_statistic = 0.0
        p_value = 1.0

    else:

        z_statistic = (
            treatment_rate
            - control_rate
        ) / standard_error

        normal_cdf = 0.5 * (
            1
            + erf(
                abs(z_statistic)
                / sqrt(2)
            )
        )

        p_value = 2 * (
            1 - normal_cdf
        )

    return {
        "control": {
            "observations": control_total,
            "recoveries": control_success,
            "recovery_rate": round(
                control_rate,
                4,
            ),
        },

        "treatment": {
            "observations": treatment_total,
            "recoveries": treatment_success,
            "recovery_rate": round(
                treatment_rate,
                4,
            ),
        },

        "absolute_lift": round(
            absolute_lift,
            4,
        ),

        "absolute_lift_percentage_points": round(
            absolute_lift * 100,
            2,
        ),

        "relative_lift": round(
            relative_lift,
            4,
        ),

        "relative_lift_percent": round(
            relative_lift * 100,
            2,
        ),

        "z_statistic": round(
            z_statistic,
            4,
        ),

        "p_value": round(
            p_value,
            6,
        ),

        "statistically_significant": (
            p_value < 0.05
        ),

        "recommendation": (
            "SHIP"
            if p_value < 0.05
            else "DO NOT SHIP YET"
        ),
    }