from dotenv import load_dotenv
import psycopg2
import subprocess
from psycopg2.extensions import ISOLATION_LEVEL_AUTOCOMMIT
import os
# Configuration
load_dotenv()
DB_NAME = os.getenv("DB_NAME")
DB_USER = os.getenv("DB_USER")
DB_PASSWORD = os.getenv("DB_PASSWORD")
DB_HOST = os.getenv("DB_HOST")
DB_PORT = os.getenv("DB_PORT")
DUMP_FILE = "server/ai/database/webFinalProject_20250518_000805.sql"

def ensure_db_exists_and_restore():
    print(DB_PASSWORD , "Pass")
    # Connect to default 'postgres' database
    con = psycopg2.connect(
        dbname="postgres",
        user=DB_USER,
        password=DB_PASSWORD,
        host=DB_HOST,
        port=DB_PORT
    )
    con.set_isolation_level(ISOLATION_LEVEL_AUTOCOMMIT)
    cur = con.cursor()

    # Check if target database exists
    cur.execute("SELECT 1 FROM pg_database WHERE datname = %s", (DB_NAME,))
    exists = cur.fetchone()

    if exists:
        print(f"Database '{DB_NAME}' already exists.")
    else:
        cur.execute(f'CREATE DATABASE "{DB_NAME}"')
        print(f"Database '{DB_NAME}' created.")
        restore_dump()

    cur.close()
    con.close()

def restore_dump():
    print(f"Restoring dump from '{DUMP_FILE}'...")
    try:
        subprocess.run([
            "psql",
            "-U", DB_USER,
            "-d", DB_NAME,
            "-h", DB_HOST,
            "-p", DB_PORT,
            "-f", DUMP_FILE
        ], check=True)
        print("Database restored successfully.")
    except subprocess.CalledProcessError as e:
        print("Failed to restore database:", e)

if __name__ == "__main__":
    ensure_db_exists_and_restore()