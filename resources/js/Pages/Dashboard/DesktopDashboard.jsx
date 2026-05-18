import React, { useState, useEffect, useRef } from 'react';
import { Head, router } from '@inertiajs/react';
import ReviewModal from '../../Components/ReviewModal';

/* ─────────────────────────────────────────────────────────────
   LIQUID GLASS — FixMe. Dashboard  (warm earth-tone palette)
   visionOS / macOS Sonoma aesthetic with deep coffee browns
───────────────────────────────────────────────────────────── */

// ── Injected global styles ────────────────────────────────────
const GlobalStyles = () => (
    <style>{`
        @import url('https://fonts.googleapis.com/css2?family=Sora:wght@300;400;500;600;700;800&family=DM+Serif+Display:ital@0;1&display=swap');

        *, *::before, *::after { box-sizing: border-box; }

        :root {
            --coffee:     #3b2314;
            --espresso:   #5d3a1a;
            --mocha:      #7c5230;
            --caramel:    #b07d4a;
            --latte:      #c8a97a;
            --cream:      #f5ede0;
            --parchment:  #faf6f0;
            --white:      #ffffff;

            /* Glass surfaces */
            --glass-bg:        rgba(255,248,238,0.55);
            --glass-bg-dark:   rgba(59,35,20,0.45);
            --glass-border:    rgba(255,255,255,0.55);
            --glass-border-dark: rgba(59,35,20,0.18);
            --glass-shadow:    0 8px 40px rgba(59,35,20,0.13), 0 2px 8px rgba(59,35,20,0.08);
            --glass-shadow-lg: 0 20px 60px rgba(59,35,20,0.18), 0 4px 16px rgba(59,35,20,0.10);

            --blur-sm: blur(12px);
            --blur-md: blur(24px);
            --blur-lg: blur(40px);
        }

        body {
            font-family: 'Sora', sans-serif;
            background: var(--parchment);
            margin: 0; padding: 0;
            min-height: 100vh;
        }

        /* ── Ambient background ── */
        .fixme-bg {
            position: fixed; inset: 0; z-index: 0;
            background:
                radial-gradient(ellipse 80% 60% at 20% 10%,  rgba(180,120,60,0.22) 0%, transparent 60%),
                radial-gradient(ellipse 60% 50% at 80% 80%,  rgba(92,50,20,0.18)  0%, transparent 55%),
                radial-gradient(ellipse 70% 40% at 55% 45%,  rgba(200,169,122,0.12) 0%, transparent 60%),
                linear-gradient(160deg, #faf6f0 0%, #f0e6d0 50%, #e8d8bf 100%);
            overflow: hidden;
        }
        .fixme-bg::before {
            content: '';
            position: absolute; inset: 0;
            background-image: url("data:image/svg+xml,%3Csvg viewBox='0 0 512 512' xmlns='http://www.w3.org/2000/svg'%3E%3Cfilter id='n'%3E%3CfeTurbulence type='fractalNoise' baseFrequency='0.75' numOctaves='4' stitchTiles='stitch'/%3E%3C/filter%3E%3Crect width='100%25' height='100%25' filter='url(%23n)' opacity='0.04'/%3E%3C/svg%3E");
            opacity: 0.6;
        }

        /* ── Glass panel base ── */
        .glass {
            background: var(--glass-bg);
            backdrop-filter: var(--blur-md);
            -webkit-backdrop-filter: var(--blur-md);
            border: 1px solid var(--glass-border);
            box-shadow: var(--glass-shadow);
        }
        .glass-dark {
            background: var(--glass-bg-dark);
            backdrop-filter: var(--blur-md);
            -webkit-backdrop-filter: var(--blur-md);
            border: 1px solid rgba(255,255,255,0.12);
            box-shadow: var(--glass-shadow);
        }
        .glass-edge {
            position: relative;
            overflow: hidden;
        }
        .glass-edge::after {
            content: '';
            position: absolute;
            inset: 0;
            background: linear-gradient(135deg, rgba(255,255,255,0.35) 0%, transparent 40%, transparent 60%, rgba(255,255,255,0.10) 100%);
            pointer-events: none;
            border-radius: inherit;
        }

        /* ── Navbar ── */
        .fixme-nav {
            position: sticky; top: 0; z-index: 100;
            background: rgba(250,246,240,0.70);
            backdrop-filter: var(--blur-lg);
            -webkit-backdrop-filter: var(--blur-lg);
            border-bottom: 1px solid rgba(255,255,255,0.60);
            box-shadow: 0 1px 0 rgba(59,35,20,0.08), 0 4px 24px rgba(59,35,20,0.08);
        }

        /* ── Tab pill ── */
        .tab-pill {
            background: rgba(255,248,238,0.50);
            backdrop-filter: var(--blur-sm);
            -webkit-backdrop-filter: var(--blur-sm);
            border: 1px solid rgba(255,255,255,0.55);
            border-radius: 999px;
            padding: 5px;
            display: flex; gap: 2px;
        }
        .tab-btn {
            padding: 7px 18px;
            border-radius: 999px;
            font-size: 13px;
            font-weight: 600;
            color: var(--mocha);
            cursor: pointer;
            transition: all 0.25s ease;
            border: none; background: transparent;
        }
        .tab-btn.active {
            background: rgba(255,255,255,0.85);
            box-shadow: 0 2px 10px rgba(59,35,20,0.14);
            color: var(--espresso);
        }
        .tab-btn:hover:not(.active) {
            background: rgba(255,255,255,0.40);
            color: var(--espresso);
        }

        /* ── Hero card ── */
        .hero-card {
            border-radius: 28px;
            position: relative;
            overflow: hidden;
            background: linear-gradient(135deg, rgba(92,50,20,0.88) 0%, rgba(59,35,20,0.92) 60%, rgba(45,24,12,0.96) 100%);
            backdrop-filter: var(--blur-md);
            -webkit-backdrop-filter: var(--blur-md);
            border: 1px solid rgba(255,255,255,0.14);
            box-shadow: var(--glass-shadow-lg);
            padding: 40px 44px;
            color: white;
        }
        .hero-card::before {
            content: '';
            position: absolute;
            top: -60px; right: -60px;
            width: 300px; height: 300px;
            border-radius: 50%;
            background: radial-gradient(circle, rgba(200,169,122,0.30) 0%, transparent 65%);
            pointer-events: none;
        }
        .hero-card::after {
            content: '';
            position: absolute; inset: 0;
            background: linear-gradient(135deg, rgba(255,255,255,0.10) 0%, transparent 35%, transparent 65%, rgba(255,255,255,0.04) 100%);
            pointer-events: none;
            border-radius: inherit;
        }

        /* ── Category tiles ── */
        .cat-tile {
            border-radius: 22px;
            padding: 22px 14px 18px;
            display: flex; flex-direction: column; align-items: center; gap: 10px;
            cursor: pointer;
            transition: transform 0.35s cubic-bezier(.23,1.22,.56,1),
                        box-shadow 0.30s ease,
                        background 0.25s ease;
            background: rgba(255,248,238,0.55);
            backdrop-filter: var(--blur-sm);
            -webkit-backdrop-filter: var(--blur-sm);
            border: 1px solid rgba(255,255,255,0.60);
            box-shadow: 0 4px 20px rgba(59,35,20,0.09), 0 1px 4px rgba(59,35,20,0.05);
            position: relative; overflow: hidden;
        }
        .cat-tile::after {
            content: '';
            position: absolute; inset: 0;
            background: linear-gradient(135deg, rgba(255,255,255,0.30) 0%, transparent 50%);
            pointer-events: none; border-radius: inherit;
        }
        .cat-tile:hover {
            transform: translateY(-6px) scale(1.03);
            box-shadow: 0 16px 40px rgba(59,35,20,0.18), 0 4px 10px rgba(59,35,20,0.10);
            background: rgba(255,248,238,0.80);
        }
        .cat-icon-wrap {
            width: 54px; height: 54px;
            border-radius: 16px;
            display: flex; align-items: center; justify-content: center;
            font-size: 26px;
            transition: transform 0.35s cubic-bezier(.23,1.22,.56,1);
            position: relative;
        }
        .cat-icon-wrap::after {
            content: '';
            position: absolute; inset: 0;
            border-radius: inherit;
            background: linear-gradient(135deg, rgba(255,255,255,0.45) 0%, transparent 55%);
        }
        .cat-tile:hover .cat-icon-wrap { transform: scale(1.14) rotate(-4deg); }

        /* ── Service cards ── */
        .service-card {
            border-radius: 22px;
            overflow: hidden;
            background: rgba(255,248,238,0.60);
            backdrop-filter: var(--blur-sm);
            -webkit-backdrop-filter: var(--blur-sm);
            border: 1px solid rgba(255,255,255,0.65);
            box-shadow: 0 4px 20px rgba(59,35,20,0.09);
            cursor: pointer;
            transition: transform 0.30s cubic-bezier(.23,1.22,.56,1), box-shadow 0.30s ease;
        }
        .service-card:hover {
            transform: translateY(-4px);
            box-shadow: 0 14px 40px rgba(59,35,20,0.16);
        }

        /* ── Sidebar cards ── */
        .sidebar-card {
            border-radius: 24px;
            background: rgba(255,248,238,0.65);
            backdrop-filter: var(--blur-md);
            -webkit-backdrop-filter: var(--blur-md);
            border: 1px solid rgba(255,255,255,0.65);
            box-shadow: var(--glass-shadow);
            overflow: hidden;
            position: relative;
        }
        .sidebar-card::after {
            content: '';
            position: absolute; inset: 0;
            background: linear-gradient(135deg, rgba(255,255,255,0.22) 0%, transparent 45%);
            pointer-events: none; border-radius: inherit;
        }

        /* ── CTA button ── */
        .btn-dark {
            background: linear-gradient(135deg, var(--coffee) 0%, var(--espresso) 100%);
            color: white; border: none; border-radius: 999px;
            font-weight: 700; font-size: 14px; letter-spacing: 0.01em;
            padding: 14px 28px; cursor: pointer; width: 100%;
            transition: transform 0.25s ease, box-shadow 0.25s ease, opacity 0.2s;
            box-shadow: 0 4px 18px rgba(59,35,20,0.35);
            position: relative; overflow: hidden;
        }
        .btn-dark::after {
            content: '';
            position: absolute; inset: 0;
            background: linear-gradient(135deg, rgba(255,255,255,0.14) 0%, transparent 55%);
            pointer-events: none; border-radius: inherit;
        }
        .btn-dark:hover { transform: translateY(-2px); box-shadow: 0 8px 28px rgba(59,35,20,0.42); }
        .btn-dark:active { transform: translateY(0); }

        .btn-caramel {
            background: linear-gradient(135deg, var(--caramel) 0%, var(--mocha) 100%);
            color: white; border: none; border-radius: 999px;
            font-weight: 700; font-size: 13px;
            padding: 10px 22px; cursor: pointer;
            transition: transform 0.22s ease, box-shadow 0.22s ease;
            box-shadow: 0 4px 14px rgba(124,82,48,0.30);
        }
        .btn-caramel:hover { transform: translateY(-2px); box-shadow: 0 8px 22px rgba(124,82,48,0.38); }

        /* ── Tag chips ── */
        .skill-chip {
            background: rgba(255,248,238,0.70);
            border: 1px solid rgba(176,125,74,0.25);
            border-radius: 999px;
            padding: 4px 12px;
            font-size: 11px; font-weight: 600;
            color: var(--mocha);
            transition: all 0.20s ease;
        }
        .skill-chip:hover {
            background: rgba(176,125,74,0.15);
            border-color: rgba(176,125,74,0.50);
        }

        /* ── Profile pill ── */
        .profile-pill {
            display: flex; align-items: center; gap: 10px;
            background: rgba(255,248,238,0.65);
            backdrop-filter: var(--blur-sm);
            -webkit-backdrop-filter: var(--blur-sm);
            border: 1px solid rgba(255,255,255,0.70);
            border-radius: 999px; padding: 6px 14px 6px 6px;
            cursor: pointer; transition: all 0.22s ease;
            box-shadow: 0 2px 12px rgba(59,35,20,0.10);
        }
        .profile-pill:hover {
            background: rgba(255,248,238,0.90);
            box-shadow: 0 4px 18px rgba(59,35,20,0.14);
        }

        /* ── Avatar circle ── */
        .avatar {
            width: 32px; height: 32px; border-radius: 50%;
            background: linear-gradient(135deg, var(--caramel), var(--espresso));
            display: flex; align-items: center; justify-content: center;
            color: white; font-weight: 800; font-size: 13px;
            box-shadow: 0 2px 8px rgba(59,35,20,0.30);
            flex-shrink: 0;
        }
        .avatar-lg {
            width: 52px; height: 52px; border-radius: 50%;
            border: 2px solid rgba(255,255,255,0.60);
            overflow: hidden; flex-shrink: 0;
        }

        /* ── Dropdown ── */
        .dropdown-menu {
            position: absolute; right: 0; top: calc(100% + 10px);
            min-width: 220px;
            background: rgba(250,246,240,0.88);
            backdrop-filter: var(--blur-lg);
            -webkit-backdrop-filter: var(--blur-lg);
            border: 1px solid rgba(255,255,255,0.75);
            border-radius: 20px;
            box-shadow: 0 20px 60px rgba(59,35,20,0.20), 0 4px 16px rgba(59,35,20,0.10);
            overflow: hidden;
            z-index: 200;
            animation: dropIn 0.22s cubic-bezier(.23,1.22,.56,1);
        }
        @keyframes dropIn {
            from { opacity: 0; transform: translateY(-8px) scale(0.97); }
            to   { opacity: 1; transform: translateY(0) scale(1); }
        }
        .dropdown-item {
            display: flex; align-items: center; gap: 12px;
            padding: 13px 18px;
            font-size: 13px; font-weight: 600;
            color: var(--espresso);
            cursor: pointer; transition: background 0.18s ease;
            border: none; background: transparent; width: 100%; text-align: left;
        }
        .dropdown-item:hover { background: rgba(176,125,74,0.12); }
        .dropdown-item.danger:hover { background: rgba(200,50,50,0.08); color: #c0392b; }
        .dropdown-icon {
            width: 30px; height: 30px; border-radius: 9px;
            background: rgba(245,237,224,0.80);
            display: flex; align-items: center; justify-content: center;
            flex-shrink: 0; font-size: 14px;
        }

        /* ── Section headings ── */
        .section-title {
            font-family: 'Sora', sans-serif;
            font-size: 17px; font-weight: 700;
            color: var(--espresso);
            display: flex; align-items: center; gap: 10px;
            margin-bottom: 18px;
        }
        .section-badge {
            width: 30px; height: 30px; border-radius: 9px;
            background: rgba(176,125,74,0.15);
            display: flex; align-items: center; justify-content: center;
            font-size: 14px;
        }

        /* ── Star badge ── */
        .star-badge {
            display: flex; align-items: center; gap: 4px;
            background: rgba(245,237,224,0.80);
            border: 1px solid rgba(176,125,74,0.30);
            border-radius: 10px; padding: 4px 10px;
            font-size: 12px; font-weight: 700;
            color: var(--espresso);
        }

        /* ── Chat / history rows ── */
        .list-row {
            display: flex; align-items: center; gap: 16px;
            padding: 16px 20px; border-radius: 18px;
            background: rgba(255,248,238,0.55);
            backdrop-filter: var(--blur-sm);
            -webkit-backdrop-filter: var(--blur-sm);
            border: 1px solid rgba(255,255,255,0.65);
            box-shadow: 0 2px 10px rgba(59,35,20,0.06);
            cursor: pointer;
            transition: transform 0.25s ease, box-shadow 0.25s ease;
            margin-bottom: 10px;
        }
        .list-row:hover { transform: translateY(-2px); box-shadow: 0 8px 24px rgba(59,35,20,0.12); }

        /* ── Unread dot ── */
        .unread-dot {
            width: 9px; height: 9px; border-radius: 50%;
            background: #e05252;
            border: 2px solid rgba(250,246,240,0.90);
            position: absolute; top: 1px; right: 1px;
        }

        /* ── Empty state ── */
        .empty-state {
            text-align: center; padding: 60px 24px;
            border-radius: 22px;
            background: rgba(255,248,238,0.45);
            backdrop-filter: var(--blur-sm);
            -webkit-backdrop-filter: var(--blur-sm);
            border: 1.5px dashed rgba(176,125,74,0.30);
        }

        /* ── Animations ── */
        @keyframes fadeUp {
            from { opacity: 0; transform: translateY(18px); }
            to   { opacity: 1; transform: translateY(0); }
        }
        .fade-up { animation: fadeUp 0.45s cubic-bezier(.23,1,.32,1) both; }
        .delay-1 { animation-delay: 0.05s; }
        .delay-2 { animation-delay: 0.12s; }
        .delay-3 { animation-delay: 0.18s; }
        .delay-4 { animation-delay: 0.24s; }

        /* ── Back button ── */
        .back-btn {
            width: 38px; height: 38px; border-radius: 50%;
            background: rgba(255,248,238,0.70);
            backdrop-filter: var(--blur-sm);
            -webkit-backdrop-filter: var(--blur-sm);
            border: 1px solid rgba(255,255,255,0.70);
            box-shadow: 0 2px 10px rgba(59,35,20,0.10);
            display: flex; align-items: center; justify-content: center;
            cursor: pointer; transition: all 0.22s ease;
            flex-shrink: 0;
        }
        .back-btn:hover { background: rgba(255,248,238,0.95); box-shadow: 0 4px 16px rgba(59,35,20,0.14); }

        /* ── Support card ── */
        .support-card {
            border-radius: 22px;
            background: linear-gradient(135deg, rgba(245,237,224,0.80) 0%, rgba(255,248,238,0.65) 100%);
            backdrop-filter: var(--blur-sm);
            -webkit-backdrop-filter: var(--blur-sm);
            border: 1px solid rgba(255,255,255,0.70);
            box-shadow: 0 4px 20px rgba(59,35,20,0.08);
            padding: 22px 24px;
        }
        .support-link {
            display: inline-flex; align-items: center; gap: 6px;
            font-size: 13px; font-weight: 700;
            color: var(--caramel);
            text-decoration: none;
            transition: color 0.18s ease;
        }
        .support-link:hover { color: var(--espresso); }

        /* ── Next Job header ── */
        .nextjob-header {
            background: linear-gradient(135deg, var(--coffee) 0%, var(--espresso) 100%);
            padding: 18px 24px; text-align: center;
            position: relative; overflow: hidden;
        }
        .nextjob-header::after {
            content: '';
            position: absolute; inset: 0;
            background: linear-gradient(135deg, rgba(255,255,255,0.12) 0%, transparent 55%);
            pointer-events: none;
        }

        /* ── Date badge ── */
        .date-badge {
            display: inline-flex; flex-direction: column; align-items: center;
            background: rgba(245,237,224,0.80);
            backdrop-filter: var(--blur-sm);
            border: 1px solid rgba(255,255,255,0.70);
            border-radius: 16px; padding: 12px 20px;
            box-shadow: 0 4px 14px rgba(59,35,20,0.10);
        }

        /* ── Time row ── */
        .time-row {
            display: flex; align-items: center; justify-content: center; gap: 8px;
            background: rgba(245,237,224,0.60);
            border: 1px solid rgba(255,255,255,0.65);
            border-radius: 14px; padding: 12px 20px;
            color: var(--espresso);
        }

        /* ── Repairer grid card ── */
        .repairer-card {
            border-radius: 22px;
            background: rgba(255,248,238,0.60);
            backdrop-filter: var(--blur-sm);
            -webkit-backdrop-filter: var(--blur-sm);
            border: 1px solid rgba(255,255,255,0.65);
            box-shadow: 0 4px 20px rgba(59,35,20,0.09);
            padding: 22px; cursor: pointer;
            transition: transform 0.30s cubic-bezier(.23,1.22,.56,1), box-shadow 0.30s ease;
            display: flex; flex-direction: column; gap: 14px;
            position: relative; overflow: hidden;
        }
        .repairer-card::after {
            content: '';
            position: absolute; inset: 0;
            background: linear-gradient(135deg, rgba(255,255,255,0.22) 0%, transparent 45%);
            pointer-events: none; border-radius: inherit;
        }
        .repairer-card:hover {
            transform: translateY(-5px);
            box-shadow: 0 16px 44px rgba(59,35,20,0.16);
        }

        /* ── Logo mark ── */
        .logo-text {
            font-family: 'DM Serif Display', serif;
            font-size: 24px;
            color: var(--espresso);
            letter-spacing: -0.5px;
        }
        .logo-dot { color: var(--caramel); }

        /* ── Scrollbar ── */
        ::-webkit-scrollbar { width: 6px; }
        ::-webkit-scrollbar-track { background: transparent; }
        ::-webkit-scrollbar-thumb { background: rgba(124,82,48,0.25); border-radius: 6px; }

        /* ── Review modal override ── */
        .review-overlay {
            position: fixed; inset: 0; z-index: 500;
            background: rgba(59,35,20,0.45);
            backdrop-filter: var(--blur-sm);
            -webkit-backdrop-filter: var(--blur-sm);
        }
    `}</style>
);

