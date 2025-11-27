
import re
import numpy as np
import pyaudio
import threading
import warnings
from kokoro import KPipeline
from queue import Queue

warnings.filterwarnings("ignore", message='dropout option adds dropout after all but last recurrent layer.*')
warnings.filterwarnings("ignore", message='.*torch.nn.utils.weight_norm.*is deprecated.*')

REPO_ID = 'hexgrad/Kokoro-82M'
LANG_CODE = 'a'
VOICE = 'af_nicole'
SPEED = 1.3
SAMPLE_RATE = 24000
FRAMES_PER_BUFFER = 1024
PIPELINE = KPipeline(lang_code=LANG_CODE, repo_id=REPO_ID)

def split_into_sentences(text):
    if not text or not text.strip():
        return []
    parts = re.split(r'(?<!\w-\w)(?<=[.!?])\s+(?=[A-Z])', text.strip())
    return [p.strip() for p in parts if p.strip()]
            
def group_sentences(sentences, block_size=2):
    for i in range (0, len(sentences), block_size):
        yield ' '.join(sentences[i:i + block_size])

def speak(
        text,
        voice = VOICE,
        base_speed = SPEED,
        lang_code = LANG_CODE,
        block_size = 2,
        initial_buffer_blocks = 1
        ):
    sentences = split_into_sentences(text)

    if not sentences:
        print('No text to speak out loud')
        return False

    audio_queue = Queue(maxsize=initial_buffer_blocks + 2)
    done_sentinel = object()

    def producer():
        try:
            for index, block in enumerate(group_sentences(sentences, block_size)):
                speed = base_speed
                print(f'[gen] block {index + 1}: "{block[:50]}" @speed: {speed})')
                chunk_list = []

                print(f'[gen] Starting TTS generation for block {index + 1}...')
                try:
                    for step_idx, (_, _, audio) in enumerate(PIPELINE(block, voice=voice, speed=speed)):
                        print(f'[gen] Processing step {step_idx + 1}...')
                        chunk_list.append(np.array(audio.tolist(), dtype=np.float32))
                except Exception as e:
                    print(f'[gen] ERROR in TTS generation: {e}')
                    continue
                    
                if chunk_list:
                    full_block = np.concatenate(chunk_list)
                    print(f'[gen] Generated audio block {index + 1}, length: {len(full_block)}')
                    audio_queue.put(full_block)
                else:
                    print(f'[gen] WARNING: No audio generated for block {index + 1}')
        except Exception as e:
            print(f'[gen] PRODUCER ERROR: {e}')
        finally:
            print('[gen] Producer finished, sending done signal')
            audio_queue.put(done_sentinel)
    
    def consumer():
        p = pyaudio.PyAudio()
        stream = p.open(format=pyaudio.paFloat32,
                        channels=1,
                        rate=SAMPLE_RATE,
                        output=True,
                        frames_per_buffer=FRAMES_PER_BUFFER)

        try:
            print(f"[play] Buffering {initial_buffer_blocks} block(s)...")
            for _ in range(initial_buffer_blocks):
                block = audio_queue.get()
                if block is done_sentinel:
                    return
                stream.write(block.tobytes())

            while True:
                block = audio_queue.get()
                if block is done_sentinel:
                    break
                stream.write(block.tobytes())
        finally:
            stream.stop_stream()
            stream.close()
            p.terminate()
            print("[play] Finished playback.")

    prod_thread = threading.Thread(target=producer, daemon=True)
    consumer_thread = threading.Thread(target=consumer, daemon=True)
    prod_thread.start()
    consumer_thread.start()
    prod_thread.join()
    consumer_thread.join()
    return True

#https://huggingface.co/hexgrad/Kokoro-82M/blob/main/VOICES.md#british-english

if __name__ == "__main__":
    speak("Olympus ready to take voice commands")


   # text = "Clear take off 2 7, Chevy 1 1."
   # speak(text, voice='bm_daniel', lang_code='b')