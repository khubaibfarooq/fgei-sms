<?php

namespace App\Http\Controllers;

use App\Models\Transport;
use App\Models\VehicleType;

use Illuminate\Http\Request;
use Inertia\Inertia;

class TransportController extends Controller
{
    public function index(Request $request)
    {
        $query = Transport::with('vehicleType', 'institute');
$inst_id = session('sms_inst_id');
$type=session('type');
if($type=='school'||$type=='college'){
        $query->where('institute_id', $inst_id);}
        if ($request->search) {
            $query->where('vehicle_no', 'like', '%' . $request->search . '%')->Where('institute_id', $inst_id);
        }
$permissions = [
            'can_add' => auth()->user()->can('transport-add'),
            'can_edit' => auth()->user()->can('transport-edit'),
            'can_delete' => auth()->user()->can('transport-delete'),
        ];
        $transports = $query->paginate(10)->withQueryString();

        return Inertia::render('transports/Index', [
            'transports' => $transports,
            'filters' => ['search' => $request->search ?? ''],
            'permissions' => $permissions,
        ]);
    }

    public function create()
    {if (!auth()->user()->can('transport-add')) {
        abort(403, 'You do not have permission to add a transport.');
    }
        $vehicale_type=VehicleType::all();
        return Inertia::render('transports/Form', ['transport' => null, 'vehicleTypes' => $vehicale_type]);
    }

    public function store(Request $request)
    {$vehicale_type=VehicleType::all();
        $data = $request->validate([
            'vehicle_type_id' => 'required|exists:vehicle_types,id',
            'vehicle_no' => 'required|string|max:255',
        ]);
$data['institute_id'] = session('sms_inst_id');

        Transport::updateOrCreate(['id' => $request->id ?? null], $data);

        return redirect()->back()->with('success', 'Transport saved successfully.');
    }
    public function edit(Transport $transport)
    {
        if (!auth()->user()->can('transport-edit')) {
        abort(403, 'You do not have permission to edit a transport.');
    }
        return Inertia::render('transports/Form', ['transport' => $transport, 'vehicleTypes' => VehicleType::all()]);
    } 
    public function update(Request $request, Transport $transport)
    {
        $data = $request->validate([
            'institute_id' => 'required|exists:institutes,id',
            'vehicle_type_id' => 'required|exists:vehicle_types,id',
            'vehicle_no' => 'required|string|max:255',        
        ]);
        $data['institute_id'] = session('sms_inst_id');

        $transport->update($data);
        return redirect()->back()->with('success', 'Transport updated successfully.');  }
    public function destroy(Transport $transport)
    {  if (!auth()->user()->can('transport-delete')) {
        abort(403, 'You do not have permission to delete a transport.');
    }
        $transport->delete();
        return redirect()->back()->with('success', 'Transport deleted successfully.');}
}
