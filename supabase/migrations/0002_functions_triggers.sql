-- ============================================================================
-- Wellspire SMS — Functions & Triggers
-- Migration 0002: keep updated_at fresh, auto-maintain derived state
-- (invoice status/amount, library copy counts), and low-stock signals.
-- ============================================================================

-- Generic updated_at bump ----------------------------------------------------
create or replace function set_updated_at()
returns trigger language plpgsql as $$
begin
  new.updated_at = now();
  return new;
end $$;

do $$
declare t text;
begin
  for t in
    select unnest(array[
      'schools','profiles','academic_years','subjects','teachers','classes',
      'students','guardians','timetable_slots','attendance','fee_structures',
      'fee_invoices','library_books','library_loans','inventory_categories',
      'inventory_items'
    ])
  loop
    execute format(
      'drop trigger if exists trg_%1$s_updated on %1$s;
       create trigger trg_%1$s_updated before update on %1$s
       for each row execute function set_updated_at();', t);
  end loop;
end $$;

-- Recompute an invoice's paid amount + status from its payments ---------------
create or replace function recompute_invoice(p_invoice_id uuid)
returns void language plpgsql as $$
declare
  v_total numeric(12,2);
  v_paid  numeric(12,2);
  v_due   date;
  v_status invoice_status;
begin
  select amount, due_date into v_total, v_due from fee_invoices where id = p_invoice_id;
  if v_total is null then return; end if;

  select coalesce(sum(amount),0) into v_paid from fee_payments where invoice_id = p_invoice_id;

  if v_paid <= 0 then
    v_status := case when v_due < current_date then 'overdue' else 'pending' end;
  elsif v_paid >= v_total then
    v_status := 'paid';
  else
    v_status := case when v_due < current_date then 'overdue' else 'partially_paid' end;
  end if;

  update fee_invoices
    set amount_paid = v_paid, status = v_status, updated_at = now()
    where id = p_invoice_id;
end $$;

create or replace function trg_payment_recompute()
returns trigger language plpgsql as $$
begin
  perform recompute_invoice(coalesce(new.invoice_id, old.invoice_id));
  return coalesce(new, old);
end $$;

drop trigger if exists trg_payments_recompute on fee_payments;
create trigger trg_payments_recompute
  after insert or update or delete on fee_payments
  for each row execute function trg_payment_recompute();

-- Mark overdue invoices (called by cron / API) -------------------------------
create or replace function mark_overdue_invoices()
returns int language plpgsql as $$
declare n int;
begin
  update fee_invoices
     set status = 'overdue', updated_at = now()
   where due_date < current_date
     and status in ('pending','partially_paid');
  get diagnostics n = row_count;
  return n;
end $$;

-- Library: keep available_copies in sync with loans --------------------------
create or replace function trg_loan_adjust_copies()
returns trigger language plpgsql as $$
begin
  if (tg_op = 'INSERT') then
    if new.status = 'issued' then
      update library_books set available_copies = greatest(available_copies - 1, 0)
       where id = new.book_id;
    end if;
  elsif (tg_op = 'UPDATE') then
    -- returning a previously-issued book frees a copy
    if old.status = 'issued' and new.status in ('returned','lost') then
      update library_books set available_copies = least(available_copies + 1, total_copies)
       where id = new.book_id;
    -- re-issuing
    elsif old.status in ('returned','lost') and new.status = 'issued' then
      update library_books set available_copies = greatest(available_copies - 1, 0)
       where id = new.book_id;
    end if;
  elsif (tg_op = 'DELETE') then
    if old.status = 'issued' then
      update library_books set available_copies = least(available_copies + 1, total_copies)
       where id = old.book_id;
    end if;
  end if;
  return coalesce(new, old);
end $$;

drop trigger if exists trg_loans_copies on library_loans;
create trigger trg_loans_copies
  after insert or update or delete on library_loans
  for each row execute function trg_loan_adjust_copies();

-- Mark overdue library loans -------------------------------------------------
create or replace function mark_overdue_loans()
returns int language plpgsql as $$
declare n int;
begin
  update library_loans set status = 'overdue', updated_at = now()
   where status = 'issued' and due_date < current_date;
  get diagnostics n = row_count;
  return n;
end $$;

-- Inventory: apply a stock transaction to the item quantity ------------------
create or replace function trg_inventory_apply()
returns trigger language plpgsql as $$
begin
  if new.type = 'inbound' or new.type = 'returned' then
    update inventory_items set quantity = quantity + new.quantity, updated_at = now()
     where id = new.item_id;
  elsif new.type = 'outbound' or new.type = 'damaged' then
    update inventory_items set quantity = greatest(quantity - new.quantity, 0), updated_at = now()
     where id = new.item_id;
  elsif new.type = 'adjustment' then
    update inventory_items set quantity = new.quantity, updated_at = now()
     where id = new.item_id;
  end if;
  return new;
end $$;

drop trigger if exists trg_inventory_apply on inventory_transactions;
create trigger trg_inventory_apply
  after insert on inventory_transactions
  for each row execute function trg_inventory_apply();

-- Convenience view: dashboard counters (fast single round-trip) --------------
create or replace view v_dashboard_stats as
select
  (select count(*) from students where is_active)                                   as active_students,
  (select count(*) from teachers where is_active)                                   as active_teachers,
  (select count(*) from guardians)                                                  as guardians,
  (select count(*) from classes)                                                    as classes,
  (select coalesce(sum(amount - amount_paid),0)
     from fee_invoices where status in ('pending','partially_paid','overdue'))       as outstanding_fees,
  (select count(*) from fee_invoices where status = 'overdue')                       as overdue_invoices,
  (select count(*) from library_loans where status in ('issued','overdue'))          as active_loans,
  (select count(*) from inventory_items where quantity <= reorder_level)             as low_stock_items;
