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
        Schema::table('approval_stages', function (Blueprint $table) {
                      $table->boolean('change_to_in_progress')->default(false);

        });
    }

    /**
     * Reverse the migrations.
     */
    public function down(): void
    {
        Schema::table('approval_stages', function (Blueprint $table) {
            $table->dropColumn('change_to_in_progress');
        });
    }
};
