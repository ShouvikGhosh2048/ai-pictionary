import {
  Text,
  Group,
  Button,
  Flex,
} from '@mantine/core';
import { Link, useNavigate } from 'react-router-dom';
import { useConvexAuth, useMutation } from "convex/react";
import { useAuthActions } from "@convex-dev/auth/react";
import { notifications } from '@mantine/notifications';
import { api } from '../../convex/_generated/api';

export default function Header() {
  const { isAuthenticated, isLoading } = useConvexAuth();
  const { signIn, signOut } = useAuthActions();
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

  return (
    <Flex gap="sm" justify="space-between" align="center"
      w="100%" px="md" py="sm" wrap="wrap"
      style={{
        borderBottom: '1px solid var(--mantine-color-gray-2)',
        marginBottom: '1rem',
      }}>
        <Link
          to="/"
          style={{
              textDecoration: 'none',
              color: "inherit",
          }}
        >
          <Text size="lg" fw={500} style={{ flexShrink: 0, minWidth: 'fit-content' }}>AI Pictionary</Text>
        </Link>
        <Group gap="xs" style={{ flexShrink: 0, minWidth: 'fit-content' }}>
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
    </Flex>
  );
} 