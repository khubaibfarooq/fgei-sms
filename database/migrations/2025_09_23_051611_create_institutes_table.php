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
        Schema::create('institutes', function (Blueprint $table) {
            $table->id();
         $table->int('hr_institute_id');
        $table->date('established_date');
       $table->decimal('total_area',20,2)->nullable();
       $table->decimal('convered_area',20,2)->nullable();
        $table->string('video')->nullable();
        $table->string('img_layout')->nullable();
        $table->string('img_3d')->nullable();
       
        $table->timestamps();
        });
    }

    /**
     * Reverse the migrations.
     */
    public function down(): void
    {
        Schema::dropIfExists('institutes');
    }
};
