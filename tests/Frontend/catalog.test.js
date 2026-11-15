import test from 'node:test';
import assert from 'node:assert/strict';
import { groupCategories, filterProvidersBySearch, searchCategories } from '../../resources/js/Pages/Dashboard/catalog.js';

const categories = [
    { name: 'Plumbing', slug: 'plumbing', service_group: 'Home & Construction', search_terms: [] },
    { name: 'Event Setup & Food Service', slug: 'event-setup-food-service', service_group: 'Food & Events', search_terms: ['table skirting'] },
];
const providers = [
    { name: 'Plumber', repairer_profile: { skills: [{ name: 'Plumbing', slug: 'plumbing' }] } },
    { name: 'Event Team', repairer_profile: { skills: [{ name: 'Event Setup & Food Service', slug: 'event-setup-food-service' }] } },
];

test('groups follow the database catalog and keep their categories', () => {
    assert.deepEqual(Object.keys(groupCategories(categories)), ['Home & Construction', 'Food & Events']);
    assert.equal(groupCategories(categories)['Food & Events'][0].slug, 'event-setup-food-service');
});

test('specific search terms find providers through their service category', () => {
    assert.deepEqual(searchCategories(categories, 'table skirting'), [categories[1]]);
    assert.deepEqual(filterProvidersBySearch(providers, categories, 'table skirting'), [providers[1]]);
    assert.deepEqual(filterProvidersBySearch(providers, categories, 'plumb'), [providers[0]]);
    assert.deepEqual(filterProvidersBySearch(providers, categories, ''), providers);
});
