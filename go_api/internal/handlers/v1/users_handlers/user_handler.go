package users_handlers

import (
	"context"
	"log"
	"net/http"
	"os"
	"strconv"
	"time"

	"github.com/gin-gonic/gin"
	"google.golang.org/grpc"
	"google.golang.org/grpc/codes"
	"google.golang.org/grpc/credentials/insecure"
	"google.golang.org/grpc/status"

	"go_api/internal/app"
	"go_api/internal/dto/users_dto"
	"go_api/internal/models/users_models"
	pb "go_api/internal/rpc/user"
)

// GetUsers godoc
// @Summary Get users
// @Description Returns paginated list of users with roles
// @Tags users
// @Produce json
// @Param limit query int false "Limit" default(10)
// @Param offset query int false "Offset" default(0)
// @Success 200 {object} users_models.PaginatedUsersResponse
// @Failure 500 {object} map[string]string
// @Router /api/v1/users [get]
func GetUsers(app *app.App) gin.HandlerFunc {
	return func(c *gin.Context) {
		limitStr := c.DefaultQuery("limit", "10")
		offsetStr := c.DefaultQuery("offset", "0")

		limit, err := strconv.Atoi(limitStr)
		if err != nil || limit <= 0 {
			limit = 10
		}
		offset, err := strconv.Atoi(offsetStr)
		if err != nil || offset < 0 {
			offset = 0
		}

		users, total, err := app.Users.GetUsers(limit, offset)
		if err != nil {
			c.JSON(http.StatusInternalServerError, gin.H{"error": err.Error()})
			return
		}

		var mappedItems []users_models.UserResponse
		for _, u := range users {
			var roleNames []string
			for _, r := range u.Roles {
				roleNames = append(roleNames, r.RoleName)
			}

			mappedItems = append(mappedItems, users_models.UserResponse{
				ID:               u.ID,
				Email:            u.Email,
				PhoneNumber:      u.PhoneNumber,
				Name:             u.Name,
				Surname:          u.Surname,
				Degree:           u.Degree,
				CreatedAt:        u.CreatedAt,
				Roles:            roleNames,
				TwoFactorEnabled: u.TwoFactorEnabled,
			})
		}

		c.JSON(http.StatusOK, users_models.PaginatedUsersResponse{
			Total:  total,
			Limit:  limit,
			Offset: offset,
			Items:  mappedItems,
		})
	}
}

// GetUserProxy godoc
// @Summary Get user by ID (proxy)
// @Description Fetches user details from internal gRPC service and enriches with DB data
// @Tags users
// @Produce json
// @Param id path int true "User ID"
// @Success 200 {object} users_models.UserDetailResponse
// @Failure 400 {object} map[string]string
// @Failure 404 {object} map[string]string
// @Failure 500 {object} map[string]string
// @Router /api/v1/users/{id} [get]
func GetUserProxy(app *app.App) gin.HandlerFunc {
	return func(c *gin.Context) {

		userId, err := strconv.ParseInt(c.Param("id"), 10, 32)
		if err != nil {
			c.JSON(http.StatusBadRequest, gin.H{"error": "Invalid user ID format"})
			return
		}

		grpcTarget := os.Getenv("BACKEND_GRPC_TARGET")
		if grpcTarget == "" {
			c.JSON(http.StatusInternalServerError, gin.H{"error": "Configuration error: BACKEND_GRPC_TARGET environment variable is not set"})
			return
		}

		conn, err := grpc.NewClient(grpcTarget, grpc.WithTransportCredentials(insecure.NewCredentials()))
		if err != nil {
			c.JSON(http.StatusInternalServerError, gin.H{"error": "Failed to connect to internal RPC service: " + err.Error()})
			return
		}
		defer func(conn *grpc.ClientConn) {
			if err := conn.Close(); err != nil {
				log.Printf("error: %v", err)
			}
		}(conn)

		ctx, cancel := context.WithTimeout(context.Background(), 5*time.Second)
		defer cancel()

		resp, err := pb.NewUserRpcServiceClient(conn).
			GetUserRPC(ctx, &pb.UserGetRequest{Id: int32(userId)})

		if err != nil {
			handleGrpcError(c, err)
			return
		}

		c.JSON(http.StatusOK, buildUserDetailResponse(app, userId, resp))
	}
}

