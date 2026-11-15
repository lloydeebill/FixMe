<?php

namespace Database\Seeders;

use Illuminate\Database\Seeder;
use App\Models\Skill;

class SkillsSeeder extends Seeder
{
    public function run(): void
    {
        // Stable slugs preserve existing skill IDs and provider links.
        $catalog = [
            ['Home & Construction', 'Plumbing', 'plumbing', null, []],
            ['Home & Construction', 'Electrical', 'electrical', null, []],
            ['Home & Construction', 'Carpentry', 'carpentry', null, []],
            ['Home & Construction', 'Masonry', 'masonry', null, []],
            ['Home & Construction', 'Painting', 'painting', null, []],
            ['Home & Construction', 'Cleaning', 'cleaning', null, []],
            ['Repair & Technology', 'Air Conditioning & Refrigeration', 'aircon-services', null, ['aircon', 'air conditioning', 'refrigerator', 'refrigeration']],
            ['Repair & Technology', 'Appliance & Electronics Repair', 'appliance-repair', null, ['appliance', 'electronics']],
            ['Repair & Technology', 'Computer Services', 'computer-services', null, ['computer', 'laptop']],
            ['Repair & Technology', 'Automotive Services', 'automotive-services', null, ['vehicle repair', 'car repair']],
            ['Food & Events', 'Cooking & Food Preparation', 'cooking-food-preparation', null, ['cooking', 'food preparation']],
            ['Food & Events', 'Baking & Pastry', 'baking-pastry', null, ['baking', 'pastry']],
            ['Food & Events', 'Event Setup & Food Service', 'event-setup-food-service', null, ['table skirting', 'event setup', 'food service', 'catering']],
            ['Food & Events', 'Bartending', 'bartending', null, []],
            ['Personal Services', 'Dressmaking & Tailoring', 'tailoring', null, ['dressmaking', 'alterations']],
            ['Personal Services', 'Hair & Beauty', 'hair-beauty', null, ['hair', 'beauty']],
            ['Personal Services', 'Wellness Massage', 'wellness-massage', null, ['massage']],
            ['Personal Services', 'Driving', 'driving', 'Professional driver services.', ['driver services', 'driver']],
        ];

        foreach ($catalog as $index => [$group, $name, $slug, $description, $terms]) {
            Skill::updateOrCreate(['slug' => $slug], [
                'name' => $name,
                'service_group' => $group,
                'description' => $description,
                'search_terms' => $terms,
                'sort_order' => $index + 1,
                'is_active' => true,
            ]);
        }

        // Keep historical provider links and booking labels for retired categories.
        Skill::whereIn('slug', ['gardening', 'shoe-repair'])->update(['is_active' => false]);
    }
}
