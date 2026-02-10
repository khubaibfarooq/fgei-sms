<?php

namespace App\Http\Controllers;

use Illuminate\Http\Request;

class ContractorController extends Controller
{
    public function index(Request $request)
    {
        $query = \App\Models\Contractor::with('company');

        if ($request->search) {
            $query->where('name', 'like', '%' . $request->search . '%')
                  ->orWhere('email', 'like', '%' . $request->search . '%')
                  ->orWhere('contact', 'like', '%' . $request->search . '%');
        }

        $contractors = $query->latest()->paginate(10)->withQueryString();

        return \Inertia\Inertia::render('contractor/Index', [
            'contractors' => $contractors,
            'filters' => ['search' => $request->search ?? ''],
        ]);
    }

    public function create()
    {
        return \Inertia\Inertia::render('contractor/Form', [
            'contractor' => null,
            'companies' => \App\Models\Company::all()
        ]);
    }

    public function store(Request $request)
    {
        $data = $request->validate([
            'name' => 'required|string|max:255',
            'email' => 'nullable|email|max:255',
            'contact' => 'nullable|string|max:255',
            'address' => 'nullable|string|max:255',
            'company_id' => 'required|exists:company,id',
        ]);

        \App\Models\Contractor::create($data);

        return redirect()->back()->with('success', 'Contractor saved successfully.');
    }

    public function edit(\App\Models\Contractor $contractor)
    {
        return \Inertia\Inertia::render('contractor/Form', [
            'contractor' => $contractor,
            'companies' => \App\Models\Company::all()
        ]);
    }

    public function update(Request $request, \App\Models\Contractor $contractor)
    {
        $data = $request->validate([
            'name' => 'required|string|max:255',
            'email' => 'nullable|email|max:255',
            'contact' => 'nullable|string|max:255',
            'address' => 'nullable|string|max:255',
            'company_id' => 'required|exists:company,id',
        ]);

        $contractor->update($data);

        return redirect()->back()->with('success', 'Contractor updated successfully.');
    }

    public function destroy(\App\Models\Contractor $contractor)
    {
        $contractor->delete();
        return redirect()->back()->with('success', 'Contractor deleted successfully.');
    }
}
