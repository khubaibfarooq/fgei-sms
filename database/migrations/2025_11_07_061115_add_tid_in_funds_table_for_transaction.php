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
    Schema::table('funds', function (Blueprint $table) {
        if (!Schema::hasColumn('funds', 'tid')) {
            $table->foreignId('tid')
                  ->nullable()
                  ->constrained('transactions')
                  ->onDelete('set null'); // optional
        }
    });
}

public function down(): void
{
    Schema::table('funds', function (Blueprint $table) {
        $table->dropForeign('funds_tid_foreign'); // explicit
        $table->dropColumn('tid');
    });
}
};
