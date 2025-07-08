import {
  Text,
  Container,
  Title,
  Stack,
  Image,
  Flex,
  Loader,
  Center,
} from '@mantine/core';
import { useQuery } from 'convex/react';
import { useInViewport } from '@mantine/hooks';
import { useState, useEffect } from 'react';
import { api } from '../../convex/_generated/api';

interface ImageData {
  _id: string;
  image: string;
  theme: string;
  answer: string;
  _creationTime: number;
}

export default function Home() {
  const [allImages, setAllImages] = useState<ImageData[]>([]);
  const [startCursor, setStartCursor] = useState<number | null>(null);
  const [loadCursor, setLoadCursor] = useState<number | null>(null);
  const [hasMore, setHasMore] = useState(true);
  const [isLoadingMore, setIsLoadingMore] = useState(false);
  
  // Load initial images
  const initialImages = useQuery(
    api.myFunctions.getImagesPaginated,
    startCursor ? { limit: 6, cursor: startCursor } : 'skip'
  );
  
  // Load more images when cursor changes
  const moreImages = useQuery(
    api.myFunctions.getImagesPaginated,
    loadCursor ? { limit: 6, cursor: loadCursor } : 'skip'
  );
  
  // Set up intersection observer for infinite scroll
  const { ref: endRef, inViewport } = useInViewport();

  useEffect(() => {
    setStartCursor(Date.now());
  }, []);

  // Handle initial load
  useEffect(() => {
    if (initialImages) {
      setAllImages(initialImages.images);
      setHasMore(initialImages.hasMore);
      if (!initialImages.hasMore) {
        setLoadCursor(null);
      }
    }
  }, [initialImages]);

  // Handle loading more images
  useEffect(() => {
    if (moreImages && loadCursor) {
      setAllImages(prev => [...prev, ...moreImages.images]);
      setHasMore(moreImages.hasMore);
      setIsLoadingMore(false);
    }
  }, [moreImages, loadCursor]);

  // Trigger load more when last image is visible
  useEffect(() => {
    if (inViewport && hasMore && !isLoadingMore && allImages.length > 0) {
      setIsLoadingMore(true);
      const lastImage = allImages[allImages.length - 1];
      if (lastImage) {
        setLoadCursor(lastImage._creationTime);
      }
    }
  }, [inViewport, hasMore, isLoadingMore, allImages]);

  return (
    <Container size="lg" py="xl">
      <Stack gap="xl" align="center">
        <Title order={1} ta="center">AI Pictionary</Title>
        <Stack gap="xl" mx="auto">
          <Text>
            Try out a game by signing in or view generated images below.
          </Text>
          <Flex wrap="wrap" gap="lg">
            {allImages.map(image => (
              <Container key={image._id}>
                <Text>{image.theme}: {image.answer}</Text>
                <Image src={image.image} alt={image.theme} w={300} h={300} />
              </Container>
            ))}
          </Flex>
          {isLoadingMore && (
            <Center>
              <Loader size="md" />
            </Center>
          )}
          <Center ref={endRef}>
            <Text c="dimmed" mih="sm">{!hasMore && allImages.length > 0 && "No more images to load"}</Text>
          </Center>
        </Stack>
      </Stack>
    </Container>
  );
} 