// ── Category palette ─────────────────────────────────────────
const CAT_COLORS = [
    { bg: 'rgba(176,125,74,0.18)',  emoji: '🔧' },
    { bg: 'rgba(100,160,120,0.18)', emoji: '⚡' },
    { bg: 'rgba(180,140,80,0.18)',  emoji: '🪚' },
    { bg: 'rgba(150,110,180,0.18)', emoji: '🔌' },
    { bg: 'rgba(80,160,200,0.18)',  emoji: '❄️' },
    { bg: 'rgba(200,120,80,0.18)',  emoji: '🧱' },
    { bg: 'rgba(100,180,160,0.18)', emoji: '🎨' },
    { bg: 'rgba(200,170,100,0.18)', emoji: '🧹' },
    { bg: 'rgba(80,170,100,0.18)',  emoji: '🌿' },
    { bg: 'rgba(70,140,200,0.18)',  emoji: '💻' },
    { bg: 'rgba(180,100,140,0.18)', emoji: '🧵' },
    { bg: 'rgba(140,110,90,0.18)',  emoji: '👟' },
];

// ── Small icon components ────────────────────────────────────
const ChevronDown = ({ size = 14 }) => (
    <svg width={size} height={size} viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.5" strokeLinecap="round" strokeLinejoin="round"><polyline points="6 9 12 15 18 9"/></svg>
);
const ChevronLeft = ({ size = 18 }) => (
    <svg width={size} height={size} viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.5" strokeLinecap="round" strokeLinejoin="round"><polyline points="15 18 9 12 15 6"/></svg>
);
const ClockIcon = ({ size = 16 }) => (
    <svg width={size} height={size} viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"><circle cx="12" cy="12" r="10"/><polyline points="12 6 12 12 16 14"/></svg>
);
const SwitchIcon = () => (
    <svg width="15" height="15" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.2" strokeLinecap="round" strokeLinejoin="round"><path d="M8 7h12m0 0l-4-4m4 4l-4 4m0 6H4m0 0l4 4m-4-4l4-4"/></svg>
);
const LogoutIcon = () => (
    <svg width="15" height="15" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.2" strokeLinecap="round" strokeLinejoin="round"><path d="M17 16l4-4m0 0l-4-4m4 4H7m6 4v1a3 3 0 01-3 3H6a3 3 0 01-3-3V7a3 3 0 013-3h4a3 3 0 013 3v1"/></svg>
);

