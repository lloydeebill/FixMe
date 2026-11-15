export const groupCategories = categories => categories.reduce((groups, category) => {
    const name = category.service_group;
    if (!name) return groups;
    (groups[name] ??= []).push(category);
    return groups;
}, {});

export const filterProvidersByCategory = (providers, category) => category
    ? providers.filter(provider => (provider.repairer_profile?.skills || []).some(skill => skill.slug === category.slug))
    : providers;

export const searchCategories = (categories, search) => {
    const query = search.trim().toLocaleLowerCase();
    if (!query) return [];
    return categories.filter(category =>
        [category.name, category.slug, ...(category.search_terms || [])]
            .some(term => term?.toLocaleLowerCase().includes(query))
    );
};

export const filterProvidersBySearch = (providers, categories, search) => {
    const query = search.trim().toLocaleLowerCase();
    if (!query) return providers;

    const matchedSlugs = new Set(searchCategories(categories, query).map(category => category.slug));

    return providers.filter(provider => {
        const profile = provider.repairer_profile;
        const names = [provider.name, profile?.business_name, ...(profile?.skills || []).map(skill => skill.name)];
        return names.some(name => name?.toLocaleLowerCase().includes(query))
            || (profile?.skills || []).some(skill => matchedSlugs.has(skill.slug));
    });
};
