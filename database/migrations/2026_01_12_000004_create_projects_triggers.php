<?php

use Illuminate\Database\Migrations\Migration;
use Illuminate\Support\Facades\DB;

return new class extends Migration
{
    /**
     * Run the migrations.
     * Creates triggers for: projects, project_types, milestones, approval_stages, project_approvals
     */
    public function up(): void
    {
        // ========================================
        // PROJECTS TABLE TRIGGERS
        // ========================================
        
        // INSERT Trigger
        DB::unprepared('DROP TRIGGER IF EXISTS projects_after_insert');
        DB::unprepared('
            CREATE TRIGGER projects_after_insert
            AFTER INSERT ON projects
            FOR EACH ROW
            BEGIN
                INSERT INTO audit_logs (table_name, record_id, action, new_values, changed_at)
                VALUES (
                    "projects",
                    NEW.id,
                    "INSERT",
                    JSON_OBJECT(
                        "id", NEW.id,
                        "name", NEW.name,
                        "project_type_id", NEW.project_type_id,
                        "estimated_cost", NEW.estimated_cost,
                        "actual_cost", NEW.actual_cost,
                        "changed_by", NEW.submitted_by,
                        "status", NEW.status,
                        "created_at", NEW.created_at,
                        "updated_at", NEW.updated_at
                    ),
                    NOW()
                );
            END
        ');

        // UPDATE Trigger
        DB::unprepared('DROP TRIGGER IF EXISTS projects_after_update');
        DB::unprepared('
            CREATE TRIGGER projects_after_update
            AFTER UPDATE ON projects
            FOR EACH ROW
            BEGIN
                INSERT INTO audit_logs (table_name, record_id, action, old_values, new_values, changed_at)
                VALUES (
                    "projects",
                    NEW.id,
                    "UPDATE",
                    JSON_OBJECT(
                        "id", OLD.id,
                        "name", OLD.name,
                        "project_type_id", OLD.project_type_id,
                        "estimated_cost", OLD.estimated_cost,
                        "actual_cost", OLD.actual_cost,
                        "changed_by", OLD.submitted_by,
                        "status", OLD.status,
                        "created_at", OLD.created_at,
                        "updated_at", OLD.updated_at
                    ),
                    JSON_OBJECT(
                        "id", NEW.id,
                        "name", NEW.name,
                        "project_type_id", NEW.project_type_id,
                        "estimated_cost", NEW.estimated_cost,
                        "actual_cost", NEW.actual_cost,
                        "changed_by", NEW.submitted_by,
                        "status", NEW.status,
                        "created_at", NEW.created_at,
                        "updated_at", NEW.updated_at
                    ),
                    NOW()
                );
            END
        ');

        // DELETE Trigger
        DB::unprepared('DROP TRIGGER IF EXISTS projects_after_delete');
        DB::unprepared('
            CREATE TRIGGER projects_after_delete
            AFTER DELETE ON projects
            FOR EACH ROW
            BEGIN
                INSERT INTO audit_logs (table_name, record_id, action, old_values, changed_at)
                VALUES (
                    "projects",
                    OLD.id,
                    "DELETE",
                    JSON_OBJECT(
                        "id", OLD.id,
                        "name", OLD.name,
                        "project_type_id", OLD.project_type_id,
                        "estimated_cost", OLD.estimated_cost,
                        "actual_cost", OLD.actual_cost,
                        "changed_by", OLD.submitted_by,
                        "status", OLD.status,
                        "created_at", OLD.created_at,
                        "updated_at", OLD.updated_at
                    ),
                    NOW()
                );
            END
        ');

        // ========================================
        // PROJECT_TYPES TABLE TRIGGERS
        // ========================================
        
        // INSERT Trigger
        DB::unprepared('DROP TRIGGER IF EXISTS project_types_after_insert');
        DB::unprepared('
            CREATE TRIGGER project_types_after_insert
            AFTER INSERT ON project_types
            FOR EACH ROW
            BEGIN
                INSERT INTO audit_logs (table_name, record_id, action, new_values, changed_at)
                VALUES (
                    "project_types",
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
        DB::unprepared('DROP TRIGGER IF EXISTS project_types_after_update');
        DB::unprepared('
            CREATE TRIGGER project_types_after_update
            AFTER UPDATE ON project_types
            FOR EACH ROW
            BEGIN
                INSERT INTO audit_logs (table_name, record_id, action, old_values, new_values, changed_at)
                VALUES (
                    "project_types",
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
        DB::unprepared('DROP TRIGGER IF EXISTS project_types_after_delete');
        DB::unprepared('
            CREATE TRIGGER project_types_after_delete
            AFTER DELETE ON project_types
            FOR EACH ROW
            BEGIN
                INSERT INTO audit_logs (table_name, record_id, action, old_values, changed_at)
                VALUES (
                    "project_types",
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
        // MILESTONES TABLE TRIGGERS
        // ========================================
        
        // INSERT Trigger (with added_by tracking)
        DB::unprepared('DROP TRIGGER IF EXISTS milestones_after_insert');
        DB::unprepared('
            CREATE TRIGGER milestones_after_insert
            AFTER INSERT ON milestones
            FOR EACH ROW
            BEGIN
                INSERT INTO audit_logs (table_name, record_id, action, new_values, changed_by, changed_at)
                VALUES (
                    "milestones",
                    NEW.id,
                    "INSERT",
                    JSON_OBJECT(
                        "id", NEW.id,
                        "name", NEW.name,
                        "description", NEW.description,
                        "days", NEW.days,
                        "project_id", NEW.project_id,
                        "status", NEW.status,
                        "completed_date", NEW.completed_date,
                        "img", NEW.img,
                        "amount", NEW.amount,
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
        DB::unprepared('DROP TRIGGER IF EXISTS milestones_after_update');
        DB::unprepared('
            CREATE TRIGGER milestones_after_update
            AFTER UPDATE ON milestones
            FOR EACH ROW
            BEGIN
                INSERT INTO audit_logs (table_name, record_id, action, old_values, new_values, changed_by, changed_at)
                VALUES (
                    "milestones",
                    NEW.id,
                    "UPDATE",
                    JSON_OBJECT(
                        "id", OLD.id,
                        "name", OLD.name,
                        "description", OLD.description,
                        "days", OLD.days,
                        "project_id", OLD.project_id,
                        "status", OLD.status,
                        "completed_date", OLD.completed_date,
                        "img", OLD.img,
                        "amount", OLD.amount,
                        "added_by", OLD.added_by,
                        "created_at", OLD.created_at,
                        "updated_at", OLD.updated_at
                    ),
                    JSON_OBJECT(
                        "id", NEW.id,
                        "name", NEW.name,
                        "description", NEW.description,
                        "days", NEW.days,
                        "project_id", NEW.project_id,
                        "status", NEW.status,
                        "completed_date", NEW.completed_date,
                        "img", NEW.img,
                        "amount", NEW.amount,
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
        DB::unprepared('DROP TRIGGER IF EXISTS milestones_after_delete');
        DB::unprepared('
            CREATE TRIGGER milestones_after_delete
            AFTER DELETE ON milestones
            FOR EACH ROW
            BEGIN
                INSERT INTO audit_logs (table_name, record_id, action, old_values, changed_by, changed_at)
                VALUES (
                    "milestones",
                    OLD.id,
                    "DELETE",
                    JSON_OBJECT(
                        "id", OLD.id,
                        "name", OLD.name,
                        "description", OLD.description,
                        "days", OLD.days,
                        "project_id", OLD.project_id,
                        "status", OLD.status,
                        "completed_date", OLD.completed_date,
                        "img", OLD.img,
                        "amount", OLD.amount,
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
        // APPROVAL_STAGES TABLE TRIGGERS
        // ========================================
        
        // INSERT Trigger
        DB::unprepared('DROP TRIGGER IF EXISTS approval_stages_after_insert');
        DB::unprepared('
            CREATE TRIGGER approval_stages_after_insert
            AFTER INSERT ON approval_stages
            FOR EACH ROW
            BEGIN
                INSERT INTO audit_logs (table_name, record_id, action, new_values, changed_at)
                VALUES (
                    "approval_stages",
                    NEW.id,
                    "INSERT",
                    JSON_OBJECT(
                        "id", NEW.id,
                        "stage_name", NEW.stage_name,
                        "fund_head_id", NEW.fund_head_id,
                        "stage_order", NEW.stage_order,
                        "description", NEW.description,
                        "is_mandatory", NEW.is_mandatory,
                        "users_can_approve", NEW.users_can_approve,
                        "created_at", NEW.created_at,
                        "updated_at", NEW.updated_at
                    ),
                    NOW()
                );
            END
        ');

        // UPDATE Trigger
        DB::unprepared('DROP TRIGGER IF EXISTS approval_stages_after_update');
        DB::unprepared('
            CREATE TRIGGER approval_stages_after_update
            AFTER UPDATE ON approval_stages
            FOR EACH ROW
            BEGIN
                INSERT INTO audit_logs (table_name, record_id, action, old_values, new_values, changed_at)
                VALUES (
                    "approval_stages",
                    NEW.id,
                    "UPDATE",
                    JSON_OBJECT(
                        "id", OLD.id,
                        "stage_name", OLD.stage_name,
                        "fund_head_id", OLD.fund_head_id,
                        "stage_order", OLD.stage_order,
                        "description", OLD.description,
                        "is_mandatory", OLD.is_mandatory,
                        "users_can_approve", OLD.users_can_approve,
                        "created_at", OLD.created_at,
                        "updated_at", OLD.updated_at
                    ),
                    JSON_OBJECT(
                        "id", NEW.id,
                        "stage_name", NEW.stage_name,
                        "fund_head_id", NEW.fund_head_id,
                        "stage_order", NEW.stage_order,
                        "description", NEW.description,
                        "is_mandatory", NEW.is_mandatory,
                        "users_can_approve", NEW.users_can_approve,
                        "created_at", NEW.created_at,
                        "updated_at", NEW.updated_at
                    ),
                    NOW()
                );
            END
        ');

        // DELETE Trigger
        DB::unprepared('DROP TRIGGER IF EXISTS approval_stages_after_delete');
        DB::unprepared('
            CREATE TRIGGER approval_stages_after_delete
            AFTER DELETE ON approval_stages
            FOR EACH ROW
            BEGIN
                INSERT INTO audit_logs (table_name, record_id, action, old_values, changed_at)
                VALUES (
                    "approval_stages",
                    OLD.id,
                    "DELETE",
                    JSON_OBJECT(
                        "id", OLD.id,
                        "stage_name", OLD.stage_name,
                        "fund_head_id", OLD.fund_head_id,
                        "stage_order", OLD.stage_order,
                        "description", OLD.description,
                        "is_mandatory", OLD.is_mandatory,
                        "users_can_approve", OLD.users_can_approve,
                        "created_at", OLD.created_at,
                        "updated_at", OLD.updated_at
                    ),
                    NOW()
                );
            END
        ');

        // ========================================
        // PROJECT_APPROVALS TABLE TRIGGERS
        // ========================================
        
        // INSERT Trigger (with approver_id tracking)
        DB::unprepared('DROP TRIGGER IF EXISTS project_approvals_after_insert');
        DB::unprepared('
            CREATE TRIGGER project_approvals_after_insert
            AFTER INSERT ON project_approvals
            FOR EACH ROW
            BEGIN
                INSERT INTO audit_logs (table_name, record_id, action, new_values, changed_by, changed_at)
                VALUES (
                    "project_approvals",
                    NEW.id,
                    "INSERT",
                    JSON_OBJECT(
                        "id", NEW.id,
                        "project_id", NEW.project_id,
                        "stage_id", NEW.stage_id,
                        "approver_id", NEW.approver_id,
                        "status", NEW.status,
                        "action_date", NEW.action_date,
                        "comments", NEW.comments,
                        "deadline", NEW.deadline,
                        "created_at", NEW.created_at,
                        "updated_at", NEW.updated_at
                    ),
                    NEW.approver_id,
                    NOW()
                );
            END
        ');

        // UPDATE Trigger (with approver_id tracking)
        DB::unprepared('DROP TRIGGER IF EXISTS project_approvals_after_update');
        DB::unprepared('
            CREATE TRIGGER project_approvals_after_update
            AFTER UPDATE ON project_approvals
            FOR EACH ROW
            BEGIN
                INSERT INTO audit_logs (table_name, record_id, action, old_values, new_values, changed_by, changed_at)
                VALUES (
                    "project_approvals",
                    NEW.id,
                    "UPDATE",
                    JSON_OBJECT(
                        "id", OLD.id,
                        "project_id", OLD.project_id,
                        "stage_id", OLD.stage_id,
                        "approver_id", OLD.approver_id,
                        "status", OLD.status,
                        "action_date", OLD.action_date,
                        "comments", OLD.comments,
                        "deadline", OLD.deadline,
                        "created_at", OLD.created_at,
                        "updated_at", OLD.updated_at
                    ),
                    JSON_OBJECT(
                        "id", NEW.id,
                        "project_id", NEW.project_id,
                        "stage_id", NEW.stage_id,
                        "approver_id", NEW.approver_id,
                        "status", NEW.status,
                        "action_date", NEW.action_date,
                        "comments", NEW.comments,
                        "deadline", NEW.deadline,
                        "created_at", NEW.created_at,
                        "updated_at", NEW.updated_at
                    ),
                    NEW.approver_id,
                    NOW()
                );
            END
        ');

        // DELETE Trigger (with approver_id tracking)
        DB::unprepared('DROP TRIGGER IF EXISTS project_approvals_after_delete');
        DB::unprepared('
            CREATE TRIGGER project_approvals_after_delete
            AFTER DELETE ON project_approvals
            FOR EACH ROW
            BEGIN
                INSERT INTO audit_logs (table_name, record_id, action, old_values, changed_by, changed_at)
                VALUES (
                    "project_approvals",
                    OLD.id,
                    "DELETE",
                    JSON_OBJECT(
                        "id", OLD.id,
                        "project_id", OLD.project_id,
                        "stage_id", OLD.stage_id,
                        "approver_id", OLD.approver_id,
                        "status", OLD.status,
                        "action_date", OLD.action_date,
                        "comments", OLD.comments,
                        "deadline", OLD.deadline,
                        "created_at", OLD.created_at,
                        "updated_at", OLD.updated_at
                    ),
                    OLD.approver_id,
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
        // Drop Projects triggers
        DB::unprepared('DROP TRIGGER IF EXISTS projects_after_insert');
        DB::unprepared('DROP TRIGGER IF EXISTS projects_after_update');
        DB::unprepared('DROP TRIGGER IF EXISTS projects_after_delete');

        DB::unprepared('DROP TRIGGER IF EXISTS project_types_after_insert');
        DB::unprepared('DROP TRIGGER IF EXISTS project_types_after_update');
        DB::unprepared('DROP TRIGGER IF EXISTS project_types_after_delete');

        DB::unprepared('DROP TRIGGER IF EXISTS milestones_after_insert');
        DB::unprepared('DROP TRIGGER IF EXISTS milestones_after_update');
        DB::unprepared('DROP TRIGGER IF EXISTS milestones_after_delete');

        DB::unprepared('DROP TRIGGER IF EXISTS approval_stages_after_insert');
        DB::unprepared('DROP TRIGGER IF EXISTS approval_stages_after_update');
        DB::unprepared('DROP TRIGGER IF EXISTS approval_stages_after_delete');

        DB::unprepared('DROP TRIGGER IF EXISTS project_approvals_after_insert');
        DB::unprepared('DROP TRIGGER IF EXISTS project_approvals_after_update');
        DB::unprepared('DROP TRIGGER IF EXISTS project_approvals_after_delete');
    }
};
