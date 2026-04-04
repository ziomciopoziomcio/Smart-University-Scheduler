from sqlalchemy.orm import Session
from backend.src.users.models import Permissions


def _generate_perm_name(code: str) -> str | None:
    """
    Generate a permission name based on the code
    :param code: permission code
    :return: permission name
    """
    if not code or ":" not in code:
        return None

    resource, action = code.split(":", 1)

    action_map = {
        "view": "View",
        "create": "Create New",
        "update": "Edit",
        "delete": "Delete",
    }

    resource_name = resource.replace("_", " ").capitalize()

    if resource.endswith("s") and action == "view":
        return f"{action_map[action]} All {resource_name[:-1].capitalize()}s"

    return f"{action_map.get(action, action.capitalize())} {resource_name}"


def _generate_perm_description(code: str) -> str | None:
    """
    Generates permission description based on the permission code.
    :param code: permission code
    :return: permission description
    """

    if not code or ":" not in code:
        return None

    resource, action = code.split(":", 1)

    action_map = {
        "view": "view",
        "create": "create",
        "update": "update",
        "delete": "delete",
    }

    action_text = action_map.get(action, action)

    resource_name = resource.replace("_", " ").capitalize()

    if resource.endswith("s") and action == "view":
        resource_name = f"all {resource_name[:-1].capitalize()}s"

    return f"Can {action_text} {resource_name} data"


def add_permission_to_db(
    session: Session,
    code: str,
    name: str | None,
    description: str | None,
    group: str | None,
) -> tuple[str, Permissions]:
    """
    Adds permission to the database
    :param session: database session
    :param code: permission code
    :param name: permission name
    :param description: permission description
    :param group: permission group
    :return: dictionary mapping permission code to Permissions object
    """
    perm = Permissions(code=code, name=name, description=description, group=group)
    session.add(perm)
    return code, perm


if __name__ == "__main__":
    print("Sample permission names:")
    print(_generate_perm_name("students:view"))
    print(_generate_perm_name("student:view"))
    print(_generate_perm_name("student:create"))
    print(_generate_perm_name("student:update"))
    print(_generate_perm_name("student:delete"))
    print()

    print("Sample permission descriptions:")
    print(_generate_perm_description("students:view"))
    print(_generate_perm_description("student:view"))
    print(_generate_perm_description("student:create"))
    print(_generate_perm_description("student:update"))
    print(_generate_perm_description("student:delete"))
    print()
