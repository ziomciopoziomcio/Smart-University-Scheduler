import logging
import grpc
import user_pb2
import user_pb2_grpc

from src.database.database import SessionLocal
from src.users.models import Users as UserModel
from src.users.auth import hash_password, secrets
from src.common.notifications import send_login_credentials_email

logger = logging.getLogger(__name__)


class UserRpcServiceServicer(user_pb2_grpc.UserRpcServiceServicer):
    async def CreateUserRPC(self, request, context):
        db = SessionLocal()
        try:
            existing_user = (
                db.query(UserModel).filter(UserModel.email == request.email).first()
            )
            if existing_user:
                context.set_code(grpc.StatusCode.ALREADY_EXISTS)
                context.set_details("User with this email already exists.")
                return user_pb2.UserCreateResponse()

            generated_password = secrets.token_urlsafe(12)
            new_user = UserModel(
                email=request.email,
                name=request.name,
                surname=request.surname,
                phone_number=request.phone_number if request.phone_number else None,
                degree=request.degree if request.degree else None,
                password_hash=hash_password(generated_password),
                force_password_change=True,
            )
            db.add(new_user)
            db.flush()

            self._handle_academic_profile(db, new_user.id, request)
            db.commit()
            db.refresh(new_user)

            if request.send_login_credentials_email:
                try:
                    send_login_credentials_email(
                        user_email=new_user.email, temporary_password=generated_password
                    )
                except Exception as e:
                    logger.error(f"Couldn't send email via credentials function: {e}")

            return user_pb2.UserCreateResponse(
                id=new_user.id, email=new_user.email, status="created"
            )

        except Exception as e:
            db.rollback()
            logger.exception(f"Error gRPC CreateUser: {str(e)}")
            context.set_code(grpc.StatusCode.INTERNAL)
            context.set_details(str(e))
            return user_pb2.UserCreateResponse()
        finally:
            db.close()

    def _handle_academic_profile(self, db, user_id, request):
        profile_type = request.WhichOneof("profile")
        if profile_type == "student":
            from src.academics.models import Students

            new_student = Students(
                user_id=user_id,
                study_program=request.student.study_program_id,
                major=(
                    request.student.major_id if request.student.major_id > 0 else None
                ),
            )
            db.add(new_student)
            logger.info(f"Adding student profile for user_id: {user_id}")
        elif profile_type == "employee":
            from src.academics.models import Employees

            new_employee = Employees(
                user_id=user_id,
                faculty_id=request.employee.faculty_id,
                unit_id=request.employee.unit_id,
            )
            db.add(new_employee)
            logger.info(f"Adding employee profile for user_id: {user_id}")

    async def DeleteUserRPC(self, request, context):
        db = SessionLocal()
        try:
            user = db.query(UserModel).filter(UserModel.id == request.id).first()
            if not user:
                context.set_code(grpc.StatusCode.NOT_FOUND)
                context.set_details("User not found")
                return user_pb2.UserDeleteResponse(
                    success=False, message="User not found"
                )

            from src.academics.models import Students, Employees

            db.query(Students).filter(Students.user_id == request.id).delete()
            db.query(Employees).filter(Employees.user_id == request.id).delete()
            db.flush()

            db.delete(user)
            db.commit()

            logger.info(
                f"Successfully deleted user with ID: {request.id} and all their academic profiles."
            )
            return user_pb2.UserDeleteResponse(
                success=True,
                message="User and associated profiles deleted successfully.",
            )

        except Exception as e:
            db.rollback()
            logger.error(f"Error gRPC DeleteUser: {str(e)}")
            context.set_code(grpc.StatusCode.INTERNAL)
            context.set_details(str(e))
            return user_pb2.UserDeleteResponse(success=False, message=str(e))
        finally:
            db.close()

    async def GetUserRPC(self, request, context):
        db = SessionLocal()
        try:
            user = db.query(UserModel).filter(UserModel.id == request.id).first()
            if not user:
                context.set_code(grpc.StatusCode.NOT_FOUND)
                context.set_details("User not found")
                return user_pb2.UserGetResponse()

            response = user_pb2.UserGetResponse(
                id=user.id,
                email=user.email,
                name=user.name,
                surname=user.surname,
                phone_number=user.phone_number if user.phone_number else "",
                degree=user.degree if user.degree else "",
            )

            self._enrich_user_response_profile(db, user.id, response)
            return response

        except Exception as e:
            logger.error(f"Error gRPC GetUser: {str(e)}")
            context.set_code(grpc.StatusCode.INTERNAL)
            context.set_details(str(e))
            return user_pb2.UserGetResponse()
        finally:
            db.close()

    def _enrich_user_response_profile(self, db, user_id, response):
        from src.academics.models import Students, Employees

        student_profile = db.query(Students).filter(Students.user_id == user_id).first()
        if student_profile:
            response.student.id = student_profile.id
            response.student.study_program_id = student_profile.study_program
            response.student.major_id = (
                student_profile.major if student_profile.major else 0
            )
            return

        employee_profile = (
            db.query(Employees).filter(Employees.user_id == user_id).first()
        )
        if employee_profile:
            response.employee.id = employee_profile.id
            response.employee.faculty_id = employee_profile.faculty_id
            response.employee.unit_id = employee_profile.unit_id


async def serve():
    server = grpc.aio.server()
    user_pb2_grpc.add_UserRpcServiceServicer_to_server(UserRpcServiceServicer(), server)
    server.add_insecure_port("[::]:50051")
    logger.info("Starting gRPC server on port 50051...")
    await server.start()
    await server.wait_for_termination()
