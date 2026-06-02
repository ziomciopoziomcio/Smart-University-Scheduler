package models

type Employee struct {
	ID        int `gorm:"primaryKey;autoIncrement"`
	UserID    int `gorm:"column:user_id;uniqueIndex"`
	UnitID    int `gorm:"column:unit_id"`
}