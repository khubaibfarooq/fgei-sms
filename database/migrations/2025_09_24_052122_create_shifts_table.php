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
      Schema::create('shifts', function (Blueprint $table) {
    $table->id();
    $table->foreignId('institute_id')->constrained('institutes');
    $table->string('name');
    $table->foreignId('building_type_id')->constrained('building_types');
    $table->string('building_name');
    $table->timestamps();
});
    }

    /**
     * Reverse the migrations.
     */
    public function down(): void
    {
        Schema::dropIfExists('shifts');
    }
};
