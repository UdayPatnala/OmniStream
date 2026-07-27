/**
 * U Tube Application
 * Copyright (c) Patnala Uday Kumar. All rights reserved.
 */

import { Routes, Route } from 'react-router-dom';
import { Layout } from './components/Layout';
import { Home } from './pages/Home';
import { Search } from './pages/Search';
import { Watch } from './pages/Watch';
import { Subscriptions } from './pages/Subscriptions';
import { Collections } from './pages/Collections';
import { History } from './pages/History';
import { SettingsPage } from './pages/Settings';
import { ChannelPage } from './pages/Channel';

export default function App() {
  return (
    <Layout>
      <Routes>
        <Route path="/" element={<Home />} />
        <Route path="/search" element={<Search />} />
        <Route path="/watch/:id" element={<Watch />} />
        <Route path="/subscriptions" element={<Subscriptions />} />
        <Route path="/collections" element={<Collections />} />
        <Route path="/history" element={<History />} />
        <Route path="/settings" element={<SettingsPage />} />
        <Route path="/channel/:id" element={<ChannelPage />} />
      </Routes>
    </Layout>
  );
}

