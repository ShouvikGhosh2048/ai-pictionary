"use client";

import {
  Center,
  Container,
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
    <Container>
      <Header />
      <Routes>
          <Route path="/" element={
            <Home />
          } />
          <Route path="/game/:id" element={
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
    </Container>
  );
}
