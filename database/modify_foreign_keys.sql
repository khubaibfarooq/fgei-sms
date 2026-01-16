-- ============================================================================
-- FGEI-SMS: Modify Foreign Keys with RESTRICT ON DELETE and CASCADE ON UPDATE
-- ============================================================================
-- 
-- IMPORTANT: Run these queries in order. Each block:
--   1. Drops the existing foreign key constraint
--   2. Re-adds it with ON DELETE RESTRICT and ON UPDATE CASCADE
--
-- Before running, backup your database!
-- ============================================================================

-- ============================================================================
-- TABLE: blocks
-- ============================================================================
ALTER TABLE `blocks` DROP FOREIGN KEY `blocks_institute_id_foreign`;
ALTER TABLE `blocks` ADD CONSTRAINT `blocks_institute_id_foreign` 
    FOREIGN KEY (`institute_id`) REFERENCES `institutes` (`id`) 
    ON DELETE RESTRICT ON UPDATE CASCADE;

ALTER TABLE `blocks` DROP FOREIGN KEY `blocks_block_type_id_foreign`;
ALTER TABLE `blocks` ADD CONSTRAINT `blocks_block_type_id_foreign` 
    FOREIGN KEY (`block_type_id`) REFERENCES `block_types` (`id`) 
    ON DELETE RESTRICT ON UPDATE CASCADE;

-- ============================================================================
-- TABLE: rooms
-- ============================================================================
ALTER TABLE `rooms` DROP FOREIGN KEY `rooms_room_type_id_foreign`;
ALTER TABLE `rooms` ADD CONSTRAINT `rooms_room_type_id_foreign` 
    FOREIGN KEY (`room_type_id`) REFERENCES `room_types` (`id`) 
    ON DELETE RESTRICT ON UPDATE CASCADE;

ALTER TABLE `rooms` DROP FOREIGN KEY `rooms_block_id_foreign`;
ALTER TABLE `rooms` ADD CONSTRAINT `rooms_block_id_foreign` 
    FOREIGN KEY (`block_id`) REFERENCES `blocks` (`id`) 
    ON DELETE RESTRICT ON UPDATE CASCADE;

-- ============================================================================
-- TABLE: institute_assets
-- ============================================================================
ALTER TABLE `institute_assets` DROP FOREIGN KEY `institute_assets_institute_id_foreign`;
ALTER TABLE `institute_assets` ADD CONSTRAINT `institute_assets_institute_id_foreign` 
    FOREIGN KEY (`institute_id`) REFERENCES `institutes` (`id`) 
    ON DELETE RESTRICT ON UPDATE CASCADE;

ALTER TABLE `institute_assets` DROP FOREIGN KEY `institute_assets_asset_id_foreign`;
ALTER TABLE `institute_assets` ADD CONSTRAINT `institute_assets_asset_id_foreign` 
    FOREIGN KEY (`asset_id`) REFERENCES `assets` (`id`) 
    ON DELETE RESTRICT ON UPDATE CASCADE;

ALTER TABLE `institute_assets` DROP FOREIGN KEY `institute_assets_room_id_foreign`;
ALTER TABLE `institute_assets` ADD CONSTRAINT `institute_assets_room_id_foreign` 
    FOREIGN KEY (`room_id`) REFERENCES `rooms` (`id`) 
    ON DELETE RESTRICT ON UPDATE CASCADE;

ALTER TABLE `institute_assets` DROP FOREIGN KEY `institute_assets_added_by_foreign`;
ALTER TABLE `institute_assets` ADD CONSTRAINT `institute_assets_added_by_foreign` 
    FOREIGN KEY (`added_by`) REFERENCES `users` (`id`) 
    ON DELETE RESTRICT ON UPDATE CASCADE;

-- ============================================================================
-- TABLE: asset_transactions
-- ============================================================================
ALTER TABLE `asset_transactions` DROP FOREIGN KEY `asset_transactions_institute_id_foreign`;
ALTER TABLE `asset_transactions` ADD CONSTRAINT `asset_transactions_institute_id_foreign` 
    FOREIGN KEY (`institute_id`) REFERENCES `institutes` (`id`) 
    ON DELETE RESTRICT ON UPDATE CASCADE;

