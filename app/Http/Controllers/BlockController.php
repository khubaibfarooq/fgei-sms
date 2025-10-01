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

        return Inertia::render('blocks/Index', [
            'blocks' => $blocks,
            'filters' => ['search' => $request->search ?? ''],
        ]);
    }

    public function create()
    {
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
    {
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
    {
        $block->delete();   
        return redirect()->back()->with('success', 'Block deleted successfully.');
    }
}
