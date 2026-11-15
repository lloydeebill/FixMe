import test from 'node:test';
import assert from 'node:assert/strict';
import { resolveAiCategory, aiServiceDestination } from '../../resources/js/Pages/Dashboard/aiCategory.js';
import { filterProvidersByCategory } from '../../resources/js/Pages/Dashboard/catalog.js';

const categories = [
    { name: 'Plumbing', slug: 'plumbing', service_group: 'Home & Construction', search_terms: [] },
    { name: 'Electrical', slug: 'electrical', service_group: 'Home & Construction', search_terms: [] },
    { name: 'Event Setup & Food Service', slug: 'event-setup-food-service', service_group: 'Food & Events', search_terms: ['table skirting'] },
];
const providers = [
    { name: 'Example plumber', repairer_profile: { skills: [{ slug: 'plumbing' }] } },
    { name: 'Example event team', repairer_profile: { skills: [{ slug: 'event-setup-food-service' }] } },
];

test('a mocked scanner response resolves a single catalog service and navigates into filtered Services', () => {
    const geminiText = 'DIAGNOSIS: Possible leak.\nNEED AN EXPERT? A plumber should inspect the pipe.';
    const result = resolveAiCategory(categories, geminiText);
    assert.equal(result.status, 'matched');
    assert.equal(result.category, categories[0]);
    assert.deepEqual(aiServiceDestination(categories, result.category), {
        tab: 'services', group: 'Home & Construction', category: categories[0],
    });
    assert.deepEqual(filterProvidersByCategory(providers, result.category), [providers[0]]);
});

test('catalog search terms resolve specific work without inventing a service ID', () => {
    const result = resolveAiCategory(categories, 'NEED AN EXPERT? A team can help with table skirting.');
    assert.equal(result.category, categories[2]);
    assert.equal(result.category.id, undefined);
});

test('unknown and ambiguous mocked AI results require manual catalog selection', () => {
    assert.deepEqual(resolveAiCategory(categories, 'NEED AN EXPERT? Ask a specialist.'), { status: 'unknown', category: null });
    assert.deepEqual(resolveAiCategory(categories, 'A plumber may help.'), { status: 'unknown', category: null });
    assert.deepEqual(resolveAiCategory(categories, 'NEED AN EXPERT? Hire a plumber and an electrician.'), { status: 'ambiguous', category: null });
    assert.equal(aiServiceDestination(categories, { slug: 'made-up', service_group: 'Home & Construction' }), null);
});

test('a valid category with no real providers remains an empty Services result', () => {
    assert.deepEqual(filterProvidersByCategory(providers, categories[1]), []);
    assert.equal(aiServiceDestination(categories, categories[1]).tab, 'services');
});
