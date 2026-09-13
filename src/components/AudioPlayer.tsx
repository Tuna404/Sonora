interface Props {
  src: string;
}

function AudioPlayer(props: Props) {
  return <audio controls src={props.src} class="w-full" />;
}

export default AudioPlayer;
