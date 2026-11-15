<?php

use Illuminate\Foundation\Inspiring;
use Illuminate\Support\Facades\Artisan;
use Illuminate\Support\Facades\DB;
use App\Models\User;

Artisan::command('inspire', function () {
    $this->comment(Inspiring::quote());
})->purpose('Display an inspiring quote');

Artisan::command('skilllink:designate-first-admin {user_id} {--operator=} {--reason=} {--apply}', function () {
    $id = (string) $this->argument('user_id');
    $operator = trim((string) $this->option('operator'));
    $reason = trim((string) $this->option('reason'));
    if (! ctype_digit($id) || (int) $id < 1 || mb_strlen($operator) < 2 || mb_strlen($operator) > 120
        || mb_strlen($reason) < 10 || mb_strlen($reason) > 1000) {
        $this->error('Provide an existing numeric user ID, operator identifier (2–120 characters), and reason (10–1000 characters).');
        return 1;
    }

    $user = User::find((int) $id);
    if (! $user || ! $user->hasVerifiedEmail() || ! $user->profileIsComplete() || ! $user->repairerDetailsAreComplete()) {
        $this->error('The designated account must exist, be email verified, and have completed onboarding.');
        return 1;
    }
    if (User::where('is_admin', true)->exists() || DB::table('admin_designations')->exists()) {
        $this->error('A first admin has already been designated.');
        return 1;
    }
    if (! $this->option('apply')) {
        $this->info("Eligible account ID {$id}. No change made. Rerun with --apply after authorization.");
        return 0;
    }

    try {
        DB::transaction(function () use ($id, $operator, $reason) {
            $target = User::whereKey((int) $id)->lockForUpdate()->firstOrFail();
            if (! $target->hasVerifiedEmail() || ! $target->profileIsComplete() || ! $target->repairerDetailsAreComplete()
                || User::where('is_admin', true)->exists()) {
                throw new RuntimeException('Account eligibility changed or an admin already exists.');
            }
            // The unique bootstrap key makes concurrent first-admin attempts mutually exclusive.
            DB::table('admin_designations')->insert([
                'bootstrap_key' => 'first_admin',
                'user_id' => $target->user_id,
                'operator' => $operator,
                'reason' => $reason,
                'created_at' => now(),
            ]);
            $target->forceFill(['is_admin' => true])->save();
        });
    } catch (Throwable) {
        $this->error('Designation was not applied. Check eligibility and whether another first-admin operation completed.');
        return 1;
    }

    $this->info("First admin designated for account ID {$id}; audit record saved.");
    return 0;
})->purpose('Designate the first SkillLink admin via an audited, explicit console operation');