func handleGrpcError(c *gin.Context, err error) {
	st, ok := status.FromError(err)
	if ok && st.Code() == codes.NotFound {
		c.JSON(http.StatusNotFound, gin.H{"error": st.Message()})
	} else {
		c.JSON(http.StatusInternalServerError, gin.H{"error": "Internal RPC error: " + err.Error()})
	}
}

func buildUserDetailResponse(app *app.App, userId int64, resp *pb.UserGetResponse) users_models.UserDetailResponse {
    dbUser, err := app.Users.GetUserByID(userId)

    var roleNames []string
    var createdAt time.Time
    var twoFactorEnabled bool

    if err == nil && dbUser != nil {
       createdAt = dbUser.CreatedAt
       twoFactorEnabled = dbUser.TwoFactorEnabled
       for _, r := range dbUser.Roles {
          roleNames = append(roleNames, r.RoleName)
       }
    } else if err != nil {
       log.Printf("Warning: details for user %d found in gRPC but missing in local DB: %v", userId, err)
    }

    userDetail := users_models.UserDetailResponse{
       ID:               int(resp.Id),
       Email:            resp.Email,
       PhoneNumber:      getOptionalString(resp.PhoneNumber),
       Name:             resp.Name,
       Surname:          resp.Surname,
       Degree:           getOptionalString(resp.Degree),
       CreatedAt:        createdAt,       
       TwoFactorEnabled: twoFactorEnabled,
       Roles:            roleNames,
    }

    if student := resp.GetStudent(); student != nil {
       userDetail.Student = map[string]interface{}{
          "id":               student.Id,
          "study_program_id": student.StudyProgramId,
          "major_id":         student.MajorId,
       }
    } else if employee := resp.GetEmployee(); employee != nil {
       userDetail.Employee = map[string]interface{}{
          "id":         employee.Id,
          "faculty_id": employee.FacultyId,
          "unit_id":    employee.UnitId,
       }
    }

    return userDetail
}

func getOptionalString(val string) *string {
	if val == "" {
		return nil
	}
	return &val
}

// CreateUserProxy godoc
// @Summary Create user (proxy)
// @Description Creates a user via internal gRPC service
// @Tags users
// @Accept json
// @Produce json
// @Param request body users_dto.CreateUserRequest true "User data"
// @Success 201 {object} map[string]interface{}
// @Failure 400 {object} map[string]string
// @Failure 500 {object} map[string]string
// @Router /api/v1/users [post]
func CreateUserProxy() gin.HandlerFunc {
	return func(c *gin.Context) {

		grpcTarget := os.Getenv("BACKEND_GRPC_TARGET")
		if grpcTarget == "" {
			c.JSON(http.StatusInternalServerError, gin.H{"error": "Configuration error: BACKEND_GRPC_TARGET environment variable is not set"})
			return
		}

		conn, err := grpc.NewClient(grpcTarget, grpc.WithTransportCredentials(insecure.NewCredentials()))
		if err != nil {
			c.JSON(http.StatusInternalServerError, gin.H{"error": "Failed to connect to internal RPC service: " + err.Error()})
			return
		}
		defer func(conn *grpc.ClientConn) {
			if err := conn.Close(); err != nil {
				log.Printf("error: %v", err)
			}
		}(conn)

		var reqBody users_dto.CreateUserRequest
		if err := c.ShouldBindJSON(&reqBody); err != nil {
			c.JSON(http.StatusBadRequest, gin.H{"error": err.Error()})
			return
		}

		ctx, cancel := context.WithTimeout(context.Background(), 5*time.Second)
		defer cancel()

		resp, err := pb.NewUserRpcServiceClient(conn).
			CreateUserRPC(ctx, buildGrpcCreateRequest(&reqBody))

		if err != nil {
			st, ok := status.FromError(err)
			if ok {
				c.JSON(http.StatusBadRequest, gin.H{"error": st.Message()})
			} else {
				c.JSON(http.StatusInternalServerError, gin.H{"error": "Internal RPC error: " + err.Error()})
			}
			return
		}

		c.JSON(http.StatusCreated, gin.H{
			"id":     resp.Id,
			"email":  resp.Email,
			"status": resp.Status,
		})
	}
}

