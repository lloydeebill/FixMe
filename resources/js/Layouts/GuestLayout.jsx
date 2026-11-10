import React from 'react';
import { Head, Link } from '@inertiajs/react';
import '../skilllink.css';

export default function GuestLayout({ children, title = 'Welcome' }) {
    return (
        <main className="skilllink-screen flex min-h-screen items-center justify-center px-4 py-10 sm:px-8">
            <Head title={title} />
            <div className="grid w-full max-w-5xl items-center gap-12 lg:grid-cols-2">
                <aside className="hidden lg:block">
                    <Link href="/" className="text-3xl font-bold text-[#0965e8]">SkillLink</Link>
                    <h1 className="mt-8 text-4xl font-semibold leading-tight">Local skills.<br />Everyday solutions.</h1>
                    <p className="mt-5 max-w-sm text-base leading-relaxed text-[#647084]">Find help for your next project, or connect your skills with people who need them.</p>
                </aside>
                <section className="mx-auto w-full max-w-md">{children}</section>
            </div>
        </main>
    );
}
