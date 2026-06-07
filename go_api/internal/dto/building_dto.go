package dto

type CreateBuildingRequest struct {
	BuildingName   string `json:"building_name" binding:"required"`
	BuildingNumber string `json:"building_number" binding:"required"`
	CampusID       int    `json:"campus_id" binding:"required"`
}
