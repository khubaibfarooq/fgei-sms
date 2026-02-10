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
        Schema::table('projects', function (Blueprint $table) {
            $table->string('structural_plan')->nullable()->after('pdf');
            $table->foreignId('contractor_id')->nullable()->constrained('contractor')->onDelete('set null')->after('structural_plan');
        });
    }

    /**
     * Reverse the migrations.
     */
    public function down(): void
    {
        Schema::table('projects', function (Blueprint $table) {
            $table->dropForeign(['contractor_id']);
            $table->dropColumn(['structural_plan', 'contractor_id']);
        });
    }
};
