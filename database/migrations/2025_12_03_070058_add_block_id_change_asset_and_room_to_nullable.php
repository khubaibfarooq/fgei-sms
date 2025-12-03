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
        Schema::table('transaction_details', function (Blueprint $table) {
            $table->dropForeign(['asset_id']);
            $table->dropForeign(['room_id']);
            $table->dropColumn(['asset_id', 'room_id']);
        });

        Schema::table('transaction_details', function (Blueprint $table) {
            $table->foreignId('asset_id')->nullable()->constrained('assets');
            $table->foreignId('room_id')->nullable()->constrained('rooms');
            $table->foreignId('block_id')->nullable()->constrained('blocks');
        });
    }

    /**
     * Reverse the migrations.
     */
    public function down(): void
    {
        Schema::table('transaction_details', function (Blueprint $table) {
            $table->dropForeign(['block_id']);
            $table->dropForeign(['asset_id']);
            $table->dropForeign(['room_id']);
            $table->dropColumn(['block_id', 'asset_id', 'room_id']);
        });

        Schema::table('transaction_details', function (Blueprint $table) {
            // Restore original columns (assuming they were required)
            $table->foreignId('asset_id')->constrained('assets');
            $table->foreignId('room_id')->constrained('rooms');
        });
    }
};
