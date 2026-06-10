import os
from datetime import timedelta
from io import BytesIO
from minio import Minio


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

    def upload_pdf(self, object_name: str, file_data: BytesIO) -> str:
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
            expires=timedelta(days=7),
        )

        return url


storage_client = MinioStorage()
