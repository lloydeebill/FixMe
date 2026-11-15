// AI text is only a hint. A result can select a service only when its slug
// exists in the server-supplied catalog and exactly one category matches.
const tradeTerms = {
    plumbing: ['plumber'],
    electrical: ['electrician'],
    carpentry: ['carpenter'],
    masonry: ['mason'],
    painting: ['painter'],
    cleaning: ['cleaner'],
    'aircon-services': ['aircon technician', 'refrigeration technician'],
    'appliance-repair': ['appliance technician', 'electronics technician'],
    'computer-services': ['computer technician'],
    'automotive-services': ['mechanic', 'auto technician'],
    'cooking-food-preparation': ['cook', 'chef'],
    'baking-pastry': ['baker', 'pastry chef'],
    'event-setup-food-service': ['event setup team', 'caterer'],
    bartending: ['bartender'],
    tailoring: ['tailor', 'dressmaker'],
    'hair-beauty': ['hairdresser', 'beautician'],
    'wellness-massage': ['massage therapist'],
    driving: ['professional driver'],
};

const normalized = value => String(value || '').toLocaleLowerCase().replace(/[^\p{L}\p{N}]+/gu, ' ').trim();

export const resolveAiCategory = (categories, responseText) => {
    if (!Array.isArray(categories) || !responseText) return { status: 'unknown', category: null };
    const expertSection = String(responseText).match(/NEED AN EXPERT\??\s*:?\s*([\s\S]*)/i)?.[1];
    if (!expertSection?.trim()) return { status: 'unknown', category: null };
    const text = ` ${normalized(expertSection)} `;
    const matches = categories.filter(category => {
        if (!category?.slug || !category?.service_group) return false;
        const terms = [category.name, category.slug.replaceAll('-', ' '), ...(category.search_terms || []), ...(tradeTerms[category.slug] || [])];
        return terms.some(term => {
            const phrase = normalized(term);
            return phrase && text.includes(` ${phrase} `);
        });
    });
    if (matches.length === 1) return { status: 'matched', category: matches[0] };
    return { status: matches.length > 1 ? 'ambiguous' : 'unknown', category: null };
};

export const aiServiceDestination = (categories, candidate) => {
    const category = categories.find(item => item.slug === candidate?.slug && item.service_group === candidate?.service_group);
    return category ? { tab: 'services', group: category.service_group, category } : null;
};
