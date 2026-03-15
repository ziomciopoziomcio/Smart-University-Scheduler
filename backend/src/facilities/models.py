"""
Tables:
- Campuses
- Buildings
- Rooms
- Faculties
- Faculty_buildings
"""

from sqlalchemy import String, Table, Column, Integer, ForeignKey, UniqueConstraint
from sqlalchemy.orm import Mapped, mapped_column, relationship
from ..database.base import Base

faculty_buildings = Table(
    "faculty_buildings",
    Base.metadata,
    Column("faculty_id", Integer, ForeignKey("faculties.id"), primary_key=True),
    Column("building_id", Integer, ForeignKey("buildings.id"), primary_key=True),
)


class Campus(Base):
    """Campus model representing a campus in the system."""

    __tablename__ = "campuses"

    id: Mapped[int] = mapped_column(primary_key=True, autoincrement=True)
    campus_name: Mapped[str | None] = mapped_column(String(255), unique=True)
    campus_short: Mapped[str] = mapped_column(String(255), unique=True)

    buildings: Mapped[list["Building"]] = relationship(back_populates="campus")


class Building(Base):
    """Building model representing a building in the system."""

    __tablename__ = "buildings"

    id: Mapped[int] = mapped_column(primary_key=True, autoincrement=True)
    building_name: Mapped[str | None] = mapped_column(String(255), unique=True)
    building_number: Mapped[str] = mapped_column(String(255), unique=True)
    campus_id: Mapped[int] = mapped_column(Integer, ForeignKey("campuses.id"))
    campus: Mapped["Campus"] = relationship(back_populates="buildings")
    rooms: Mapped[list["Room"]] = relationship(back_populates="building")

    faculties: Mapped[list["Faculty"]] = relationship(
        secondary=faculty_buildings, back_populates="buildings"
    )


class Room(Base):
    """Room model representing a room in the system."""

    __tablename__ = "rooms"

    id: Mapped[int] = mapped_column(primary_key=True, autoincrement=True)
    room_name: Mapped[str] = mapped_column(String(255))
    projector_availability: Mapped[bool] = mapped_column(default=False)
    pc_amount: Mapped[int] = mapped_column(server_default="0")
    room_capacity: Mapped[int] = mapped_column(server_default="15")

    building_id: Mapped[int] = mapped_column(Integer, ForeignKey("buildings.id"))
    unit_id: Mapped[int | None] = mapped_column(Integer, ForeignKey("units.id"))
    faculty_id: Mapped[int] = mapped_column(Integer, ForeignKey("faculties.id"))

    building: Mapped["Building"] = relationship(back_populates="rooms")

    __table_args__ = (
        UniqueConstraint("room_name", "building_id", name="uq_room_building"),
    )


class Faculty(Base):
    """Faculty model representing a faculty in the system."""

    __tablename__ = "faculties"

    id: Mapped[int] = mapped_column(primary_key=True, autoincrement=True)
    faculty_name: Mapped[str] = mapped_column(String(255), unique=True)
    faculty_short: Mapped[str] = mapped_column(String(255), unique=True)

    buildings: Mapped[list["Building"]] = relationship(
        secondary=faculty_buildings, back_populates="faculties"
    )
