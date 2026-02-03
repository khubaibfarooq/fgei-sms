<?php

use Illuminate\Database\Migrations\Migration;
use Illuminate\Support\Facades\DB;

return new class extends Migration
{
    /**
     * Run the migrations.
     * Creates triggers for: funds, fund_heads, fund_helds, transactions, donations
     */
    public function up(): void
    {
        // ========================================
        // FUNDS TABLE TRIGGERS
        // ========================================
        
        // INSERT Trigger (with added_by tracking)
        DB::unprepared('DROP TRIGGER IF EXISTS funds_after_insert');
        DB::unprepared('
            CREATE TRIGGER funds_after_insert
            AFTER INSERT ON funds
            FOR EACH ROW
            BEGIN
                INSERT INTO audit_logs (table_name, record_id, action, new_values, changed_by, changed_at)
                VALUES (
                    "funds",
                    NEW.id,
                    "INSERT",
                    JSON_OBJECT(
                        "id", NEW.id,
                        "fund_head_id", NEW.fund_head_id,
                        "amount", NEW.amount,
                        "status", NEW.status,
                        "description", NEW.description,
                        "type", NEW.type,
                        "added_by", NEW.added_by,
                        "created_at", NEW.created_at,
                        "updated_at", NEW.updated_at
                    ),
                    NEW.added_by,
                    NOW()
                );
            END
        ');

        // UPDATE Trigger (with added_by tracking)
        DB::unprepared('DROP TRIGGER IF EXISTS funds_after_update');
        DB::unprepared('
            CREATE TRIGGER funds_after_update
            AFTER UPDATE ON funds
            FOR EACH ROW
            BEGIN
                INSERT INTO audit_logs (table_name, record_id, action, old_values, new_values, changed_by, changed_at)
                VALUES (
                    "funds",
                    NEW.id,
                    "UPDATE",
                    JSON_OBJECT(
                        "id", OLD.id,
                        "fund_head_id", OLD.fund_head_id,
                        "amount", OLD.amount,
                        "status", OLD.status,
                        "description", OLD.description,
                        "type", OLD.type,
                        "added_by", OLD.added_by,
                        "created_at", OLD.created_at,
                        "updated_at", OLD.updated_at
                    ),
                    JSON_OBJECT(
                        "id", NEW.id,
                        "fund_head_id", NEW.fund_head_id,
                        "amount", NEW.amount,
                        "status", NEW.status,
                        "description", NEW.description,
                        "type", NEW.type,
                        "added_by", NEW.added_by,
                        "created_at", NEW.created_at,
                        "updated_at", NEW.updated_at
                    ),
                    NEW.added_by,
                    NOW()
                );
            END
        ');

        // DELETE Trigger (with added_by tracking)
        DB::unprepared('DROP TRIGGER IF EXISTS funds_after_delete');
        DB::unprepared('
            CREATE TRIGGER funds_after_delete
            AFTER DELETE ON funds
            FOR EACH ROW
            BEGIN
                INSERT INTO audit_logs (table_name, record_id, action, old_values, changed_by, changed_at)
                VALUES (
                    "funds",
                    OLD.id,
                    "DELETE",
                    JSON_OBJECT(
                        "id", OLD.id,
                        "fund_head_id", OLD.fund_head_id,
                        "amount", OLD.amount,
                        "status", OLD.status,
                        "description", OLD.description,
                        "type", OLD.type,
                        "added_by", OLD.added_by,
                        "created_at", OLD.created_at,
                        "updated_at", OLD.updated_at
                    ),
                    OLD.added_by,
                    NOW()
                );
            END
        ');

        // ========================================
        // FUND_HEADS TABLE TRIGGERS
        // ========================================
        
        // INSERT Trigger
        DB::unprepared('DROP TRIGGER IF EXISTS fund_heads_after_insert');
        DB::unprepared('
            CREATE TRIGGER fund_heads_after_insert
            AFTER INSERT ON fund_heads
            FOR EACH ROW
            BEGIN
                INSERT INTO audit_logs (table_name, record_id, action, new_values, changed_at)
                VALUES (
                    "fund_heads",
                    NEW.id,
                    "INSERT",
                    JSON_OBJECT(
                        "id", NEW.id,
                        "name", NEW.name,
                        "parent_id", NEW.parent_id,
                        "created_at", NEW.created_at,
                        "updated_at", NEW.updated_at
                    ),
                    NOW()
                );
            END
        ');

        // UPDATE Trigger
        DB::unprepared('DROP TRIGGER IF EXISTS fund_heads_after_update');
        DB::unprepared('
            CREATE TRIGGER fund_heads_after_update
            AFTER UPDATE ON fund_heads
            FOR EACH ROW
            BEGIN
                INSERT INTO audit_logs (table_name, record_id, action, old_values, new_values, changed_at)
                VALUES (
                    "fund_heads",
                    NEW.id,
                    "UPDATE",
                    JSON_OBJECT(
                        "id", OLD.id,
                        "name", OLD.name,
                        "parent_id", OLD.parent_id,
                        "created_at", OLD.created_at,
                        "updated_at", OLD.updated_at
                    ),
                    JSON_OBJECT(
                        "id", NEW.id,
                        "name", NEW.name,
                        "parent_id", NEW.parent_id,
                        "created_at", NEW.created_at,
                        "updated_at", NEW.updated_at
                    ),
                    NOW()
                );
            END
        ');

        // DELETE Trigger
        DB::unprepared('DROP TRIGGER IF EXISTS fund_heads_after_delete');
        DB::unprepared('
            CREATE TRIGGER fund_heads_after_delete
            AFTER DELETE ON fund_heads
            FOR EACH ROW
            BEGIN
                INSERT INTO audit_logs (table_name, record_id, action, old_values, changed_at)
                VALUES (
                    "fund_heads",
                    OLD.id,
                    "DELETE",
                    JSON_OBJECT(
                        "id", OLD.id,
                        "name", OLD.name,
                        "parent_id", OLD.parent_id,
                        "created_at", OLD.created_at,
                        "updated_at", OLD.updated_at
                    ),
                    NOW()
                );
            END
        ');

        // ========================================
        // FUND_HELDS TABLE TRIGGERS
        // ========================================
        
        // INSERT Trigger (with added_by tracking)
        DB::unprepared('DROP TRIGGER IF EXISTS fund_helds_after_insert');
        DB::unprepared('
            CREATE TRIGGER fund_helds_after_insert
            AFTER INSERT ON fund_helds
            FOR EACH ROW
            BEGIN
                INSERT INTO audit_logs (table_name, record_id, action, new_values, changed_by, changed_at)
                VALUES (
                    "fund_helds",
                    NEW.id,
                    "INSERT",
                    JSON_OBJECT(
                        "id", NEW.id,
                        "institute_id", NEW.institute_id,
                        "fund_head_id", NEW.fund_head_id,
                        "balance", NEW.balance,
                        "added_by", NEW.added_by,
                        "created_at", NEW.created_at,
                        "updated_at", NEW.updated_at
                    ),
                    NEW.added_by,
                    NOW()
                );
            END
        ');

        // UPDATE Trigger (with added_by tracking)
        DB::unprepared('DROP TRIGGER IF EXISTS fund_helds_after_update');
        DB::unprepared('
            CREATE TRIGGER fund_helds_after_update
            AFTER UPDATE ON fund_helds
            FOR EACH ROW
            BEGIN
                INSERT INTO audit_logs (table_name, record_id, action, old_values, new_values, changed_by, changed_at)
                VALUES (
                    "fund_helds",
                    NEW.id,
                    "UPDATE",
                    JSON_OBJECT(
                        "id", OLD.id,
                        "institute_id", OLD.institute_id,
                        "fund_head_id", OLD.fund_head_id,
                        "balance", OLD.balance,
                        "added_by", OLD.added_by,
                        "created_at", OLD.created_at,
                        "updated_at", OLD.updated_at
                    ),
                    JSON_OBJECT(
                        "id", NEW.id,
                        "institute_id", NEW.institute_id,
                        "fund_head_id", NEW.fund_head_id,
                        "balance", NEW.balance,
                        "added_by", NEW.added_by,
                        "created_at", NEW.created_at,
                        "updated_at", NEW.updated_at
                    ),
                    NEW.added_by,
                    NOW()
                );
            END
        ');

        // DELETE Trigger (with added_by tracking)
        DB::unprepared('DROP TRIGGER IF EXISTS fund_helds_after_delete');
        DB::unprepared('
            CREATE TRIGGER fund_helds_after_delete
            AFTER DELETE ON fund_helds
            FOR EACH ROW
            BEGIN
                INSERT INTO audit_logs (table_name, record_id, action, old_values, changed_by, changed_at)
                VALUES (
                    "fund_helds",
                    OLD.id,
                    "DELETE",
                    JSON_OBJECT(
                        "id", OLD.id,
                        "institute_id", OLD.institute_id,
                        "fund_head_id", OLD.fund_head_id,
                        "balance", OLD.balance,
                        "added_by", OLD.added_by,
                        "created_at", OLD.created_at,
                        "updated_at", OLD.updated_at
                    ),
                    OLD.added_by,
                    NOW()
                );
            END
        ');

        // ========================================
        // TRANSACTIONS TABLE TRIGGERS
        // ========================================
        
        // INSERT Trigger (with added_by tracking)
        DB::unprepared('DROP TRIGGER IF EXISTS transactions_after_insert');
        DB::unprepared('
            CREATE TRIGGER transactions_after_insert
            AFTER INSERT ON transactions
            FOR EACH ROW
            BEGIN
                INSERT INTO audit_logs (table_name, record_id, action, new_values, changed_by, changed_at)
                VALUES (
                    "transactions",
                    NEW.id,
                    "INSERT",
                    JSON_OBJECT(
                        "id", NEW.id,
                        "institute_id", NEW.institute_id,
                        "added_by", NEW.added_by,
                        "total_amount", NEW.total_amount,
                        "type", NEW.type,
                        "status", NEW.status,
                        "bill_img", NEW.bill_img,
                        "approved_by", NEW.approved_by,
                        "created_at", NEW.created_at,
                        "updated_at", NEW.updated_at
                    ),
                    NEW.added_by,
                    NOW()
                );
            END
        ');

        // UPDATE Trigger (with approved_by or added_by tracking)
        DB::unprepared('DROP TRIGGER IF EXISTS transactions_after_update');
        DB::unprepared('
            CREATE TRIGGER transactions_after_update
            AFTER UPDATE ON transactions
            FOR EACH ROW
            BEGIN
                INSERT INTO audit_logs (table_name, record_id, action, old_values, new_values, changed_by, changed_at)
                VALUES (
                    "transactions",
                    NEW.id,
                    "UPDATE",
                    JSON_OBJECT(
                        "id", OLD.id,
                        "institute_id", OLD.institute_id,
                        "added_by", OLD.added_by,
                        "total_amount", OLD.total_amount,
                        "type", OLD.type,
                        "status", OLD.status,
                        "bill_img", OLD.bill_img,
                        "approved_by", OLD.approved_by,
                        "created_at", OLD.created_at,
                        "updated_at", OLD.updated_at
                    ),
                    JSON_OBJECT(
                        "id", NEW.id,
                        "institute_id", NEW.institute_id,
                        "added_by", NEW.added_by,
                        "total_amount", NEW.total_amount,
                        "type", NEW.type,
                        "status", NEW.status,
                        "bill_img", NEW.bill_img,
                        "approved_by", NEW.approved_by,
                        "created_at", NEW.created_at,
                        "updated_at", NEW.updated_at
                    ),
                    COALESCE(NEW.approved_by, NEW.added_by),
                    NOW()
                );
            END
        ');

        // DELETE Trigger (with approved_by or added_by tracking)
        DB::unprepared('DROP TRIGGER IF EXISTS transactions_after_delete');
        DB::unprepared('
            CREATE TRIGGER transactions_after_delete
            AFTER DELETE ON transactions
            FOR EACH ROW
            BEGIN
                INSERT INTO audit_logs (table_name, record_id, action, old_values, changed_by, changed_at)
                VALUES (
                    "transactions",
                    OLD.id,
                    "DELETE",
                    JSON_OBJECT(
                        "id", OLD.id,
                        "institute_id", OLD.institute_id,
                        "added_by", OLD.added_by,
                        "total_amount", OLD.total_amount,
                        "type", OLD.type,
                        "status", OLD.status,
                        "bill_img", OLD.bill_img,
                        "approved_by", OLD.approved_by,
                        "created_at", OLD.created_at,
                        "updated_at", OLD.updated_at
                    ),
                    COALESCE(OLD.approved_by, OLD.added_by),
                    NOW()
                );
            END
        ');

        // ========================================
        // DONATIONS TABLE TRIGGERS
        // ========================================
        
        // INSERT Trigger
        DB::unprepared('DROP TRIGGER IF EXISTS donations_after_insert');
        DB::unprepared('
            CREATE TRIGGER donations_after_insert
            AFTER INSERT ON donations
            FOR EACH ROW
            BEGIN
                INSERT INTO audit_logs (table_name, record_id, action, new_values, changed_at)
                VALUES (
                    "donations",
                    NEW.id,
                    "INSERT",
                    JSON_OBJECT(
                        "id", NEW.id,
                        "details", NEW.details,
                        "amount", NEW.amount,
                        "donation_type_id", NEW.donation_type_id,
                        "institute_id", NEW.institute_id,
                        "added_date", NEW.added_date,
                        "created_at", NEW.created_at,
                        "updated_at", NEW.updated_at
                    ),
                    NOW()
                );
            END
        ');

        // UPDATE Trigger
        DB::unprepared('DROP TRIGGER IF EXISTS donations_after_update');
        DB::unprepared('
            CREATE TRIGGER donations_after_update
            AFTER UPDATE ON donations
            FOR EACH ROW
            BEGIN
                INSERT INTO audit_logs (table_name, record_id, action, old_values, new_values, changed_at)
                VALUES (
                    "donations",
                    NEW.id,
                    "UPDATE",
                    JSON_OBJECT(
                        "id", OLD.id,
                        "details", OLD.details,
                        "amount", OLD.amount,
                        "donation_type_id", OLD.donation_type_id,
                        "institute_id", OLD.institute_id,
                        "added_date", OLD.added_date,
                        "created_at", OLD.created_at,
                        "updated_at", OLD.updated_at
                    ),
                    JSON_OBJECT(
                        "id", NEW.id,
                        "details", NEW.details,
                        "amount", NEW.amount,
                        "donation_type_id", NEW.donation_type_id,
                        "institute_id", NEW.institute_id,
                        "added_date", NEW.added_date,
                        "created_at", NEW.created_at,
                        "updated_at", NEW.updated_at
                    ),
                    NOW()
                );
            END
        ');

        // DELETE Trigger
        DB::unprepared('DROP TRIGGER IF EXISTS donations_after_delete');
        DB::unprepared('
            CREATE TRIGGER donations_after_delete
            AFTER DELETE ON donations
            FOR EACH ROW
            BEGIN
                INSERT INTO audit_logs (table_name, record_id, action, old_values, changed_at)
                VALUES (
                    "donations",
                    OLD.id,
                    "DELETE",
                    JSON_OBJECT(
                        "id", OLD.id,
                        "details", OLD.details,
                        "amount", OLD.amount,
                        "donation_type_id", OLD.donation_type_id,
                        "institute_id", OLD.institute_id,
                        "added_date", OLD.added_date,
                        "created_at", OLD.created_at,
                        "updated_at", OLD.updated_at
                    ),
                    NOW()
                );
            END
        ');
    }

    /**
     * Reverse the migrations.
     */
    public function down(): void
    {
        // Drop Financial triggers
        DB::unprepared('DROP TRIGGER IF EXISTS funds_after_insert');
        DB::unprepared('DROP TRIGGER IF EXISTS funds_after_update');
        DB::unprepared('DROP TRIGGER IF EXISTS funds_after_delete');

        DB::unprepared('DROP TRIGGER IF EXISTS fund_heads_after_insert');
        DB::unprepared('DROP TRIGGER IF EXISTS fund_heads_after_update');
        DB::unprepared('DROP TRIGGER IF EXISTS fund_heads_after_delete');

        DB::unprepared('DROP TRIGGER IF EXISTS fund_helds_after_insert');
        DB::unprepared('DROP TRIGGER IF EXISTS fund_helds_after_update');
        DB::unprepared('DROP TRIGGER IF EXISTS fund_helds_after_delete');

        DB::unprepared('DROP TRIGGER IF EXISTS transactions_after_insert');
        DB::unprepared('DROP TRIGGER IF EXISTS transactions_after_update');
        DB::unprepared('DROP TRIGGER IF EXISTS transactions_after_delete');

        DB::unprepared('DROP TRIGGER IF EXISTS donations_after_insert');
        DB::unprepared('DROP TRIGGER IF EXISTS donations_after_update');
        DB::unprepared('DROP TRIGGER IF EXISTS donations_after_delete');
    }
};
