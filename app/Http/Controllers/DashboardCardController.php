<?php

namespace App\Http\Controllers;

use App\Models\DashboardCard;
use Illuminate\Http\Request;
use Inertia\Inertia;

class DashboardCardController extends Controller
{
    /**
     * Display a listing of the resource.
     */
   public function index(Request $request)
{

    $query = DashboardCard::query();

  

    if ($request->filled('search')) {
        $query->where('title', 'like', "%{$request->search}%");
    }

    $dashboardCards = $query->paginate(10)->withQueryString();

    // Manually attach roles to each card
    $dashboardCards->getCollection()->transform(function ($card) {
        $roleIdsOrNames = $card->role_id ? explode(',', $card->role_id) : [];

        $card->roles = \Spatie\Permission\Models\Role::query()
            ->when(
                count($roleIdsOrNames) > 0 && is_numeric($roleIdsOrNames[0]),
                fn($q) => $q->whereIn('id', $roleIdsOrNames),
            )
            ->get();

        return $card;
    });

    return Inertia::render('dashboard_cards/Index', [
        'dashboardCards' => $dashboardCards,
        'filters' => $request->only('search'),
    ]);
}

    /**
     * Show the form for creating a new resource.
     */
    public function create()
    { $roles=\Spatie\Permission\Models\Role::all();
        return Inertia::render('dashboard_cards/Form', [
            'dashboardCard' => null,
            'roles'=>$roles,
        ]);
    }

    /**
     * Store a newly created resource in storage.
     */
    public function store(Request $request)
    {
        $data = $request->validate([
            'title'   => 'required|string|max:255',
            'link'    => 'required|string|max:255',
            'color'   => 'nullable|string|max:255',
            'role_id' => 'required',
            'redirectlink' => 'nullable|string',
            'icon'  => 'nullable|string|max:255',
        ]);

        DashboardCard::create($data);

        return redirect()->route('dashboardcards.index')
            ->with('success', 'Dashboard card created successfully.');
    }

    /**
     * Show the form for editing the specified resource.
     */
    public function edit($id)
{
    $dashboardCard = DashboardCard::findOrFail($id); // Explicitly fetch the record
    $roles = \Spatie\Permission\Models\Role::all();
    return Inertia::render('dashboard_cards/Form', [
        'dashboardCard' => $dashboardCard,
        'roles' => $roles,
    ]);
}

    /**
     * Update the specified resource in storage.
     */
    public function update(Request $request, DashboardCard $dashboardCard)
{
    $data = $request->validate([
        'title'   => 'required|string|max:255',
                'color'   => 'nullable|string|max:255',
'icon'  => 'nullable|string|max:255',
        'link'    => 'required|string|max:255',
        'role_id' => 'required',
          'redirectlink' => 'nullable|string',
    ]);
$dashboardCard=DashboardCard::find($request->id);

    if ($dashboardCard->update($data)) {
        return redirect()->route('dashboardcards.index')
            ->with('success', 'Dashboard card updated successfully.');
    } else {
        return redirect()->back()->withErrors(['error' => 'Failed to update dashboard card.']);
    }
}

    /**
     * Remove the specified resource from storage.
     */
  
    public function destroy($id) // or (Request $request, $id)
{
    $dashboardCard = DashboardCard::findOrFail($id);

    $dashboardCard->delete();

    return redirect()->back()->with('success', 'Dashboard card deleted successfully.');
}
    
}