ALTER TABLE `asset_transactions` DROP FOREIGN KEY `asset_transactions_institute_asset_id_foreign`;
ALTER TABLE `asset_transactions` ADD CONSTRAINT `asset_transactions_institute_asset_id_foreign` 
    FOREIGN KEY (`institute_asset_id`) REFERENCES `institute_assets` (`id`) 
    ON DELETE RESTRICT ON UPDATE CASCADE;

ALTER TABLE `asset_transactions` DROP FOREIGN KEY `asset_transactions_added_by_foreign`;
ALTER TABLE `asset_transactions` ADD CONSTRAINT `asset_transactions_added_by_foreign` 
    FOREIGN KEY (`added_by`) REFERENCES `users` (`id`) 
    ON DELETE RESTRICT ON UPDATE CASCADE;

ALTER TABLE `asset_transactions` DROP FOREIGN KEY `asset_transactions_approved_by_foreign`;
ALTER TABLE `asset_transactions` ADD CONSTRAINT `asset_transactions_approved_by_foreign` 
    FOREIGN KEY (`approved_by`) REFERENCES `users` (`id`) 
    ON DELETE RESTRICT ON UPDATE CASCADE;

-- ============================================================================
-- TABLE: transports
-- ============================================================================
ALTER TABLE `transports` DROP FOREIGN KEY `transports_vehicle_type_id_foreign`;
ALTER TABLE `transports` ADD CONSTRAINT `transports_vehicle_type_id_foreign` 
    FOREIGN KEY (`vehicle_type_id`) REFERENCES `vehicle_types` (`id`) 
    ON DELETE RESTRICT ON UPDATE CASCADE;

ALTER TABLE `transports` DROP FOREIGN KEY `transports_institute_id_foreign`;
ALTER TABLE `transports` ADD CONSTRAINT `transports_institute_id_foreign` 
    FOREIGN KEY (`institute_id`) REFERENCES `institutes` (`id`) 
    ON DELETE RESTRICT ON UPDATE CASCADE;

-- ============================================================================
-- TABLE: plants
-- ============================================================================
ALTER TABLE `plants` DROP FOREIGN KEY `plants_institute_id_foreign`;
ALTER TABLE `plants` ADD CONSTRAINT `plants_institute_id_foreign` 
    FOREIGN KEY (`institute_id`) REFERENCES `institutes` (`id`) 
    ON DELETE RESTRICT ON UPDATE CASCADE;

-- ============================================================================
-- TABLE: upgradations
-- ============================================================================
ALTER TABLE `upgradations` DROP FOREIGN KEY `upgradations_institute_id_foreign`;
ALTER TABLE `upgradations` ADD CONSTRAINT `upgradations_institute_id_foreign` 
    FOREIGN KEY (`institute_id`) REFERENCES `institutes` (`id`) 
    ON DELETE RESTRICT ON UPDATE CASCADE;

ALTER TABLE `upgradations` DROP FOREIGN KEY `upgradations_added_by_foreign`;
ALTER TABLE `upgradations` ADD CONSTRAINT `upgradations_added_by_foreign` 
    FOREIGN KEY (`added_by`) REFERENCES `users` (`id`) 
    ON DELETE RESTRICT ON UPDATE CASCADE;

ALTER TABLE `upgradations` DROP FOREIGN KEY `upgradations_approved_by_foreign`;
ALTER TABLE `upgradations` ADD CONSTRAINT `upgradations_approved_by_foreign` 
    FOREIGN KEY (`approved_by`) REFERENCES `users` (`id`) 
    ON DELETE RESTRICT ON UPDATE CASCADE;

-- ============================================================================
-- TABLE: shifts
-- ============================================================================
ALTER TABLE `shifts` DROP FOREIGN KEY `shifts_institute_id_foreign`;
ALTER TABLE `shifts` ADD CONSTRAINT `shifts_institute_id_foreign` 
    FOREIGN KEY (`institute_id`) REFERENCES `institutes` (`id`) 
    ON DELETE RESTRICT ON UPDATE CASCADE;

