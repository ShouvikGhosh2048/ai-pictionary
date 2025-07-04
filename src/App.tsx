"use client";

import {
  AppShell,
  Center,
  Stack,
  Text,
} from '@mantine/core';
import { Routes, Route } from 'react-router-dom';
import Header from './components/Header';
import Home from './pages/Home';
import Game from './pages/Game';
import { Authenticated } from 'convex/react';

export default function App() {
  return (
    <AppShell
      header={{ height: 60 }}
      padding="md"
    >
      <AppShell.Header>
        <Header />
      </AppShell.Header>

      <AppShell.Main>
        <Routes>
          <Route path="/" element={
            <Authenticated>
              <Home />
            </Authenticated>
          } />
          <Route path="/game" element={
            <Authenticated>
              <Game />
            </Authenticated>
          } />
          <Route path="*" element={
            <Center>
              <Stack align="center" gap="md">
                <Text size="xl">404 - Page Not Found</Text>
                <Text>This page doesn't exist.</Text>
              </Stack>
            </Center>
          } />
        </Routes>
      </AppShell.Main>
    </AppShell>
  );
}
