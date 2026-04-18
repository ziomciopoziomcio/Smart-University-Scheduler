import pytest

ROLES_ORDER = [
    "Administrator",
    "Schedule Manager",
    "Dean's Office",
    "Head of Unit",
    "Instructor",
    "Student",
    "Administrative Staff",
    "Guest",
]


@pytest.mark.parametrize(
    "role_name, expected_status",
    [
        pytest.param("Administrator", 200, id="admin-can-view"),
        pytest.param("Schedule Manager", 200, id="manager-can-view"),
        pytest.param("Dean's Office", 200, id="dean-can-view"),
        pytest.param("Head of Unit", 200, id="head-of-unit-can-view"),
        pytest.param("Instructor", 200, id="instructor-can-view"),
        pytest.param("Student", 200, id="student-can-view"),
        pytest.param("Administrative Staff", 200, id="staff-can-view"),
        pytest.param("Guest", 200, id="guest-can-view"),
    ],
)
def test_endpoint_view_calendar_days(
    client, db_session, get_auth_headers, role_name, expected_status
):
    headers = get_auth_headers(role_name)
    response = client.get("/academics/calendar", headers=headers)

    assert response.status_code == expected_status


@pytest.mark.parametrize(
    "role_name, expected_status",
    [
        pytest.param("Administrator", 200, id="admin-can-view"),
        pytest.param("Schedule Manager", 200, id="manager-can-view"),
        pytest.param("Dean's Office", 200, id="dean-can-view"),
        pytest.param("Head of Unit", 200, id="head-of-unit-can-view"),
        pytest.param("Instructor", 200, id="instructor-can-view"),
        pytest.param("Student", 200, id="student-can-view"),
        pytest.param("Administrative Staff", 200, id="staff-can-view"),
        pytest.param("Guest", 200, id="guest-can-view"),
    ],
)
def test_endpoint_view_calendar_day(
    client,
    db_session,
    get_auth_headers,
    create_test_calendar_day,
    role_name,
    expected_status,
):
    headers = get_auth_headers(role_name)
    idx = ROLES_ORDER.index(role_name) + 1

    cal_day = create_test_calendar_day(
        date_val=f"2026-10-{idx:02d}",
        description=f"Day for {role_name}",
        week_num=idx,
        day_of_week=1,
    )

    response = client.get(
        f"/academics/calendar/{cal_day.calendar_date}", headers=headers
    )

    assert response.status_code == expected_status
    if expected_status == 200:
        data = response.json()
        assert data["calendar_date"] == str(cal_day.calendar_date)


@pytest.mark.parametrize(
    "role_name, expected_status",
    [
        pytest.param("Administrator", 201, id="admin-can-create"),
        pytest.param("Schedule Manager", 201, id="manager-can-create"),
        pytest.param("Dean's Office", 201, id="dean-can-create"),
        pytest.param("Head of Unit", 403, id="head-of-unit-forbidden"),
        pytest.param("Instructor", 403, id="instructor-forbidden"),
        pytest.param("Student", 403, id="student-forbidden"),
        pytest.param("Administrative Staff", 403, id="staff-forbidden"),
        pytest.param("Guest", 403, id="guest-forbidden"),
    ],
)
def test_endpoint_create_calendar_day(
    client,
    db_session,
    get_auth_headers,
    role_name,
    expected_status,
):
    headers = get_auth_headers(role_name)
    idx = ROLES_ORDER.index(role_name) + 1

    payload = {
        "calendar_date": f"2026-11-{idx:02d}",
        "academic_year": "2026/2027",
        "semester_type": "Winter",
        "week_number": idx,
        "academic_day_of_week": 2,
        "description": f"New Holiday {role_name}",
    }

    response = client.post("/academics/calendar", json=payload, headers=headers)

    assert response.status_code == expected_status
    if expected_status == 201:
        assert response.json()["calendar_date"] == payload["calendar_date"]
        assert response.json()["week_number"] == payload["week_number"]


