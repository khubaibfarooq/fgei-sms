<?php

namespace App\Http\Controllers;

use App\Models\DashboardCard;
use Illuminate\Http\Request;
use Inertia\Inertia;
use Spatie\Permission\Models\Role;

class DashboardCardController extends Controller
{
    /**
     * Display a listing of the resource.
     */

public function index(Request $request)
{
    // Extract filters properly
    $filters = [
        'search' => $request->input('search', ''),
        'role'   => $request->input('role', ''), // role ID as string
    ];

    $query = DashboardCard::query();

    // Search by title
    if ($filters['search']) {
        $query->where('title', 'like', '%' . $filters['search'] . '%');
    }

    // Filter by role — using FIND_IN_SET (best for comma-separated IDs)
    if ($filters['role']) {
        $roleId = $filters['role'];
      //  $query->whereRaw("FIND_IN_SET(?, role_id)", [$roleId]);
        // Alternative (less efficient but works everywhere):
        $query->where('role_id', 'like', "%{$roleId}%");
    }
$query->orderByRaw('ISNULL(`order`) ASC, `order` ASC, id DESC');
    // Optional: Order by custom order, then ID

    $dashboardCards = $query->paginate(10)->withQueryString();

    // Transform each card to include full role objects (for badges)
    $dashboardCards->getCollection()->transform(function ($card) {
        $roleIds = $card->role_id ? array_filter(explode(',', $card->role_id)) : [];

        $card->roles = collect();

        if (!empty($roleIds)) {
            // Only fetch if there are IDs and they are numeric
            if (is_numeric($roleIds[0])) {
                $card->roles = Role::whereIn('id', $roleIds)->get();
            }
        }

        return $card;
    });

    // Get all roles for the filter dropdown
    $allRoles = Role::orderBy('name')->get(['id', 'name']);

    return Inertia::render('dashboard_cards/Index', [
        'dashboardCards' => $dashboardCards,
        'filters'        => $filters, // send both search & role back
        'roles'          => $allRoles,
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
            'order'=>'nullable|numeric',
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
              'order'=>'nullable|numeric',
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
  
    public function destroy(DashboardCard $dashboardCard) // or (Request $request, $id)
{
   // $dashboardCard = DashboardCard::findOrFail($request->id);

    $dashboardCard->delete();

    return redirect()->back()->with('success', 'Dashboard card deleted successfully.');
}
    
}
