import os
import smtplib
import ssl
import logging
from email.message import EmailMessage

logger = logging.getLogger(__name__)


def send_email(to_email: str, subject: str, body_text: str) -> None:
    host = os.getenv("SMTP_HOST")
    port_raw = os.getenv("SMTP_PORT", "587")
    user = os.getenv("SMTP_USER")
    password = os.getenv("SMTP_PASSWORD")
    sender = os.getenv("SMTP_FROM", user or "")

    if not host or not user or not password or not sender:
        logger.error(
            "SMTP is not configured (SMTP_HOST/SMTP_PORT/SMTP_USER/SMTP_PASSWORD/SMTP_FROM missing)"
        )
        raise RuntimeError(
            "SMTP is not configured. Please set SMTP_HOST, SMTP_PORT, SMTP_USER, SMTP_PASSWORD, SMTP_FROM."
        )

    try:
        port = int(port_raw)
    except ValueError as e:
        logger.error("Invalid SMTP_PORT value: %r", port_raw)
        raise RuntimeError(f"Invalid SMTP_PORT value: {port_raw!r}") from e

    msg = EmailMessage()
    msg["From"] = sender
    msg["To"] = to_email
    msg["Subject"] = subject
    msg.set_content(body_text)

    timeout = 10

    try:
        if port == 465:
            with smtplib.SMTP_SSL(host, port, timeout=timeout) as smtp:
                smtp.login(user, password)
                smtp.send_message(msg)
        else:
            context = ssl.create_default_context()
            with smtplib.SMTP(host, port, timeout=timeout) as smtp:
                smtp.ehlo()
                smtp.starttls(context=context)
                smtp.ehlo()
                smtp.login(user, password)
                smtp.send_message(msg)
    except Exception:
        logger.exception(
            "SMTP send failed (to=%s, subject=%r, host=%s, port=%s)",
            to_email,
            subject,
            host,
            port_raw,
        )
        raise
