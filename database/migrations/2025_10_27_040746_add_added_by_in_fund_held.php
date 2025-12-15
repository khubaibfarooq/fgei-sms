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
        Schema::table('fund_helds', function (Blueprint $table) {
            if (!Schema::hasColumn('fund_helds', 'added_by')) {
                     $table->foreignId('added_by')->constrained('users');
            }
        });
    }

    /**
     * Reverse the migrations.
     */
    public function down(): void
    {
        Schema::table('fund_helds', function (Blueprint $table) {
        $table->dropColumn('added_by');
        });
    }
};
