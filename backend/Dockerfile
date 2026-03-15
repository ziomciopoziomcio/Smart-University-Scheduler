##################################################
# STEP 1: BUILDER
##################################################
FROM python:3.14-slim as builder
LABEL authors="ziomciopoziomcio"

WORKDIR /build

# hadolint: ignore=DL3008
RUN apt-get update && apt-get install -y --no-install-recommends \
    build-essential \
    libpq-dev \
    && rm -rf /var/lib/apt/lists/*

COPY requirements.txt .

RUN pip wheel --no-cache-dir --wheel-dir /build/wheels -r requirements.txt

##################################################
# STEP 2: RUNTIME
##################################################

FROM python:3.14-slim
LABEL authors="ziomciopoziomcio"

RUN groupadd -r appservice && useradd -r -g appservice appservice

WORKDIR /app

RUN apt-get update && apt-get install -y --no-install-recommends \
    libpq5 \
    && rm -rf /var/lib/apt/lists/*

COPY --from=builder /build/wheels /wheels

RUN pip install --no-cache-dir /wheels/* && rm -rf /wheels

COPY --chown=appservice:appservice . .

USER appservice
CMD ["uvicorn", "main:app", "--host", "0.0.0.0", "--port", "3000"]
