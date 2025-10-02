<?php
namespace App\Http\Controllers;

use App\Models\Block;
use Illuminate\Http\Request;
use Inertia\Inertia;

class BlockController extends Controller
{
    public function index(Request $request)
    {
        $query = Block::with('institute');
$inst_id = session('sms_inst_id');
$type=session('type');
if($type=='school'||$type=='college'){
        $query->where('institute_id', $inst_id);}
        if ($request->search) {
            $query->where('name', 'like', '%' . $request->search . '%')
            ->Where('institute_id', $inst_id);
                  
        }

       

        $blocks = $query->paginate(10)->withQueryString();
$permissions = [
        'can_add'    => auth()->user()->can('block-add'),
        'can_edit'   => auth()->user()->can('block-edit'),
        'can_delete' => auth()->user()->can('block-delete'),
    ];
        return Inertia::render('blocks/Index', [
            'blocks' => $blocks,
            'filters' => ['search' => $request->search ?? ''],
                'permissions' => $permissions,
        ]);
    }

    public function create()
    {
        if(!auth()->user()->can('block-add')){
            abort(403);
        }
        return Inertia::render('blocks/Form', ['block' => null]);
    }

    public function store(Request $request)
    {
        $data = $request->validate([
            'name' => 'required|string|max:255',
            'area' => 'required|numeric',
        ]);
$data['institute_id'] = session('sms_inst_id');

        Block::updateOrCreate(['id' => $request->id ?? null], $data);

        return redirect()->back()->with('success', 'Block saved successfully.');
    }
    public function edit(Block $block)
    {if (!auth()->user()->can('block-edit')) {
        abort(403, 'You do not have permission to edit a block.');
    }
        return Inertia::render('blocks/Form', ['block' => $block]);
    }
    public function update(Request $request, Block $block)
    {
        $data = $request->validate([
            'name' => 'required|string|max:255',
            'area' => 'required|numeric',
        ]); 
        $data['institute_id'] = session('sms_inst_id');

        $block->update($data);       
        return redirect()->back()->with('success', 'Block updated successfully.');
    }
    public function destroy(Block $block)
    {if (!auth()->user()->can('block-delete')) {
        abort(403, 'You do not have permission to delete a block.');
    }
        $block->delete();   
        return redirect()->back()->with('success', 'Block deleted successfully.');
    }
}
