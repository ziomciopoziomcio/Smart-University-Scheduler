"""
Tables:
- Campus
- Buildings
- Rooms
- Faculty
- Faculty_buildings
"""

from sqlalchemy import String
from sqlalchemy.orm import Mapped, mapped_column
from src.database.base import Base


class Campus(Base):
    """Campus model representing a campus in the system."""
    __tablename__ = 'campus'
    id: Mapped[int] = mapped_column(primary_key=True, autoincrement=True)
    campus_name: Mapped[str | None] = mapped_column(String(255), unique=True)
    campus_short: Mapped[str] = mapped_column(String(255), unique=True)


class Buildings(Base):
    """Buildings model representing a building in the system."""
    __tablename__ = 'buildings'

    id: Mapped[int] = mapped_column(primary_key=True, autoincrement=True)
    building_name: Mapped[str | None] = mapped_column(String(255), unique=True)
    building_number: Mapped[str] = mapped_column(String(255), unique=True)


class Rooms(Base):
    """Rooms model representing a room in the system."""
    __tablename__ = 'rooms'

    id: Mapped[int] = mapped_column(primary_key=True, autoincrement=True)
    room_name: Mapped[str] = mapped_column(String(255), unique=True)
    projector_availability: Mapped[bool] = mapped_column(default=False)
    PC_amount: Mapped[int] = mapped_column(default=0)
    room_capacity: Mapped[int] = mapped_column(default=15)


class Faculty(Base):
    """Faculty model representing a faculty in the system."""
    __tablename__ = 'faculty'

    id: Mapped[int] = mapped_column(primary_key=True, autoincrement=True)
    faculty_name: Mapped[str] = mapped_column(String(255), unique=True)
    faculty_short: Mapped[str] = mapped_column(String(255), unique=True)
