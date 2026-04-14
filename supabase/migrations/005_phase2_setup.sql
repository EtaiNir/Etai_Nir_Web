-- Disable RLS on reference tables (same issue as talmidim_kesher — new Supabase key format)
ALTER TABLE yishuvei_hamoatza DISABLE ROW LEVEL SECURITY;
ALTER TABLE semel_yishuv_verechevot DISABLE ROW LEVEL SECURITY;

-- Also disable RLS on users table to allow admin queries
ALTER TABLE users DISABLE ROW LEVEL SECURITY;

-- Create joined view for full student record
CREATE OR REPLACE VIEW talmidim_full AS
SELECT
  k.*,
  n."מזהה"                            AS "מזהה נוספים",
  n."חינוך מיוחד תלמיד",
  n."חינוך מיוחד אפיון וזכאות",
  n."חינוך מיוחד משבצת",
  n."חינוך מיוחד סלים אישיים",
  n."חינוך מיוחד לפי מוסד או כיתה",
  n."סל זכאות בכיתה רגילה",
  n."זכאי שעות סייעת",
  n."מספר שעות זכאות סייעת",
  n."במשבצת",
  n."תלמיד חוץ",
  n."תלמיד תושב",
  n."תלמיד תושב לומד בחוץ",
  n."תלמיד במוסד ברשות",
  n."לא במרשם אוכלוסין",
  n."הערות",
  n."שכבה וכיתה בפועל",
  n."מגבלה רפואית",
  n."קופת חולים תלמיד",
  n."הערה",
  n."אגרת חוץ",
  n."לידה עד 3",
  n."גן חובה 4-6",
  n."קידום נוער",
  n."תלמידי תמת",
  n."חינוך ביתי",
  n."קבצים מצורפים",
  n."סטטוס היל""ה",
  n."מפונים לבירור",
  n."מפונים מאושרים",
  n."בעיית ישוב מגורים לבירור"
FROM talmidim_kesher k
LEFT JOIN talmidim_nospim n
  ON k."מספר זהות" = n."מספר זהות תוספתי"
  AND k.council_id = n.council_id;
