<?php

use Illuminate\Database\Migrations\Migration;
use Illuminate\Database\Schema\Blueprint;
use Illuminate\Support\Facades\Schema;

return new class extends Migration
{
    /**
     * Run the migrations.
     *
     * Creates the project_effects table.
     * Each row defines one effect (block / room / asset) that should be created
     * automatically when the parent project transitions to status = 'completed'.
     *
     * effect_type: 'block' | 'room' | 'asset'
     * effect_data: JSON containing the parameters needed to create that entity.
     *   block → { name, block_type_id, area, rooms:[{name, room_type_id, area}] }
     *   room  → { name, room_type_id, block_id, area }
     *   asset → { asset_id, qty, room_id, details }
     *
     * applied / applied_at / applied_by track when the effect was executed.
     */
    public function up(): void
    {
        Schema::create('project_effects', function (Blueprint $table) {
            $table->id();
            $table->foreignId('project_id')->constrained('projects')->cascadeOnDelete();
            $table->string('effect_type');               // 'block', 'room', 'asset'
            $table->json('effect_data');                  // Creation parameters (see above)
            $table->boolean('applied')->default(false);
            $table->timestamp('applied_at')->nullable();
            $table->foreignId('applied_by')->nullable()->constrained('users')->nullOnDelete();
            $table->timestamps();
        });
    }

    /**
     * Reverse the migrations.
     */
    public function down(): void
    {
        Schema::dropIfExists('project_effects');
    }
};
