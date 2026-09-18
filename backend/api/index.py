import os
import sys

_api_dir = os.path.dirname(os.path.abspath(__file__))
_backend_dir = os.path.dirname(_api_dir)
_repo_root = os.path.dirname(_backend_dir)

for path in (_repo_root, _backend_dir):
    if path not in sys.path:
        sys.path.insert(0, path)

try:
    from backend.app.main import app
except ModuleNotFoundError:
    from app.main import app

__all__ = ["app"]
