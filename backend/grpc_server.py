import asyncio
import logging
import grpc
import user_pb2
import user_pb2_grpc

from src.database.database import SessionLocal
from src.users.models import Users as UserModel
from src.users.auth import secrets, verify_password
from src.common.notifications import send_login_credentials_email
from src.academics.models import Employees, Students
from src.users import models

from src.common.user_service import (
    _validate_signup,
    _prepare_user_and_token,
    _stage_user,
)
from src.common.notifications import send_verification_email
from src.users.schemas import SignupRequest

logger = logging.getLogger(__name__)


class UserRpcServiceServicer(user_pb2_grpc.UserRpcServiceServicer):
    async def CreateUserRPC(self, request, context):
        db = SessionLocal()
        try:
            generated_pass = secrets.token_urlsafe(12)
            signup_payload = SignupRequest(
                email=request.email,
                password=generated_pass,
                password2=generated_pass,
                name=request.name,
                surname=request.surname,
                phone_number=request.phone_number if request.phone_number else None,
                degree=request.degree if request.degree else None,
            )

            _validate_signup(signup_payload, db)

            new_user, token = _prepare_user_and_token(signup_payload)

            _stage_user(db, new_user)

            self._handle_academic_profile(db, new_user.id, request)

            db.commit()
            db.refresh(new_user)

            try:
                send_verification_email(new_user.email, token)
            except Exception as e:
                logger.error(f"Couldn't send verification email: {e}")

            if request.send_login_credentials_email:
                try:
                    send_login_credentials_email(
                        user_email=new_user.email, temporary_password=generated_pass
                    )
                except Exception as e:
                    logger.error(f"Couldn't send credentials email: {e}")

            return user_pb2.UserCreateResponse(
                id=new_user.id, email=new_user.email, status="created"
            )

        except Exception as e:
            db.rollback()
            logger.exception(f"Error gRPC CreateUser: {str(e)}")

            if hasattr(e, "status_code") and e.status_code == 409:
                context.set_code(grpc.StatusCode.ALREADY_EXISTS)
                context.set_details("User with this email already exists.")
            else:
                context.set_code(grpc.StatusCode.INTERNAL)
                context.set_details(str(e))

            return user_pb2.UserCreateResponse()
        finally:
            db.close()

    def _handle_academic_profile(self, db, user_id, request):
        profile_type = request.WhichOneof("profile")
        if profile_type == "student":
            new_student = Students(
                user_id=user_id,
                study_program=request.student.study_program_id,
                major=(
                    request.student.major_id if request.student.major_id > 0 else None
                ),
            )
            db.add(new_student)
        elif profile_type == "employee":
            new_employee = Employees(
                user_id=user_id,
                faculty_id=request.employee.faculty_id,
                unit_id=request.employee.unit_id,
            )
            db.add(new_employee)

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

            db.query(Students).filter(Students.user_id == request.id).delete()
            db.query(Employees).filter(Employees.user_id == request.id).delete()
            db.flush()

            db.delete(user)
            db.commit()
            return user_pb2.UserDeleteResponse(
                success=True, message="Deleted successfully."
            )
        except Exception as e:
            db.rollback()
            context.set_code(grpc.StatusCode.INTERNAL)
            return user_pb2.UserDeleteResponse(success=False, message=str(e))
        finally:
            db.close()

    async def GetUserRPC(self, request, context):
        db = SessionLocal()
        try:
            user = db.query(UserModel).filter(UserModel.id == request.id).first()
            if not user:
                context.set_code(grpc.StatusCode.NOT_FOUND)
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
            context.set_code(grpc.StatusCode.INTERNAL)
            return user_pb2.UserGetResponse()
        finally:
            db.close()

    def _enrich_user_response_profile(self, db, user_id, response):
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

    async def SaveUserApiKeyRPC(self, request, context):
        db = SessionLocal()
        try:
            db.query(models.UserApiKey).filter(
                models.UserApiKey.user_id == request.user_id
            ).delete()
            new_key = models.UserApiKey(
                user_id=request.user_id, api_key_hash=request.api_key_hash
            )
            db.add(new_key)
            db.commit()
            return user_pb2.SaveUserApiKeyResponse(success=True)
        except Exception as e:
            db.rollback()
            context.set_code(grpc.StatusCode.INTERNAL)
            return user_pb2.SaveUserApiKeyResponse(success=False)
        finally:
            db.close()

    async def AuthenticateApiKeyRPC(self, request, context):
        db = SessionLocal()
        try:
            matched_user_id = self._find_user_by_api_key(db, request.provided_api_key)
            if not matched_user_id:
                context.set_code(grpc.StatusCode.UNAUTHENTICATED)
                return user_pb2.AuthenticateApiKeyResponse(user_id=0, is_admin=False)

            user = db.query(UserModel).filter(UserModel.id == matched_user_id).first()
            is_admin = self._has_admin_role(user)

            return user_pb2.AuthenticateApiKeyResponse(
                user_id=matched_user_id, is_admin=is_admin
            )
        except Exception as e:
            context.set_code(grpc.StatusCode.INTERNAL)
            return user_pb2.AuthenticateApiKeyResponse(user_id=0, is_admin=False)
        finally:
            db.close()

    def _find_user_by_api_key(self, db, provided_key: str):
        api_keys = db.query(models.UserApiKey).all()
        for key_entry in api_keys:
            if verify_password(provided_key, key_entry.api_key_hash):
                return key_entry.user_id
        return None

    def _has_admin_role(self, user) -> bool:
        if not user or not hasattr(user, "roles"):
            return False
        for r in user.roles:
            if r.role_name.lower() in ["administrator", "admin"]:
                return True
        return False


async def serve():
    server = grpc.aio.server()
    user_pb2_grpc.add_UserRpcServiceServicer_to_server(UserRpcServiceServicer(), server)
    server.add_insecure_port("[::]:50051")
    logger.info("Starting gRPC server on port 50051...")
    await server.start()
    await server.wait_for_termination()


if __name__ == "__main__":
    logging.basicConfig(level=logging.INFO)
    asyncio.run(serve())
