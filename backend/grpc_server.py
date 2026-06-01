import asyncio
import logging
import grpc
import user_pb2
import user_pb2_grpc

from src.database.database import SessionLocal
from src.users.models import Users as UserModel
from src.users.auth import hash_password, secrets
from src.common.email_client import send_email


class UserRpcServiceServicer(user_pb2_grpc.UserRpcServiceServicer):
    async def CreateUserRPC(self, request, context):
        db = SessionLocal()
        try:
            # Check if user already exists
            existing_user = (
                db.query(UserModel).filter(UserModel.email == request.email).first()
            )
            if existing_user:
                context.set_code(grpc.StatusCode.ALREADY_EXISTS)
                context.set_details("User with this email already exists.")
                return user_pb2.UserCreateResponse()

            # Logic identical to your FastAPI endpoint
            generated_password = secrets.token_urlsafe(12)
            hashed = hash_password(generated_password)

            new_user = UserModel(
                email=request.email,
                name=request.name,
                surname=request.surname,
                phone_number=request.phone_number if request.phone_number else None,
                degree=request.degree if request.degree else None,
                password_hash=hashed,
                force_password_change=True,
            )

            db.add(new_user)
            db.commit()
            db.refresh(new_user)

            # Send email if checked
            if request.send_login_credentials_email:
                # W gRPC działamy asynchronicznie, wysyłamy maila bezpośrednio
                try:
                    send_email(new_user.email, generated_password)
                except Exception as e:
                    logging.error(f"Failed to send email: {e}")

            return user_pb2.UserCreateResponse(
                id=new_user.id, email=new_user.email, status="created"
            )
        except Exception as e:
            db.rollback()
            context.set_code(grpc.StatusCode.INTERNAL)
            context.set_details(str(e))
            return user_pb2.UserCreateResponse()
        finally:
            db.close()


async def serve():
    server = grpc.aio.server()
    user_pb2_grpc.add_UserRpcServiceServicer_to_server(UserRpcServiceServicer(), server)
    server.add_insecure_port("[::]:50051")
    logging.info("Starting gRPC server on port 50051...")
    await server.start()
    await server.wait_for_termination()


if __name__ == "__main__":
    logging.basicConfig(level=logging.INFO)
    asyncio.run(serve())
