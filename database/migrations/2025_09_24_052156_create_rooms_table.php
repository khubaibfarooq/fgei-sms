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
       Schema::create('rooms', function (Blueprint $table) {
    $table->id();
    $table->string('name');
    $table->decimal('area', 10, 2)->nullable();
    $table->foreignId('room_type_id')->constrained('room_types');
    $table->foreignId('block_id')->constrained('blocks');
    $table->timestamps();
});

    }

    /**
     * Reverse the migrations.
     */
    public function down(): void
    {
        Schema::dropIfExists('rooms');
    }
};