-- ============================================================================
-- TABLE: funds
-- ============================================================================
ALTER TABLE `funds` DROP FOREIGN KEY `funds_fund_head_id_foreign`;
ALTER TABLE `funds` ADD CONSTRAINT `funds_fund_head_id_foreign` 
    FOREIGN KEY (`fund_head_id`) REFERENCES `fund_heads` (`id`) 
    ON DELETE RESTRICT ON UPDATE CASCADE;

ALTER TABLE `funds` DROP FOREIGN KEY `funds_institute_id_foreign`;
ALTER TABLE `funds` ADD CONSTRAINT `funds_institute_id_foreign` 
    FOREIGN KEY (`institute_id`) REFERENCES `institutes` (`id`) 
    ON DELETE RESTRICT ON UPDATE CASCADE;

ALTER TABLE `funds` DROP FOREIGN KEY `funds_added_by_foreign`;
ALTER TABLE `funds` ADD CONSTRAINT `funds_added_by_foreign` 
    FOREIGN KEY (`added_by`) REFERENCES `users` (`id`) 
    ON DELETE RESTRICT ON UPDATE CASCADE;

-- ============================================================================
-- TABLE: fund_helds
-- ============================================================================
ALTER TABLE `fund_helds` DROP FOREIGN KEY `fund_helds_institute_id_foreign`;
ALTER TABLE `fund_helds` ADD CONSTRAINT `fund_helds_institute_id_foreign` 
    FOREIGN KEY (`institute_id`) REFERENCES `institutes` (`id`) 
    ON DELETE RESTRICT ON UPDATE CASCADE;

ALTER TABLE `fund_helds` DROP FOREIGN KEY `fund_helds_fund_head_id_foreign`;
ALTER TABLE `fund_helds` ADD CONSTRAINT `fund_helds_fund_head_id_foreign` 
    FOREIGN KEY (`fund_head_id`) REFERENCES `fund_heads` (`id`) 
    ON DELETE RESTRICT ON UPDATE CASCADE;

-- ============================================================================
-- TABLE: fund_details
-- ============================================================================
ALTER TABLE `fund_details` DROP FOREIGN KEY `fund_details_fund_id_foreign`;
ALTER TABLE `fund_details` ADD CONSTRAINT `fund_details_fund_id_foreign` 
    FOREIGN KEY (`fund_id`) REFERENCES `funds` (`id`) 
    ON DELETE RESTRICT ON UPDATE CASCADE;

ALTER TABLE `fund_details` DROP FOREIGN KEY `fund_details_asset_id_foreign`;
ALTER TABLE `fund_details` ADD CONSTRAINT `fund_details_asset_id_foreign` 
    FOREIGN KEY (`asset_id`) REFERENCES `assets` (`id`) 
    ON DELETE RESTRICT ON UPDATE CASCADE;

ALTER TABLE `fund_details` DROP FOREIGN KEY `fund_details_room_id_foreign`;
ALTER TABLE `fund_details` ADD CONSTRAINT `fund_details_room_id_foreign` 
    FOREIGN KEY (`room_id`) REFERENCES `rooms` (`id`) 
    ON DELETE RESTRICT ON UPDATE CASCADE;

-- ============================================================================
-- TABLE: projects
-- ============================================================================
ALTER TABLE `projects` DROP FOREIGN KEY `projects_project_type_id_foreign`;
ALTER TABLE `projects` ADD CONSTRAINT `projects_project_type_id_foreign` 
    FOREIGN KEY (`project_type_id`) REFERENCES `project_types` (`id`) 
    ON DELETE RESTRICT ON UPDATE CASCADE;

ALTER TABLE `projects` DROP FOREIGN KEY `projects_institute_id_foreign`;
ALTER TABLE `projects` ADD CONSTRAINT `projects_institute_id_foreign` 
    FOREIGN KEY (`institute_id`) REFERENCES `institutes` (`id`) 
    ON DELETE RESTRICT ON UPDATE CASCADE;

ALTER TABLE `projects` DROP FOREIGN KEY `projects_fund_head_id_foreign`;
ALTER TABLE `projects` ADD CONSTRAINT `projects_fund_head_id_foreign` 
    FOREIGN KEY (`fund_head_id`) REFERENCES `fund_heads` (`id`) 
    ON DELETE RESTRICT ON UPDATE CASCADE;

