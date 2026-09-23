from fastapi.testclient import TestClient
from main import app
from db import Database, get_projects_collection, get_tasks_collection

client = TestClient(app)

def test_health():
    response = client.get("/health")
    assert response.status_code == 200
    data = response.json()
    assert data["status"] == "online"
    assert data["service"] == "EchoArchitech-AI-Engine"
    print("Health check response:", data)

def test_manual_commit_simulation_and_task_matching():
    Database.connect()
    projects_col = get_projects_collection()
    tasks_col = get_tasks_collection()

    project = projects_col.find_one()
    if not project:
        print("No project found to test task matching.")
        return

    project_id = str(project["_id"])
    print(f"Testing with Project ID: {project_id} ({project.get('title')})")

    # Fetch a task to see its targetFiles
    sample_task = tasks_col.find_one({"projectId": project["_id"]})
    target_file = "src/index.js"
    if sample_task and sample_task.get("targetFiles"):
        target_file = sample_task["targetFiles"][0]

    print(f"Targeting file: {target_file} for task: {sample_task.get('title') if sample_task else 'None'}")

    simulated_payload = {
        "projectId": project_id,
        "commits": [
            {
                "hash": "sim001a",
                "message": f"feat: implement component and update {target_file}",
                "author": "engineer@echoarchitech.ai",
                "modifiedFiles": [target_file, "README.md"]
            }
        ]
    }

    res = client.post("/api/sync/manual", json=simulated_payload)
    print("Manual sync status code:", res.status_code)
    print("Manual sync result:", res.json())
    assert res.status_code == 200
    assert res.json()["success"] is True

if __name__ == "__main__":
    test_health()
    test_manual_commit_simulation_and_task_matching()
    print("All API integration tests passed successfully!")
