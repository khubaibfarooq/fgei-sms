<?php

use Illuminate\Database\Migrations\Migration;
use Illuminate\Database\Schema\Blueprint;
use Illuminate\Support\Facades\Schema;

return new class extends Migration
{
    /**
     * Run the migrations.
     */
    public function up()
{
    Schema::table('dashboard_cards', function (Blueprint $table) {
        // Drop foreign key
        $table->dropForeign(['role_id']);

        // Change to string (255 is common for role names)
        $table->string('role_id', 255)->change();
    });
}

public function down()
{
    Schema::table('dashboard_cards', function (Blueprint $table) {
        $table->dropUnique(['role_id']); // if you added unique later

        $table->unsignedBigInteger('role_id')->change();
        $table->foreign('role_id')->references('id')->on('roles');
    });
}
};
