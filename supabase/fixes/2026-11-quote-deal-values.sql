-- ==============================================================================
-- One-time data fix (2026-11): quote budgets converted to absurd deal values.
--
-- Before the fix in frontend/src/api/client.js, "Convert to Deal" removed every
-- non-digit from the budget text, so
--     "$500 – $2,000"   became 5002000
--     "$2,000 – $5,000" became 20005000
-- inflating "Total Pipeline". This repairs only leads that still carry exactly
-- those two values, so any deal value you edited by hand is left alone.
--
-- Run in the Supabase SQL Editor. Step 1 is a read-only preview; run step 2 after
-- checking the preview. Safe to run more than once.
-- ==============================================================================

-- 1. Preview: which leads would change, and to what
SELECT l.id, l.name, q.budget, l.deal_value AS current_value,
       CASE q.budget
         WHEN '$500 – $2,000'   THEN 1250
         WHEN '$2,000 – $5,000' THEN 3500
       END AS corrected_value
FROM public.crm_leads l
JOIN public.quote_requests q ON q.id = l.quote_request_id
WHERE l.deal_value IN (5002000, 20005000)
  AND q.budget IN ('$500 – $2,000', '$2,000 – $5,000');

-- 2. Apply
UPDATE public.crm_leads l
SET deal_value = CASE q.budget
                   WHEN '$500 – $2,000'   THEN 1250
                   WHEN '$2,000 – $5,000' THEN 3500
                 END,
    updated_at = TIMEZONE('utc', NOW())
FROM public.quote_requests q
WHERE q.id = l.quote_request_id
  AND l.deal_value IN (5002000, 20005000)
  AND q.budget IN ('$500 – $2,000', '$2,000 – $5,000');
