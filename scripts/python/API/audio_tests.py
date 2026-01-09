from api import API
import soundfile as sf
import numpy as np
from scipy import signal as scipy_signal
import tempfile
import os

# Load the test cases from the samples folder
# Test cases are in the format of wav files
# For the time being, don't do 1:1 testing, just paste what the api returns
def test_audio_samples(api: API):
    samples = [
        "samples/normal/abeam.wav",
        "samples/normal/departure.wav",
        "samples/normal/goaround.wav",
        "samples/normal/initials.wav",
        "samples/normal/taxi.wav",
    ]
    
    for sample in samples:
        # Convert file to 16kHz mono if necessary
        audio, sample_rate = sf.read(sample)
        
        # Convert stereo to mono if necessary
        if len(audio.shape) > 1:
            audio = np.mean(audio, axis=1)
        
        # Resample to 16kHz if necessary
        if sample_rate != 16000:
            target_length = int(len(audio) * 16000 / sample_rate)
            audio = scipy_signal.resample(audio, target_length)
            sample_rate = 16000
        
        # Save converted audio to temporary file
        temp_dir = tempfile.gettempdir()
        converted_file = os.path.join(temp_dir, f"converted_{os.path.basename(sample)}")
        sf.write(converted_file, audio, sample_rate, subtype='PCM_16')
        
        print(f"Testing audio sample: {sample}")
        response = api.transcribe_audio(converted_file)
        print(f"Response: {response}\n")

if __name__ == "__main__":
    api = API()
    test_audio_samples(api)