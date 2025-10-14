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

        if ($request->search) {
            $query->where('name', 'like', '%' . $request->search . '%');
        }

        $helpDesk = $query->paginate(10)->withQueryString();

        return Inertia::render('helpdesk/Index', [
            'helpDesk' => $helpDesk,
            'filters' => ['search' => $request->search ?? ''],
        ]);
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
'attachment'=>'required|string',
    

    ]);
      $data['status'] = 'Pending';
      $data['user_id'] = auth::user()->id();
      $data['institute_id'] = session('sms_inst_id');
        HelpDesk::updateOrCreate(['id' => $request->id ?? null], $data);

        return redirect()->back()->with('success', 'Request saved successfully.');
    }   
    public function edit(HelpDesk $HelpDesk)
    {
        //dd($HelpDesk);
        return Inertia::render('helpdesk/Form', ['helpDesk' => $HelpDesk]);
    } 
    public function update(Request $request, HelpDesk $HelpDesk)
    {
         $data = $request->validate([
            'title' => 'required|string|max:255',
'description'=>'required|string',
'attachment'=>'nullable|string',
    'status'=>'required|string',
'feedback'=>'nullable|string',
'feedback_date'=>'required|date_format:Y-m-d',



    ]);
           $data['feedback_by'] = auth::user()->id();
     
        $HelpDesk->update($data);     
        return redirect()->back()->with('success', 'Request updated successfully.');
    }
    public function destroy(HelpDesk $HelpDesk)
    {
        $HelpDesk->delete();   
        return redirect()->back()->with('success', 'Request deleted successfully.');
    }
}
