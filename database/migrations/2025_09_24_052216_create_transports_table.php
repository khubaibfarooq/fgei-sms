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
       Schema::create('transports', function (Blueprint $table) {
    $table->id();
    $table->string('vehicle_no');
    $table->foreignId('vehicle_type_id')->constrained('vehicle_types');
    $table->foreignId('institute_id')->constrained('institutes');
    $table->timestamps();
});
    }

    /**
     * Reverse the migrations.
     */
    public function down(): void
    {
        Schema::dropIfExists('transports');
    }
};
