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
│       ├───schedules
│       └───users
├───unit
│   ├───test_academics.py
│   ├───test_conversations.py
│   ├───test_courses.py
│   ├───test_facilities.py
│   ├───test_schedules.py
│   └───test_user.py
└───test_main.py
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
* **`schedules/`**: Absences, suggestions. (for now)
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
    headers = get_auth_headers(
        role_name, 
        additional_permissions=["resource:view"]
    )
    
    # 2. Call endpoint
    response = client.get("/api/resource", headers=headers)
    
    # 3. Assert
    assert response.status_code == expected_status
    # 3.1. Optionally, test the response's value
```

## 2 Unit Tests

Unit tests focus exclusively on testing business logic and data validation rules using Pydantic schemas. 
These tests run completely in memory without setting up the database or the FastAPI test client.

### 2.1 Execution

* **Run all unit tests:** `pytest tests/unit/`

### 2.2 What is tested?

* **Field Limits:** Validating numeric boundaries (e.g., negative ECTS points, invalid room capacities).
* **Cross-field Validation:** Mutual exclusions (e.g., an academic group cannot belong to a `major` and an `elective_block` simultaneously).
* **Date Logic:** Ensuring `start_date` is strictly before or equal to `end_date` (e.g., in `EmployeeAbsenceCreate`).
* **String/Regex Constraints:** Verifying identical passwords during signup or checking if academic years follow the `YYYY/YYYY` regex.

### 2.3 Example Tnit Test

```python
def test_employee_absence_create_dates():
    """Tests if start_date must be before or equal to end_date during creation."""
    base_data = {"employee_id": 1, "reason": "Sick leave"}
    today = date.today()
    yesterday = today - timedelta(days=1)

    # Invalid: start > end
    with pytest.raises(ValidationError) as exc:
        EmployeeAbsenceCreate(**base_data, start_date=today, end_date=yesterday)
    assert "Start date must be before end date" in str(exc.value)
```


## 3 Health tests

Health tests verify the basic operational status of the application and documentation rendering. 
They are located in `test_main.py`

### 3.1 Execution

* **Run health tests:**  `pytest tests/test_main.py`
* **Root Endpoint (`/`):** Verifies that the API successfully boots up and returns the standard `{"status": "SUS API is running!"}` response.
* **Swagger UI (`/docs`):** Checks if the interactive API documentation is accessible and returns the standard HTTP 200 with the `swagger-ui` payload.
* **ReDoc (`/redoc`):** Verifies that the alternative OpenAPI documentation renders correctly.

