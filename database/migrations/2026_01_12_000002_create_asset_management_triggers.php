<?php

use Illuminate\Database\Migrations\Migration;
use Illuminate\Support\Facades\DB;

return new class extends Migration
{
    /**
     * Run the migrations.
     * Creates triggers for: assets, asset_categories, institute_assets, asset_transactions
     */
    public function up(): void
    {
        // ========================================
        // ASSETS TABLE TRIGGERS
        // ========================================
        
        // INSERT Trigger
        DB::unprepared('DROP TRIGGER IF EXISTS assets_after_insert');
        DB::unprepared('
            CREATE TRIGGER assets_after_insert
            AFTER INSERT ON assets
            FOR EACH ROW
            BEGIN
                INSERT INTO audit_logs (table_name, record_id, action, new_values, changed_at)
                VALUES (
                    "assets",
                    NEW.id,
                    "INSERT",
                    JSON_OBJECT(
                        "id", NEW.id,
                        "name", NEW.name,
                        "asset_category_id", NEW.asset_category_id,
                        "details", NEW.details,
                        "created_at", NEW.created_at,
                        "updated_at", NEW.updated_at
                    ),
                    NOW()
                );
            END
        ');

        // UPDATE Trigger
        DB::unprepared('DROP TRIGGER IF EXISTS assets_after_update');
        DB::unprepared('
            CREATE TRIGGER assets_after_update
            AFTER UPDATE ON assets
            FOR EACH ROW
            BEGIN
                INSERT INTO audit_logs (table_name, record_id, action, old_values, new_values, changed_at)
                VALUES (
                    "assets",
                    NEW.id,
                    "UPDATE",
                    JSON_OBJECT(
                        "id", OLD.id,
                        "name", OLD.name,
                        "asset_category_id", OLD.asset_category_id,
                        "details", OLD.details,
                        "created_at", OLD.created_at,
                        "updated_at", OLD.updated_at
                    ),
                    JSON_OBJECT(
                        "id", NEW.id,
                        "name", NEW.name,
                        "asset_category_id", NEW.asset_category_id,
                        "details", NEW.details,
                        "created_at", NEW.created_at,
                        "updated_at", NEW.updated_at
                    ),
                    NOW()
                );
            END
        ');

        // DELETE Trigger
        DB::unprepared('DROP TRIGGER IF EXISTS assets_after_delete');
        DB::unprepared('
            CREATE TRIGGER assets_after_delete
            AFTER DELETE ON assets
            FOR EACH ROW
            BEGIN
                INSERT INTO audit_logs (table_name, record_id, action, old_values, changed_at)
                VALUES (
                    "assets",
                    OLD.id,
                    "DELETE",
                    JSON_OBJECT(
                        "id", OLD.id,
                        "name", OLD.name,
                        "asset_category_id", OLD.asset_category_id,
                        "details", OLD.details,
                        "created_at", OLD.created_at,
                        "updated_at", OLD.updated_at
                    ),
                    NOW()
                );
            END
        ');

        // ========================================
        // ASSET_CATEGORIES TABLE TRIGGERS
        // ========================================
        
        // INSERT Trigger
        DB::unprepared('DROP TRIGGER IF EXISTS asset_categories_after_insert');
        DB::unprepared('
            CREATE TRIGGER asset_categories_after_insert
            AFTER INSERT ON asset_categories
            FOR EACH ROW
            BEGIN
                INSERT INTO audit_logs (table_name, record_id, action, new_values, changed_at)
                VALUES (
                    "asset_categories",
                    NEW.id,
                    "INSERT",
                    JSON_OBJECT(
                        "id", NEW.id,
                        "name", NEW.name,
                        "created_at", NEW.created_at,
                        "updated_at", NEW.updated_at
                    ),
                    NOW()
                );
            END
        ');

        // UPDATE Trigger
        DB::unprepared('DROP TRIGGER IF EXISTS asset_categories_after_update');
        DB::unprepared('
            CREATE TRIGGER asset_categories_after_update
            AFTER UPDATE ON asset_categories
            FOR EACH ROW
            BEGIN
                INSERT INTO audit_logs (table_name, record_id, action, old_values, new_values, changed_at)
                VALUES (
                    "asset_categories",
                    NEW.id,
                    "UPDATE",
                    JSON_OBJECT(
                        "id", OLD.id,
                        "name", OLD.name,
                        "created_at", OLD.created_at,
                        "updated_at", OLD.updated_at
                    ),
                    JSON_OBJECT(
                        "id", NEW.id,
                        "name", NEW.name,
                        "created_at", NEW.created_at,
                        "updated_at", NEW.updated_at
                    ),
                    NOW()
                );
            END
        ');

        // DELETE Trigger
        DB::unprepared('DROP TRIGGER IF EXISTS asset_categories_after_delete');
        DB::unprepared('
            CREATE TRIGGER asset_categories_after_delete
            AFTER DELETE ON asset_categories
            FOR EACH ROW
            BEGIN
                INSERT INTO audit_logs (table_name, record_id, action, old_values, changed_at)
                VALUES (
                    "asset_categories",
                    OLD.id,
                    "DELETE",
                    JSON_OBJECT(
                        "id", OLD.id,
                        "name", OLD.name,
                        "created_at", OLD.created_at,
                        "updated_at", OLD.updated_at
                    ),
                    NOW()
                );
            END
        ');

        // ========================================
        // INSTITUTE_ASSETS TABLE TRIGGERS
        // ========================================
        
        // INSERT Trigger (with added_by tracking)
        DB::unprepared('DROP TRIGGER IF EXISTS institute_assets_after_insert');
        DB::unprepared('
            CREATE TRIGGER institute_assets_after_insert
            AFTER INSERT ON institute_assets
            FOR EACH ROW
            BEGIN
                INSERT INTO audit_logs (table_name, record_id, action, new_values, changed_by, changed_at)
                VALUES (
                    "institute_assets",
                    NEW.id,
                    "INSERT",
                    JSON_OBJECT(
                        "id", NEW.id,
                        "institute_id", NEW.institute_id,
                        "asset_id", NEW.asset_id,
                        "room_id", NEW.room_id,
                        "current_qty", NEW.current_qty,
                        "added_by", NEW.added_by,
                        "added_date", NEW.added_date,
                        "created_at", NEW.created_at,
                        "updated_at", NEW.updated_at
                    ),
                    NEW.added_by,
                    NOW()
                );
            END
        ');

        // UPDATE Trigger (with added_by tracking)
        DB::unprepared('DROP TRIGGER IF EXISTS institute_assets_after_update');
        DB::unprepared('
            CREATE TRIGGER institute_assets_after_update
            AFTER UPDATE ON institute_assets
            FOR EACH ROW
            BEGIN
                INSERT INTO audit_logs (table_name, record_id, action, old_values, new_values, changed_by, changed_at)
                VALUES (
                    "institute_assets",
                    NEW.id,
                    "UPDATE",
                    JSON_OBJECT(
                        "id", OLD.id,
                        "institute_id", OLD.institute_id,
                        "asset_id", OLD.asset_id,
                        "room_id", OLD.room_id,
                        "current_qty", OLD.current_qty,
                        "added_by", OLD.added_by,
                        "added_date", OLD.added_date,
                        "created_at", OLD.created_at,
                        "updated_at", OLD.updated_at
                    ),
                    JSON_OBJECT(
                        "id", NEW.id,
                        "institute_id", NEW.institute_id,
                        "asset_id", NEW.asset_id,
                        "room_id", NEW.room_id,
                        "current_qty", NEW.current_qty,
                        "added_by", NEW.added_by,
                        "added_date", NEW.added_date,
                        "created_at", NEW.created_at,
                        "updated_at", NEW.updated_at
                    ),
                    NEW.added_by,
                    NOW()
                );
            END
        ');

        // DELETE Trigger (with added_by tracking)
        DB::unprepared('DROP TRIGGER IF EXISTS institute_assets_after_delete');
        DB::unprepared('
            CREATE TRIGGER institute_assets_after_delete
            AFTER DELETE ON institute_assets
            FOR EACH ROW
            BEGIN
                INSERT INTO audit_logs (table_name, record_id, action, old_values, changed_by, changed_at)
                VALUES (
                    "institute_assets",
                    OLD.id,
                    "DELETE",
                    JSON_OBJECT(
                        "id", OLD.id,
                        "institute_id", OLD.institute_id,
                        "asset_id", OLD.asset_id,
                        "room_id", OLD.room_id,
                        "current_qty", OLD.current_qty,
                        "added_by", OLD.added_by,
                        "added_date", OLD.added_date,
                        "created_at", OLD.created_at,
                        "updated_at", OLD.updated_at
                    ),
                    OLD.added_by,
                    NOW()
                );
            END
        ');

        // ========================================
        // ASSET_TRANSACTIONS TABLE TRIGGERS
        // ========================================
        
        // INSERT Trigger (with added_by tracking)
        DB::unprepared('DROP TRIGGER IF EXISTS asset_transactions_after_insert');
        DB::unprepared('
            CREATE TRIGGER asset_transactions_after_insert
            AFTER INSERT ON asset_transactions
            FOR EACH ROW
            BEGIN
                INSERT INTO audit_logs (table_name, record_id, action, new_values, changed_by, changed_at)
                VALUES (
                    "asset_transactions",
                    NEW.id,
                    "INSERT",
                    JSON_OBJECT(
                        "id", NEW.id,
                        "institute_id", NEW.institute_id,
                        "institute_asset_id", NEW.institute_asset_id,
                        "qty", NEW.qty,
                        "details", NEW.details,
                        "status", NEW.status,
                        "added_by", NEW.added_by,
                        "added_date", NEW.added_date,
                        "approved_date", NEW.approved_date,
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
        DB::unprepared('DROP TRIGGER IF EXISTS asset_transactions_after_update');
        DB::unprepared('
            CREATE TRIGGER asset_transactions_after_update
            AFTER UPDATE ON asset_transactions
            FOR EACH ROW
            BEGIN
                INSERT INTO audit_logs (table_name, record_id, action, old_values, new_values, changed_by, changed_at)
                VALUES (
                    "asset_transactions",
                    NEW.id,
                    "UPDATE",
                    JSON_OBJECT(
                        "id", OLD.id,
                        "institute_id", OLD.institute_id,
                        "institute_asset_id", OLD.institute_asset_id,
                        "qty", OLD.qty,
                        "details", OLD.details,
                        "status", OLD.status,
                        "added_by", OLD.added_by,
                        "added_date", OLD.added_date,
                        "approved_date", OLD.approved_date,
                        "approved_by", OLD.approved_by,
                        "created_at", OLD.created_at,
                        "updated_at", OLD.updated_at
                    ),
                    JSON_OBJECT(
                        "id", NEW.id,
                        "institute_id", NEW.institute_id,
                        "institute_asset_id", NEW.institute_asset_id,
                        "qty", NEW.qty,
                        "details", NEW.details,
                        "status", NEW.status,
                        "added_by", NEW.added_by,
                        "added_date", NEW.added_date,
                        "approved_date", NEW.approved_date,
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
        DB::unprepared('DROP TRIGGER IF EXISTS asset_transactions_after_delete');
        DB::unprepared('
            CREATE TRIGGER asset_transactions_after_delete
            AFTER DELETE ON asset_transactions
            FOR EACH ROW
            BEGIN
                INSERT INTO audit_logs (table_name, record_id, action, old_values, changed_by, changed_at)
                VALUES (
                    "asset_transactions",
                    OLD.id,
                    "DELETE",
                    JSON_OBJECT(
                        "id", OLD.id,
                        "institute_id", OLD.institute_id,
                        "institute_asset_id", OLD.institute_asset_id,
                        "qty", OLD.qty,
                        "details", OLD.details,
                        "status", OLD.status,
                        "added_by", OLD.added_by,
                        "added_date", OLD.added_date,
                        "approved_date", OLD.approved_date,
                        "approved_by", OLD.approved_by,
                        "created_at", OLD.created_at,
                        "updated_at", OLD.updated_at
                    ),
                    COALESCE(OLD.approved_by, OLD.added_by),
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
        // Drop Asset Management triggers
        DB::unprepared('DROP TRIGGER IF EXISTS assets_after_insert');
        DB::unprepared('DROP TRIGGER IF EXISTS assets_after_update');
        DB::unprepared('DROP TRIGGER IF EXISTS assets_after_delete');

        DB::unprepared('DROP TRIGGER IF EXISTS asset_categories_after_insert');
        DB::unprepared('DROP TRIGGER IF EXISTS asset_categories_after_update');
        DB::unprepared('DROP TRIGGER IF EXISTS asset_categories_after_delete');

        DB::unprepared('DROP TRIGGER IF EXISTS institute_assets_after_insert');
        DB::unprepared('DROP TRIGGER IF EXISTS institute_assets_after_update');
        DB::unprepared('DROP TRIGGER IF EXISTS institute_assets_after_delete');

        DB::unprepared('DROP TRIGGER IF EXISTS asset_transactions_after_insert');
        DB::unprepared('DROP TRIGGER IF EXISTS asset_transactions_after_update');
        DB::unprepared('DROP TRIGGER IF EXISTS asset_transactions_after_delete');
    }
};
