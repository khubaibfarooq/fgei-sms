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
        Schema::create('transactions', function (Blueprint $table) {
       $table->id();
                              $table->foreignId('institute_id')->constrained('institutes');

                 $table->foreignId('added_by')->constrained('users');
                $table->decimal('total_amount', 20, 2)->default(0.00);
                $table->string('type');
                $table->string('status');
                $table->string('bill_img')->nullable();

                                          $table->foreignId('approved_by')->constrained('users')->nullable();

            $table->timestamps();
   
        });
    }

    /**
     * Reverse the migrations.
     */
    public function down(): void
    {
              Schema::dropIfExists('transactions');
    }
};