-- ============================================================================
-- TABLE: milestones
-- ============================================================================
ALTER TABLE `milestones` DROP FOREIGN KEY `milestones_project_id_foreign`;
ALTER TABLE `milestones` ADD CONSTRAINT `milestones_project_id_foreign` 
    FOREIGN KEY (`project_id`) REFERENCES `projects` (`id`) 
    ON DELETE RESTRICT ON UPDATE CASCADE;

ALTER TABLE `milestones` DROP FOREIGN KEY `milestones_added_by_foreign`;
ALTER TABLE `milestones` ADD CONSTRAINT `milestones_added_by_foreign` 
    FOREIGN KEY (`added_by`) REFERENCES `users` (`id`) 
    ON DELETE RESTRICT ON UPDATE CASCADE;

-- ============================================================================
-- TABLE: approval_stages
-- ============================================================================
ALTER TABLE `approval_stages` DROP FOREIGN KEY `approval_stages_project_type_id_foreign`;
ALTER TABLE `approval_stages` ADD CONSTRAINT `approval_stages_project_type_id_foreign` 
    FOREIGN KEY (`project_type_id`) REFERENCES `project_types` (`id`) 
    ON DELETE RESTRICT ON UPDATE CASCADE;

-- ============================================================================
-- TABLE: project_approvals
-- ============================================================================
ALTER TABLE `project_approvals` DROP FOREIGN KEY `project_approvals_project_id_foreign`;
ALTER TABLE `project_approvals` ADD CONSTRAINT `project_approvals_project_id_foreign` 
    FOREIGN KEY (`project_id`) REFERENCES `projects` (`id`) 
    ON DELETE RESTRICT ON UPDATE CASCADE;

ALTER TABLE `project_approvals` DROP FOREIGN KEY `project_approvals_stage_id_foreign`;
ALTER TABLE `project_approvals` ADD CONSTRAINT `project_approvals_stage_id_foreign` 
    FOREIGN KEY (`stage_id`) REFERENCES `approval_stages` (`id`) 
    ON DELETE RESTRICT ON UPDATE CASCADE;

ALTER TABLE `project_approvals` DROP FOREIGN KEY `project_approvals_approver_id_foreign`;
ALTER TABLE `project_approvals` ADD CONSTRAINT `project_approvals_approver_id_foreign` 
    FOREIGN KEY (`approver_id`) REFERENCES `users` (`id`) 
    ON DELETE RESTRICT ON UPDATE CASCADE;

-- ============================================================================
-- TABLE: donations
-- ============================================================================
ALTER TABLE `donations` DROP FOREIGN KEY `donations_donation_type_id_foreign`;
ALTER TABLE `donations` ADD CONSTRAINT `donations_donation_type_id_foreign` 
    FOREIGN KEY (`donation_type_id`) REFERENCES `donation_types` (`id`) 
    ON DELETE RESTRICT ON UPDATE CASCADE;

ALTER TABLE `donations` DROP FOREIGN KEY `donations_institute_id_foreign`;
ALTER TABLE `donations` ADD CONSTRAINT `donations_institute_id_foreign` 
    FOREIGN KEY (`institute_id`) REFERENCES `institutes` (`id`) 
    ON DELETE RESTRICT ON UPDATE CASCADE;

-- ============================================================================
-- TABLE: transactions
-- ============================================================================
ALTER TABLE `transactions` DROP FOREIGN KEY `transactions_institute_id_foreign`;
ALTER TABLE `transactions` ADD CONSTRAINT `transactions_institute_id_foreign` 
    FOREIGN KEY (`institute_id`) REFERENCES `institutes` (`id`) 
    ON DELETE RESTRICT ON UPDATE CASCADE;

ALTER TABLE `transactions` DROP FOREIGN KEY `transactions_added_by_foreign`;
ALTER TABLE `transactions` ADD CONSTRAINT `transactions_added_by_foreign` 
    FOREIGN KEY (`added_by`) REFERENCES `users` (`id`) 
    ON DELETE RESTRICT ON UPDATE CASCADE;

