<?php

use Inertia\Inertia;
use Illuminate\Support\Facades\Route;
use App\Http\Controllers\MenuController;
use App\Http\Controllers\RoleController;
use App\Http\Controllers\UserController;
use App\Http\Controllers\BackupController;
use App\Http\Controllers\AuditLogController;
use App\Http\Controllers\UserFileController;
use App\Http\Controllers\PermissionController;
use App\Http\Controllers\SettingAppController;
use App\Http\Controllers\MediaFolderController;
use App\Http\Controllers\InstituteController;
use App\Http\Controllers\BuildingTypeController;
use App\Http\Controllers\ShiftController;
use App\Http\Controllers\UpgradationController;
use App\Http\Controllers\BlockController;
use App\Http\Controllers\RoomTypeController;
use App\Http\Controllers\RoomController;
use App\Http\Controllers\AssetCategoryController;
use App\Http\Controllers\AssetController;
use App\Http\Controllers\InstituteAssetController;
use App\Http\Controllers\AssetTransactionController;
use App\Http\Controllers\VehicleTypeController;
use App\Http\Controllers\TransportController;
use App\Http\Controllers\PlantController;
use App\Http\Controllers\DashboardCardController;
use App\Http\Controllers\DashboardController;

Route::get('/', function () {
    return Inertia::render('welcome');
})->name('home');

Route::middleware(['auth', 'menu.permission'])->group(function () {
    // Route::get('/dashboard', function () {
    //     return Inertia::render('dashboard');
    // })->name('dashboard');
  
      Route::get('/dashboard', [DashboardController::class, 'index'])->name('dashboard');

    Route::get('/institute', [InstituteController::class, 'index'])->name('institute.index');
    Route::post('/institute', [InstituteController::class, 'store'])->name('institute.store');
    Route::get('/institute/create', [InstituteController::class, 'create'])->name('institute.create');


    Route::resource('roles', RoleController::class);
    Route::resource('menus', MenuController::class);
    Route::post('menus/reorder', [MenuController::class, 'reorder'])->name('menus.reorder');
    Route::resource('permissions', PermissionController::class);
    Route::resource('users', UserController::class);
    Route::put('/users/{user}/reset-password', [UserController::class, 'resetPassword'])->name('users.reset-password');
    Route::get('/settingsapp', [SettingAppController::class, 'edit'])->name('setting.edit');
    Route::post('/settingsapp', [SettingAppController::class, 'update'])->name('setting.update');
    Route::get('/audit-logs', [AuditLogController::class, 'index'])->name('audit-logs.index');
    Route::get('/backup', [BackupController::class, 'index'])->name('backup.index');
    Route::post('/backup/run', [BackupController::class, 'run'])->name('backup.run');
    Route::get('/backup/download/{file}', [BackupController::class, 'download'])->name('backup.download');
    Route::delete('/backup/delete/{file}', [BackupController::class, 'delete'])->name('backup.delete');
    Route::get('/files', [UserFileController::class, 'index'])->name('files.index');
    Route::post('/files', [UserFileController::class, 'store'])->name('files.store');
    Route::delete('/files/{id}', [UserFileController::class, 'destroy'])->name('files.destroy');
    Route::resource('media', MediaFolderController::class);


    Route::resource('institutes', InstituteController::class);

// Buildings
Route::resource('building-types', BuildingTypeController::class);
Route::resource('shifts', ShiftController::class);
Route::resource('upgradations', UpgradationController::class);
Route::resource('blocks', BlockController::class);
//DashboardCardController


Route::resource('dashboardcards', DashboardCardController::class);

// Rooms
Route::resource('room-types', RoomTypeController::class);
Route::resource('rooms', RoomController::class);

// Assets
Route::resource('asset-categories', AssetCategoryController::class);
Route::resource('assets', AssetController::class);
Route::resource('institute-assets', InstituteAssetController::class);
Route::resource('asset-transactions', AssetTransactionController::class);

// Transport
Route::resource('vehicle-types', VehicleTypeController::class);
Route::resource('transports', TransportController::class);

// Plants
Route::resource('plants', PlantController::class);

});

require __DIR__ . '/settings.php';
require __DIR__ . '/auth.php';
