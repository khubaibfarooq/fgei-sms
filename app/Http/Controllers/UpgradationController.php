<?php
namespace App\Http\Controllers;

use App\Models\Upgradation;
use Illuminate\Http\Request;
use Inertia\Inertia;

class UpgradationController extends Controller
{
    public function index(Request $request)
    {
        $query = Upgradation::with('institute');
$inst_id = session('sms_inst_id');
$type=session('type');
if($type=='school'||$type=='college'){
        $query->where('institute_id', $inst_id);}
        if ($request->search) {
            $query->where('details', 'like', '%' . $request->search . '%')
            ->Where('institute_id', $inst_id);
                  
        }
       
        $upgradations = $query->paginate(10)->withQueryString();
$permissions = [
        'can_add'    => auth()->user()->can('upgradations-add'),
        'can_edit'   => auth()->user()->can('upgradations-edit'),
        'can_delete' => auth()->user()->can('upgradations-delete'),
    ];
        return Inertia::render('upgradations/Index', [
            'upgradations' => $upgradations,
            'filters' => ['search' => $request->search ?? ''],
                'permissions' => $permissions,
        ]);
    }

    public function create()
    {
        if (!auth()->user()->can('upgradations-add')) {
        abort(403, 'You do not have permission to add a upgradation.');
    }
        return Inertia::render('upgradations/Form', ['upgradation' => null]);
    }

    public function store(Request $request)
    {
        $data = $request->validate([
 
            'details' => 'required|string',
            'from' => 'required|date',
            'to' => 'required|date',
              'levelfrom' => 'required|string',
            'levelto' => 'required|string',
            'status' => 'nullable|string|max:50',
   
            'approved_date' => 'nullable|date',
            'approved_by' => 'nullable|integer',
        ]);
$data['institute_id']=session('sms_inst_id');
$data['added_by']=auth()->user()->id;
        Upgradation::updateOrCreate(['id' => $request->id ?? null], $data);

        return redirect()->back()->with('success', 'Upgradation saved successfully.');
    }
    public function edit(Upgradation $upgradation)
    {
        
        if (!auth()->user()->can('upgradations-edit')) {
        abort(403, 'You do not have permission to edit  upgradation.');
    }
        return Inertia::render('upgradations/Form', ['upgradation' => $upgradation]);
    } 
    public function update(Request $request, Upgradation $upgradation)
    {
        $data = $request->validate([
            'details' => 'required|string',
            'from' => 'nullable|date',  
            'to' => 'nullable|date',
               'levelfrom' => 'required|string',
            'levelto' => 'required|string',
            'status' => 'nullable|string|max:50',
            
            'approved_date' => 'nullable|date',
            'approved_by' => 'nullable|integer',
        ]);
        $data['institute_id']=session('sms_inst_id');
$data['added_by']=auth()->user()->id;
        $upgradation->update($data);
        return redirect()->back()->with('success', 'Upgradation updated successfully.');  }
    public function destroy(Upgradation $upgradation)
    {if (!auth()->user()->can('upgradations-delete')) {
        abort(403, 'You do not have permission to delete  upgradation.');
    }
        $upgradation->delete();
        return redirect()->back()->with('success', 'Upgradation deleted successfully.');}   
}
