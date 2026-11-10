<?php

namespace App\Models;

use Illuminate\Database\Eloquent\Model;
use Illuminate\Database\Eloquent\Relations\BelongsTo;

class TesdaQualification extends Model
{
    protected $fillable = ['repairer_profile_id', 'image_path', 'image_mime', 'processing_status', 'verification_status', 'extracted_details', 'issues', 'failure_reason'];

    protected $casts = ['extracted_details' => 'array', 'issues' => 'array'];

    protected $hidden = ['image_path'];

    public function repairerProfile(): BelongsTo
    {
        return $this->belongsTo(RepairerProfile::class);
    }
}
