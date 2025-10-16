<?php
namespace App\Http\Controllers;

use App\Models\HelpDesk;
use Illuminate\Http\Request;
use Inertia\Inertia;

class HelpDeskController extends Controller
{
    public function index(Request $request)
    {
        $query = HelpDesk::query();
$inst_id = session('sms_inst_id');
$type=session('type');
if($type=="School"||$type=="College")
   {$query->where('institute_id',$inst_id);}

        if ($request->search) {
            $query->where('name', 'like', '%' . $request->search . '%');
        }

        $helpDesk = $query->with(['user', 'institute', 'feedbackby'])->paginate(10)->withQueryString();
if($type=="School"||$type=="College"){
        return Inertia::render('helpdesk/Index', [
            'helpDesk' => $helpDesk,
            'filters' => ['search' => $request->search ?? ''],
        ]);}else{
          return Inertia::render('helpdesk/Requests', [
            'helpDesk' => $helpDesk,
            'filters' => ['search' => $request->search ?? ''],
        ]);  
        }
    }

    public function create()
    {
        return Inertia::render('helpdesk/Form', ['helpDesk' => null]);
    }

    public function store(Request $request)
    {
        $data = $request->validate([
            'title' => 'required|string|max:255',
'description'=>'required|string',
'attachment'=>'nullable|file',
    

    ]);
      if ($request->hasFile('attachment')) {
            $data['attachment'] = $request->file('attachment')->store('attachment', 'public');
        } else {
            unset($data['attachment']);
        }  
      $data['status'] = 'Pending';
      $data['user_id'] = auth()->id();
      $data['institute_id'] = session('sms_inst_id');
        HelpDesk::updateOrCreate(['id' => $request->id ?? null], $data);

        return redirect()->back()->with('success', 'Request saved successfully.');
    }   
    public function edit(HelpDesk $HelpDesk)
    {
        //dd($HelpDesk);
        return Inertia::render('helpdesk/Form', ['helpDesk' => $HelpDesk]);
    } 
    public function update(Request $request, HelpDesk $helpDesk)
{
    if (!auth()->check()) {
        return response()->json(['message' => 'Unauthorized'], 401);
    }

    try {
        $data = $request->validate([
            'status' => 'required|string|in:Pending,Waiting,Resolved,Rejected',
            'feedback' => 'required|string',
        ]);

        $data['feedback_date'] = date('Y-m-d');
        $data['feedback_by'] = auth()->id();


        $helpDesk->update($data);
  return redirect()->back()->with('success', 'Request updated successfully.');
    
    } catch (ValidationException $e) {
        return response()->json(['errors' => $e->errors()], 422);
    } catch (\Exception $e) {
        \Log::error('HelpDesk update failed: ' . $e->getMessage());
        return response()->json(['message' => 'Failed to update help desk ticket'], 409);
    }
}
    public function destroy(HelpDesk $HelpDesk)
    {
        $HelpDesk->delete();   
        return redirect()->back()->with('success', 'Request deleted successfully.');
    }
}
