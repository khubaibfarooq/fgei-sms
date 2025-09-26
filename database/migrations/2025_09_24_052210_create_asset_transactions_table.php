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
        Schema::create('asset_transactions', function (Blueprint $table) {
    $table->id();
    $table->foreignId('institute_id')->constrained('institutes');
    $table->foreignId('institute_asset_id')->constrained('institute_assets');
    $table->integer('qty');
    $table->text('details');
    $table->enum('status', ['condemned', 'required']);
    $table->foreignId('added_by')->constrained('users');
    $table->date('added_date');
    $table->date('approved_date')->nullable();
    $table->foreignId('approved_by')->nullable()->constrained('users');
    $table->timestamps();
});

    }

    /**
     * Reverse the migrations.
     */
    public function down(): void
    {
        Schema::dropIfExists('asset_transactions');
    }
};