func buildGrpcCreateRequest(reqBody *users_dto.CreateUserRequest) *pb.UserCreateRequest {
	grpcReq := &pb.UserCreateRequest{
		Email:                     reqBody.Email,
		Name:                      reqBody.Name,
		Surname:                   reqBody.Surname,
		PhoneNumber:               reqBody.PhoneNumber,
		Degree:                    reqBody.Degree,
		SendLoginCredentialsEmail: reqBody.SendLoginCredentialsEmail,
	}

	if reqBody.Student != nil {
		grpcReq.Profile = &pb.UserCreateRequest_Student{
			Student: &pb.StudentProfile{
				StudyProgramId: reqBody.Student.StudyProgramId,
				MajorId:        reqBody.Student.MajorId,
			},
		}
	} else if reqBody.Employee != nil {
		grpcReq.Profile = &pb.UserCreateRequest_Employee{
			Employee: &pb.EmployeeProfile{
				FacultyId: reqBody.Employee.FacultyId,
				UnitId:    reqBody.Employee.UnitId,
			},
		}
	}

	return grpcReq
}

// DeleteUserProxy godoc
// @Summary Delete user (proxy)
// @Description Deletes a user via internal gRPC service
// @Tags users
// @Produce json
// @Param id path int true "User ID"
// @Success 200 {object} map[string]interface{}
// @Failure 400 {object} map[string]string
// @Failure 500 {object} map[string]string
// @Router /api/v1/users/{id} [delete]
func DeleteUserProxy() gin.HandlerFunc {
	return func(c *gin.Context) {

		idParam := c.Param("id")
		userId, err := strconv.ParseInt(idParam, 10, 32)
		if err != nil {
			c.JSON(http.StatusBadRequest, gin.H{"error": "Invalid user ID format"})
			return
		}

		grpcTarget := os.Getenv("BACKEND_GRPC_TARGET")
		if grpcTarget == "" {
			c.JSON(http.StatusInternalServerError, gin.H{"error": "Configuration error: BACKEND_GRPC_TARGET environment variable is not set"})
			return
		}

		conn, err := grpc.NewClient(grpcTarget, grpc.WithTransportCredentials(insecure.NewCredentials()))
		if err != nil {
			c.JSON(http.StatusInternalServerError, gin.H{"error": "Failed to connect to internal RPC service: " + err.Error()})
			return
		}
		defer func(conn *grpc.ClientConn) {
			if err := conn.Close(); err != nil {
				log.Printf("error: %v", err)
			}
		}(conn)

		client := pb.NewUserRpcServiceClient(conn)

		ctx, cancel := context.WithTimeout(context.Background(), 5*time.Second)
		defer cancel()

		resp, err := client.DeleteUserRPC(ctx, &pb.UserDeleteRequest{Id: int32(userId)})
		if err != nil {
			st, ok := status.FromError(err)
			if ok {
				c.JSON(http.StatusBadRequest, gin.H{"error": st.Message()})
			} else {
				c.JSON(http.StatusInternalServerError, gin.H{"error": err.Error()})
			}
			return
		}

		c.JSON(http.StatusOK, gin.H{
			"success": resp.Success,
			"message": resp.Message,
		})
	}
}
