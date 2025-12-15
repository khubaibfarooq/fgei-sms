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
        Schema::create('approval_stages', function (Blueprint $table) {
            $table->id();
            $table->string('stage_name');
            $table->foreignId('project_type_id')->constrained('project_types')->onDelete('cascade');
            $table->integer('stage_order');
            $table->text('description')->nullable();
            $table->boolean('is_mandatory')->default(true);
            $table->json('users_can_approve')->nullable(); // Role IDs
            $table->timestamps();
        });
    }

    /**
     * Reverse the migrations.
     */
    public function down(): void
    {
        Schema::dropIfExists('approval_stages');
    }
};
