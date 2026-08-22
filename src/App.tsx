/**
 * U Tube Application
 * Copyright (c) Patnala Uday Kumar. All rights reserved.
 */

import React, { Suspense, lazy } from 'react';
import { Routes, Route } from 'react-router-dom';
import { Layout } from './components/Layout';
import { useAppStore } from './store';
import { Skeleton } from './components/Skeleton';

// Code-split route bundles for optimal first-paint performance
const Home = lazy(() => import('./pages/Home').then(m => ({ default: m.Home })));
const Search = lazy(() => import('./pages/Search').then(m => ({ default: m.Search })));
const Watch = lazy(() => import('./pages/Watch').then(m => ({ default: m.Watch })));
const CineMorphTheater = lazy(() => import('./pages/CineMorphTheater').then(m => ({ default: m.CineMorphTheater })));
const Subscriptions = lazy(() => import('./pages/Subscriptions').then(m => ({ default: m.Subscriptions })));
const Collections = lazy(() => import('./pages/Collections').then(m => ({ default: m.Collections })));
const History = lazy(() => import('./pages/History').then(m => ({ default: m.History })));
const SettingsPage = lazy(() => import('./pages/Settings').then(m => ({ default: m.SettingsPage })));
const ChannelPage = lazy(() => import('./pages/Channel').then(m => ({ default: m.ChannelPage })));

function RouteFallback() {
  return (
    <div className="w-full min-h-[60vh] flex flex-col items-center justify-center p-8 space-y-4">
      <div className="w-8 h-8 rounded-full border-2 border-[#D0BCFF] border-t-transparent animate-spin" />
      <div className="text-xs text-[#938F99] tracking-wider uppercase">Loading view...</div>
    </div>
  );
}

// Picks V1 Watch page or V2 Theater based on active version mode.
function WatchRouter() {
  const versionMode = useAppStore(s => s.versionMode);
  return versionMode === 'v2' ? <CineMorphTheater /> : <Watch />;
}

export default function App() {
  return (
    <Layout>
      <Suspense fallback={<RouteFallback />}>
        <Routes>
          <Route path="/" element={<Home />} />
          <Route path="/search" element={<Search />} />
          <Route path="/watch/:id" element={<WatchRouter />} />
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

