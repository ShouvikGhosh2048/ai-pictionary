import {
  Button,
  Modal,
  Stack,
  TextInput,
  Group,
  Flex
} from '@mantine/core';
import { Navigate, useParams } from 'react-router-dom';
import { useAction, useMutation, useQuery } from 'convex/react';
import { api } from '../../convex/_generated/api';
import { useEffect, useState } from 'react';
import { IoSettings } from 'react-icons/io5';
import { Id } from '../../convex/_generated/dataModel';

function GameSettings(props: { game: NonNullable<typeof api.myFunctions.getGame._returnType>, gameID: string }) {
    const [theme, setTheme] = useState(props.game.theme);
    const [settingsOpened, setSettingsOpened] = useState(props.game.round === 0);
    const setThemeMutation = useMutation(api.myFunctions.setTheme);

    return (
        <>
            <Button variant="outline" color="gray" onClick={() => { setTheme(props.game.theme); setSettingsOpened(true); }} ><IoSettings size={16} /></Button>
            <Modal
                opened={settingsOpened}
                onClose={() => { setSettingsOpened(false); setThemeMutation({ gameId: props.gameID as Id<"games">, theme: theme }); }}
                title="Game Settings"
            >
                <Stack>
                    <TextInput
                        label="Theme"
                        placeholder="Enter a theme for the game"
                        value={theme}
                        onChange={(e) => setTheme(e.target.value)}
                    />
                </Stack>
            </Modal>
        </>
    );
}

export default function Game() {
  const { id } = useParams();
  const game = useQuery(api.myFunctions.getGame, { id: id ?? "" });
  const [disableHostButton, setDisableHostButton] = useState(false);
  const [guess, setGuess] = useState("");
  const newRoundAction = useAction(api.myActions.newRound);
  const revealAnswerAction = useMutation(api.myFunctions.revealAnswer);
  const addGuessMutation = useMutation(api.myFunctions.addGuess);

  useEffect(() => {
    setGuess("");
  }, [game?.round]);

  if (id === undefined || game === null) {
    return <Navigate to="/" />;
  }

  if (!game) { return null; }

  return (
    <Stack>
        {game.isHost && (
            <Group>
                { game.image && !game.answer ? (
                    <Button onClick={async () => {
                        try {
                            setDisableHostButton(true);
                            await revealAnswerAction({ gameId: id as Id<"games">});
                        } finally {
                            setDisableHostButton(false);
                        }
                    }} disabled={disableHostButton}>Reveal answer</Button>
                ) : (
                    <Button onClick={async () => {
                        try {
                            setDisableHostButton(true);
                            await newRoundAction({ gameId: id as Id<"games">});
                        } finally {
                            setDisableHostButton(false);
                        }
                    }} disabled={disableHostButton}>{game.round === 0 ? "Begin game" : "Next round"}</Button>
                )}
                <GameSettings game={game} gameID={id} />
            </Group>
        )}
        {game.image && <img src={game.image} width={300} height={300} />}
        <Stack>
            <Flex gap="md" align="end">
                <TextInput
                    label="Guess"
                    placeholder="Enter your guess"
                    value={guess}
                    onChange={(e) => setGuess(e.target.value)}
                    disabled={game.round === 0 || game.answer !== undefined}
                />
                <Button onClick={async () => {
                    await addGuessMutation({ gameId: id as Id<"games">, guess });
                }}
                disabled={game.round === 0 || game.answer !== undefined}>Submit</Button>
            </Flex>
            {game.guesses.map((guess) => (
                <span>{guess.username}: {guess.guess}</span>
            ))}
            {game.answer && <span>Answer: {game.answer} {game.winner && `(Winner: ${game.winner})`}</span>}
        </Stack>
    </Stack>
  );
} 