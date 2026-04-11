import pytest
from pydantic import ValidationError

from src.facilities.schemas import RoomCreate, RoomUpdate

# ==========================================
# TESTS: Room (Numeric ranges and constraints)
# ==========================================


def test_room_capacity_limits():
    """Tests if room_capacity is strictly greater than 0."""
    base_data = {
        "room_name": "101A",
        "building_id": 1,
        "faculty_id": 1,
    }

    # Invalid: 0 capacity
    with pytest.raises(ValidationError) as exc_zero:
        RoomCreate(**base_data, room_capacity=0)
    assert "Input should be greater than 0" in str(exc_zero.value)

    # Invalid: Negative capacity
    with pytest.raises(ValidationError) as exc_neg:
        RoomCreate(**base_data, room_capacity=-5)
    assert "Input should be greater than 0" in str(exc_neg.value)

    # Valid capacity
    valid_room = RoomCreate(**base_data, room_capacity=30)
    assert valid_room.room_capacity == 30


def test_room_pc_amount_limits():
    """Tests if pc_amount is greater than or equal to 0 (no negative values)."""
    base_data = {
        "room_name": "Lab 1",
        "building_id": 1,
        "faculty_id": 1,
        "room_capacity": 15,
    }

    # Invalid: Negative PCs
    with pytest.raises(ValidationError) as exc_neg:
        RoomCreate(**base_data, pc_amount=-1)
    assert "Input should be greater than or equal to 0" in str(exc_neg.value)

    # Valid: 0 PCs is completely fine
    valid_no_pc = RoomCreate(**base_data, pc_amount=0)
    assert valid_no_pc.pc_amount == 0

    # Valid: positive amount
    valid_with_pc = RoomCreate(**base_data, pc_amount=15)
    assert valid_with_pc.pc_amount == 15


def test_room_update_limits():
    """Tests the exact same constraints applied to the RoomUpdate schema."""

    # Invalid capacity update
    with pytest.raises(ValidationError) as exc_cap:
        RoomUpdate(room_capacity=0)
    assert "Input should be greater than 0" in str(exc_cap.value)

    # Invalid PC amount update
    with pytest.raises(ValidationError) as exc_pc:
        RoomUpdate(pc_amount=-10)
    assert "Input should be greater than or equal to 0" in str(exc_pc.value)

    # Valid update
    valid_update = RoomUpdate(room_capacity=20, pc_amount=10)
    assert valid_update.room_capacity == 20
    assert valid_update.pc_amount == 10
