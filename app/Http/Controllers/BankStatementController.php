<?php

namespace App\Http\Controllers;

use App\Models\BankStatement;
use App\Models\Institute;
use Illuminate\Http\Request;

class BankStatementController extends Controller
{
    /**
     * Upload a bank statement image for an institute.
     */
    public function store(Request $request, Institute $institute)
    {
        $request->validate([
            'image' => 'required|file|max:10240',
        ]);

        $file = $request->file('image');
        $fileName = time() . '-' . uniqid() . '.' . $file->getClientOriginalExtension();

        $dir = public_path('assets/bank-statements');
        if (!file_exists($dir)) {
            mkdir($dir, 0755, true);
        }

        $file->move($dir, $fileName);

        BankStatement::create([
            'institute_id' => $institute->id,
            'image'        => 'assets/bank-statements/' . $fileName,
            'uploaded_by'  => auth()->id(),
        ]);

        return redirect()->back()->with('success', 'Bank statement uploaded successfully.');
    }

    /**
     * Delete a bank statement image.
     */
    public function destroy(BankStatement $bankStatement)
    {
        $filePath = public_path($bankStatement->image);
        if (file_exists($filePath)) {
            unlink($filePath);
        }

        $bankStatement->delete();

        return redirect()->back()->with('success', 'Bank statement deleted.');
    }
}
