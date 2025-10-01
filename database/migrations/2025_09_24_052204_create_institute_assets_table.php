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
    {Schema::create('institute_assets', function (Blueprint $table) {
    $table->id();
    $table->foreignId('institute_id')->constrained('institutes');
    $table->foreignId('asset_id')->constrained('assets');
    $table->foreignId('room_id')->constrained('rooms');

    $table->integer('current_qty');
    $table->foreignId('added_by')->constrained('users');
    $table->date('added_date');
    $table->timestamps();
});
    }

    /**
     * Reverse the migrations.
     */
    public function down(): void
    {
        Schema::dropIfExists('institute_assets');
    }
};
