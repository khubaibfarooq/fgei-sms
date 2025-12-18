<?php

use Illuminate\Database\Migrations\Migration;
use Illuminate\Database\Schema\Blueprint;
use Illuminate\Support\Facades\Schema;

return new class extends Migration
{
    /**
     * Run the migrations.
     */
    public function up(): void
    {
        // Projects Table Updates
        Schema::table('projects', function (Blueprint $table) {
            if (Schema::hasColumn('projects', 'budget')) {
                $table->renameColumn('budget', 'estimated_amount');
            }
        });

        Schema::table('projects', function (Blueprint $table) {
            if (!Schema::hasColumn('projects', 'actual_amount')) {
                $table->decimal('actual_amount', 15, 2)->nullable()->after('estimated_amount');
            }
            if (!Schema::hasColumn('projects', 'final_comments')) {
                $table->text('final_comments')->nullable()->after('actual_amount');
            }
            if (!Schema::hasColumn('projects', 'fund_head_id')) {
                $table->foreignId('fund_head_id')->nullable()->constrained('fund_heads')->after('final_comments');
            }
        });

        // Approval Stages Table Updates
        Schema::table('approval_stages', function (Blueprint $table) {
            if (Schema::hasColumn('approval_stages', 'project_type_id')) {
                $table->dropForeign(['project_type_id']);
                $table->dropColumn('project_type_id');
            }
            if (!Schema::hasColumn('approval_stages', 'fund_head_id')) {
                $table->foreignId('fund_head_id')->nullable()->constrained('fund_heads')->after('stage_name');
            }
        });

        // Milestones Table Updates
        Schema::table('milestones', function (Blueprint $table) {
            if (!Schema::hasColumn('milestones', 'pdf')) {
                $table->string('pdf')->nullable()->after('img');
            }
        });

        // Project Approvals Table Updates
        Schema::table('project_approvals', function (Blueprint $table) {
            if (!Schema::hasColumn('project_approvals', 'pdf')) {
                $table->string('pdf')->nullable()->after('comments');
            }
        });
    }

    /**
     * Reverse the migrations.
     */
    public function down(): void
    {
        Schema::table('project_approvals', function (Blueprint $table) {
            if (Schema::hasColumn('project_approvals', 'pdf')) {
                $table->dropColumn('pdf');
            }
        });

        Schema::table('milestones', function (Blueprint $table) {
            if (Schema::hasColumn('milestones', 'pdf')) {
                $table->dropColumn('pdf');
            }
        });

        Schema::table('approval_stages', function (Blueprint $table) {
            if (Schema::hasColumn('approval_stages', 'fund_head_id')) {
                $table->dropForeign(['fund_head_id']);
                $table->dropColumn('fund_head_id');
            }
            if (!Schema::hasColumn('approval_stages', 'project_type_id')) {
                $table->foreignId('project_type_id')->nullable()->constrained('project_types')->onDelete('cascade');
            }
        });

        Schema::table('projects', function (Blueprint $table) {
            if (Schema::hasColumn('projects', 'fund_head_id')) {
                $table->dropForeign(['fund_head_id']);
            }
            $table->dropColumn(['actual_amount', 'final_comments', 'fund_head_id']);
            if (Schema::hasColumn('projects', 'estimated_amount')) {
                $table->renameColumn('estimated_amount', 'budget');
            }
        });
    }
};
