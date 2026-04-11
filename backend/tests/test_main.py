def test_read_main_root(client):
    """
    Checks main endpoint.
    """
    response = client.get("/")
    assert response.status_code == 200
    assert response.json() == {"status": "SUS API is running!"}


def test_docs_accessible(client):
    """
    Checks swagger documentation endpoint.
    """
    response = client.get("/docs")
    assert response.status_code == 200
    assert "swagger-ui" in response.text.lower()


def test_redoc_accessible(client):
    """Checks ReDoc endpoint"""
    response = client.get("/redoc")
    assert response.status_code == 200