ALTER TABLE `transactions` DROP FOREIGN KEY `transactions_approved_by_foreign`;
ALTER TABLE `transactions` ADD CONSTRAINT `transactions_approved_by_foreign` 
    FOREIGN KEY (`approved_by`) REFERENCES `users` (`id`) 
    ON DELETE RESTRICT ON UPDATE CASCADE;

-- ============================================================================
-- TABLE: transaction_details
-- ============================================================================
ALTER TABLE `transaction_details` DROP FOREIGN KEY `transaction_details_fund_head_id_foreign`;
ALTER TABLE `transaction_details` ADD CONSTRAINT `transaction_details_fund_head_id_foreign` 
    FOREIGN KEY (`fund_head_id`) REFERENCES `fund_heads` (`id`) 
    ON DELETE RESTRICT ON UPDATE CASCADE;

ALTER TABLE `transaction_details` DROP FOREIGN KEY `transaction_details_tid_foreign`;
ALTER TABLE `transaction_details` ADD CONSTRAINT `transaction_details_tid_foreign` 
    FOREIGN KEY (`tid`) REFERENCES `transactions` (`id`) 
    ON DELETE RESTRICT ON UPDATE CASCADE;

ALTER TABLE `transaction_details` DROP FOREIGN KEY `transaction_details_asset_id_foreign`;
ALTER TABLE `transaction_details` ADD CONSTRAINT `transaction_details_asset_id_foreign` 
    FOREIGN KEY (`asset_id`) REFERENCES `assets` (`id`) 
    ON DELETE RESTRICT ON UPDATE CASCADE;

ALTER TABLE `transaction_details` DROP FOREIGN KEY `transaction_details_room_id_foreign`;
ALTER TABLE `transaction_details` ADD CONSTRAINT `transaction_details_room_id_foreign` 
    FOREIGN KEY (`room_id`) REFERENCES `rooms` (`id`) 
    ON DELETE RESTRICT ON UPDATE CASCADE;

-- ============================================================================
-- TABLE: help_desks
-- ============================================================================
ALTER TABLE `help_desks` DROP FOREIGN KEY `help_desks_user_id_foreign`;
ALTER TABLE `help_desks` ADD CONSTRAINT `help_desks_user_id_foreign` 
    FOREIGN KEY (`user_id`) REFERENCES `users` (`id`) 
    ON DELETE RESTRICT ON UPDATE CASCADE;

ALTER TABLE `help_desks` DROP FOREIGN KEY `help_desks_institute_id_foreign`;
ALTER TABLE `help_desks` ADD CONSTRAINT `help_desks_institute_id_foreign` 
    FOREIGN KEY (`institute_id`) REFERENCES `institutes` (`id`) 
    ON DELETE RESTRICT ON UPDATE CASCADE;

ALTER TABLE `help_desks` DROP FOREIGN KEY `help_desks_feedback_by_foreign`;
ALTER TABLE `help_desks` ADD CONSTRAINT `help_desks_feedback_by_foreign` 
    FOREIGN KEY (`feedback_by`) REFERENCES `users` (`id`) 
    ON DELETE RESTRICT ON UPDATE CASCADE;

-- ============================================================================
-- TABLE: help_desk_messages
-- ============================================================================
ALTER TABLE `help_desk_messages` DROP FOREIGN KEY `help_desk_messages_help_desk_id_foreign`;
ALTER TABLE `help_desk_messages` ADD CONSTRAINT `help_desk_messages_help_desk_id_foreign` 
    FOREIGN KEY (`help_desk_id`) REFERENCES `help_desks` (`id`) 
    ON DELETE RESTRICT ON UPDATE CASCADE;

ALTER TABLE `help_desk_messages` DROP FOREIGN KEY `help_desk_messages_user_id_foreign`;
ALTER TABLE `help_desk_messages` ADD CONSTRAINT `help_desk_messages_user_id_foreign` 
    FOREIGN KEY (`user_id`) REFERENCES `users` (`id`) 
    ON DELETE RESTRICT ON UPDATE CASCADE;

-- ============================================================================
-- END OF SCRIPT
-- ============================================================================
