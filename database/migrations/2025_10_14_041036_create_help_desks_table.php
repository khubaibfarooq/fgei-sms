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
        Schema::create('help_desks', function (Blueprint $table) {
            $table->id();
         $table->string('token', 8)->unique(); // Specify length and uniqueness
              $table->string('title');
               $table->text('description');
             $table->string('attachment')->nullable();
   $table->foreignId('user_id')->constrained('users');
                $table->foreignId('institute_id')->constrained('institutes');
                  $table->string('status');
                  $table->string('feedback')->nullable();
                  $table->foreignId('feedback_by')->constrained('users')->nullable();
           
                    $table->date('feedback_date')->nullable();
            $table->timestamps();
        });
    }

    /**
     * Reverse the migrations.
     */
    public function down(): void
    {
        Schema::dropIfExists('help_desks');
    }
};
