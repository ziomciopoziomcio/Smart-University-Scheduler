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


if __name__ == "__main__":
    print("Sample permission names:")
    print(_generate_perm_name("students:view"))
    print(_generate_perm_name("student:view"))
    print(_generate_perm_name("student:create"))
    print(_generate_perm_name("student:update"))
    print(_generate_perm_name("student:delete"))
    print()
