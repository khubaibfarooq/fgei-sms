<?php
namespace App\Http\Controllers;

use App\Models\FundHead;
use Illuminate\Http\Request;
use Inertia\Inertia;

class FundHeadsController extends Controller
{
    public function index(Request $request)
    {
        $query = FundHead::query();

        if ($request->search) {
            $query->where('name', 'like', '%' . $request->search . '%');
        }

        $fundHeads = $query->paginate(10)->withQueryString();

        return Inertia::render('fundheads/Index', [
            'fundHeads' => $fundHeads,
            'filters' => ['search' => $request->search ?? ''],
        ]);
    }

    public function create()
    {
         $fundHeads = FundHead::whereNull('parent_id')
        ->select('id', 'name')
        ->get();
        return Inertia::render('fundheads/Form', ['fundHead' => null,
    'fundHeads'=>$fundHeads]);
    }

    public function store(Request $request)
    {
        $data = $request->validate([
            'name' => 'required|string|max:255',
            'parent_id'=>'nullable|numeric',
        ]);

        FundHead::Create($data);

        return redirect()->back()->with('success', 'Fund Head saved successfully.');
    }   
    public function edit(FundHead $FundHead)
    {
        //dd($FundHeads);
         $fundHeads = FundHead::whereNull('parent_id')
        ->select('id', 'name')
        ->get();
        return Inertia::render('fundheads/Form', ['fundHead' => $FundHead,
    'fundHeads'=>$fundHeads]);
    } 
    public function update(Request $request, FundHead $FundHead)
    {
        $data = $request->validate(['name' => 'required|string|max:255',
         'parent_id'=>'nullable|numeric',]);  
        $FundHead->update($data);     
        return redirect()->back()->with('success', 'Fund Head updated successfully.');
    }
    public function destroy(FundHead $FundHead)
    {
        $FundHead->delete();   
        return redirect()->back()->with('success', 'Fund Head deleted successfully.');
    }
}
