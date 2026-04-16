# Authority Isolation & Multi-Municipal Support — Design Document
**Date:** 2026-04-16
**Status:** Approved

---

## Background

The app serves a regional council that manages multiple education authorities (רשויות חינוך) — e.g., מגידו (1300000) and מנשה (1400000). Both authorities share the same Supabase tables (`talmidim_kesher`, `talmidim_nospim`) and are distinguished by `"סמל רשות חינוך"`.

The original Phase 2 import deleted **all rows** for the council on each upload, destroying data from other authorities. This document defines the fix and the broader multi-authority support design.

---

## Excel File Structure (reference)

### talmidim_kesher file (`*_Talmidim_gormey_kesher_...xlsx`)
- Named with authority code prefix, e.g. `1300000_Talmidim_...`
- Contains `"סמל רשות חינוך"` (numeric, e.g. 1300000) — the authority identifier
- Contains `"שם רשות חינוך"` — authority name
- Contains `"בישוב-מחוץ"` — "ברשות" or "מחוץ"
- Contains `"מספר זהות"` — student ID (JOIN key)
- Contains `__EMPTY` — Excel artifact, must be stripped before insert

### talmidim_nospim file (`*_additional_fields_filled.xlsx`)
- Contains `"מספר זהות תוספתי"` — student ID (JOIN key to kesher)
- Contains `"מזהה"` — always null, Excel artifact, must be stripped
- **Does NOT contain authority code** — must be added during import

### Upload workflow
Both files are always prepared and uploaded together — they are derived from 6 source files received from the Ministry of Education and combined into these 2 files before upload.

---

## Design Decisions

### 1. Authority Registry Table — `rashuyot_chinuch`

New Supabase table to serve as source of truth for authorities within a council:

| column | type | notes |
|--------|------|-------|
| `id` | uuid (PK) | auto |
| `council_id` | uuid | FK to councils |
| `semel` | integer | e.g. 1300000 |
| `shem` | text | e.g. "מגידו" |

Used for:
- Upload UI dropdown (select which authority you are uploading)
- User permission assignment
- Display labels throughout the app

### 2. Add `semel_reshut` to `talmidim_nospim`

Since the nospim Excel file has no authority column, add `semel_reshut integer` to `talmidim_nospim` in Supabase. This is populated during import from the authority code auto-detected from the kesher file (uploaded together).

### 3. Import Logic — Authority-Scoped Delete

**Current (broken):**
```sql
DELETE FROM talmidim_kesher WHERE council_id = X
DELETE FROM talmidim_nospim WHERE council_id = X
```

**New (correct):**
```sql
DELETE FROM talmidim_kesher WHERE council_id = X AND "סמל רשות חינוך" = Y
DELETE FROM talmidim_nospim WHERE council_id = X AND semel_reshut = Y
```

Where `Y` is auto-read from the first row of the kesher file (`"סמל רשות חינוך"`).

### 4. Column Stripping

Strip these columns before inserting into Supabase (Excel artifacts):
- `talmidim_kesher`: `__EMPTY`
- `talmidim_nospim`: `"מזהה"`

### 5. User Permissions — Per-Authority Access

Add `allowed_reshuyot` (array of semel integers) to Supabase user metadata:

| value | meaning |
|-------|---------|
| `null` or `[]` | user sees all authorities in their council |
| `[1300000]` | user sees only מגידו students |
| `[1300000, 1400000]` | user sees both |

The server applies this filter automatically on all `/students` queries.

In the Users tab, admin can assign authorities from the `rashuyot_chinuch` table (checkbox list).

---

## Supabase Changes Required

1. **Create** `rashuyot_chinuch` table (semel, shem, council_id)
2. **Add column** `semel_reshut integer` to `talmidim_nospim`
3. **Populate** `rashuyot_chinuch` with initial data (1300000/מגידו, 1400000/מנשה)

---

## Out of Scope (future)
- Partial update (upsert by מספר זהות instead of delete+insert)
- Automatic source-file combining (the 6→2 file preparation step remains manual)
