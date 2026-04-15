def test_health(client):
    resp = client.get("/health")
    assert resp.status_code == 200
    assert resp.json()["status"] == "ok"


def test_dashboard_overview(client):
    resp = client.get("/api/dashboard/overview")
    assert resp.status_code == 200
    data = resp.json()
    assert "social_health" in data
    assert "published_posts" in data


def test_dashboard_calendar(client):
    resp = client.get("/api/dashboard/calendar")
    assert resp.status_code == 200


def test_agents_status(client):
    resp = client.get("/api/agents/status")
    assert resp.status_code == 200
    data = resp.json()
    assert "research" in data
    assert "social_stats" in data
    assert "analytics" in data


def test_social_stats_latest(client):
    resp = client.get("/api/social-stats/latest")
    assert resp.status_code == 200


def test_social_stats_history(client):
    resp = client.get("/api/social-stats/history/instagram")
    assert resp.status_code == 200
    assert isinstance(resp.json(), list)


def test_research_items(client):
    resp = client.get("/api/research/items")
    assert resp.status_code == 200
    assert isinstance(resp.json(), list)


def test_research_competitors(client):
    resp = client.get("/api/research/competitors")
    assert resp.status_code == 200
    assert isinstance(resp.json(), list)


def test_ga4_status(client):
    resp = client.get("/api/ga4/status")
    assert resp.status_code == 200
    assert "connected" in resp.json()


def test_trigger_unknown_agent(client):
    resp = client.post("/api/agents/trigger/unknown_agent")
    assert resp.status_code == 404
