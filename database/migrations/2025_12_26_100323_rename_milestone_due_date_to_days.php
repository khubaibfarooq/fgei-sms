<?php

use Illuminate\Database\Migrations\Migration;
use Illuminate\Database\Schema\Blueprint;
use Illuminate\Support\Facades\Schema;
use Illuminate\Support\Facades\DB;

return new class extends Migration
{
    /**
     * Run the migrations.
     */
    public function up(): void
    {
        Schema::table('milestones', function (Blueprint $table) {
            // Rename due_date to days
            $table->renameColumn('due_date', 'days');
        });

        Schema::table('milestones', function (Blueprint $table) {
            // Change type to integer. We'll use DB::statement for safety across drivers if needed,
            // but Laravel's change() usually works if doctrine/dbal is installed.
            // Since we are on Laravel 10/11+, change() is more native.
            $table->integer('days')->nullable()->change();
        });
    }

    /**
     * Reverse the migrations.
     */
    public function down(): void
    {
        Schema::table('milestones', function (Blueprint $table) {
            $table->date('days')->nullable()->change();
        });

        Schema::table('milestones', function (Blueprint $table) {
            $table->renameColumn('days', 'due_date');
        });
    }
};
