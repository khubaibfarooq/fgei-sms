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
        Schema::table('project_approvals', function (Blueprint $table) {
            if (!Schema::hasColumn('project_approvals', 'img')) {
                $table->string('img')->nullable()->after('pdf');
            }
        });
    }

    /**
     * Reverse the migrations.
     */
    public function down(): void
    {
        Schema::table('project_approvals', function (Blueprint $table) {
            if (Schema::hasColumn('project_approvals', 'img')) {
                $table->dropColumn('img');
            }
        });
    }
};
