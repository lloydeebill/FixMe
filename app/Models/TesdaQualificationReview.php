<?php

namespace App\Models;

use Illuminate\Database\Eloquent\Model;

class TesdaQualificationReview extends Model
{
    public $timestamps = false;

    // History is written only by the authorized review transaction, not mass assignment.
    protected $guarded = ['*'];

    protected $casts = ['reviewed_at' => 'datetime'];
}
