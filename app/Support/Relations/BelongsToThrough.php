<?php

namespace App\Support\Relations;

use Illuminate\Database\Eloquent\Model;
use Illuminate\Database\Eloquent\Relations\BelongsTo;

trait BelongsToThrough
{
    public function belongsToThrough(
        string $related,
        string $through,
        string $throughForeignKey,
        string $throughRelatedKey,
        string $firstKey,
        string $secondKey
    ): BelongsTo {
        $throughModel   = $this->{$through}()->getRelated();
        $relatedModel   = new $related();

        $throughTable   = $throughModel->getTable();
        $relatedTable   = $relatedModel->getTable();

        return new BelongsTo(
            $relatedModel->newQuery(),
            $this,
            "{$relatedTable}.{$relatedModel->getKeyName()}",
            $firstKey,
            $secondKey,
            $throughForeignKey,
            $throughRelatedKey,
            $throughTable,
            $relatedTable,
            __FUNCTION__
        );
    }
}