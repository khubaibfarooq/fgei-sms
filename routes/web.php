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
use App\Http\Controllers\BlockTypeController;

use App\Http\Controllers\TransportController;
use App\Http\Controllers\PlantController;
use App\Http\Controllers\DashboardCardController;
use App\Http\Controllers\DashboardController;
use App\Http\Controllers\ReportsController;
use App\Http\Controllers\FundHeadsController;
use App\Http\Controllers\FundsController;
use App\Http\Controllers\FundHeldController;

use App\Http\Controllers\ProjectTypeController;
use App\Http\Controllers\ProjectController;
use App\Http\Controllers\DonationTypeController;
use App\Http\Controllers\DonationController;
use App\Http\Controllers\HelpDeskController;
Route::get('/', function () {
    return Inertia::render('welcome');
})->name('home');
Route::get('/sso-redirect', [App\Http\Controllers\Auth\SSORedirectController::class, 'handle'])->name('sso.redirect');
// Route::get('/sms-redirect', [App\Http\Controllers\Auth\SSORedirectController::class, 'redirectToSMS'])->name('sso.redirectToSMS');
Route::middleware(['auth', 'menu.permission'])->group(function () {
    // Route::get('/dashboard', function () {
    //     return Inertia::render('dashboard');
    // })->name('dashboard');
  // API routes for counts
//Dashboard API routes
    Route::get('/api/getinstitutes', [DashboardController::class, 'getInstitutes']);
    Route::get('/api/getfunds', [DashboardController::class, 'getFunds']);
        Route::get('/api/getrooms', [DashboardController::class, 'getRooms']);
        Route::get('/api/getblocks', [DashboardController::class, 'getBlocks']);
        Route::get('/api/getplants', [DashboardController::class, 'getPlants']);
        Route::get('/api/gettransports', [DashboardController::class, 'getTransports']);

    Route::get('/api/getusers', [DashboardController::class, 'getUsers']);
    Route::get('/api/getrequests', [DashboardController::class, 'getRequests']);

//end Dashboard API routes
      Route::get('/dashboard', [DashboardController::class, 'index'])->name('dashboard');
      //all institute routes for region and dactotrate
    Route::get('/all-institutes', [InstituteController::class, 'institutes'])->name('all-institutes');

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
// fund heads
Route::resource('fund-heads', FundHeadsController::class);
// funds
Route::resource('funds', FundHeldController::class);
//get funds transactions

Route::get('/fund-trans/{id}', [FundsController::class, 'getFund'])->name('funds.getFund');
// project type 
Route::resource('project-types', ProjectTypeController::class);
// project
Route::resource('projects', ProjectController::class);
// project type 
Route::resource('donation-types', DonationTypeController::class);
// project
Route::resource('donations', DonationController::class);
//DashboardCardController


Route::resource('dashboardcards', DashboardCardController::class);

// Rooms
Route::resource('room-types', RoomTypeController::class);
Route::resource('rooms', RoomController::class);

// Assets
Route::resource('asset-categories', AssetCategoryController::class);
Route::resource('asset', AssetController::class);
Route::resource('institute-assets', InstituteAssetController::class);
Route::resource('asset-transactions', AssetTransactionController::class);

// Transport
Route::resource('vehicle-types', VehicleTypeController::class);
Route::resource('transports', TransportController::class);
Route::resource('block-types', BlockTypeController::class);

// Plants
Route::resource('plants', PlantController::class);
//Reports
Route::get('/reports', [ReportsController::class, 'index'])->name('reports.index');
Route::get('/reports/institutes', [ReportsController::class, 'index'])->name('reports.institutes');
Route::get('/reports/institutes/getData', [ReportsController::class, 'getAllData'])->name('reports.getData');

Route::get('/reports/assets', [ReportsController::class, 'assets'])->name('reports.assets');
Route::get('/reports/blocks', [ReportsController::class, 'getBlocks'])->name('reports.blocks');
Route::get('/reports/rooms', [ReportsController::class, 'getRooms'])->name('reports.rooms');
Route::get('/reports/assets/list', [ReportsController::class, 'getAssets'])->name('reports.assets.list');
Route::get('/reports/assets/institute-assets', [ReportsController::class, 'getInstituteAssets'])->name('reports.getInstituteAssets');
Route::get('/reports/transports', [ReportsController::class, 'transports'])->name('reports.transports');Route::get('/reports/transports/getTransports', [ReportsController::class, 'getTransports'])->name('reports.getTransports');
Route::get('/reports/plants', [ReportsController::class, 'plants'])->name('reports.plants');
Route::get('/reports/plants/getPlants', [ReportsController::class, 'getPlants'])->name('reports.getPlants');
Route::get('/reports/upgradations', [ReportsController::class, 'upgradations'])->name('reports.upgradations');
Route::get('/reports/upgradations/getUpgradations', [ReportsController::class, 'getUpgradations'])->name('reports.getUpgradations');
Route::get('/reports/getInstitutes', [ReportsController::class, 'getInstitutes'])->name('reports.getInstitutes');
//helpdesk
Route::put('/helpdesk/{helpDesk}', [HelpDeskController::class, 'update'])->name('helpdesk.update');
Route::get('/helpdesk', [HelpDeskController::class, 'index'])->name('helpdesk.index');
Route::post('/helpdesk', [HelpDeskController::class, 'store'])->name('helpdesk.store');

});

require __DIR__ . '/settings.php';
require __DIR__ . '/auth.php';