// ═══════════════════════════════════════════════════════════════
//  MAIN COMPONENT
// ═══════════════════════════════════════════════════════════════
const DesktopDashboard = ({
    user,
    appointment,
    categories,
    selectedCategory,
    onSelectCategory,
    repairers,
    onRepairerSelect,
    topServices,
    onSwitchToWork,
    conversations = [],
    history = [],
    pendingReviewsCount = 0,
}) => {
    const [isDropdownOpen, setIsDropdownOpen] = useState(false);
    const [activeTab, setActiveTab]           = useState('browse');
    const [reviewingJob, setReviewingJob]     = useState(null);

    const handleLogout   = () => router.post('/logout');
    const handleOpenChat = (bookingId) => {
        if (!bookingId) return alert('Error: Booking ID missing.');
        router.visit(`/test-chat/${bookingId}`);
    };
    const unreadCount = conversations.filter(c => c.unread_count > 0).length;

    // ── Close dropdown on outside click ─────────────────────
    const dropdownRef = useRef(null);
    useEffect(() => {
        const handler = (e) => {
            if (dropdownRef.current && !dropdownRef.current.contains(e.target))
                setIsDropdownOpen(false);
        };
        document.addEventListener('mousedown', handler);
        return () => document.removeEventListener('mousedown', handler);
    }, []);

    // ── Category icon resolver ───────────────────────────────
    const getCatStyle = (index) => CAT_COLORS[index % CAT_COLORS.length];

    // ── Sub-views ────────────────────────────────────────────

    const renderBrowse = () => (
        <>
            {/* Hero */}
            {!selectedCategory && (
                <div className="hero-card fade-up" style={{ marginBottom: 28 }}>
                    <div style={{ position: 'relative', zIndex: 1 }}>
                        <p style={{ fontSize: 13, fontWeight: 600, color: 'rgba(200,169,122,0.85)', marginBottom: 8, letterSpacing: '0.06em', textTransform: 'uppercase' }}>
                            Welcome back
                        </p>
                        <h1 style={{ fontSize: 38, fontWeight: 800, lineHeight: 1.1, margin: '0 0 10px', fontFamily: "'DM Serif Display', serif" }}>
                            Hello, {user?.name?.split(' ')[0]}! 👋
                        </h1>
                        <p style={{ fontSize: 17, color: 'rgba(245,237,224,0.75)', fontWeight: 400 }}>
                            What needs fixing today?
                        </p>
                    </div>
                    {/* Background tool icon */}
                    <div style={{
                        position: 'absolute', right: 40, top: '50%', transform: 'translateY(-50%)',
                        fontSize: 110, opacity: 0.07, userSelect: 'none', filter: 'blur(1px)',
                        lineHeight: 1,
                    }}>🛠️</div>
                    {/* Soft light orb */}
                    <div style={{
                        position: 'absolute', bottom: -40, left: '40%',
                        width: 200, height: 200, borderRadius: '50%',
                        background: 'radial-gradient(circle, rgba(200,169,122,0.18) 0%, transparent 70%)',
                        pointerEvents: 'none',
                    }}/>
                </div>
            )}

            {/* Categories */}
            {!selectedCategory && (
                <div className="fade-up delay-1" style={{ marginBottom: 32 }}>
                    <div className="section-title">
                        <span className="section-badge">📂</span>
                        Categories
                    </div>
                    <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fill, minmax(110px, 1fr))', gap: 12 }}>
                        {categories.map((cat, index) => {
                            const style = getCatStyle(index);
                            return (
                                <button key={index} className="cat-tile" onClick={() => onSelectCategory(cat)}>
                                    <div className="cat-icon-wrap" style={{ background: style.bg }}>
                                        <span style={{ position: 'relative', zIndex: 1 }}>
                                            {cat.icon || style.emoji}
                                        </span>
                                    </div>
                                    <span style={{ fontSize: 12, fontWeight: 700, color: 'var(--espresso)', textAlign: 'center', lineHeight: 1.3 }}>
                                        {cat.name}
                                    </span>
                                </button>
                            );
                        })}
                    </div>
                </div>
            )}

            {/* Top Services */}
            {!selectedCategory && (
                <div className="fade-up delay-2">
                    <div className="section-title">
                        <span className="section-badge">⭐</span>
                        Top Services
                    </div>
                    <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fill, minmax(280px, 1fr))', gap: 14 }}>
                        {topServices && topServices.length > 0 ? topServices.map((service, index) => (
                            <div key={index} className="service-card" onClick={() => onRepairerSelect(service)}>
                                <div style={{ display: 'flex', gap: 14, padding: '16px' }}>
                                    <div style={{
                                        width: 80, height: 80,
                                        borderRadius: 16, overflow: 'hidden',
                                        background: 'rgba(245,237,224,0.80)',
                                        flexShrink: 0, border: '1px solid rgba(255,255,255,0.70)',
                                    }}>
                                        <img src={service.image} alt={service.role} style={{ width: '100%', height: '100%', objectFit: 'cover' }}/>
                                    </div>
                                    <div style={{ flex: 1, display: 'flex', flexDirection: 'column', justifyContent: 'center' }}>
                                        <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'flex-start', marginBottom: 4 }}>
                                            <h3 style={{ fontSize: 15, fontWeight: 700, color: 'var(--espresso)', margin: 0 }}>{service.role}</h3>
                                            <div className="star-badge">
                                                <span style={{ color: '#c8a97a' }}>★</span>
                                                <span>{service.rating}</span>
                                            </div>
                                        </div>
                                        <p style={{ fontSize: 12, color: 'var(--mocha)', margin: '0 0 10px', fontWeight: 500 }}>{service.name}</p>
                                        <span style={{ fontSize: 12, fontWeight: 700, color: 'var(--caramel)' }}>Book Now →</span>
                                    </div>
                                </div>
                            </div>
                        )) : (
                            <div className="empty-state" style={{ gridColumn: '1 / -1' }}>
                                <p style={{ color: 'var(--mocha)', opacity: 0.6 }}>No top services available.</p>
                            </div>
                        )}
                    </div>
                </div>
            )}

            {/* Repairer list */}
            {selectedCategory && (
                <div className="fade-up">
                    <div style={{ display: 'flex', alignItems: 'center', gap: 14, marginBottom: 22 }}>
                        <button className="back-btn" onClick={() => onSelectCategory(null)}>
                            <ChevronLeft/>
                        </button>
                        <div>
                            <h2 style={{ fontSize: 22, fontWeight: 800, color: 'var(--espresso)', margin: 0 }}>
                                {selectedCategory.name} Experts
                            </h2>
                            <p style={{ fontSize: 12, color: 'var(--mocha)', margin: '2px 0 0', fontWeight: 500 }}>
                                Found {repairers.length} professionals
                            </p>
                        </div>
                    </div>
                    <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fill, minmax(260px, 1fr))', gap: 14 }}>
                        {repairers.length === 0 ? (
                            <div className="empty-state" style={{ gridColumn: '1 / -1' }}>
                                <div style={{ fontSize: 52, marginBottom: 12 }}>🕵️</div>
                                <h3 style={{ fontWeight: 800, color: 'var(--espresso)', marginBottom: 4 }}>No repairers found</h3>
                                <button className="btn-caramel" style={{ marginTop: 16 }} onClick={() => onSelectCategory(null)}>
                                    View All Categories
                                </button>
                            </div>
                        ) : repairers.map((repairer) => (
                            <div key={repairer.id} className="repairer-card" onClick={() => onRepairerSelect(repairer)}>
                                <div style={{ display: 'flex', alignItems: 'flex-start', gap: 12 }}>
                                    <div className="avatar-lg">
                                        <img
                                            src={`https://ui-avatars.com/api/?name=${repairer.repairer_profile.business_name}&background=random`}
                                            alt={repairer.repairer_profile.business_name}
                                            style={{ width: '100%', height: '100%', objectFit: 'cover' }}
                                        />
                                    </div>
                                    <div style={{ flex: 1, minWidth: 0 }}>
                                        <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'flex-start' }}>
                                            <h3 style={{ fontSize: 15, fontWeight: 700, color: 'var(--espresso)', margin: 0, overflow: 'hidden', textOverflow: 'ellipsis', whiteSpace: 'nowrap', maxWidth: '70%' }}>
                                                {repairer.repairer_profile.business_name}
                                            </h3>
                                            <div className="star-badge">
                                                <span style={{ color: '#c8a97a' }}>★</span>
                                                <span>{repairer.repairer_profile.rating || 'New'}</span>
                                            </div>
                                        </div>
                                        <p style={{ fontSize: 12, color: 'var(--mocha)', margin: '4px 0 0', fontWeight: 500 }}>
                                            📍 {repairer.location?.address || 'Davao City'}
                                        </p>
                                    </div>
                                </div>
                                <div style={{ display: 'flex', flexWrap: 'wrap', gap: 6, marginTop: 4 }}>
                                    {repairer.repairer_profile.skills?.slice(0, 3).map(skill => (
                                        <span key={skill.id} className="skill-chip">{skill.name}</span>
                                    ))}
                                    {repairer.repairer_profile.skills?.length > 3 && (
                                        <span style={{ fontSize: 11, color: 'var(--latte)', fontWeight: 600, padding: '4px 8px' }}>
                                            +{repairer.repairer_profile.skills.length - 3} more
                                        </span>
                                    )}
                                </div>
                            </div>
                        ))}
                    </div>
                </div>
            )}
        </>
    );

    const renderChats = () => (
        <div className="fade-up">
            <div className="section-title">
                <span className="section-badge">💬</span>
                Your Conversations
            </div>
            {conversations.length === 0 ? (
                <div className="empty-state">
                    <div style={{ fontSize: 48, marginBottom: 12 }}>💬</div>
                    <p style={{ color: 'var(--mocha)', fontWeight: 600, marginBottom: 8 }}>No messages yet.</p>
                    <button className="btn-caramel" onClick={() => setActiveTab('browse')}>Find a Repairer to Chat</button>
                </div>
            ) : conversations.map(chat => (
                <div key={chat.id} className="list-row" onClick={() => handleOpenChat(chat.booking_id)}>
                    <div style={{ position: 'relative' }}>
                        <div className="avatar-lg">
                            <img src={`https://ui-avatars.com/api/?name=${chat.other_user_name}&background=random`} style={{ width: '100%', height: '100%', objectFit: 'cover' }}/>
                        </div>
                        {chat.unread_count > 0 && <div className="unread-dot"/>}
                    </div>
                    <div style={{ flex: 1, minWidth: 0 }}>
                        <div style={{ display: 'flex', justifyContent: 'space-between', marginBottom: 3 }}>
                            <h3 style={{ fontSize: 14, fontWeight: 700, color: 'var(--espresso)', margin: 0 }}>{chat.other_user_name}</h3>
                            <span style={{ fontSize: 11, color: 'var(--latte)', fontWeight: 500 }}>{chat.last_message_time}</span>
                        </div>
                        <p style={{ fontSize: 11, color: 'var(--caramel)', fontWeight: 700, margin: '0 0 2px', letterSpacing: '0.05em', textTransform: 'uppercase' }}>
                            Job #{chat.booking_id} · {chat.service_type}
                        </p>
                        <p style={{ fontSize: 13, color: 'var(--mocha)', margin: 0, overflow: 'hidden', textOverflow: 'ellipsis', whiteSpace: 'nowrap' }}>
                            {chat.last_message_content}
                        </p>
                    </div>
                </div>
            ))}
        </div>
    );

    const renderHistory = () => (
        <div className="fade-up">
            <div className="section-title">
                <span className="section-badge">📂</span>
                Job History
            </div>
            {history.length === 0 ? (
                <div className="empty-state">
                    <div style={{ fontSize: 48, marginBottom: 12 }}>📋</div>
                    <p style={{ color: 'var(--mocha)', fontWeight: 600, marginBottom: 4 }}>No job history found.</p>
                    <p style={{ fontSize: 13, color: 'var(--latte)' }}>Completed jobs will appear here.</p>
                </div>
            ) : history.map(job => (
                <div key={job.id} className="list-row" style={{ flexWrap: 'wrap', gap: 12 }}>
                    <div style={{
                        width: 44, height: 44, borderRadius: 14,
                        background: 'rgba(176,125,74,0.15)',
                        display: 'flex', alignItems: 'center', justifyContent: 'center',
                        fontSize: 20, flexShrink: 0,
                    }}>✅</div>
                    <div style={{ flex: 1 }}>
                        <h3 style={{ fontSize: 15, fontWeight: 700, color: 'var(--espresso)', margin: '0 0 3px' }}>{job.service_type}</h3>
                        <p style={{ fontSize: 12, color: 'var(--mocha)', margin: 0 }}>
                            Completed by <strong style={{ color: 'var(--espresso)' }}>{job.repairer_profile?.business_name || 'Repairer'}</strong>
                        </p>
                        <p style={{ fontSize: 11, color: 'var(--latte)', margin: '3px 0 0' }}>
                            {new Date(job.scheduled_at).toLocaleDateString()}
                        </p>
                    </div>
                    <div style={{ flexShrink: 0 }}>
                        {!job.review ? (
                            <button className="btn-caramel" onClick={(e) => { e.stopPropagation(); setReviewingJob(job); }}>
                                ⭐ Leave a Review
                            </button>
                        ) : (
                            <div style={{
                                padding: '8px 16px', borderRadius: 12,
                                background: 'rgba(245,237,224,0.60)',
                                border: '1px solid rgba(255,255,255,0.65)',
                                fontSize: 12, fontWeight: 600, color: 'var(--latte)',
                            }}>
                                Rated {job.review.rating} ★
                            </div>
                        )}
                    </div>
                </div>
            ))}
        </div>
    );

    // ── MAIN RENDER ──────────────────────────────────────────
    return (
        <>
            <GlobalStyles/>
            <Head title="Dashboard — FixMe."/>

            {/* Ambient background */}
            <div className="fixme-bg"/>

            <div style={{ position: 'relative', zIndex: 1, minHeight: '100vh', paddingBottom: 48 }}>

                {/* ── NAVBAR ─────────────────────────────────────── */}
                <div className="fixme-nav">
                    <div style={{ maxWidth: 1280, margin: '0 auto', padding: '0 28px', height: 62, display: 'flex', alignItems: 'center', justifyContent: 'space-between' }}>

                        {/* Logo + Tabs */}
                        <div style={{ display: 'flex', alignItems: 'center', gap: 28 }}>
                            <div
                                className="logo-text"
                                style={{ cursor: 'pointer', userSelect: 'none' }}
                                onClick={() => { onSelectCategory(null); setActiveTab('browse'); }}
                            >
                                FixMe<span className="logo-dot">.</span>
                            </div>

                            <nav className="tab-pill">
                                <button className={`tab-btn ${activeTab === 'browse' ? 'active' : ''}`}
                                    onClick={() => { onSelectCategory(null); setActiveTab('browse'); }}>
                                    Browse Services
                                </button>
                                <button className={`tab-btn ${activeTab === 'chats' ? 'active' : ''}`}
                                    onClick={() => setActiveTab('chats')}
                                    style={{ display: 'flex', alignItems: 'center', gap: 6 }}>
                                    Messages
                                    {unreadCount > 0 && (
                                        <span style={{ background: '#e05252', color: '#fff', borderRadius: 999, fontSize: 10, fontWeight: 800, padding: '1px 6px' }}>
                                            {unreadCount}
                                        </span>
                                    )}
                                </button>
                                <button className={`tab-btn ${activeTab === 'history' ? 'active' : ''}`}
                                    onClick={() => setActiveTab('history')}
                                    style={{ display: 'flex', alignItems: 'center', gap: 6 }}>
                                    Job History
                                    {pendingReviewsCount > 0 && (
                                        <span style={{ background: '#e05252', color: '#fff', borderRadius: 999, fontSize: 10, fontWeight: 800, padding: '1px 6px' }}>
                                            {pendingReviewsCount}
                                        </span>
                                    )}
                                </button>
                            </nav>
                        </div>

                        {/* Profile pill */}
                        <div style={{ position: 'relative' }} ref={dropdownRef}>
                            <div className="profile-pill" onClick={() => setIsDropdownOpen(v => !v)}>
                                <div className="avatar">{user.name.charAt(0)}</div>
                                <span style={{ fontSize: 13, fontWeight: 700, color: 'var(--espresso)' }}>{user.name}</span>
                                <ChevronDown/>
                            </div>

                            {isDropdownOpen && (
                                <div className="dropdown-menu">
                                    <button className="dropdown-item" onClick={() => { setIsDropdownOpen(false); onSwitchToWork(); }}>
                                        <div className="dropdown-icon"><SwitchIcon/></div>
                                        {user.isRepairer ? 'Switch to Work Mode' : 'Become a Pro'}
                                    </button>
                                    <div style={{ height: 1, background: 'rgba(176,125,74,0.15)', margin: '4px 14px' }}/>
                                    <button className="dropdown-item danger" onClick={handleLogout}>
                                        <div className="dropdown-icon"><LogoutIcon/></div>
                                        Log Out
                                    </button>
                                </div>
                            )}
                        </div>
                    </div>
                </div>

                {/* ── BODY ───────────────────────────────────────── */}
                <div style={{ maxWidth: 1280, margin: '0 auto', padding: '32px 28px 0', display: 'grid', gridTemplateColumns: '1fr 300px', gap: 24, alignItems: 'start' }}>

                    {/* ─ LEFT COLUMN ─────────────────────────────── */}
                    <div>
                        {activeTab === 'browse'  && renderBrowse()}
                        {activeTab === 'chats'   && renderChats()}
                        {activeTab === 'history' && renderHistory()}
                    </div>

                    {/* ─ RIGHT SIDEBAR ───────────────────────────── */}
                    <div style={{ position: 'sticky', top: 82, display: 'flex', flexDirection: 'column', gap: 16 }}>

                        {/* Next Job card */}
                        <div className="sidebar-card glass-edge">
                            <div className="nextjob-header">
                                <h3 style={{ fontSize: 13, fontWeight: 800, letterSpacing: '0.12em', textTransform: 'uppercase', color: 'rgba(245,237,224,0.90)', margin: 0, position: 'relative', zIndex: 1 }}>
                                    Next Job
                                </h3>
                            </div>

                            <div style={{ padding: '22px 22px 24px' }}>
                                {appointment?.exists ? (
                                    <div style={{ textAlign: 'center' }}>
                                        <div className="date-badge" style={{ marginBottom: 16 }}>
                                            <span style={{ fontSize: 32, fontWeight: 900, color: 'var(--espresso)', lineHeight: 1, fontFamily: "'DM Serif Display', serif" }}>
                                                {appointment.day}
                                            </span>
                                            <span style={{ fontSize: 11, fontWeight: 800, color: 'var(--caramel)', textTransform: 'uppercase', letterSpacing: '0.08em', marginTop: 2 }}>
                                                {appointment.month}
                                            </span>
                                        </div>
                                        <h4 style={{ fontSize: 16, fontWeight: 800, color: 'var(--espresso)', margin: '0 0 4px' }}>{appointment.type}</h4>
                                        <p style={{ fontSize: 13, color: 'var(--mocha)', margin: '0 0 16px' }}>with {appointment.repairer}</p>
                                        <div className="time-row" style={{ marginBottom: 18 }}>
                                            <ClockIcon/>
                                            <span style={{ fontFamily: 'monospace', fontWeight: 800, fontSize: 15 }}>{appointment.time}</span>
                                        </div>
                                        <button className="btn-dark" onClick={() => handleOpenChat(appointment.id)}>
                                            💬 Chat with Repairer
                                        </button>
                                    </div>
                                ) : (
                                    <div style={{ textAlign: 'center', padding: '18px 0' }}>
                                        <div style={{ fontSize: 44, marginBottom: 12 }}>🗓️</div>
                                        <p style={{ fontWeight: 700, color: 'var(--espresso)', margin: '0 0 6px', fontSize: 14 }}>No Upcoming Fixes</p>
                                        <p style={{ fontSize: 12, color: 'var(--latte)', margin: '0 0 22px' }}>Your schedule is currently empty.</p>
                                        <button className="btn-dark" onClick={() => { onSelectCategory(null); setActiveTab('browse'); }}>
                                            Find a Service
                                        </button>
                                    </div>
                                )}
                            </div>
                        </div>

                        {/* Support card */}
                        <div className="support-card glass-edge">
                            <div style={{ fontSize: 26, marginBottom: 10 }}>🤝</div>
                            <h3 style={{ fontSize: 14, fontWeight: 800, color: 'var(--espresso)', margin: '0 0 6px' }}>Need Help?</h3>
                            <p style={{ fontSize: 12, color: 'var(--mocha)', lineHeight: 1.6, margin: '0 0 14px' }}>
                                Our support team is available 24/7 to assist with your repairs.
                            </p>
                            <a href="#" className="support-link">
                                Contact Support <span>→</span>
                            </a>
                        </div>
                    </div>
                </div>
            </div>

            {/* Review Modal */}
            {reviewingJob && (
                <ReviewModal
                    booking={reviewingJob}
                    onClose={() => setReviewingJob(null)}
                />
            )}
        </>
    );
};

export default DesktopDashboard;