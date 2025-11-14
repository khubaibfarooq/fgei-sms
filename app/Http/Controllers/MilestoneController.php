<?php

namespace App\Http\Controllers;

use Illuminate\Http\Request;
use App\Models\Milestone;
class MilestoneController extends Controller
{
  public function index(Request $request)
    {
        $query = Milestone::with('institute');
        $project_id = $request->project_id;

        $query->where('project_id', $inst_id);
     

        $milestones = $query->with('FundHead')->paginate(10)->withQueryString();
if($request->search){
    $query->where('name', 'like', '%' . $request->search . '%')
          ->where('project_id', $project_id);
}
        $permissions = [
            'can_add'    => auth()->user()->can('milestone-add'),
            'can_edit'   => auth()->user()->can('milestone-edit'),
            'can_delete' => auth()->user()->can('milestone-delete'),
        ];

        return Inertia::render('milestone/Index', [
            'milestones'       => $milestones,
            'filters'     => ['search' => $request->search ?? ''],
            'permissions' => $permissions,
        ]);
    }

  

    // --------------------------------------------------------------------- //
    // 3. API: SINGLE TRANSACTION DETAIL (for modal)
    // --------------------------------------------------------------------- //
 

    // --------------------------------------------------------------------- //
    // 4. CREATE (unchanged)
    // --------------------------------------------------------------------- //
    public function create()
    {
        if (!auth()->user()->can('milestone-add')) {
            abort(403);
        }


        return Inertia::render('milestone/Form', [
            'milestone'      => null,
        ]);
    }

    // --------------------------------------------------------------------- //
    // 5. STORE (minor cleanup)
    // --------------------------------------------------------------------- //
    public function store(Request $request)
    {
        try {
            $data = $request->validate([
                'amount'        => 'required|numeric',
          'project_id'   => 'required|numeric',
                'due_date'    => 'required|date_format:Y-m-d',
                'status'        => 'required|string',
                'description'   => 'nullable|string',
                'status'          => 'required|string',
            ]);
$data['added_by'] = auth()->id();

            Milestone::create($data);

            return redirect()->back()->with('success', 'Milestone saved successfully.');
        } catch (\Illuminate\Validation\ValidationException $e) {
            return back()->withErrors($e->validator->errors())->withInput();
        } catch (\Exception $e) {
            return back()->with('error', 'Error: ' . $e->getMessage());
        }
    }

    // --------------------------------------------------------------------- //
    // 6. EDIT (unchanged)
    // --------------------------------------------------------------------- //
    public function edit(Milestone $milestone)
    {
        if (!auth()->user()->can('milestone-add')) {
            abort(403);
        }

        $milestone = Milestone::select('id', 'name')->get();

        return Inertia::render('milestone/Form', [
            'milestone'      => $milestone,
        ]);
    }

    // --------------------------------------------------------------------- //
    // 7. UPDATE (minor cleanup)
    // --------------------------------------------------------------------- //
    public function update(Request $request, Milestone $milestone)
    {
        try {
            if (!auth()->user()->can('milestone-add')) {
                abort(403);
            }

            $validated = $request->validate([
        
                'amount'        => 'required|numeric',
          'project_id'   => 'required|numeric',
                'due_date'    => 'required|date_format:Y-m-d',
                'status'        => 'required|string',
                'description'   => 'nullable|string',
                'status'          => 'required|string',
            ]);
$validated['added_by'] = auth()->id();

            $milestone->update($validated);

            return redirect()->back()->with('success', 'milestone updated successfully.');
        } catch (\Illuminate\Validation\ValidationException $e) {
            return back()->withErrors($e->validator->errors())->withInput();
        } catch (\Exception $e) {
            return back()->with('error', 'Error: ' . $e->getMessage());
        }
    }

    // --------------------------------------------------------------------- //
    // 8. DELETE (unchanged)
    // --------------------------------------------------------------------- //
    public function destroy(Milestone $milestone)
    {
        if (!auth()->user()->can('milestone-delete')) {
            abort(403);
        }

        $milestone->delete();

        return redirect()->back()->with('success', 'milestone deleted successfully.');
    }
}
