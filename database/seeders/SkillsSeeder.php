<?php

namespace Database\Seeders;

use Illuminate\Database\Seeder;
use Illuminate\Support\Facades\DB;
use Carbon\Carbon;

class SkillsSeeder extends Seeder
{
    public function run(): void
    {
        $skills = [
            ['name' => 'Plumbing', 'slug' => 'plumbing'],
            ['name' => 'Electrical', 'slug' => 'electrical'],
            ['name' => 'Carpentry', 'slug' => 'carpentry'],
            ['name' => 'Appliance Repair', 'slug' => 'appliance-repair'],
            ['name' => 'Aircon Services', 'slug' => 'aircon-services'],
            ['name' => 'Masonry', 'slug' => 'masonry'],
            ['name' => 'Painting', 'slug' => 'painting'],
            ['name' => 'Cleaning', 'slug' => 'cleaning'],
            ['name' => 'Gardening', 'slug' => 'gardening'],
            ['name' => 'Computer Services', 'slug' => 'computer-services'],
            ['name' => 'Tailoring & Alterations', 'slug' => 'tailoring'],
            ['name' => 'Shoes and Bag Repair', 'slug' => 'shoe-repair']
        ];

        // Insert them all at once
        $now = Carbon::now();
        foreach ($skills as $skill) {
            DB::table('skills')->insert([
                'name' => $skill['name'],
                'slug' => $skill['slug'],
                'created_at' => $now,
                'updated_at' => $now,
            ]);
        }
    }
}
