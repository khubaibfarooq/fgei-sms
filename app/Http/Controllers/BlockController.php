<?php
namespace App\Http\Controllers;

use App\Models\Block;
use Illuminate\Http\Request;
use Inertia\Inertia;
use App\Models\BlockType;


class BlockController extends Controller
{
    public function index(Request $request)
    {

      
$inst_id = session('sms_inst_id');
$type=session('type');
  $query = Block::Where('institute_id', $inst_id)->with('institute');
        $query->where('institute_id', $inst_id);
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
                $blockTypes = BlockType::pluck('name', 'id')->toArray();

        return Inertia::render('blocks/Form', ['block' => null,'blockTypes'=>$blockTypes]);
    }

    public function store(Request $request)
    {
        $data = $request->validate([
            'name' => 'required|string|max:255',
            'area' => 'required|numeric',
           'block_type_id' => 'required|exists:block_types,id',
        ]);
$data['institute_id'] = session('sms_inst_id');

        Block::updateOrCreate(['id' => $request->id ?? null], $data);

        return redirect()->back()->with('success', 'Block saved successfully.');
    }
    public function edit(Block $block)
    {if (!auth()->user()->can('block-edit')) {
        abort(403, 'You do not have permission to edit a block.');
    }
     $blockTypes = BlockType::pluck('name', 'id')->toArray();
        return Inertia::render('blocks/Form', ['block' => $block,
    'blockTypes'=>$blockTypes]);
    }
    public function update(Request $request, Block $block)
    {
        $data = $request->validate([
            'name' => 'required|string|max:255',
            'area' => 'required|numeric',
                       'block_type_id' => 'required|exists:block_types,id',

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