@pytest.mark.parametrize(
    "role_name, expected_status",
    [
        pytest.param("Administrator", 201, id="admin-can-bulk-create"),
        pytest.param("Schedule Manager", 201, id="manager-can-bulk-create"),
        pytest.param("Dean's Office", 201, id="dean-can-bulk-create"),
        pytest.param("Head of Unit", 403, id="head-of-unit-forbidden"),
        pytest.param("Instructor", 403, id="instructor-forbidden"),
        pytest.param("Student", 403, id="student-forbidden"),
        pytest.param("Administrative Staff", 403, id="staff-forbidden"),
        pytest.param("Guest", 403, id="guest-forbidden"),
    ],
)
def test_endpoint_create_calendar_bulk(
    client,
    db_session,
    get_auth_headers,
    role_name,
    expected_status,
):
    headers = get_auth_headers(role_name)
    idx = ROLES_ORDER.index(role_name) + 1

    payload = [
        {
            "calendar_date": f"2026-12-{idx:02d}",
            "academic_year": "2026/2027",
            "semester_type": "Winter",
            "week_number": idx,
            "academic_day_of_week": 3,
            "description": "Winter Break Start",
        },
        {
            "calendar_date": f"2026-12-{idx + 10:02d}",
            "academic_year": "2026/2027",
            "semester_type": "Winter",
            "week_number": idx,
            "academic_day_of_week": 4,
            "description": "Winter Break Continue",
        },
    ]

    response = client.post("/academics/calendar/bulk", json=payload, headers=headers)

    assert response.status_code == expected_status
    if expected_status == 201:
        data = response.json()
        assert len(data) == 2


@pytest.mark.parametrize(
    "role_name, expected_status",
    [
        pytest.param("Administrator", 200, id="admin-can-update"),
        pytest.param("Schedule Manager", 200, id="manager-can-update"),
        pytest.param("Dean's Office", 200, id="dean-can-update"),
        pytest.param("Head of Unit", 403, id="head-of-unit-forbidden"),
        pytest.param("Instructor", 403, id="instructor-forbidden"),
        pytest.param("Student", 403, id="student-forbidden"),
        pytest.param("Administrative Staff", 403, id="staff-forbidden"),
        pytest.param("Guest", 403, id="guest-forbidden"),
    ],
)
def test_endpoint_update_calendar_day(
    client,
    db_session,
    get_auth_headers,
    create_test_calendar_day,
    role_name,
    expected_status,
):
    headers = get_auth_headers(role_name)
    idx = ROLES_ORDER.index(role_name) + 1

    cal_day = create_test_calendar_day(
        date_val=f"2027-01-{idx:02d}",
        description="Old Desc",
        week_num=idx,
        day_of_week=5,
    )

    payload = {"description": "Updated Description"}

    response = client.patch(
        f"/academics/calendar/{cal_day.calendar_date}", json=payload, headers=headers
    )

    assert response.status_code == expected_status
    if expected_status == 200:
        assert response.json()["description"] == "Updated Description"


@pytest.mark.parametrize(
    "role_name, expected_status",
    [
        pytest.param("Administrator", 204, id="admin-can-delete"),
        pytest.param("Schedule Manager", 204, id="manager-can-delete"),
        pytest.param("Dean's Office", 204, id="dean-can-delete"),
        pytest.param("Head of Unit", 403, id="head-of-unit-forbidden"),
        pytest.param("Instructor", 403, id="instructor-forbidden"),
        pytest.param("Student", 403, id="student-forbidden"),
        pytest.param("Administrative Staff", 403, id="staff-forbidden"),
        pytest.param("Guest", 403, id="guest-forbidden"),
    ],
)
def test_endpoint_delete_calendar_day(
    client,
    db_session,
    get_auth_headers,
    create_test_calendar_day,
    role_name,
    expected_status,
):
    headers = get_auth_headers(role_name)
    idx = ROLES_ORDER.index(role_name) + 1

    cal_day = create_test_calendar_day(
        date_val=f"2027-02-{idx:02d}",
        description="To Delete",
        week_num=idx,
        day_of_week=6,
    )

    response = client.delete(
        f"/academics/calendar/{cal_day.calendar_date}", headers=headers
    )

    assert response.status_code == expected_status
    if expected_status == 204:
        admin_headers = get_auth_headers("Administrator")
        check = client.get(
            f"/academics/calendar/{cal_day.calendar_date}", headers=admin_headers
        )
        assert check.status_code == 404
