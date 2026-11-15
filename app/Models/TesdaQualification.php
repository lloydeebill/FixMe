<?php

namespace App\Models;

use Illuminate\Database\Eloquent\Model;
use Illuminate\Database\Eloquent\Relations\BelongsTo;

class TesdaQualification extends Model
{
    protected $fillable = ['repairer_profile_id', 'image_path', 'image_mime', 'processing_status', 'verification_status', 'extracted_details', 'issues', 'failure_reason', 'reviewed_by', 'reviewed_at', 'review_note'];

    protected $casts = ['extracted_details' => 'array', 'issues' => 'array', 'reviewed_at' => 'datetime'];

    protected $hidden = ['image_path'];

    public function repairerProfile(): BelongsTo
    {
        return $this->belongsTo(RepairerProfile::class);
    }
}
