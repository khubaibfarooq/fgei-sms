<?php

namespace App\Http\Controllers;

use Inertia\Inertia;
use App\Models\SettingApp;
use Illuminate\Http\Request;

class SettingAppController extends Controller
{
    public function edit()
    {
        $setting = SettingApp::first();
        return Inertia::render('settingapp/Form', ['setting' => $setting]);
    }

    public function update(Request $request)
    {
        $data = $request->validate([
            'nama_app'   => 'required|string|max:255',
            'deskripsi'  => 'nullable|string',
            'logo'       => 'nullable|file|image|max:2048',
            'favicon'    => 'nullable|file|image|max:1024',
            'warna'      => 'nullable|string|max:20',
            'seo'        => 'nullable|array',
        ]);

        $setting = SettingApp::firstOrNew();
$resultImageName = null;
        if ($request->hasFile('logo')) {
            $resultImage = $request->file('logo');
                $resultImageName = time() . '-' . uniqid() . '.' . $resultImage->getClientOriginalExtension();
                // $resultImage->move(public_path('Assets/Uploads/ACR/acr17to18/results'), $resultImageName);
                $resultImage->move('assets/logo', $resultImageName);
                 $data['logo']='logo/'.$resultImageName;   
        } else {
            unset($data['logo']);
        }
$resultImageName = null;
        if ($request->hasFile('favicon')) {
              $resultImage = $request->file('favicon');
                $resultImageName = time() . '-' . uniqid() . '.' . $resultImage->getClientOriginalExtension();
                // $resultImage->move(public_path('Assets/Uploads/ACR/acr17to18/results'), $resultImageName);
                $resultImage->move('assets/favicon', $resultImageName);
                 $data['favicon']='favicon/'.$resultImageName; 
        } else {
            unset($data['favicon']);
        }

        $setting->fill($data)->save();

        return redirect()->back()->with('success', 'Pengaturan berhasil disimpan.');
    }
}
