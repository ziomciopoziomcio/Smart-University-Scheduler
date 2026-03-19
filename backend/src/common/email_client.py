import os
import smtplib
from email.message import EmailMessage


def send_email(to_email: str, subject: str, body_text: str) -> None:
    host = os.getenv("SMTP_HOST")
    port_raw = os.getenv("SMTP_PORT", "587")
    user = os.getenv("SMTP_USER")
    password = os.getenv("SMTP_PASSWORD")
    sender = os.getenv("SMTP_FROM", user or "")

    if not host or not user or not password or not sender:
        raise RuntimeError(
            "SMTP is not configured. Please set SMTP_HOST, SMTP_PORT, SMTP_USER, SMTP_PASSWORD, SMTP_FROM."
        )

    try:
        port = int(port_raw)
    except ValueError as e:
        raise RuntimeError(f"Invalid SMTP_PORT value: {port_raw!r}") from e

    msg = EmailMessage()
    msg["From"] = sender
    msg["To"] = to_email
    msg["Subject"] = subject
    msg.set_content(body_text)

    if port == 465:
        with smtplib.SMTP_SSL(host, port) as smtp:
            smtp.login(user, password)
            smtp.send_message(msg)
    else:
        with smtplib.SMTP(host, port) as smtp:
            smtp.ehlo()
            smtp.starttls()
            smtp.ehlo()
            smtp.login(user, password)
            smtp.send_message(msg)
