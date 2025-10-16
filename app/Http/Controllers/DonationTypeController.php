<?php
namespace App\Http\Controllers;

use App\Models\DonationType;
use Illuminate\Http\Request;
use Inertia\Inertia;

class DonationTypeController extends Controller
{
    public function index(Request $request)
    {
        $query = DonationType::query();

        if ($request->search) {
            $query->where('name', 'like', '%' . $request->search . '%');
        }

        $donationTypes = $query->paginate(10)->withQueryString();

        return Inertia::render('donationtypes/Index', [
            'donationTypes' => $donationTypes,
            'filters' => ['search' => $request->search ?? ''],
        ]);
    }

    public function create()
    {
        return Inertia::render('donationtypes/Form', ['donationType' => null]);
    }

    public function store(Request $request)
    {
        $data = $request->validate(['name' => 'required|string|max:255']);

        DonationType::Create($data);

        return redirect()->back()->with('success', 'Donation type saved successfully.');
    }   
    public function edit(DonationType $DonationType)
    {
        //dd($DonationType);
        return Inertia::render('donationtypes/Form', ['donationType' => $DonationType]);
    } 
    public function update(Request $request, DonationType $DonationType)
    {
        $data = $request->validate(['name' => 'required|string|max:255']);  
        $DonationType->update($data);     
        return redirect()->back()->with('success', 'Donation type updated successfully.');
    }
    public function destroy(DonationType $DonationType)
    {
        $DonationType->delete();   
        return redirect()->back()->with('success', 'Donation type deleted successfully.');
    }
}

