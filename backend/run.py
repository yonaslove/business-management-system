import os
import sys

backend_dir = os.path.dirname(os.path.abspath(__file__))
if backend_dir not in sys.path:
    sys.path.insert(0, backend_dir)

import uvicorn

if __name__ == "__main__":
    port = int(os.environ.get("PORT", os.environ.get("RENDER_PORT", 10000)))
    print(f"Starting BMS FastAPI backend on port {port}...")
    uvicorn.run("app.main:app", host="0.0.0.0", port=port, reload=False)
