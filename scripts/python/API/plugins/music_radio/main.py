"""
MusicRadio plugin for DCS Olympus API.
"""

import asyncio
from random import randrange
import sys
from pathlib import Path
import re

from radio.radio_transmitter import RadioTransmitter

api_dir = Path(__file__).parent.parent.parent
if str(api_dir) not in sys.path:
    sys.path.insert(0, str(api_dir))

from plugin_base import Plugin, PluginStatus

from api import API

class MusicRadio(Plugin):
    """
    MusicRadio plugin.
    """

    def __init__(self, plugin_info, global_config=None):
        super().__init__(plugin_info, global_config)
        self.config = plugin_info.get("config", {})
        self.music_folder = str(self.config.get("music_folder", "")).strip()
        self.music_frequency_hz = self._read_frequency_hz("music_frequency_hz")
        self.music_modulation = self._read_modulation("music_modulation", default=0)
        self.start_at_random_point = self.config.get("start_at_random_point", True)
        
        self.api: API | None = None
        self.transmitter: RadioTransmitter | None = None
        
        self.song_queue = []
        self.current_song = None

    def _read_frequency_hz(self, key: str):
        value = self.config.get(key)
        if value is None:
            return None

        try:
            return float(value)
        except (TypeError, ValueError):
            self.logger.warning("Invalid frequency value for %s: %s", key, value)
            return None

    def _read_modulation(self, key: str, default: int = 0) -> int:
        value = self.config.get(key, default)
        try:
            return int(value)
        except (TypeError, ValueError):
            self.logger.warning("Invalid modulation value for %s: %s", key, value)
            return default
        
    def on_start(self) -> bool:
        try:
            self.logger.info("MusicRadio plugin started")
            self.logger.info("Music folder: %s", self.music_folder or "<not configured>")
            self.logger.info("Music frequency (Hz): %s", self.music_frequency_hz)
            self.logger.info("Music modulation: %s", self.music_modulation)

            music_files = []
            converted_folder: Path | None = None
            if self.music_folder:
                music_folder_path = Path(self.music_folder)
                converted_folder = music_folder_path / "converted"
                converted_folder.mkdir(parents=True, exist_ok=True)
                music_files = [
                    f for f in music_folder_path.iterdir()
                    if f.is_file() and f.suffix.lower() in [".mp3", ".wav"]
                ]
            else:
                self.logger.warning("music_folder is not configured. No songs will be queued.")

            self.logger.info("Found %d source audio files in the folder.", len(music_files))

            import subprocess
            ffmpeg_path = Path(__file__).parent / "libs" / "ffmpeg"
            if not ffmpeg_path.exists():
                ffmpeg_path = ffmpeg_path.with_suffix(".exe")

            for source_file in music_files:
                self.logger.info(" - %s", source_file.name)
                converted_file = converted_folder / f"{source_file.stem}.wav"

                if converted_file.exists():
                    self.logger.info("Converted WAV already exists, skipping: %s", converted_file.name)
                    continue

                self.logger.info("Converting %s -> %s", source_file.name, converted_file.name)
                try:
                    subprocess.run([
                        str(ffmpeg_path), "-y", "-i", str(source_file),
                        "-ac", "1", "-ar", "16000", "-sample_fmt", "s16",
                        str(converted_file)
                    ], check=True)
                    self.logger.info("Conversion successful: %s", converted_file.name)
                except Exception as e:
                    self.logger.error(f"Failed to convert {source_file.name}: {e}", exc_info=True)

            # Put all converted wav files in the song queue
            self.song_queue = [f for f in converted_folder.glob("*.wav")] if converted_folder else []
            self.logger.info("Added %d songs to the queue.", len(self.song_queue))
            
            # If the filenames start with a number, order the queue by that number to allow custom ordering. Otherwise, order alphabetically
            if self.song_queue and self.song_queue[0].name[0].isdigit():
                try:
                    self.song_queue.sort(key=lambda f: int(re.search("^[0-9]*", f.stem).group()))
                except:
                    self.logger.warning("Unable to sort songs.")
            else:
                self.song_queue.sort(key=lambda f: f.name)
                
            # If we want to start at a random point, quickly run through the queue
            if self.start_at_random_point:
                for i in range(randrange(len(self.song_queue))):
                    current_song = self.song_queue.pop(0)
                    self.song_queue.append(current_song)
            
            self.api = API(saved_games_folder=self.global_config.get('dcs_saved_games_folder', '.'), load_whisper=False, load_kokoro=False)
            self.transmitter = self.api.create_radio_transmitter()
            self.transmitter.start()
            
            asyncio.create_task(self._periodic_task())
            self.logger.info("MusicRadio periodic task scheduled")
            
            return True
        except Exception as e:
            self.logger.error(f"Failed to start MusicRadio plugin: {e}", exc_info=True)
            return False

    def on_stop(self) -> bool:
        try:
            if self.transmitter:
                self.transmitter.stop()
                
            self.logger.info("MusicRadio plugin stopped")
            return True
        except Exception as e:
            self.logger.error(f"Failed to stop MusicRadio plugin: {e}", exc_info=True)
            return False

    def on_pause(self) -> bool:
        try:
            self.paused = True
            self.logger.info("MusicRadio plugin paused")
            if self.transmitter:
                self.transmitter.pause()
            return True
        except Exception as e:
            self.logger.error(f"Failed to pause MusicRadio plugin: {e}", exc_info=True)
            return False

    def on_resume(self) -> bool:
        try:
            self.paused = False
            self.logger.info("MusicRadio plugin resumed")
            if self.transmitter:
                self.transmitter.resume()
            return True
        except Exception as e:
            self.logger.error(f"Failed to resume MusicRadio plugin: {e}", exc_info=True)
            return False

    async def _periodic_task(self):
        while self.get_status() == PluginStatus.RUNNING:
            self.watchdog_tick()
            if not self.get_status() == PluginStatus.PAUSED:
                if not self.transmitter.is_transmitting():
                    # Get the next song from the queue. Put the played song at the end of the queue to create a loop
                    if self.song_queue:
                        self.current_song = self.song_queue.pop(0)
                        self.logger.info("Now playing: %s", self.current_song.name)
                        if self.music_frequency_hz is None:
                            self.logger.warning("music_frequency_hz is not configured. Skipping transmission.")
                        else:
                            self.transmitter.transmit_on_frequency(
                                str(self.current_song),
                                self.music_frequency_hz,
                                self.music_modulation,
                                0,
                                keep_file = True
                            )
                        self.song_queue.append(self.current_song)
                    else:
                        self.logger.warning("Song queue is empty. No music to play.")
            await asyncio.sleep(1)