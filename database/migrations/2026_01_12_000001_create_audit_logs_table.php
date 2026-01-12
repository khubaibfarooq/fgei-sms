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
        Schema::create('audit_logs', function (Blueprint $table) {
            $table->id();
            $table->string('table_name', 100);              // Source table
            $table->unsignedBigInteger('record_id');        // Primary key of affected row
            $table->enum('action', ['INSERT', 'UPDATE', 'DELETE']);
            $table->json('old_values')->nullable();         // Previous values (for UPDATE/DELETE)
            $table->json('new_values')->nullable();         // New values (for INSERT/UPDATE)
            $table->unsignedBigInteger('changed_by')->nullable(); // User who made the change
            $table->timestamp('changed_at')->useCurrent();  // When the change occurred
            $table->index(['table_name', 'record_id']);
            $table->index('action');
            $table->index('changed_at');
        });
    }

    /**
     * Reverse the migrations.
     */
    public function down(): void
    {
        Schema::dropIfExists('audit_logs');
    }
};
