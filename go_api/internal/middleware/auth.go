package middleware

import (
    "context"
    "net/http"
    "os"
    "time"

    "go_api/internal/app"
    pb "go_api/internal/rpc/user"

    "github.com/gin-gonic/gin"
    "google.golang.org/grpc"
    "google.golang.org/grpc/codes"
    "google.golang.org/grpc/credentials/insecure"
    "google.golang.org/grpc/status"
)

func ApiKeyAdminOnly(application *app.App) gin.HandlerFunc {
    return func(c *gin.Context) {
       providedAPIKey := c.GetHeader("X-API-Key")
       if providedAPIKey == "" {
          c.AbortWithStatusJSON(http.StatusUnauthorized, gin.H{"error": "Missing X-API-Key header"})
          return
       }

       grpcTarget := os.Getenv("BACKEND_GRPC_TARGET")
       if grpcTarget == "" {
          c.AbortWithStatusJSON(http.StatusInternalServerError, gin.H{"error": "Configuration error: BACKEND_GRPC_TARGET environment variable is not set"})
          return
       }

       conn, err := grpc.NewClient(grpcTarget, grpc.WithTransportCredentials(insecure.NewCredentials()))
       if err != nil {
          c.AbortWithStatusJSON(http.StatusInternalServerError, gin.H{"error": "Failed to connect to internal RPC service"})
          return
       }
       defer conn.Close()

       client := pb.NewUserRpcServiceClient(conn)

       ctx, cancel := context.WithTimeout(context.Background(), 5*time.Second)
       defer cancel()

       resp, err := client.AuthenticateApiKeyRPC(ctx, &pb.AuthenticateApiKeyRequest{
          ProvidedApiKey: providedAPIKey,
       })

       if err != nil {
          st, ok := status.FromError(err)
          if ok && st.Code() == codes.Unauthenticated {
             c.AbortWithStatusJSON(http.StatusForbidden, gin.H{"error": "Invalid API key or insufficient permissions"})
          } else {
             c.AbortWithStatusJSON(http.StatusInternalServerError, gin.H{"error": "Internal server error during key verification via RPC"})
          }
          return
       }

       if !resp.IsAdmin {
          c.AbortWithStatusJSON(http.StatusForbidden, gin.H{"error": "Required administrator privileges missing"})
          return
       }

       c.Set("admin_id", uint(resp.UserId))
       c.Next()
    }
}