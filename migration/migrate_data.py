# migration/migrate_data.py
"""
One-time migration: copies all data from an Access .accdb file to Supabase.

Usage:
  python migrate_data.py \
    --db "C:\path\to\database.accdb" \
    --password 2600000 \
    --council-id <uuid-from-supabase-councils-table>

Run ONCE per council. Safe to re-run -- clears council rows before re-inserting.
"""

import pyodbc
import psycopg2
import argparse
import os
from dotenv import load_dotenv
from tqdm import tqdm

load_dotenv(os.path.join(os.path.dirname(__file__), "..", "server", ".env"))

DATABASE_URL = os.environ["DATABASE_URL"]  # add to server/.env


def get_access_tables(cursor) -> list:
    return [r.table_name for r in cursor.tables(tableType="TABLE")]


def migrate_table(access_cursor, pg_conn, table_name: str, council_id: str):
    pg_table = table_name.lower().replace(" ", "_")
    access_cursor.execute(f'SELECT * FROM [{table_name}]')
    rows = access_cursor.fetchall()
    if not rows:
        print(f"  {table_name} -- empty, skipping")
        return

    columns = [desc[0] for desc in access_cursor.description]
    quoted_cols = ", ".join([f'"{c}"' for c in columns])
    placeholders = ", ".join(["%s"] * len(columns))

    pg_cursor = pg_conn.cursor()

    # Clear existing council data before inserting
    pg_cursor.execute(f'DELETE FROM "{pg_table}" WHERE council_id = %s', (council_id,))

    insert_sql = (
        f'INSERT INTO "{pg_table}" (council_id, {quoted_cols}) '
        f'VALUES (%s, {placeholders})'
    )

    batch = []
    for row in tqdm(rows, desc=f"  {table_name}", leave=False):
        batch.append((council_id, *row))
        if len(batch) >= 500:
            pg_cursor.executemany(insert_sql, batch)
            batch = []
    if batch:
        pg_cursor.executemany(insert_sql, batch)

    pg_conn.commit()
    print(f"  OK {table_name} -- {len(rows)} rows migrated")
    pg_cursor.close()


def main():
    parser = argparse.ArgumentParser()
    parser.add_argument("--db",         required=True)
    parser.add_argument("--password",   default="")
    parser.add_argument("--council-id", required=True, help="UUID from councils table")
    parser.add_argument("--table",      default=None,  help="Migrate single table only")
    args = parser.parse_args()

    conn_str = (
        f"DRIVER={{Microsoft Access Driver (*.mdb, *.accdb)}};"
        f"DBQ={args.db};"
        f"PWD={args.password};"
    )
    access_conn   = pyodbc.connect(conn_str)
    access_cursor = access_conn.cursor()
    pg_conn       = psycopg2.connect(DATABASE_URL, sslmode="require")

    tables = get_access_tables(access_cursor)
    if args.table:
        tables = [t for t in tables if t == args.table]

    print(f"\nMigrating {len(tables)} tables for council: {args.council_id}\n")
    for table in sorted(tables):
        try:
            migrate_table(access_cursor, pg_conn, table, args.council_id)
        except Exception as e:
            print(f"  ERROR {table} -- {e}")
            pg_conn.rollback()

    access_conn.close()
    pg_conn.close()
    print("\nMigration complete.")


if __name__ == "__main__":
    main()
