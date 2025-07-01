"use client";

import {
  Authenticated,
  Unauthenticated,
  useConvexAuth,
  useMutation,
  useQuery,
} from "convex/react";
import { api } from "../convex/_generated/api";
import { useAuthActions } from "@convex-dev/auth/react";
import { useState } from "react";
import {
  AppShell,
  Text,
  Button,
  Container,
  Title,
  Paper,
  TextInput,
  PasswordInput,
  Stack,
  Group,
  Alert,
  Code,
  Card,
  Anchor,
  Grid,
  Box,
  Loader,
  Center,
} from '@mantine/core';
import { notifications } from '@mantine/notifications';

export default function App() {
  return (
    <AppShell
      header={{ height: 60 }}
      padding="md"
    >
      <AppShell.Header p="md">
        <Group justify="space-between">
          <Text size="lg" fw={500}>Convex + React + Convex Auth</Text>
          <SignOutButton />
        </Group>
      </AppShell.Header>

      <AppShell.Main>
        <Container size="lg" py="xl">
          <Stack gap="xl" align="center">
            <Title order={1} ta="center">
              Convex + React + Convex Auth
            </Title>
            
            <Authenticated>
              <Content />
            </Authenticated>
            
            <Unauthenticated>
              <SignInForm />
            </Unauthenticated>
          </Stack>
        </Container>
      </AppShell.Main>
    </AppShell>
  );
}

function SignOutButton() {
  const { isAuthenticated } = useConvexAuth();
  const { signOut } = useAuthActions();
  
  if (!isAuthenticated) return null;
  
  return (
    <Button
      variant="light"
      onClick={() => void signOut()}
    >
      Sign out
    </Button>
  );
}

function SignInForm() {
  const { signIn } = useAuthActions();
  const [flow, setFlow] = useState<"signIn" | "signUp">("signIn");
  const [error, setError] = useState<string | null>(null);
  const [loading, setLoading] = useState(false);

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setLoading(true);
    setError(null);
    
    try {
      await signIn("google");
    } catch (error: any) {
      setError(error.message);
      notifications.show({
        title: 'Error',
        message: error.message,
        color: 'red',
      });
    } finally {
      setLoading(false);
    }
  };

  return (
    <Paper shadow="sm" p="xl" radius="md" w={400} mx="auto">
      <Stack gap="lg">
        <Text ta="center">Log in to see the numbers</Text>
        
        <form onSubmit={handleSubmit}>
          <Stack gap="md">
            <TextInput
              label="Email"
              placeholder="Enter your email"
              type="email"
              required
            />
            
            <PasswordInput
              label="Password"
              placeholder="Enter your password"
              required
            />
            
            <Button
              type="submit"
              loading={loading}
              fullWidth
            >
              {flow === "signIn" ? "Sign in" : "Sign up"}
            </Button>
            
            <Group justify="center" gap="xs">
              <Text size="sm">
                {flow === "signIn"
                  ? "Don't have an account?"
                  : "Already have an account?"}
              </Text>
              <Anchor
                size="sm"
                onClick={() => setFlow(flow === "signIn" ? "signUp" : "signIn")}
              >
                {flow === "signIn" ? "Sign up instead" : "Sign in instead"}
              </Anchor>
            </Group>
          </Stack>
        </form>
        
        {error && (
          <Alert color="red" title="Error">
            <Text size="sm">Error signing in: {error}</Text>
          </Alert>
        )}
      </Stack>
    </Paper>
  );
}

function Content() {
  const { viewer, numbers } =
    useQuery(api.myFunctions.listNumbers, {
      count: 10,
    }) ?? {};
  const addNumber = useMutation(api.myFunctions.addNumber);

  if (viewer === undefined || numbers === undefined) {
    return (
      <Center>
        <Stack align="center" gap="md">
          <Loader size="lg" />
          <Text>Loading... (consider a loading skeleton)</Text>
        </Stack>
      </Center>
    );
  }

  const handleAddNumber = () => {
    void addNumber({ value: Math.floor(Math.random() * 10) });
    notifications.show({
      title: 'Success',
      message: 'Random number added!',
      color: 'green',
    });
  };

  return (
    <Stack gap="xl" maw={600} mx="auto">
      <Text size="lg">Welcome {viewer ?? "Anonymous"}!</Text>
      
      <Text>
        Click the button below and open this page in another window - this data
        is persisted in the Convex cloud database!
      </Text>
      
      <Button onClick={handleAddNumber}>
        Add a random number
      </Button>
      
      <Paper p="md" withBorder>
        <Text fw={500}>Numbers: </Text>
        <Text>
          {numbers?.length === 0
            ? "Click the button!"
            : (numbers?.join(", ") ?? "...")}
        </Text>
      </Paper>
      
      <Stack gap="xs">
        <Text>
          Edit{" "}
          <Code>convex/myFunctions.ts</Code>{" "}
          to change your backend
        </Text>
        <Text>
          Edit{" "}
          <Code>src/App.tsx</Code>{" "}
          to change your frontend
        </Text>
      </Stack>
      
      <Box>
        <Title order={3} mb="md">Useful resources:</Title>
        <Grid gutter="md">
          <Grid.Col span={6}>
            <Stack gap="md">
              <ResourceCard
                title="Convex docs"
                description="Read comprehensive documentation for all Convex features."
                href="https://docs.convex.dev/home"
              />
              <ResourceCard
                title="Stack articles"
                description="Learn about best practices, use cases, and more from a growing collection of articles, videos, and walkthroughs."
                href="https://www.typescriptlang.org/docs/handbook/2/basic-types.html"
              />
            </Stack>
          </Grid.Col>
          <Grid.Col span={6}>
            <Stack gap="md">
              <ResourceCard
                title="Templates"
                description="Browse our collection of templates to get started quickly."
                href="https://www.convex.dev/templates"
              />
              <ResourceCard
                title="Discord"
                description="Join our developer community to ask questions, trade tips & tricks, and show off your projects."
                href="https://www.convex.dev/community"
              />
            </Stack>
          </Grid.Col>
        </Grid>
      </Box>
    </Stack>
  );
}

function ResourceCard({
  title,
  description,
  href,
}: {
  title: string;
  description: string;
  href: string;
}) {
  return (
    <Card shadow="sm" padding="md" radius="md" withBorder h={120}>
      <Stack gap="xs" h="100%">
        <Anchor href={href} size="sm" fw={500}>
          {title}
        </Anchor>
        <Text size="xs" c="dimmed" style={{ flex: 1 }}>
          {description}
        </Text>
      </Stack>
    </Card>
  );
}
