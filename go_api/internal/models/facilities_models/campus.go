package facilities_models

type Campus struct {
	ID          int        `json:"id" gorm:"primaryKey;autoIncrement"`
	CampusName  string     `json:"campus_name" gorm:"unique"`
	CampusShort string     `json:"campus_short" gorm:"unique"`
	Buildings   []Building `json:"-" gorm:"foreignKey:CampusID"`
}

func (Campus) TableName() string {
	return "campuses"
}

type PaginatedCampusesResponse struct {
	Total  int64    `json:"total"`
	Limit  int      `json:"limit"`
	Offset int      `json:"offset"`
	Items  []Campus `json:"items"`
}
