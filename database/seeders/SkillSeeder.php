<?php

namespace Database\Seeders;

use Illuminate\Database\Console\Seeds\WithoutModelEvents;
use Illuminate\Database\Seeder;
use App\Models\Skill;

class SkillSeeder extends Seeder
{



    public function run(): void
    {
        //Masterlist skills

        $skills = [
            ['name' => 'Electrical Installation', 'slug' => 'electrical'],
            ['name' => 'Plumbing', 'slug' => 'plumbing'],
            ['name' => 'Carpentry', 'slug' => 'carpentry'],
            ['name' => 'Appliances', 'slug' => 'appliances'],
            ['name' => 'Home Cleaning', 'slug' => 'cleaning'],
            ['name' => 'Gardening', 'slug' => 'gardening'],
            ['name' => 'Computer Repair', 'slug' => 'computer'],
            ['name' => 'Tailoring & Alterations', 'slug' => 'tailoring'],
            ['name' => 'Shoes and Bag Repair', 'slug' => 'shoe-repair']
        ];

        foreach ($skills as $skill) {
            Skill::firstOrCreate(['slug' => $skill['slug']], $skill);
        }
    }
}
