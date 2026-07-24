import { useBarber } from '../context/BarberContext';

export function useDisplayStore() {
  const { config, updateLocalPlaylist, logVideoActivity } = useBarber();

  const playlist = config.videoPlaylist || [];

  return {
    playlist, tickerMessage: config.tickerMessage,
    tickerSpeed: config.tickerSpeed,
    videoSource: config.videoSource,
    youtubeVideoId: config.youtubeVideoId,
    updateLocalPlaylist, logVideoActivity,
  };
}
