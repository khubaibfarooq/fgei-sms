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
            Schema::create('transaction_details', function (Blueprint $table) {
       $table->id();
             $table->foreignId('fund_head_id')->constrained('fund_heads');
                $table->foreignId('tid')->constrained('transactions');
                 $table->foreignId('asset_id')->constrained('assets');
                     $table->foreignId('room_id')->constrained('rooms');
                $table->decimal('amount', 20, 2)->default(0.00);
                      $table->integer('qty');
            $table->timestamps();
   
        });
    }

    /**
     * Reverse the migrations.
     */
    public function down(): void
    {
            Schema::dropIfExists('transaction_details');
    }
};
