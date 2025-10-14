<?php
namespace App\Http\Controllers;

use App\Models\Donation;
use Illuminate\Http\Request;
use Inertia\Inertia;
use App\Models\DonationType;


class DonationController extends Controller
{
    public function index(Request $request)
    {

        $query = Donation::with('institute');
$inst_id = session('sms_inst_id');
$type=session('type');

        $query->where('institute_id', $inst_id);
        if ($request->search) {
            $query->where('name', 'like', '%' . $request->search . '%')
            ->Where('institute_id', $inst_id);
                  
        }

       

        $donations = $query->paginate(10)->withQueryString();
$permissions = [
        'can_add'    => auth()->user()->can('donation-add'),
        'can_edit'   => auth()->user()->can('donation-edit'),
        'can_delete' => auth()->user()->can('donation-delete'),
    ];
        return Inertia::render('donations/Index', [
            'donations' => $donations,
            'filters' => ['search' => $request->search ?? ''],
                'permissions' => $permissions,
        ]);
    }

    public function create()
    {
        if(!auth()->user()->can('donation-add')){
            abort(403);
        }
                $donationTypes = DonationType::pluck('name', 'id')->toArray();

        return Inertia::render('donations/Form', ['donation' => null,'donationTypes'=>$donationTypes]);
    }

    public function store(Request $request)
    {
        $data = $request->validate([
            'details' => 'required|string|max:255',
            'amount' => 'required|numeric',
           'donation_type_id' => 'required|exists:donation_types,id',
                   'added_date' => 'required|date_format:Y-m-d',

        ]);
$data['institute_id'] = session('sms_inst_id');

        Donation::updateOrCreate(['id' => $request->id ?? null], $data);

        return redirect()->back()->with('success', 'Donation saved successfully.');
    }
    public function edit(Donation $donation)
    {if (!auth()->user()->can('donation-edit')) {
        abort(403, 'You do not have permission to edit a donation.');
    }
     $donationTypes = DonationType::pluck('name', 'id')->toArray();
        return Inertia::render('donations/Form', ['donation' => $donation,
    'donationTypes'=>$donationTypes]);
    }
    public function update(Request $request, Donation $donation)
    {
        $data = $request->validate([
            'details' => 'required|string|max:255',
            'amount' => 'required|numeric',
                       'donation_type_id' => 'required|exists:donation_types,id',   
                            'added_date' => 'required|date_format:Y-m-d',

        ]); 
        $data['institute_id'] = session('sms_inst_id');

        $donation->update($data);       
        return redirect()->back()->with('success', 'Donation updated successfully.');
    }
    public function destroy(Donation $donation)
    {if (!auth()->user()->can('donation-delete')) {
        abort(403, 'You do not have permission to delete a donation.');
    }
        $donation->delete();   
        return redirect()->back()->with('success', 'Donation deleted successfully.');
    }
}
