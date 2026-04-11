# migration/load_excel_to_supabase.py
"""
Monthly import: loads Ministry of Education Excel exports into Supabase.

Handles two files per council:
  *_Talmidim_gormey_kesher_pirtey_kesher_mosdot_megamot_kitot.xlsx  -> talmidim_kesher
  *_additional_fields_filled.xlsx                                    -> talmidim_nospim

Strategy: DELETE existing rows for the council, then INSERT all rows from Excel.
Safe to re-run — the delete+insert is wrapped in a transaction.

Usage:
  python load_excel_to_supabase.py --folder "C:\\path\\to\\data" --council manashe

Council name must match the `name` column in the Supabase `councils` table.
Examples: manashe, mata_yehuda

Requirements:
  pip install pandas openpyxl psycopg2-binary python-dotenv tqdm
"""

import os
import sys
import argparse
import math

import pandas as pd
import psycopg2
import psycopg2.extras
from dotenv import load_dotenv
from tqdm import tqdm

# Load DATABASE_URL from server/.env (only required when not doing --dry-run)
load_dotenv(os.path.join(os.path.dirname(__file__), "..", "server", ".env"))
DATABASE_URL = os.environ.get("DATABASE_URL")

# Maps filename fragment -> (table_name, id_column)
FILE_CONFIG = {
    "gormey_kesher": ("talmidim_kesher",  "מספר זהות"),
    "additional_fields_filled": ("talmidim_nospim", "מספר זהות תוספתי"),
}

BATCH_SIZE = 500


def clean_value(val):
    """Convert pandas value to Python-native, replacing NaN/NaT with None."""
    if val is None:
        return None
    if isinstance(val, float) and math.isnan(val):
        return None
    if pd.isna(val):
        return None
    return str(val) if not isinstance(val, (int, float)) else val


def get_council_id(pg_conn, council_name: str) -> str:
    with pg_conn.cursor() as cur:
        cur.execute("SELECT id FROM councils WHERE name = %s", (council_name,))
        row = cur.fetchone()
        if not row:
            cur.execute("SELECT name FROM councils")
            available = [r[0] for r in cur.fetchall()]
            raise ValueError(
                f"Council '{council_name}' not found in Supabase.\n"
                f"Available councils: {available}"
            )
        return str(row[0])


def find_file(folder: str, fragment: str):
    """Find the Excel file whose name contains the given fragment."""
    for fname in os.listdir(folder):
        if fragment in fname and fname.endswith(".xlsx"):
            return os.path.join(folder, fname)
    return None


def load_file(pg_conn, file_path: str, table: str, id_col: str, council_id: str):
    print(f"\nLoading: {os.path.basename(file_path)}")
    print(f"  -> table: {table}")

    df = pd.read_excel(file_path)
    print(f"  Rows: {len(df):,}  Columns: {len(df.columns)}")

    # Validate that the key column exists
    if id_col not in df.columns:
        raise ValueError(f"Key column '{id_col}' not found in {file_path}.\n"
                         f"Available columns: {list(df.columns)}")

    columns = list(df.columns)
    quoted_cols = ", ".join(['"' + c.replace('"', '""') + '"' for c in columns])
    placeholders = ", ".join(["%s"] * len(columns))

    insert_sql = (
        f'INSERT INTO "{table}" (council_id, {quoted_cols}) '
        f'VALUES (%s, {placeholders})'
    )

    with pg_conn.cursor() as cur:
        # Delete existing rows for this council
        cur.execute(f'DELETE FROM "{table}" WHERE council_id = %s', (council_id,))
        deleted = cur.rowcount
        print(f"  Deleted {deleted:,} existing rows for this council")

        # Insert in batches
        batch = []
        for _, row in tqdm(df.iterrows(), total=len(df), desc="  Inserting"):
            values = tuple(clean_value(row[c]) for c in columns)
            batch.append((council_id, *values))
            if len(batch) >= BATCH_SIZE:
                psycopg2.extras.execute_batch(cur, insert_sql, batch)
                batch = []
        if batch:
            psycopg2.extras.execute_batch(cur, insert_sql, batch)

    pg_conn.commit()
    print(f"  Inserted {len(df):,} rows")


def main():
    parser = argparse.ArgumentParser(
        description="Load Ministry Excel exports into Supabase"
    )
    parser.add_argument(
        "--folder", required=True,
        help="Folder containing the two Excel files"
    )
    parser.add_argument(
        "--council", required=True,
        help="Council name as stored in Supabase (e.g. manashe, mata_yehuda)"
    )
    parser.add_argument(
        "--dry-run", action="store_true",
        help="Read files and report row counts without writing to DB"
    )
    args = parser.parse_args()

    if args.dry_run:
        print("DRY RUN — no data will be written\n")
        for fragment, (table, id_col) in FILE_CONFIG.items():
            path = find_file(args.folder, fragment)
            if path:
                df = pd.read_excel(path)
                print(f"{os.path.basename(path)}")
                print(f"  Table: {table}  |  Rows: {len(df):,}  |  Cols: {len(df.columns)}")
                print(f"  Key column '{id_col}' present: {id_col in df.columns}")
            else:
                print(f"WARNING: No file found for fragment '{fragment}' in {args.folder}")
        return

    if not DATABASE_URL:
        print("ERROR: DATABASE_URL not set in server/.env", file=sys.stderr)
        sys.exit(1)

    pg_conn = psycopg2.connect(DATABASE_URL, sslmode="require")
    try:
        council_id = get_council_id(pg_conn, args.council)
        print(f"Council: {args.council}  (id: {council_id})")

        loaded = 0
        for fragment, (table, id_col) in FILE_CONFIG.items():
            path = find_file(args.folder, fragment)
            if not path:
                print(f"\nWARNING: No file found for '{fragment}' in {args.folder} — skipping")
                continue
            load_file(pg_conn, path, table, id_col, council_id)
            loaded += 1

        print(f"\nDone — {loaded} file(s) loaded successfully.")
    except Exception as e:
        pg_conn.rollback()
        print(f"\nERROR: {e}", file=sys.stderr)
        sys.exit(1)
    finally:
        pg_conn.close()


if __name__ == "__main__":
    main()
