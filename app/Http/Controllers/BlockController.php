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

        if ($request->search) {
            $query->where('name', 'like', '%' . $request->search . '%');
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
            'institute_id' => 'required|exists:institutes,id',
            'name' => 'required|string|max:255',
            'area' => 'required|numeric',
        ]);

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
            'institute_id' => 'required|exists:institutes,id',
            'name' => 'required|string|max:255',
            'area' => 'required|numeric',
        ]); 
        $block->update($data);       
        return redirect()->back()->with('success', 'Block updated successfully.');
    }
    public function destroy(Block $block)
    {
        $block->delete();   
        return redirect()->back()->with('success', 'Block deleted successfully.');
    }
}
