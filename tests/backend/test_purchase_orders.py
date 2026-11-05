"""
Tests for purchase order API endpoints.
"""
from datetime import date

import pytest

import mock_data


@pytest.fixture(autouse=True)
def restore_purchase_orders():
    """POs are stored in an in-memory list; restore it so tests stay independent."""
    snapshot = [dict(po) for po in mock_data.purchase_orders]
    yield
    mock_data.purchase_orders[:] = snapshot


@pytest.fixture
def backlog_item_id(client):
    """ID of a backlog item without a purchase order."""
    items = client.get("/api/backlog").json()
    free = [item for item in items if not item["has_purchase_order"]]
    assert free, "expected at least one backlog item without a purchase order"
    return free[0]["id"]


@pytest.fixture
def po_payload(backlog_item_id):
    """Valid create-PO request body."""
    return {
        "backlog_item_id": backlog_item_id,
        "supplier_name": "Acme Components",
        "quantity": 350,
        "unit_cost": 12.5,
        "expected_delivery_date": "2025-12-15",
        "notes": "Expedite if possible",
    }


class TestPurchaseOrderEndpoints:
    """Test suite for purchase-order endpoints."""

    def test_create_purchase_order(self, client, po_payload):
        """Test creating a purchase order returns 201 and the stored PO."""
        response = client.post("/api/purchase-orders", json=po_payload)
        assert response.status_code == 201

        po = response.json()
        for field in ["id", "backlog_item_id", "supplier_name", "quantity", "unit_cost",
                      "expected_delivery_date", "status", "created_date", "notes"]:
            assert field in po
        assert po["id"].startswith("PO-")
        assert po["backlog_item_id"] == po_payload["backlog_item_id"]
        assert po["quantity"] == 350
        assert abs(po["unit_cost"] - 12.5) < 0.01
        assert po["status"] == "pending"
        assert po["created_date"] == date.today().isoformat()

    def test_get_purchase_order_by_backlog_item(self, client, po_payload):
        """Test fetching a created PO by its backlog item ID."""
        created = client.post("/api/purchase-orders", json=po_payload).json()

        response = client.get(f"/api/purchase-orders/{po_payload['backlog_item_id']}")
        assert response.status_code == 200
        assert response.json() == created

    def test_backlog_flags_item_with_purchase_order(self, client, po_payload):
        """Test that /api/backlog marks the item as having a PO after creation."""
        client.post("/api/purchase-orders", json=po_payload)

        items = client.get("/api/backlog").json()
        item = next(i for i in items if i["id"] == po_payload["backlog_item_id"])
        assert item["has_purchase_order"] is True

    def test_create_duplicate_purchase_order(self, client, po_payload):
        """Test that a second PO for the same backlog item is rejected with 409."""
        assert client.post("/api/purchase-orders", json=po_payload).status_code == 201

        response = client.post("/api/purchase-orders", json=po_payload)
        assert response.status_code == 409
        assert "already exists" in response.json()["detail"].lower()

    def test_create_purchase_order_unknown_backlog_item(self, client, po_payload):
        """Test that creating a PO for a nonexistent backlog item returns 404."""
        po_payload["backlog_item_id"] = "nonexistent-999"
        response = client.post("/api/purchase-orders", json=po_payload)
        assert response.status_code == 404
        assert "not found" in response.json()["detail"].lower()

    def test_get_nonexistent_purchase_order(self, client, backlog_item_id):
        """Test getting a PO for a backlog item that has none."""
        response = client.get(f"/api/purchase-orders/{backlog_item_id}")
        assert response.status_code == 404
        assert "not found" in response.json()["detail"].lower()

    @pytest.mark.parametrize("field,value", [
        ("quantity", 0),
        ("quantity", -5),
        ("unit_cost", -1),
        ("supplier_name", "   "),
        ("expected_delivery_date", "2025-13-40"),
        ("expected_delivery_date", "next week"),
    ])
    def test_create_purchase_order_validation(self, client, po_payload, field, value):
        """Test that invalid input is rejected with 422 and nothing is stored."""
        po_payload[field] = value
        response = client.post("/api/purchase-orders", json=po_payload)
        assert response.status_code == 422

        lookup = client.get(f"/api/purchase-orders/{po_payload['backlog_item_id']}")
        assert lookup.status_code == 404

    def test_purchase_order_ids_are_unique(self, client):
        """Test that POs created for different backlog items get distinct IDs."""
        items = [i for i in client.get("/api/backlog").json() if not i["has_purchase_order"]][:2]
        assert len(items) == 2

        ids = set()
        for item in items:
            response = client.post("/api/purchase-orders", json={
                "backlog_item_id": item["id"],
                "supplier_name": "Acme Components",
                "quantity": 10,
                "unit_cost": 1.0,
                "expected_delivery_date": "2025-12-01",
            })
            assert response.status_code == 201
            ids.add(response.json()["id"])
        assert len(ids) == 2
