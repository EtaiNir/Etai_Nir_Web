# Phase 2 Features — Design Document
**Date:** 2026-04-14
**Status:** Approved

---

## Overview

Four feature areas to build on top of the working Phase 1 app:
1. Advanced search & filtering on the student list
2. Combined student record view (talmidim_kesher + talmidim_nospim)
3. Admin panel (data import, reference tables, user management)
4. Excel and PDF exports

---

## 1. Search & Filtering

### UI
A **compact single-row toolbar** above the student table containing:
- Free text search box (searches שם משפחה + שם פרטי)
- 4 quick-filter dropdowns: שם מוסד, שכבה, מקבילה, תאור ישוב 1ת
- Export buttons (Excel, PDF) on the left side
- "חיפוש מתקדם" toggle button — expands a second row with 2 dynamic column selectors

The advanced search row (collapsed by default) contains:
- 2 pairs of [column dropdown + value input], matching the Excel viewer pattern
- "נקה הכל" clear button
- Active filter tags showing what is currently applied

**Design constraint:** Bar must be compact — smaller inputs, no wasted whitespace, table gets maximum vertical space.

### Data Flow
- Dropdown values (distinct schools, grades, classes, villages) fetched once on page load via `/students/filters` endpoint
- All filtering is **server-side**: filter params sent as query string to `/students`
- Server builds a dynamic WHERE clause in Supabase query
- Pagination resets to page 1 when any filter changes

### API changes
- `GET /students/filters` — returns distinct values for the 4 quick-filter fields
- `GET /students?q=&mosad=&shkhava=&makhbila=&yishuv=&col1=&val1=&col2=&val2=&page=` — extended with new filter params

---

## 2. Student Record — Combined View

### UI
- Default: shows `talmidim_kesher` fields only (existing behavior)
- Toggle button **"הצג נתונים נוספים ▼"** at the top of the record
- When toggled on, `talmidim_nospim` fields appear in a visually distinct section below (different background color, labelled "נתונים נוספים")
- Toggle state persists during the session

### Data Layer
- Create a Supabase database view `talmidim_full` that LEFT JOINs `talmidim_kesher` and `talmidim_nospim` on `מספר זהות`
- Server exposes `GET /students/:id?full=true` — queries `talmidim_full` when `full=true`, otherwise queries `talmidim_kesher`

---

## 3. Admin Panel

Three tabs, accessible only to `admin` and `super_admin` roles.

### Tab 1 — ייבוא נתונים (Data Import)
- Two file upload areas: one for each Excel file (gormey_kesher, additional_fields_filled)
- Upload sends files to `POST /admin/import` — server runs the same delete+insert logic as the Python script
- Progress feedback: "מוחק נתונים קיימים... מייבא X שורות..."
- Shows row count and success/error message on completion

### Tab 2 — טבלאות עזר (Reference Tables)
- Dropdown to select which reference table to edit (מוסדות, ישובים, etc.)
- Spreadsheet-style editable grid: inline edit, add row, delete row
- Save button commits changes via REST API
- Endpoints: `GET/POST/PUT/DELETE /admin/ref/:table`

### Tab 3 — ניהול משתמשים (User Management)
- List of users with their council and role
- Add new user (email, council, role) — creates Supabase auth user + sets metadata
- Edit role/council of existing user
- Endpoints: `GET/POST/PUT /admin/users`

---

## 4. Exports

Both export buttons appear in the main search toolbar and export the **full filtered result set** (all pages, not just the visible 50 rows).

### Excel Export
- Client-side using the `xlsx` library (already used in the HTML Excel viewer)
- Fetches all filtered rows from `/students/export` (no pagination limit)
- Downloads as `תלמידים_YYYY-MM-DD.xlsx`

### PDF Export
- Client-side using `jsPDF` + `jsPDF-autotable` (same libraries as the HTML viewer)
- Header: council name, export date, active filters summary, total row count
- Table: selected visible columns only (to fit on page)
- Downloads as `תלמידים_YYYY-MM-DD.pdf`

### API addition
- `GET /students/export?<same filter params>` — returns all matching rows (no range limit), used by both exports

---

## Out of Scope (Phase 3)
- Improved Access migration scripts
- UI redesign / branding
- Mobile-optimized layout
