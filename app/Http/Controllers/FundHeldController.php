<?php
namespace App\Http\Controllers;

use App\Models\FundHeld;
use App\Models\Fund;

use App\Models\FundHead;

use Illuminate\Http\Request;
use Inertia\Inertia;
use Illuminate\Support\Facades\Auth;
class FundHeldController extends Controller
{
    public function index(Request $request)
    {
        $query = FundHeld::with('institute');
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
    try {
        $data = $request->validate([
            'balance' => 'required|numeric',
            'fund_head_id' => 'required|numeric',
        ]);

        // Add authenticated user ID and institute_id from session
        $data['added_by'] = auth()->id();
        $data['institute_id'] = session('sms_inst_id');

        // Find existing FundHeld record
        $fundHeld = FundHeld::where('fund_head_id', $data['fund_head_id'])
            ->where('institute_id', $data['institute_id'])
            ->first();

        if ($fundHeld) {
            // Update existing record
            $fundHeld->update($data);
            $message = 'Fund updated successfully.';
        } else {
            //dd( $data);
            // Create new record
            FundHeld::create($data);
            $message = 'Fund saved successfully.';
        }

        return redirect()->back()->with('success', $message);

    } catch (\Illuminate\Validation\ValidationException $e) {
        // Return validation errors to the frontend
        return back()->withErrors($e->validator->errors())->withInput();
    } catch (\Exception $e) {
        // Handle any unexpected errors
        return back()->with('error', 'An error occurred while processing the fund: ' . $e->getMessage());
    }
}
    public function edit(FundHeld $Fund)
    { if(!auth()->user()->can('fund-add')){
            abort(403);
        }
        //dd($Funds);
         $fundHeads = FundHead::select('id', 'name')->get()->values();;
        return Inertia::render('funds/Form', [
    'fund'=>$Fund,
    'fundHeads' => $fundHeads,]);
    } 
   public function update(Request $request, FundHeld $fund)
    {
        try {
            // Check if user has permission to update funds
            if (!auth()->user()->can('fund-add')) {
                abort(403, 'Unauthorized action.');
            }

            // Validate request data
            $validatedData = $request->validate([
                'balance' => 'required|numeric',
                'fund_head_id' => 'required|numeric',
          
            ]);
//dd($validatedData,$fund);
            // Add the authenticated user's ID to the data
            // Update the fund
            $fund->update($validatedData);

            // Return success response
          return redirect()->route('funds.index')->with('success',  'Fund updated successfully.');
         
        } catch (\Illuminate\Validation\ValidationException $e) {
            // Return validation errors to the frontend
            return back()->withErrors($e->validator->errors())->withInput();
        } catch (\Exception $e) {
            // Handle any unexpected errors
            return back()->with('error', 'An error occurred while updating the fund: ' . $e->getMessage());
        }
    }
    public function destroy(FundHeld $Fund)
    { if(!auth()->user()->can('fund-delete')){
            abort(403);
        }
        $Fund->delete();   
        return redirect()->back()->with('success', 'Fund  deleted successfully.');
    }
}
