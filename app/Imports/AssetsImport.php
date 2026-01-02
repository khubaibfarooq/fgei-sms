<?php

namespace App\Imports;

use App\Models\Asset;
use App\Models\AssetCategory;
use Maatwebsite\Excel\Concerns\ToModel;
use Maatwebsite\Excel\Concerns\WithHeadingRow;
use Maatwebsite\Excel\Concerns\WithValidation;
use Maatwebsite\Excel\Concerns\SkipsOnError;
use Maatwebsite\Excel\Concerns\SkipsErrors;
use Maatwebsite\Excel\Concerns\SkipsOnFailure;
use Maatwebsite\Excel\Concerns\SkipsFailures;
use Maatwebsite\Excel\Concerns\Importable;

class AssetsImport implements ToModel, WithHeadingRow, WithValidation, SkipsOnError, SkipsOnFailure
{
    use Importable, SkipsErrors, SkipsFailures;

    private $categories;
    private $importedCount = 0;

    public function __construct()
    {
        // Cache categories for performance
        $this->categories = AssetCategory::pluck('id', 'name')->toArray();
    }

    public function model(array $row)
    {
        $categoryName = trim($row['category'] ?? '');
        $categoryId = $this->categories[$categoryName] ?? null;

        if (!$categoryId) {
            return null; // Skip rows with invalid category
        }

        $this->importedCount++;

        return new Asset([
            'name' => $row['name'],
            'asset_category_id' => $categoryId,
            'details' => $row['details'] ?? null,
            'type' => $row['type'],
        ]);
    }

    public function rules(): array
    {
        return [
            'name' => 'required|string|max:255',
            'category' => 'required|string',
            'type' => 'required|in:consumable,fixed',
            'details' => 'nullable|string',
        ];
    }

    public function customValidationMessages(): array
    {
        return [
            'name.required' => 'Asset name is required.',
            'category.required' => 'Category is required.',
            'type.required' => 'Type is required.',
            'type.in' => 'Type must be either "consumable" or "fixed".',
        ];
    }

    public function getImportedCount(): int
    {
        return $this->importedCount;
    }

    public function getAvailableCategories(): array
    {
        return array_keys($this->categories);
    }
}
