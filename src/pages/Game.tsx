import {
  Button,
  Modal,
  Stack,
  TextInput,
  Group,
  Flex,
  Text
} from '@mantine/core';
import { Navigate, useParams } from 'react-router-dom';
import { useAction, useMutation, useQuery } from 'convex/react';
import { api } from '../../convex/_generated/api';
import { useEffect, useState } from 'react';
import { IoSettings, IoTrophy } from 'react-icons/io5';
import { Id } from '../../convex/_generated/dataModel';

function GameControl(props: { game: NonNullable<typeof api.myFunctions.getGame._returnType>, gameID: string }) {
    const [disableHostButton, setDisableHostButton] = useState(false);
    const newRoundAction = useAction(api.myActions.newRound);
    const revealAnswerAction = useMutation(api.myFunctions.revealAnswer);

    return (props.game.image && !props.game.answer ? (
        <Button onClick={async () => {
            try {
                setDisableHostButton(true);
                await revealAnswerAction({ gameId: props.gameID as Id<"games">});
            } finally {
                setDisableHostButton(false);
            }
        }} disabled={disableHostButton}>Reveal answer</Button>
    ) : (
        <Button onClick={async () => {
            try {
                setDisableHostButton(true);
                await newRoundAction({ gameId: props.gameID as Id<"games">});
            } finally {
                setDisableHostButton(false);
            }
        }} disabled={disableHostButton}>{props.game.round === 0 ? "Begin game" : "Next round"}</Button>
    ))
}

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

function Scoreboard(props: { game: NonNullable<typeof api.myFunctions.getGame._returnType>, gameID: string }) {
    const [scoreboardOpened, setScoreboardOpened] = useState(false);
    return (
        <>
            <Button variant="outline" color="gray" onClick={() => setScoreboardOpened(true)}><IoTrophy size={16}/></Button>
            <Modal
                opened={scoreboardOpened}
                onClose={() => setScoreboardOpened(false)}
                title="Scoreboard"
            >
                <Stack>
                    {props.game.scores
                        .map((score) => (
                            <Group justify="space-between">
                                <Text>{score.username}: {score.score}</Text>
                            </Group>
                        ))
                    }
                </Stack>
            </Modal>
        </>
    );
}

export default function Game() {
  const { id } = useParams();
  const game = useQuery(api.myFunctions.getGame, { id: id ?? "" });
  const [guess, setGuess] = useState("");
  const addGuessMutation = useMutation(api.myFunctions.addGuess);

  useEffect(() => {
    setGuess("");
  }, [game?.round]);

  if (id === undefined || game === null) {
    return <Navigate to="/" />;
  }

  if (!game) { return null; }

  return (
    <Flex wrap="wrap" gap="xl">
        <Stack w={300}>
            {game.isHost && (
                <Flex justify="space-between">
                    <GameControl game={game} gameID={id} />
                    <GameSettings game={game} gameID={id} />
                </Flex>
            )}
            <Flex justify="space-between" align="center">
                {game.round > 0 ? <Text>Round {game.round}</Text> : <Text>Waiting for host to start game</Text>}
                <Scoreboard game={game} gameID={id} />
            </Flex>
            {game.image && <img src={game.image} key={game.image} width={300} height={300} />}
            {game.answer && <span>Answer: {game.answer} {game.winner && `(Winner: ${game.winner})`}</span>}
        </Stack>
        <Stack style={{ maxWidth: '300px' }} gap="sm">
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
                disabled={game.round === 0 || game.answer !== undefined}>Guess</Button>
            </Flex>
            {game.guesses.map((guess) => (
                <Text style={{ whiteSpace: 'pre-wrap', wordBreak: 'break-word' }}>{guess.username}: {guess.guess}</Text>
            ))}
        </Stack>
    </Flex>
  );
} 