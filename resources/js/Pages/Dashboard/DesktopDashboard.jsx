import React from 'react';
// 🚨 Make sure this path is correct relative to this file
import RepairerFinder from '../../Components/RepairerFinder'; 

// Mocks for preview
const Head = ({ title }) => null;
const Link = ({ href, className, children }) => (
    <a href={href} className={className} onClick={(e) => e.preventDefault()}>{children}</a>
);
const AuthenticatedLayout = ({ user, header, children }) => (
    <div className="min-h-screen bg-gray-100">
        <nav className="bg-white shadow">
            <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
                <div className="flex justify-between h-16 items-center">
                    {header}
                    <span className="text-gray-600">Welcome, {user?.name}</span>
                </div>
            </div>
        </nav>
        <main>{children}</main>
    </div>
);

const DesktopDashboard = ({ user, appointment, history }) => {
    return (
        <AuthenticatedLayout
            user={user}
            header={<h2 className="font-semibold text-xl text-gray-800 leading-tight">Dashboard</h2>}
        >
            <Head title="Dashboard" />

            <div className="py-8 md:py-12">
                <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 space-y-8">
                    
                    {/* --- 1. WELCOME BANNER --- */}
                    <div className="bg-white p-6 md:p-8 rounded-xl shadow-lg border-l-4 border-blue-600">
                        <div className="flex justify-between items-center">
                            <div>
                                <h1 className="text-3xl font-extrabold text-gray-900 mb-1">
                                    Hello, {user?.name || 'FixMe User'}!
                                </h1>
                                <p className="text-gray-500">
                                    Ready to get things fixed? Select a category below.
                                </p>
                            </div>
                        </div>
                    </div>

                    {/* --- 2. MAIN GRID LAYOUT --- */}
                    <div className="grid grid-cols-1 lg:grid-cols-3 gap-8">
                        
                        {/* LEFT COLUMN (2/3 Width) */}
                        <div className="lg:col-span-2 space-y-8">
                            
                            {/* REPAIRER FINDER (Dynamic Component) */}
                            {/* ✅ Placed here to replace the static grid */}
                            {/* Since we are on a wide screen, RepairerFinder will automatically show 2 columns */}
                            <RepairerFinder />
                            
                            {/* SERVICE ACTIVITY */}
                            <div className="bg-white p-6 rounded-xl shadow-lg">
                                <h2 className="text-xl font-bold text-gray-800 mb-4">Service Activity</h2>
                                <div className="bg-blue-50 rounded-xl p-5 flex items-center gap-6 shadow-sm border border-blue-100">
                                    <div className="bg-white p-4 rounded-full shadow-md text-blue-600">
                                        <svg className="w-8 h-8" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                                            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 5H7a2 2 0 00-2 2v12a2 2 0 002 2h10a2 2 0 00-2-2h-2M9 5a2 2 0 00-2 2h2a2 2 0 002-2M9 5a2 2 0 012-2h2a2 2 0 012 2m-3 7h3m-3 4h3m-6-4h.01M9 16h.01" />
                                        </svg>
                                    </div>
                                    <div>
                                        <h3 className="font-extrabold text-gray-800 text-lg mb-1">{history?.lastJob}</h3>
                                        <p className="text-sm text-gray-500">
                                            You have completed <span className="font-semibold">{history?.count}</span> jobs with FixMe.
                                        </p>
                                    </div>
                                </div>
                            </div>
                        </div>

                        {/* RIGHT COLUMN (1/3 Width) */}
                        <div className="lg:col-span-1">
                            
                            {/* UPCOMING APPOINTMENT */}
                            {appointment?.exists ? (
                                <div className="bg-green-600 text-white rounded-xl shadow-xl overflow-hidden min-h-[250px] flex flex-col">
                                    <div className="p-6 flex-1">
                                        <h3 className="text-sm font-semibold uppercase opacity-90 mb-4 tracking-widest">Next Scheduled Fix</h3>
                                        
                                        <div className="flex items-baseline mb-3">
                                            <div className="text-5xl font-extrabold leading-none mr-3">
                                                {appointment.day}
                                            </div>
                                            <div className="text-xl font-medium">
                                                {appointment.month}
                                            </div>
                                        </div>
                                        
                                        <p className="font-bold text-xl truncate mb-1">
                                            {appointment.time}, {appointment.repairer}
                                        </p>
                                        <span className="text-xs bg-white/20 px-2 py-0.5 rounded text-white font-medium">
                                            {appointment.type}
                                        </span>
                                    </div>
                                    <div className="bg-green-700 p-4 text-center text-base font-medium hover:bg-green-800 transition cursor-pointer">
                                        View Job Details & Chat
                                    </div>
                                </div>
                            ) : (
                                <div className="bg-white p-6 rounded-xl shadow-md text-center border border-gray-200 min-h-[250px] flex flex-col justify-center">
                                    <p className="text-gray-500 mb-4">No upcoming appointments scheduled.</p>
                                    <Link href="#" className="mt-3 inline-block text-blue-600 font-semibold hover:underline">
                                        Book Your First Fix
                                    </Link>
                                </div>
                            )}

                        </div>
                    </div>
                </div>
            </div>
        </AuthenticatedLayout>
    );
};

export default DesktopDashboard;