from sqlalchemy.orm import Session
from backend.src.users.models import Permissions, Roles
import pandas as pd


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


def _add_permission_to_db(
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
    :return: tuple mapping permission code to Permissions object
    """
    perm = Permissions(code=code, name=name, description=description, group=group)
    session.add(perm)
    return code, perm


def generate_permissions_from_excel_file(
    session: Session, sourcefile: str, sheet_name: str
) -> dict[str, Permissions]:
    """
    Generate permissions from an Excel file and add them to the database.
    :param session: database session
    :param sourcefile: path to the source Excel file
    :param sheet_name: name of the sheet in the Excel file to read
    :return: dictionary mapping permission codes to Permissions objects
             that were added to the database
    """
    db_permissions: dict[str, Permissions] = {}

    groups = pd.read_excel(sourcefile, sheet_name=sheet_name, usecols="B")
    perms_names = pd.read_excel(sourcefile, sheet_name=sheet_name, usecols="C")

    curr_group = None
    for group, code in zip(groups.iloc[:, 0], perms_names.iloc[:, 0]):
        if pd.isnull(code):
            continue
        if not pd.isna(group):
            curr_group = group
        name = _generate_perm_name(code)
        description = _generate_perm_description(code)
        print(f"Processing: {code}\t-\t{name}\t-\t{description}\t-\t{curr_group}")

        added_perm = _add_permission_to_db(
            session=session,
            code=code,
            name=name,
            description=description,
            group=curr_group,
        )
        db_permissions[added_perm[0]] = added_perm[1]

    session.flush()
    return db_permissions


def _get_roles_names(sourcefile: str, sheet_name: str) -> list[str]:
    """
    Gets role names from an Excel file.
    :param sourcefile: path to the source Excel file
    :param sheet_name: name of the sheet in the Excel file to read
    :return: list of role names
    """
    df = pd.read_excel(sourcefile, sheet_name=sheet_name)
    row = df.iloc[0]
    return list(row.index)[3:]


def _map_roles_into_english(roles_pl: list[str]) -> list[str]:
    """
    Maps Polish role names to English ones.
    :param roles_pl: list of role names
    :return: list of English role names
    """
    map_names = {
        "Administrator": "Administrator",
        "Menedżer planu": "Schedule Manager",
        "Dziekanat": "Dean's Office",
        "Kierownik jednostki": "Head of Unit",
        "Prowadzący": "Instructor",
        "Student": "Student",
        "Pracownik administracyjny": "Administrative Staff",
        "Gość": "Guest",
    }

    roles_en = []
    for role in roles_pl:
        role_en = map_names.get(role, role)
        roles_en.append(role_en)
    return roles_en


def _get_next_column(curr_col):
    """
    Gets the next column letter.
    :param curr_col: letter representing column
    :return: letter representing next column
    """
    return chr(ord(curr_col) + 1)


def generate_roles_from_excel_file(
    session: Session,
    sourcefile: str,
    sheet_name: str,
    permissions: dict[str, Permissions],
) -> dict[str, Roles]:
    """
    Generate roles from an Excel file and add them to the database.
    :param session: database session
    :param sourcefile: path to the source Excel file
    :param sheet_name: name of the sheet in the Excel file to read
    :param permissions: dictionary mapping permission codes to
        Permissions objects that were added to the database
    :return: dictionary mapping role names to Roles objects
    """

    db_roles: dict[str, Roles] = {}

    all_roles = _get_roles_names(sourcefile)
    all_roles = _map_roles_into_english(all_roles)

    start_col = "D"
    perms_codes = pd.read_excel(sourcefile, sheet_name=sheet_name, usecols="C")

    for role in all_roles:
        print(
            f"{role.upper()}: =============================================================="
        )
        role_perms = pd.read_excel(sourcefile, sheet_name=sheet_name, usecols=start_col)

        granted_perms: list[Permissions] = []  # list of perms for the current role

        for code, role_perm in zip(perms_codes.iloc[:, 0], role_perms.iloc[:, 0]):
            if pd.isnull(code) or pd.isnull(role_perm):
                continue
            granted: bool = role_perm == 1
            print(f"{role} -> {code} - {'granted' if granted else 'not granted'}")

            if granted:
                to_add = permissions.get(code, None)
                if to_add is None:
                    print(
                        f"Warning: permission with code '{code}' not found in the database. Skipping."
                    )
                else:
                    granted_perms.append(to_add)

        # creating role
        role_obj = Roles(role_name=role, permissions=granted_perms)
        session.add(role_obj)
        db_roles[role] = role_obj

        print()
        print()
        print()

        start_col = _get_next_column(start_col)

    session.flush()
    return db_roles


if __name__ == "__main__":
    path = r"..\data\role_uprawnienia.xlsx"
    sheet_name = "Arkusz1"
