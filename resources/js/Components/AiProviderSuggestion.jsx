import React, { useState } from 'react';
import { groupCategories } from '../Pages/Dashboard/catalog';
import { resolveAiCategory } from '../Pages/Dashboard/aiCategory';

export default function AiProviderSuggestion({ categories, resultText, onSelectCategory }) {
    const [selectedSlug, setSelectedSlug] = useState('');
    const resolution = resolveAiCategory(categories, resultText);
    const category = resolution.category || categories.find(item => item.slug === selectedSlug);

    return <div className="mt-5 border-t border-gray-200 pt-4">
        {resolution.status === 'matched' ? <p className="mb-3 text-xs text-gray-600">Suggested service: <strong>{category.name}</strong></p> : <>
            <p className="mb-3 text-xs text-gray-600">{resolution.status === 'ambiguous' ? 'This plan mentions more than one service.' : 'The service is not clear from this result.'} Choose a category to browse real providers.</p>
            <label htmlFor="ai-service-category" className="mb-1 block text-xs font-semibold text-gray-700">Service category</label>
            <select id="ai-service-category" value={selectedSlug} onChange={event => setSelectedSlug(event.target.value)} className="mb-3 w-full rounded-xl border border-gray-300 bg-white p-3 text-xs text-gray-800">
                <option value="">Choose a service</option>
                {Object.entries(groupCategories(categories)).map(([group, items]) => <optgroup key={group} label={group}>{items.map(item => <option key={item.slug} value={item.slug}>{item.name}</option>)}</optgroup>)}
            </select>
        </>}
        <button type="button" disabled={!category} onClick={() => category && onSelectCategory(category)} className="sl-ai-primary w-full rounded-xl py-3 text-xs disabled:cursor-not-allowed disabled:opacity-50">Find providers for this service</button>
    </div>;
}
