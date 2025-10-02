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
       Schema::create('upgradations', function (Blueprint $table) {
    $table->id();
    $table->foreignId('institute_id')->constrained('institutes');
    $table->text('details');
    $table->date('from');
    $table->string('to');
    $table->string('levelfrom');
    $table->date('levelto');
    $table->enum('status', ['pending', 'approved', 'rejected'])->default('pending');
    $table->date('approved_date')->nullable();
    $table->foreignId('added_by')->constrained('users');
    $table->foreignId('approved_by')->nullable()->constrained('users');
    $table->timestamps();
});
    }

    /**
     * Reverse the migrations.
     */
    public function down(): void
    {
        Schema::dropIfExists('upgradations');
    }
};
