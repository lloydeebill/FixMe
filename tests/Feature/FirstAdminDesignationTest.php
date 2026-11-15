<?php

namespace Tests\Feature;

use App\Models\Location;
use App\Models\User;
use Illuminate\Foundation\Testing\RefreshDatabase;
use Tests\TestCase;

class FirstAdminDesignationTest extends TestCase
{
    use RefreshDatabase;

    private function eligibleUser(): User
    {
        $location = Location::create(['address' => 'Test area']);
        $user = User::create([
            'name' => 'Test Account', 'email' => uniqid().'@example.test', 'password' => 'password',
            'gender' => 'Other', 'date_of_birth' => '1990-01-01', 'location_id' => $location->id,
        ]);
        $user->forceFill(['email_verified_at' => now()])->save();
        return $user;
    }

    public function test_admin_flag_cannot_be_mass_assigned_or_set_by_profile_input(): void
    {
        $user = $this->eligibleUser();
        $user->fill(['is_admin' => true])->save();
        $this->assertFalse((bool) $user->fresh()->is_admin);
        $this->actingAs($user)->put('/settings/profile', ['name' => 'Updated', 'is_admin' => true]);
        $this->assertFalse((bool) $user->fresh()->is_admin);
    }

    public function test_first_admin_requires_explicit_apply_and_saves_audit_record_once(): void
    {
        $target = $this->eligibleUser();
        $other = $this->eligibleUser();
        $options = ['user_id' => $target->user_id, '--operator' => 'thesis-owner', '--reason' => 'Approved initial reviewer for thesis pilot'];

        $this->artisan('skilllink:designate-first-admin', $options)->assertExitCode(0);
        $this->assertFalse((bool) $target->fresh()->is_admin);
        $this->assertDatabaseCount('admin_designations', 0);

        $this->artisan('skilllink:designate-first-admin', [...$options, '--apply' => true])->assertExitCode(0);
        $this->assertTrue((bool) $target->fresh()->is_admin);
        $this->assertDatabaseHas('admin_designations', [
            'bootstrap_key' => 'first_admin', 'user_id' => $target->user_id,
            'operator' => 'thesis-owner', 'reason' => 'Approved initial reviewer for thesis pilot',
        ]);
        $this->artisan('skilllink:designate-first-admin', [
            'user_id' => $other->user_id, '--operator' => 'thesis-owner',
            '--reason' => 'Attempted second bootstrap designation', '--apply' => true,
        ])->assertExitCode(1);
        $this->assertFalse((bool) $other->fresh()->is_admin);
        $this->assertDatabaseCount('admin_designations', 1);
    }

    public function test_unverified_or_incomplete_accounts_cannot_be_designated(): void
    {
        $unverified = User::create(['name' => 'Unverified', 'email' => 'unverified@example.test', 'password' => 'password']);
        $this->artisan('skilllink:designate-first-admin', [
            'user_id' => $unverified->user_id, '--operator' => 'thesis-owner',
            '--reason' => 'Attempted incomplete account designation', '--apply' => true,
        ])->assertExitCode(1);
        $this->assertDatabaseCount('admin_designations', 0);
    }
}
