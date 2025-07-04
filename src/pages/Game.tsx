import {
  Container,
  Title,
  Stack,
  Text,
  Button,
  Paper,
  Group,
} from '@mantine/core';

export default function Game() {
  return (
    <Container size="lg" py="xl">
      <Stack gap="xl" align="center">
        <Title order={1} ta="center">AI Pictionary Game</Title>
        
        <Paper p="xl" radius="md" withBorder>
          <Stack gap="lg">
            <Text size="lg" ta="center" fw={500}>
              Game Room
            </Text>
            
            <Text ta="center" c="dimmed">
              AI Pictionary game functionality coming soon!
            </Text>
            
            <Group justify="center">
              <Button variant="outline">
                Create Room
              </Button>
              <Button variant="outline">
                Join Room
              </Button>
            </Group>
          </Stack>
        </Paper>
      </Stack>
    </Container>
  );
} 