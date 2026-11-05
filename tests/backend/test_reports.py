"""
Tests for reports API endpoints.
"""
import pytest


class TestReportsEndpoints:
    """Test suite for /api/reports/* endpoints."""

    def test_get_quarterly_reports(self, client):
        """Test getting quarterly reports without filters."""
        response = client.get("/api/reports/quarterly")
        assert response.status_code == 200

        data = response.json()
        assert isinstance(data, list)
        assert [q["quarter"] for q in data] == ["Q1-2025", "Q2-2025", "Q3-2025", "Q4-2025"]

        for q in data:
            for field in ["quarter", "total_orders", "total_revenue",
                          "delivered_orders", "avg_order_value", "fulfillment_rate"]:
                assert field in q
            assert 0 <= q["fulfillment_rate"] <= 100

    def test_quarterly_totals_match_orders(self, client):
        """Test that quarterly totals sum to the full order set."""
        orders = client.get("/api/orders").json()
        quarters = client.get("/api/reports/quarterly").json()

        assert sum(q["total_orders"] for q in quarters) == len(orders)
        assert abs(sum(q["total_revenue"] for q in quarters)
                   - sum(o["total_value"] for o in orders)) < 0.05

    def test_quarterly_calculations(self, client):
        """Test avg order value and fulfillment rate calculations."""
        for q in client.get("/api/reports/quarterly").json():
            assert abs(q["avg_order_value"] - q["total_revenue"] / q["total_orders"]) < 0.01
            expected_rate = q["delivered_orders"] / q["total_orders"] * 100
            assert abs(q["fulfillment_rate"] - expected_rate) < 0.1

    def test_get_monthly_trends(self, client):
        """Test getting monthly trends without filters."""
        response = client.get("/api/reports/monthly-trends")
        assert response.status_code == 200

        data = response.json()
        assert len(data) == 12
        months = [m["month"] for m in data]
        assert months == sorted(months)
        for m in data:
            assert isinstance(m["order_count"], int)
            assert isinstance(m["revenue"], (int, float))
            # Revenue is rounded to cents server-side
            assert round(m["revenue"], 2) == m["revenue"]

    @pytest.mark.parametrize("query,field,expected", [
        ("warehouse=Tokyo", "warehouse", "tokyo"),
        ("category=Sensors", "category", "sensors"),
        ("status=Delivered", "status", "delivered"),
    ])
    def test_reports_match_filtered_orders(self, client, query, field, expected):
        """Test that report filters mirror /api/orders filters."""
        orders = client.get(f"/api/orders?{query}").json()
        assert all(o[field].lower() == expected for o in orders)

        monthly = client.get(f"/api/reports/monthly-trends?{query}").json()
        quarterly = client.get(f"/api/reports/quarterly?{query}").json()

        assert sum(m["order_count"] for m in monthly) == len(orders)
        assert sum(q["total_orders"] for q in quarterly) == len(orders)

    def test_reports_by_month(self, client):
        """Test filtering reports by a single month."""
        monthly = client.get("/api/reports/monthly-trends?month=2025-03").json()
        assert [m["month"] for m in monthly] == ["2025-03"]

        quarterly = client.get("/api/reports/quarterly?month=2025-03").json()
        assert [q["quarter"] for q in quarterly] == ["Q1-2025"]
        assert quarterly[0]["total_orders"] == monthly[0]["order_count"]

    def test_reports_by_quarter(self, client):
        """Test filtering reports by quarter."""
        monthly = client.get("/api/reports/monthly-trends?month=Q2-2025").json()
        assert {m["month"] for m in monthly} <= {"2025-04", "2025-05", "2025-06"}

        quarterly = client.get("/api/reports/quarterly?month=Q2-2025").json()
        assert [q["quarter"] for q in quarterly] == ["Q2-2025"]

    def test_reports_all_filter_is_noop(self, client):
        """Test that 'all' values behave like no filter."""
        base = client.get("/api/reports/quarterly").json()
        all_ = client.get(
            "/api/reports/quarterly?warehouse=all&category=all&status=all&month=all"
        ).json()
        assert base == all_

    def test_reports_empty_result(self, client):
        """Test that non-matching filters return empty lists."""
        for path in ["/api/reports/quarterly", "/api/reports/monthly-trends"]:
            response = client.get(f"{path}?warehouse=Nowhere")
            assert response.status_code == 200
            assert response.json() == []
