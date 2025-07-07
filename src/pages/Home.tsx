import {
  Text,
  Container,
  Title,
  Stack,
  Image,
  Flex,
} from '@mantine/core';
import { useQuery } from 'convex/react';
import { api } from '../../convex/_generated/api';

export default function Home() {
  const images = useQuery(api.myFunctions.getImages);

  return (
    <Container size="lg" py="xl">
      <Stack gap="xl" align="center">
        <Title order={1} ta="center">AI Pictionary</Title>
        <Stack gap="xl" mx="auto">
          <Text>
            Try out a game by signing in or view generated images below.
          </Text>
          <Flex wrap="wrap" gap="lg">
            {images?.map((image) => (
              <Container key={image.image}>
                <Text>{image.theme}: {image.answer}</Text>
                <Image src={image.image} alt={image.theme} w={300} h={300} />
              </Container>
            ))}
          </Flex>
        </Stack>
      </Stack>
    </Container>
  );
} 