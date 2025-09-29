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
        $query = DashboardCard::with('role');

        if ($request->search) {
            $query->where('title', 'like', '%' . $request->search . '%');
        }

        $dashboardCards = $query->paginate(10)->withQueryString();

        return Inertia::render('dashboard_cards/Index', [
            'dashboardCards' => $dashboardCards,
            'filters' => [
                'search' => $request->search ?? '',
            ],
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
            'role_id' => 'required|exists:roles,id',
        ]);

        DashboardCard::create($data);

        return redirect()->route('dashboardcards.index')
            ->with('success', 'Dashboard card created successfully.');
    }

    /**
     * Show the form for editing the specified resource.
     */
    public function edit(DashboardCard $dashboardCard)
    {$roles=\Spatie\Permission\Models\Role::all();
       
        return Inertia::render('dashboard_cards/Form', [
            'dashboardCard' => $dashboardCard,
            'roles'=>$roles,
        ]);
    }

    /**
     * Update the specified resource in storage.
     */
    public function update(Request $request, DashboardCard $dashboardCard)
    {
        $data = $request->validate([
            'title'   => 'required|string|max:255',
            'link'    => 'required|string|max:255',
            'role_id' => 'required|exists:roles,id',
        ]);

        $dashboardCard->update($data);

        return redirect()->route('dashboardcards.index')
            ->with('success', 'Dashboard card updated successfully.');
    }

    /**
     * Remove the specified resource from storage.
     */
    public function destroy(DashboardCard $dashboardCard)
    {
        $dashboardCard->delete();

        return redirect()->route('dashboardcards.index')
            ->with('success', 'Dashboard card deleted successfully.');
    }
}
