/**
 * OmniStream Application Shell & Route Gateway
 * Copyright (c) Patnala Uday Kumar. All rights reserved.
 *
 * Implements OPCA v1.0 Shell Orchestration.
 */

import React, { Suspense, lazy, useEffect } from 'react';
import { Routes, Route } from 'react-router-dom';
import { Layout } from '@omnistream/shell';
import { useAppStore } from '@/src/store';
import { useUTubeStore } from '@omnistream/utube';
import { BentoGrid } from '@omnistream/shell';
import { TicketPrinterAnimation } from '@omnistream/cinemorph';

// Code-split route bundles for optimal first-paint performance
const Home = lazy(() => import('@omnistream/utube').then((m) => ({ default: m.Home })));
const Search = lazy(() => import('@omnistream/utube').then((m) => ({ default: m.Search })));
const Watch = lazy(() => import('@omnistream/utube').then((m) => ({ default: m.Watch })));
const CineMorphLanding = lazy(() => import('@omnistream/cinemorph').then((m) => ({ default: m.CineMorphLanding })));
const CineMorphTheater = lazy(() => import('@omnistream/cinemorph').then((m) => ({ default: m.CineMorphTheater })));
const Subscriptions = lazy(() => import('@omnistream/utube').then((m) => ({ default: m.Subscriptions })));
const Collections = lazy(() => import('@omnistream/utube').then((m) => ({ default: m.Collections })));
const History = lazy(() => import('@omnistream/utube').then((m) => ({ default: m.History })));
const SettingsPage = lazy(() => import('@/src/pages/Settings').then((m) => ({ default: m.SettingsPage })));
const ChannelPage = lazy(() => import('@omnistream/utube').then((m) => ({ default: m.ChannelPage })));
const RootLanding = lazy(() => import('@/src/pages/RootLanding').then((m) => ({ default: m.RootLanding })));

function RootRouter() {
  const rootLandingPreference = useAppStore((s) => s.rootLandingPreference);
  if (rootLandingPreference === 'v1') return <Home />;
  if (rootLandingPreference === 'v2') return <CineMorphLanding />;
  return <RootLanding />;
}

function RouteFallback() {
  return (
    <div className="w-full min-h-[60vh] flex flex-col items-center justify-center p-8 space-y-4">
      <div className="w-8 h-8 rounded-full border-2 border-amber-400 border-t-transparent animate-spin" />
      <span className="text-xs uppercase tracking-widest text-zinc-400 font-medium">Entering Scene...</span>
    </div>
  );
}

export default function App() {
  const { rootLandingPreference } = useAppStore();
  const refreshFeedIfNeeded = useUTubeStore((state) => state.refreshFeedIfNeeded);

  // E11 — Immediate App-Open Refresh Invariant
  useEffect(() => {
    refreshFeedIfNeeded();
  }, [refreshFeedIfNeeded]);

  return (
    <Layout>
      <TicketPrinterAnimation />
      <Suspense fallback={<RouteFallback />}>
        <Routes>
          {/* Spatial Root Landing — dynamically routed based on user preference */}
          <Route path="/" element={<RootRouter />} />
          <Route path="/portal" element={<RootLanding />} />
          <Route path="/bento" element={<BentoGrid />} />

          {/* U-Tube Discovery & Watch Engine */}
          <Route path="/u-tube" element={<Home />} />
          <Route path="/search" element={<Search />} />
          <Route path="/watch/:id" element={<Watch />} />
          <Route path="/channel/:id" element={<ChannelPage />} />
          <Route path="/subscriptions" element={<Subscriptions />} />
          <Route path="/collections" element={<Collections />} />
          <Route path="/history" element={<History />} />

          {/* CineMorph Cinema & Theater Engine */}
          <Route path="/cinemorph" element={<CineMorphLanding />} />
          <Route path="/theater" element={<CineMorphTheater />} />
          <Route path="/theater/:id" element={<CineMorphTheater />} />

          {/* Application Control & Settings */}
          <Route path="/settings" element={<SettingsPage />} />
        </Routes>
      </Suspense>
    </Layout>
  );
}

