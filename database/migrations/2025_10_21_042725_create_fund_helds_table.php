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
        Schema::create('fund_helds', function (Blueprint $table) {

            $table->id();
              $table->foreignId('institute_id')->constrained('institutes');
                $table->foreignId('fund_head_id')->constrained('fund_heads');
                $table->decimal('balance', 15, 2)->default(0.00);
            $table->timestamps();
        });
    }

    /**
     * Reverse the migrations.
     */
    public function down(): void
    {
        Schema::dropIfExists('fund_helds');
    }
};
