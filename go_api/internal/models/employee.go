package models

type Employee struct {
	ID        int `json:"id" gorm:"primaryKey;autoIncrement"`
	UserID    int `json:"user_id" gorm:"column:user_id;uniqueIndex"`
	UnitID    int `json:"unit_id" gorm:"column:unit_id"`
}