from pathlib import Path

import uvicorn
from dotenv import load_dotenv


def safe_load_dotenv() -> None:
    env_path = Path(__file__).resolve().parent / ".env"
    if not env_path.exists():
        return

    try:
        raw = env_path.read_bytes()
        if b"\x00" in raw:
            clean = raw.replace(b"\x00", b"")
            env_path.write_bytes(clean)
        load_dotenv(env_path, override=True)
    except Exception:
        try:
            raw = env_path.read_bytes()
            env_path.write_bytes(raw.replace(b"\x00", b""))
        except Exception:
            pass
        try:
            load_dotenv(env_path, override=True)
        except Exception:
            pass


safe_load_dotenv()

if __name__ == "__main__":
    uvicorn.run("app.main:app", host="0.0.0.0", port=8000, reload=True)
