<?php

use Illuminate\Database\Migrations\Migration;
use Illuminate\Database\Schema\Blueprint;
use Illuminate\Support\Facades\Schema;

class AddAssetsIdToRoomTypesTable extends Migration
{
    public function up()
    {
        Schema::table('room_types', function (Blueprint $table) {
            $table->string('assets_id')->nullable();
        });
    }

    public function down()
    {
        Schema::table('room_types', function (Blueprint $table) {
            $table->dropColumn('assets_id');
        });
    }
}