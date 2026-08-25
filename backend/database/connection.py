"""
SQLite Database Connection Manager for SIH MPLADS AI.

Provides safe, parameterized SQLite connections using pathlib and sqlite3.Row.
Uses the existing database located at data/output/mplads.db.
"""

import os
from pathlib import Path
import sqlite3
from typing import Generator, Optional

# Primary and fallback database paths
PRIMARY_DB_PATH = Path(__file__).resolve().parent.parent.parent / "data" / "output" / "mplads.db"
FALLBACK_DB_PATH = Path(__file__).resolve().parent.parent.parent / "mplads.db"


def get_db_path() -> Path:
    """
    Resolves the SQLite database file path.
    Checks environment variable MPLADS_DB_PATH, primary output path, or root fallback.
    """
    env_path = os.getenv("MPLADS_DB_PATH")
    if env_path:
        p = Path(env_path)
        if p.exists():
            return p

    if PRIMARY_DB_PATH.exists():
        return PRIMARY_DB_PATH

    if FALLBACK_DB_PATH.exists():
        return FALLBACK_DB_PATH

    raise FileNotFoundError(f"MPLADS SQLite database not found at {PRIMARY_DB_PATH} or {FALLBACK_DB_PATH}")


def get_connection(db_path: Optional[Path] = None) -> sqlite3.Connection:
    """
    Creates and returns a new SQLite connection with row factory set to sqlite3.Row.
    The caller is responsible for closing the connection or using it as a context manager.
    """
    resolved_path = db_path if db_path is not None else get_db_path()
    conn = sqlite3.connect(resolved_path, timeout=10.0, check_same_thread=False)
    conn.row_factory = sqlite3.Row
    return conn


def get_db() -> Generator[sqlite3.Connection, None, None]:
    """
    FastAPI dependency yielding a managed SQLite connection.
    Ensures safe closing of connections after request completion.
    """
    conn = get_connection()
    try:
        yield conn
    finally:
        conn.close()


def check_database_health() -> bool:
    """
    Checks if database exists, connects, and contains the anomaly_results table.
    """
    try:
        conn = get_connection()
        cursor = conn.cursor()
        cursor.execute("SELECT COUNT(*) FROM anomaly_results")
        count = cursor.fetchone()[0]
        conn.close()
        return count > 0
    except Exception:
        return False
