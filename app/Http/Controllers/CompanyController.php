<?php

namespace App\Http\Controllers;

use Illuminate\Http\Request;

class CompanyController extends Controller
{
    public function index(Request $request)
    {
        $query = \App\Models\Company::query();

        if ($request->search) {
            $query->where('name', 'like', '%' . $request->search . '%')
                  ->orWhere('email', 'like', '%' . $request->search . '%')
                  ->orWhere('contact', 'like', '%' . $request->search . '%');
        }

        $companies = $query->latest()->paginate(10)->withQueryString();

        return \Inertia\Inertia::render('company/Index', [
            'companies' => $companies,
            'filters' => ['search' => $request->search ?? ''],
        ]);
    }

    public function create()
    {
        return \Inertia\Inertia::render('company/Form', ['company' => null]);
    }

    public function store(Request $request)
    {
        $data = $request->validate([
            'name' => 'required|string|max:255',
            'email' => 'nullable|email|max:255',
            'contact' => 'nullable|string|max:255',
            'address' => 'nullable|string|max:255',
        ]);

        \App\Models\Company::create($data);

        return redirect()->back()->with('success', 'Company saved successfully.');
    }

    public function edit(\App\Models\Company $company)
    {
        return \Inertia\Inertia::render('company/Form', ['company' => $company]);
    }

    public function update(Request $request, \App\Models\Company $company)
    {
        $data = $request->validate([
            'name' => 'required|string|max:255',
            'email' => 'nullable|email|max:255',
            'contact' => 'nullable|string|max:255',
            'address' => 'nullable|string|max:255',
        ]);

        $company->update($data);

        return redirect()->back()->with('success', 'Company updated successfully.');
    }

    public function destroy(\App\Models\Company $company)
    {
        $company->delete();
        return redirect()->back()->with('success', 'Company deleted successfully.');
    }
}
