import {
  Text,
  Group,
  Button,
} from '@mantine/core';
import { Link, useLocation, useNavigate } from 'react-router-dom';
import { useConvexAuth, useMutation } from "convex/react";
import { useAuthActions } from "@convex-dev/auth/react";
import { notifications } from '@mantine/notifications';
import { api } from '../../convex/_generated/api';

export default function Header() {
  const { isAuthenticated, isLoading } = useConvexAuth();
  const { signIn, signOut } = useAuthActions();
  const location = useLocation();
  const navigate = useNavigate();
  const newGameMutation = useMutation(api.myFunctions.createGame);
  
  const handleSignIn = async () => {
    try {
      await signIn("google");
    } catch (error: any) {
      notifications.show({
        title: 'Error',
        message: error.message,
        color: 'red',
      });
    }
  };

  const handleNewGame = async () => {
    try {
      const gameId = await newGameMutation();
      navigate(`/game/${gameId}`);
    } catch (error: any) {
      notifications.show({
        title: 'Error',
        message: error.message, 
        color: 'red',
      });
    }
  };

  const isActive = (path: string) => location.pathname === path;

  return (
    <Group gap="lg" justify="space-between" w="100%" h="100%" px="md">
        <Text size="lg" fw={500}>AI Pictionary</Text>
        <Group gap="xs">
            <Link
                to="/"
                style={{
                    textDecoration: 'none',
                    color: isActive('/') ? 'var(--mantine-color-blue-filled)' : 'inherit',
                    fontWeight: 500,
                    fontSize: 'var(--mantine-font-size-sm)'
                }}
            >
                Home
            </Link>
            {isAuthenticated && (
                <Button onClick={handleNewGame}>New Game</Button>
            )}
            {!isAuthenticated ? (
                <Button
                    loading={isLoading}
                    onClick={handleSignIn}
                >
                    Sign in
                </Button>
                ) : (
                    <Button
                        loading={isLoading}
                        onClick={signOut}
                    >
                        Sign out
                    </Button>
            )}
        </Group>
    </Group>
  );
} 