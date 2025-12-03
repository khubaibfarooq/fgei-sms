<?php

namespace App\Http\Controllers;

use App\Models\Type;
use Illuminate\Http\Request;
use Inertia\Inertia;

class TypeController extends Controller
{
    public function index(Request $request)
    {
        $query = Type::query();

        if ($request->search) {
            $query->where('name', 'like', '%' . $request->search . '%')
                  ->orWhere('module', 'like', '%' . $request->search . '%');
        }

        $types = $query->paginate(10)->withQueryString();

        return Inertia::render('types/Index', [
            'types' => $types,
            'filters' => ['search' => $request->search ?? ''],
        ]);
    }

    public function create()
    {
        $types = Type::whereNull('parent_id')
            ->select('id', 'name')
            ->get();
        return Inertia::render('types/Form', [
            'type' => null,
            'types' => $types
        ]);
    }

    public function store(Request $request)
    {
        $data = $request->validate([
            'name' => 'required|string|max:255',
            'parent_id' => 'nullable|numeric',
            'module' => 'required|string|max:255',
            'isblock' => 'required|boolean',
            'isroom' => 'required|boolean',
            'isasset' => 'required|boolean',
        ]);

        Type::create($data);

        return redirect()->back()->with('success', 'Type saved successfully.');
    }

    public function edit(Type $type)
    {
        $types = Type::whereNull('parent_id')
            ->select('id', 'name')
            ->get();
        return Inertia::render('types/Form', [
            'type' => $type,
            'types' => $types
        ]);
    }

    public function update(Request $request, Type $type)
    {
        $data = $request->validate([
            'name' => 'required|string|max:255',
            'parent_id' => 'nullable|numeric',
            'module' => 'required|string|max:255',
            'isblock' => 'required|boolean',
            'isroom' => 'required|boolean',
            'isasset' => 'required|boolean',
        ]);

        $type->update($data);

        return redirect()->back()->with('success', 'Type updated successfully.');
    }

    public function destroy(Type $type)
    {
        $type->delete();

        return redirect()->back()->with('success', 'Type deleted successfully.');
    }
}
