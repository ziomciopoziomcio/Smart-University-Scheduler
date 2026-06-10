import os
from datetime import timedelta, datetime, timezone
from io import BytesIO
from minio import Minio
import logging

logger = logging.getLogger(__name__)


class MinioStorage:
    def __init__(self):
        self.access_key = os.getenv("MINIO_ACCESS_KEY")
        self.secret_key = os.getenv("MINIO_SECRET_KEY")
        self.bucket_name = os.getenv("MINIO_BUCKET", "smart-scheduler")
        self.secure = os.getenv("MINIO_SECURE", "false").lower() == "true"

        if not self.access_key or not self.secret_key:
            raise ValueError("BŁĄD: Brak kluczy MINIO w zmiennych środowiskowych!")

        self.client = Minio(
            endpoint="127.0.0.1:9000",
            access_key=self.access_key,
            secret_key=self.secret_key,
            secure=self.secure,
        )

        internal_docker_host = os.getenv("MINIO_ENDPOINT", "minio:9000")
        self.client._http.connection_pool_kw["server_hostname"] = internal_docker_host

        pool_manager = self.client._http
        original_urlopen = pool_manager.urlopen

        def redirected_urlopen(method, url, *args, **kwargs):
            if "127.0.0.1:9000" in url:
                url = url.replace("127.0.0.1:9000", internal_docker_host)
            return original_urlopen(method, url, *args, **kwargs)

        pool_manager.urlopen = redirected_urlopen

    def upload_pdf(
        self,
        object_name: str,
        file_data: BytesIO,
        expires: timedelta = timedelta(days=7),
    ) -> str:
        """
        Upload PDF to Minio and return a presigned GET URL.
        expires: timedelta specifying how long the presigned URL is valid.
        """
        file_data.seek(0)
        length = file_data.getbuffer().nbytes

        self.client.put_object(
            bucket_name=self.bucket_name,
            object_name=object_name,
            data=file_data,
            length=length,
            content_type="application/pdf",
        )

        url = self.client.presigned_get_object(
            bucket_name=self.bucket_name,
            object_name=object_name,
            expires=expires,
        )

        return url

    def cleanup_old_objects(
        self,
        prefix: str = "schedules/",
        older_than_days: int = 7,
        dry_run: bool = False,
    ) -> list[str]:
        """
        Delete objects in the configured bucket under `prefix` that are older than `older_than_days`.
        Returns list of object names deleted (or would be deleted in dry_run).
        """
        cutoff = datetime.now(timezone.utc) - timedelta(days=older_than_days)
        deleted = []

        for obj in self.client.list_objects(
            self.bucket_name, prefix=prefix, recursive=True
        ):
            try:
                last_modified = obj.last_modified
            except AttributeError:
                continue

            if last_modified < cutoff:
                if dry_run:
                    deleted.append(obj.object_name)
                else:
                    try:
                        self.client.remove_object(self.bucket_name, obj.object_name)
                        deleted.append(obj.object_name)
                    except Exception as e:
                        logger.error(f"Failed to delete {obj.object_name}: {e}")
        return deleted


storage_client = MinioStorage()
