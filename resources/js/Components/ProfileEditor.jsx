import React, { useEffect, useRef, useState } from 'react';
import { useForm, usePage } from '@inertiajs/react';
import LocationPicker from './LocationPicker';
import RepairerFormFields from './RepairerFormFields';

export default function ProfileEditor({ role, user, location, profile, availableSkills = [] }) {
    const provider = role === 'provider';
    const { pilotAreas = {} } = usePage().props;
    const [feedback, setFeedback] = useState('');
    const [saveError, setSaveError] = useState('');
    const [showSaveConfirmation, setShowSaveConfirmation] = useState(false);
    const confirmationButton = useRef(null);
    useEffect(() => { if (showSaveConfirmation) confirmationButton.current?.focus(); }, [showSaveConfirmation]);
    useEffect(() => {
        if (!feedback) return;
        const timer = window.setTimeout(() => setFeedback(''), 5000);
        return () => window.clearTimeout(timer);
    }, [feedback]);
    const form = useForm(provider ? {
        business_name: profile?.business_name || '',
        bio: profile?.bio || '',
        skills: profile?.skills?.map(skill => skill.id) || [],
        service_areas: profile?.service_areas || [],
        location: location?.address || '',
        latitude: location?.latitude ?? null,
        longitude: location?.longitude ?? null,
    } : {
        name: user?.name || '',
        location: location?.address || '',
        latitude: location?.latitude ?? null,
        longitude: location?.longitude ?? null,
    });
    const updateLocation = value => form.setData(current => ({ ...current, location: value.address, latitude: value.lat, longitude: value.lng }));

    return <>
    <form onSubmit={event => { event.preventDefault(); if (form.processing) return; setFeedback(''); setSaveError(''); form.put(provider ? '/settings/provider-profile' : '/settings/profile', { preserveScroll: true, onSuccess: () => provider ? setShowSaveConfirmation(true) : setFeedback('Profile saved.'), onError: errors => setSaveError(Object.values(errors)[0] || 'Could not save your profile. Check the highlighted fields and try again.') }); }} className={provider ? 'space-y-5' : 'mt-5 space-y-4 border-t border-gray-100 pt-5'}>
        {!provider && <h3 className="hidden text-lg font-semibold text-[#172335] sm:block">Edit account profile</h3>}
        <div className="sm:hidden text-sm text-gray-600">{provider && <p>{user?.name}</p>}<p className="break-words">{user?.email}</p></div>
        {saveError && <p role="alert" className="rounded-xl border border-red-200 bg-red-50 p-3 text-sm text-red-700">Could not save profile. {saveError}</p>}
        {provider ? <><RepairerFormFields data={form.data} setData={form.setData} errors={form.errors} availableSkills={availableSkills} pilotAreas={pilotAreas} collapseSkillGroups />{availableSkills.some(skill => skill.is_active === false) && <p className="text-xs text-gray-500">Previously linked services that are no longer in the active catalog remain selected until you remove them.</p>}</> : <label className="block text-sm font-medium text-gray-700">Full name<input value={form.data.name} onChange={event => form.setData('name', event.target.value)} className="mt-1 block w-full rounded-lg border-gray-300" />{form.errors.name && <span role="alert" className="text-sm text-red-700">{form.errors.name}</span>}</label>}
        <div>
            <label className="block text-sm font-medium text-gray-700">{provider ? 'Saved service location' : 'Account location'}</label>
            <p className="mb-2 text-xs text-gray-500">{provider ? 'This is your saved service pin, not live tracking.' : 'This is separate from a booking’s service address.'}</p>
            <LocationPicker initialLat={form.data.latitude} initialLng={form.data.longitude} onLocationChange={updateLocation} />
            <input value={form.data.location} onChange={event => form.setData(current => ({ ...current, location: event.target.value, latitude: null, longitude: null }))} aria-label={provider ? 'Service location address' : 'Account location address'} className="mt-2 block w-full rounded-lg border-gray-300 text-sm" />
            {['location', 'latitude', 'longitude'].map(field => form.errors[field] && <p key={field} role="alert" className="text-sm text-red-700">{form.errors[field]}</p>)}
        </div>
        <div className={provider ? 'flex justify-center pb-4 pt-2' : ''}><button type="submit" disabled={form.processing} className="rounded-xl bg-[#0965e8] px-6 py-3 text-sm font-semibold text-white disabled:opacity-50">{form.processing ? 'Saving…' : provider ? 'Save Profile' : 'Save profile'}</button></div>
        {feedback && <p role="status" className="text-sm text-green-800">{feedback}</p>}
    </form>
    {showSaveConfirmation && <div className="fixed inset-0 z-[9999] flex items-center justify-center bg-black/50 p-4"><div role="dialog" aria-modal="true" aria-labelledby="profile-saved-title" className="w-full max-w-sm rounded-2xl bg-white p-6 text-center shadow-xl"><h2 id="profile-saved-title" className="text-lg font-semibold text-[#172335]">Profile saved</h2><p className="mt-2 text-sm text-[#647084]">Your service profile has been updated.</p><button ref={confirmationButton} type="button" onClick={() => setShowSaveConfirmation(false)} className="mt-5 rounded-xl bg-[#0965e8] px-6 py-3 text-sm font-semibold text-white focus-visible:outline focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-[#0965e8]">Done</button></div></div>}
    </>;
}
