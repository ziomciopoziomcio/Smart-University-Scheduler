from typing import Optional


def mask_email(email: Optional[str]) -> str:
    """
    Mask email for safe logging.
    Examples:
      - john.doe@example.com -> j***e@example.com
      - ab@example.com -> **@example.com
      - None or invalid -> "unknown"
    """
    if not email or "@" not in email:
        return "unknown"
    local, domain = email.split("@", 1)
    if len(local) <= 2:
        masked_local = "*" * len(local)
    else:
        masked_local = local[0] + ("*" * max(0, len(local) - 2)) + local[-1]
    return f"{masked_local}@{domain}"
