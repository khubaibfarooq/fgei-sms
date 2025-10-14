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
        Schema::create('fund_heads', function (Blueprint $table) {
    $table->id();
    $table->string('name', 100)->unique(); // Added length and unique constraint
    $table->foreignId('parent_id')->nullable()->constrained('fund_heads')->onDelete('set null')->after('id');
    $table->timestamps();
});
    }

    /**
     * Reverse the migrations.
     */
    public function down(): void
    {
        Schema::dropIfExists('fund_heads');
    }
};
