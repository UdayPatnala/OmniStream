/**
 * OmniStream Application Shell & Route Gateway
 * Copyright (c) Patnala Uday Kumar. All rights reserved.
 */

import React, { Suspense, lazy, useEffect } from 'react';
import { Routes, Route } from 'react-router-dom';
import { Layout, BentoGrid, RootLanding, SettingsPage } from '@omnistream/shell';
import { TicketPrinterAnimation } from '@omnistream/cinemorph';
import { useAppStore } from '../store';
import { useUTubeStore } from '@omnistream/utube';

// Code-split route bundles for optimal first-paint performance
const Home = lazy(() => import('@omnistream/utube').then((m) => ({ default: m.Home })));
const Search = lazy(() => import('@omnistream/utube').then((m) => ({ default: m.Search })));
const Watch = lazy(() => import('@omnistream/utube').then((m) => ({ default: m.Watch })));
const CineMorphLanding = lazy(() => import('@omnistream/cinemorph').then((m) => ({ default: m.CineMorphLanding })));
const CineMorphTheater = lazy(() => import('@omnistream/cinemorph').then((m) => ({ default: m.CineMorphTheater })));
const Subscriptions = lazy(() => import('@omnistream/utube').then((m) => ({ default: m.Subscriptions })));
const Collections = lazy(() => import('@omnistream/utube').then((m) => ({ default: m.Collections })));
const History = lazy(() => import('@omnistream/utube').then((m) => ({ default: m.History })));
const ChannelPage = lazy(() => import('@omnistream/utube').then((m) => ({ default: m.ChannelPage })));

function RouteFallback() {
  return (
    <div className="w-full min-h-[60vh] flex flex-col items-center justify-center p-8 space-y-4">
      <div className="w-8 h-8 rounded-full border-2 border-amber-400 border-t-transparent animate-spin" />
      <div className="text-xs text-gray-400 tracking-wider uppercase font-mono">Loading Experience...</div>
    </div>
  );
}

// Routes root based on user preference — RootLanding (Cosmic Threshold) is the master gateway
function RootRouter() {
  const rootLandingPreference = useAppStore((s) => s.rootLandingPreference);
  if (rootLandingPreference === 'v1') return <Home />;
  if (rootLandingPreference === 'v2') return <CineMorphLanding />;
  return <RootLanding />;
}

export function App() {
  const refreshFeedIfNeeded = useUTubeStore((s) => s.refreshFeedIfNeeded);

  // Background non-blocking subscription feed cache validation & refresh on app open
  useEffect(() => {
    refreshFeedIfNeeded().catch((err) => {
      console.warn('[OmniStream] App-open feed refresh skipped / using cache:', err);
    });
  }, [refreshFeedIfNeeded]);

  return (
    <Layout>
      <TicketPrinterAnimation />
      <Suspense fallback={<RouteFallback />}>
        <Routes>
          <Route path="/" element={<RootRouter />} />
          <Route path="/landing" element={<RootLanding />} />
          <Route path="/gateway" element={<RootLanding />} />
          <Route path="/portal" element={<RootLanding />} />
          <Route path="/bento" element={<BentoGrid />} />
          <Route path="/home" element={<Home />} />
          <Route path="/feed" element={<Home />} />
          <Route path="/cinemorph" element={<CineMorphLanding />} />
          <Route path="/theater/:id" element={<CineMorphTheater />} />
          <Route path="/search" element={<Search />} />
          <Route path="/shorts" element={<Home />} />
          <Route path="/watch/:id" element={<Watch />} />
          <Route path="/subscriptions" element={<Subscriptions />} />
          <Route path="/collections" element={<Collections />} />
          <Route path="/history" element={<History />} />
          <Route path="/settings" element={<SettingsPage />} />
          <Route path="/channel/:id" element={<ChannelPage />} />
        </Routes>
      </Suspense>
    </Layout>
  );
}

export default App;
