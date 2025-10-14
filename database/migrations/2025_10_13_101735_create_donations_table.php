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
        Schema::create('donations', function (Blueprint $table) {
            $table->id();
             $table->string('details');
              $table->double('amount', 15, 2)->default(0.00);
             $table->foreignId('donation_type_id')->constrained('donation_types');
             $table->foreignId('institute_id')->constrained('institutes');
             $table->date('added_date')->default(now());
            $table->timestamps();
        });
    }

    /**
     * Reverse the migrations.
     */
    public function down(): void
    {
        Schema::dropIfExists('donations');
    }
};
