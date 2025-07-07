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
import { useIntersection } from '@mantine/hooks';
import { useState, useEffect, useRef } from 'react';
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
  const [cursor, setCursor] = useState<string | null>(null);
  const [hasMore, setHasMore] = useState(true);
  const [isLoadingMore, setIsLoadingMore] = useState(false);
  
  // Load initial images
  const initialImages = useQuery(api.myFunctions.getImagesPaginated, {
    limit: 6,
  });
  
  // Load more images when cursor changes
  const moreImages = useQuery(
    api.myFunctions.getImagesPaginated,
    cursor ? { limit: 6, cursor } : 'skip'
  );
  
  // Set up intersection observer for infinite scroll
  const containerRef = useRef<HTMLDivElement>(null);
  const { ref: lastImageRef, entry } = useIntersection({
    root: containerRef.current,
    threshold: 1,
  });

  // Handle initial load
  useEffect(() => {
    if (initialImages) {
      setAllImages(initialImages.images);
      setHasMore(initialImages.hasMore);
      if (!initialImages.hasMore) {
        setCursor(null);
      }
    }
  }, [initialImages]);

  // Handle loading more images
  useEffect(() => {
    if (moreImages && cursor) {
      setAllImages(prev => [...prev, ...moreImages.images]);
      setHasMore(moreImages.hasMore);
      setIsLoadingMore(false);
    }
  }, [moreImages, cursor]);

  // Trigger load more when last image is visible
  useEffect(() => {
    if (entry?.isIntersecting && hasMore && !isLoadingMore && allImages.length > 0) {
      setIsLoadingMore(true);
      const lastImage = allImages[allImages.length - 1];
      if (lastImage) {
        setCursor(lastImage._id);
      }
    }
  }, [entry?.isIntersecting, hasMore, isLoadingMore, allImages]);

  return (
    <Container size="lg" py="xl" ref={containerRef}>
      <Stack gap="xl" align="center">
        <Title order={1} ta="center">AI Pictionary</Title>
        <Stack gap="xl" mx="auto">
          <Text>
            Try out a game by signing in or view generated images below.
          </Text>
          <Flex wrap="wrap" gap="lg">
            {allImages.map((image, index) => (
              <Container 
                key={image._id} 
                ref={index === allImages.length - 1 ? lastImageRef : undefined}
              >
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
          {!hasMore && allImages.length > 0 && (
            <Center>
              <Text c="dimmed">No more images to load</Text>
            </Center>
          )}
        </Stack>
      </Stack>
    </Container>
  );
} 