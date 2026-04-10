# Backend tests
Structure
```githubexpressionlanguage
tests
├───integration
│   └───endpoints
│       ├───academics
│       ├───conversations
│       ├───courses
│       ├───facilities
│       └───users
└───unit
```
## 1 Integration Tests

### 1.1 Execution
Tests use `pytest`, FastAPI's `TestClient`, and an in-memory SQLite database.
DB is automatically seeded with roles/permissions from `role_uprawnienia.xlsx` via `conftest.py`.

* **Run all tests:** `pytest tests/integration/endpoints/`
* **Run specific module:** `pytest tests/integration/endpoints/users/`

### 1.2. Directory Structure

* **`users/`**: Auth, roles, permissions, passwords, 2FA.
* **`academics/`**: Students, employees, groups, units, academic calendar.
* **`courses/`**: Curriculums, programs, majors, courses, instructors.
* **`facilities/`**: Campuses, buildings, rooms, faculties.
* **`conversations/`**: Chats, messages (includes ownership validation).

### 1.3. Writing a New Test (Best Practice)
Never create DB records manually in the test file. Use `conftest.py` factory fixtures (`create_test_user`, `create_test_group`, etc.). Always parameterize by all 8 roles.

```python
import pytest

@pytest.mark.parametrize(
    "role_name, expected_status",
    [
        ("Administrator", 200),
        ("Dean's Office", 200),
        ("Student", 403),
        ("Guest", 403),
    ]
)
def test_example_endpoint(client, get_auth_headers, role_name, expected_status):
    # 1. Get token and auto-inject missing permissions if needed
    headers = get_auth_headers(role_name, additional_permissions=["resource:view"])
    
    # 2. Call endpoint
    response = client.get("/api/resource", headers=headers)
    
    # 3. Assert
    assert response.status_code == expected_status
```

## 2 Unit tests

[//]: # (TODO)

## 3 Health tests
