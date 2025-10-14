<?php
namespace App\Http\Controllers;

use App\Models\Fund;
use App\Models\FundHead;

use Illuminate\Http\Request;
use Inertia\Inertia;

class FundsController extends Controller
{
    public function index(Request $request)
    {
        $query = Fund::with('institute');
$inst_id = session('sms_inst_id');
$type=session('type');

        $query->where('institute_id', $inst_id);
        if ($request->search) {
            $query->where('name', 'like', '%' . $request->search . '%') ->Where('institute_id', $inst_id);
        }

        $funds = $query->with('FundHead')->paginate(10)->withQueryString();
$permissions = [
        'can_add'    => auth()->user()->can('fund-add'),
        'can_edit'   => auth()->user()->can('fund-edit'),
        'can_delete' => auth()->user()->can('fund-delete'),
    ];
        return Inertia::render('funds/Index', [
            'funds' => $funds,
            'filters' => ['search' => $request->search ?? ''],
            'permissions'=>$permissions,
        ]);
    }

    public function create()
    {
         if(!auth()->user()->can('fund-add')){
            abort(403);
        }
         $fundHeads = FundHead::select('id', 'name')->get();
      
        return Inertia::render('funds/Form', ['fund' => null,
    'fundHeads'=>$fundHeads]);
    }

   public function store(Request $request)
{
    $data = $request->validate([
        'amount' => 'required|numeric',
        'fund_head_id' => 'required|numeric',
        'added_date' => 'required|date_format:Y-m-d', // Enforce YYYY-MM-DD format
    ]);

    // Add institute_id from session
    $data['institute_id'] = session('sms_inst_id');

    // Ensure added_date is in YYYY-MM-DD format (optional, for extra safety)
    $data['added_date'] = \Carbon\Carbon::parse($data['added_date'])->format('Y-m-d');

    // Update or create the Fund record
    Fund::updateOrCreate(['id' => $request->id ?? null], $data);

    return redirect()->back()->with('success', 'Fund saved successfully.');
} 
    public function edit(Fund $Fund)
    { if(!auth()->user()->can('fund-add')){
            abort(403);
        }
        //dd($Funds);
         $fundHeads = FundHead::select('id', 'name')->get()->values();;
        return Inertia::render('funds/Form', [
    'fund'=>$Fund,
    'fundHeads' => $fundHeads,]);
    } 
    public function update(Request $request, Fund $Fund)
    { if(!auth()->user()->can('fund-add')){
            abort(403);
        }
        $data = $request->validate([ 
             'amount' => 'required|numeric',
        'fund_head_id'=>'required|numeric',
        'added_date' => 'required|date_format:Y-m-d',]); 
        $data['institute_id'] = session('sms_inst_id');
 
        $Fund->update($data);     
        return redirect()->back()->with('success', 'Fund  updated successfully.');
    }
    public function destroy(Fund $Fund)
    { if(!auth()->user()->can('fund-delete')){
            abort(403);
        }
        $Fund->delete();   
        return redirect()->back()->with('success', 'Fund  deleted successfully.');
    }
}
