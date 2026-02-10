<?php

namespace App\Http\Middleware;

use Closure;
use Illuminate\Http\Request;
use Symfony\Component\HttpFoundation\Response;
use App\Models\Menu;

class CheckMenuPermission
{
    public function handle(Request $request, Closure $next): Response
    {
        // Skip menu permission check for non-GET requests (actions like store/update)
        if (!$request->isMethod('get')) {
            return $next($request);
        }

        $user = $request->user();

        // Abaikan jika belum login
        if (!$user) {
            return redirect()->route('login');
        }

        // Ambil route yang sedang diakses, contoh: "/permissions"
        $currentRoute = $request->route()->uri();

        // Ambil menu berdasarkan route
        $menu = Menu::where('route', '/' . ltrim($currentRoute, '/'))->first();

        // Jika menu ditemukan dan punya permission
        if ($menu && $menu->permission_name) {
            if (!$user->can($menu->permission_name)) {
                abort(403, 'you do not have permission to access this page.');
            }
        }

        return $next($request);
    }
}
