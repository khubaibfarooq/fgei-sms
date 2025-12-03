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
        Schema::table('transactions', function (Blueprint $table) {
            // Drop the old 'type' column (was likely enum or string for 'income'/'expense')
            $table->dropColumn('type');
        });

        Schema::table('transactions', function (Blueprint $table) {
            // Add new 'type' as foreign key to types table
            $table->foreignId('type')->constrained('types')->after('institute_id');
            $table->foreignId('sub_type')->nullable()->constrained('types')->after('type');
            $table->string('description')->nullable();
        });
    }

    /**
     * Reverse the migrations.
     */
    public function down(): void
    {
        Schema::table('transactions', function (Blueprint $table) {
            $table->dropForeign(['type']);
            $table->dropForeign(['sub_type']);
            $table->dropColumn(['type', 'sub_type', 'description']);
        });

        Schema::table('transactions', function (Blueprint $table) {
            // Restore original type column (adjust this based on your original schema)
            $table->string('type')->after('institute_id'); // or enum if it was enum
        });
    }
};
