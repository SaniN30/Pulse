import pytest
from unittest.mock import patch

from fastapi.testclient import TestClient

from backend.app.main import app


client = TestClient(app)


def test_health_check():
    mock_connection = patch(
        "backend.app.main.engine.connect"
    )

    with mock_connection as connect:
        connection = connect.return_value.__enter__.return_value
        connection.execute.return_value.scalar.return_value = "postgres"

        response = client.get("/api/health")

    assert response.status_code == 200

    data = response.json()

    assert data["status"] == "healthy"
    assert data["database"] == "postgres"


def test_overview_endpoint():
    expected = {
        "total_orders": 50000,
        "purchasing_customers": 30019,
        "total_revenue": 341799100.90,
        "average_order_value": 7432.54,
        "revenue_per_customer": 113860.92,
        "purchase_rate": 60.04,
    }

    with patch(
        "backend.app.api.routes.overview.get_overview",
        return_value=expected,
    ):
        response = client.get("/api/overview")

    assert response.status_code == 200
    assert response.json() == expected


def test_revenue_endpoint():
    expected = [
        {
            "month": "2026-06",
            "revenue": 100000.00,
        }
    ]

    with patch(
        "backend.app.api.routes.overview.get_revenue",
        return_value=expected,
    ):
        response = client.get("/api/revenue")

    assert response.status_code == 200
    assert response.json() == expected


def test_funnel_endpoint():
    expected = {
        "sessions": 150000,
        "product_views": 100000,
        "cart_additions": 50000,
    }

    with patch(
        "backend.app.api.routes.funnel.get_funnel",
        return_value=expected,
    ):
        response = client.get("/api/funnel")

    assert response.status_code == 200
    assert response.json() == expected


def test_devices_endpoint():
    expected = [
        {
            "device_type": "desktop",
            "sessions": 1000,
        }
    ]

    with patch(
        "backend.app.api.routes.funnel.get_devices",
        return_value=expected,
    ):
        response = client.get("/api/devices")

    assert response.status_code == 200
    assert response.json() == expected


def test_payments_endpoint():
    expected = [
        {
            "payment_method": "upi",
            "payment_status": "success",
        }
    ]

    with patch(
        "backend.app.api.routes.payments.get_payment_performance",
        return_value=expected,
    ):
        response = client.get("/api/payments")

    assert response.status_code == 200
    assert response.json() == expected


def test_products_limit_validation():
    response = client.get("/api/products?limit=0")

    assert response.status_code == 422


def test_products_limit_upper_bound():
    response = client.get("/api/products?limit=101")

    assert response.status_code == 422


def test_products_limit_valid():
    expected = [
        {
            "product_id": 1,
            "product_name": "Test Product",
        }
    ]

    with patch(
        "backend.app.api.routes.products.get_products",
        return_value=expected,
    ) as mock_get_products:
        response = client.get("/api/products?limit=10")

    assert response.status_code == 200
    assert response.json() == expected

    mock_get_products.assert_called_once_with(10)

def test_categories_endpoint():
    expected = [
        {
            "category_id": 1,
            "category_name": "Electronics",
        }
    ]

    with patch(
        "backend.app.api.routes.products.get_categories",
        return_value=expected,
    ):
        response = client.get("/api/categories")

    assert response.status_code == 200
    assert response.json() == expected


def test_acquisition_endpoint():
    expected = [
        {
            "acquisition_channel": "organic",
            "customers": 100,
        }
    ]

    with patch(
        "backend.app.api.routes.customers.get_acquisition",
        return_value=expected,
    ):
        response = client.get("/api/acquisition")

    assert response.status_code == 200
    assert response.json() == expected


def test_customer_segments_endpoint():
    expected = [
        {
            "segment": "repeat",
            "customers": 100,
        }
    ]

    with patch(
        "backend.app.api.routes.customers.get_customer_segments",
        return_value=expected,
    ):
        response = client.get("/api/customer-segments")

    assert response.status_code == 200
    assert response.json() == expected


def test_repeat_rate_endpoint():
    expected = {
        "repeat_customers": 100,
        "repeat_rate": 25.0,
    }

    with patch(
        "backend.app.api.routes.customers.get_repeat_rate",
        return_value=expected,
    ):
        response = client.get("/api/repeat-rate")

    assert response.status_code == 200
    assert response.json() == expected


def test_experiment_endpoint():
    expected = [
        {
            "experiment_group": "control",
            "failed_payments": 100,
            "recovered_payments": 20,
        },
        {
            "experiment_group": "treatment",
            "failed_payments": 100,
            "recovered_payments": 30,
        },
    ]

    with patch(
        "backend.app.api.routes.experiments.get_experiment",
        return_value=expected,
    ):
        response = client.get("/api/experiment")

    assert response.status_code == 200
    assert response.json() == expected


def test_experiment_statistics():
    experiment_data = [
        {
            "experiment_group": "control",
            "failed_payments": 100,
            "recovered_payments": 20,
        },
        {
            "experiment_group": "treatment",
            "failed_payments": 100,
            "recovered_payments": 30,
        },
    ]

    with patch(
        "backend.app.services.experiment_service.get_experiment",
        return_value=experiment_data,
    ):
        response = client.get("/api/experiment/statistics")

    assert response.status_code == 200

    data = response.json()

    assert data["control"]["observations"] == 100
    assert data["control"]["recoveries"] == 20
    assert data["control"]["recovery_rate"] == 0.2

    assert data["treatment"]["observations"] == 100
    assert data["treatment"]["recoveries"] == 30
    assert data["treatment"]["recovery_rate"] == 0.3

    assert data["absolute_lift"] == 0.1
    assert data["absolute_lift_percentage_points"] == 10.0
    assert data["relative_lift"] == 0.5
    assert data["relative_lift_percent"] == 50.0

    assert "z_statistic" in data
    assert "p_value" in data
    assert "statistically_significant" in data
    assert "recommendation" in data


def test_experiment_statistics_requires_two_groups():
    experiment_data = [
        {
            "experiment_group": "control",
            "failed_payments": 100,
            "recovered_payments": 20,
        }
    ]

    with patch(
        "backend.app.services.experiment_service.get_experiment",
        return_value=experiment_data,
    ):
        with pytest.raises(
            ValueError,
            match="Experiment data must contain control and treatment groups.",
        ):
            client.get("/api/experiment/statistics")