import {
  useMutation,
  useQuery,
} from "convex/react";
import { api } from "../../convex/_generated/api";
import {
  Text,
  Container,
  Title,
  Stack,
  Loader,
  Center,
  Button,
} from '@mantine/core';
import { notifications } from '@mantine/notifications';

export default function Home() {
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
    <Container size="lg" py="xl">
      <Stack gap="xl" align="center">
        <Title order={1} ta="center">AI Pictionary</Title>
        <Stack gap="xl" maw={600} mx="auto">
          <Text size="lg">Welcome {viewer ?? "Anonymous"}!</Text>
          
          <Text>
            Click the button below and open this page in another window - this data
            is persisted in the Convex cloud database!
          </Text>
          
          <Button onClick={handleAddNumber}>
            Add a random number
          </Button>
        </Stack>
      </Stack>
    </Container>
  );
} 