<?php

namespace App\Http\Controllers;

use App\Models\Transport;
use Illuminate\Http\Request;
use Inertia\Inertia;

class TransportController extends Controller
{
    public function index(Request $request)
    {
        $query = Transport::with('vehicleType', 'institute');

        if ($request->search) {
            $query->where('vehicle_no', 'like', '%' . $request->search . '%');
        }

        $transports = $query->paginate(10)->withQueryString();

        return Inertia::render('transports/Index', [
            'transports' => $transports,
            'filters' => ['search' => $request->search ?? ''],
        ]);
    }

    public function create()
    {
        return Inertia::render('transports/Form', ['transport' => null]);
    }

    public function store(Request $request)
    {
        $data = $request->validate([
            'institute_id' => 'required|exists:institutes,id',
            'vehicle_type_id' => 'required|exists:vehicle_types,id',
            'vehicle_no' => 'required|string|max:255',
        ]);

        Transport::updateOrCreate(['id' => $request->id ?? null], $data);

        return redirect()->back()->with('success', 'Transport saved successfully.');
    }
    public function edit(Transport $transport)
    {
        return Inertia::render('transports/Form', ['transport' => $transport]);
    } 
    public function update(Request $request, Transport $transport)
    {
        $data = $request->validate([
            'institute_id' => 'required|exists:institutes,id',
            'vehicle_type_id' => 'required|exists:vehicle_types,id',
            'vehicle_no' => 'required|string|max:255',        
        ]);
        $transport->update($data);
        return redirect()->back()->with('success', 'Transport updated successfully.');  }
    public function destroy(Transport $transport)
    {
        $transport->delete();
        return redirect()->back()->with('success', 'Transport deleted successfully.');}
}
