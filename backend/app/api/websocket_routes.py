from fastapi import APIRouter, WebSocket, WebSocketDisconnect
from typing import List

router = APIRouter(tags=["WebSockets"])

class ConnectionManager:
    def __init__(self):
        self.active_connections: List[WebSocket] = []

    async def connect(self, websocket: WebSocket):
        await websocket.accept()
        self.active_connections.append(websocket)

    def disconnect(self, websocket: WebSocket):
        if websocket in self.active_connections:
            self.active_connections.remove(websocket)

    async def broadcast_incident(self, incident_data: dict):
        """
        Sends the new incident data to all connected dashboards and mobile devices.
        """
        # Create a copy of the list to safely iterate and remove disconnected clients
        for connection in list(self.active_connections):
            try:
                await connection.send_json(incident_data)
            except Exception as e:
                # If a client dropped connection unexpectedly, remove them
                print(f"Failed to send data to a client: {e}")
                self.disconnect(connection)

# Create a global instance of the manager
manager = ConnectionManager()

@router.websocket("/ws/incidents")
async def websocket_endpoint(websocket: WebSocket):
    await manager.connect(websocket)
    try:
        while True:
            # Keep the connection open to listen for client disconnects
            # We wait for any incoming message, though we just need it to keep the line open
            data = await websocket.receive_text()
            print(f"Ping from client: {data}")
    except WebSocketDisconnect:
        manager.disconnect(websocket)
        print("A dashboard or mobile client disconnected.")