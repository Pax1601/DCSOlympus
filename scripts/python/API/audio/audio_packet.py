from enum import Enum
from typing import List, Dict, Optional
import struct

packet_id = 0

class MessageType(Enum):
    AUDIO = 0
    SETTINGS = 1
    CLIENTS_DATA = 2

class AudioPacket:
    def __init__(self):
        # Mandatory data
        self._frequencies: List[Dict[str, int]] = []
        self._audio_data: Optional[bytes] = None
        self._transmission_guid: Optional[str] = None
        self._client_guid: Optional[str] = None
        
        # Default data
        self._unit_id: int = 0
        self._hops: int = 0
        
        # Usually internally set only
        self._packet_id: Optional[int] = None

    def from_byte_array(self, byte_array: bytes):
        total_length = self._byte_array_to_integer(byte_array[0:2])
        audio_length = self._byte_array_to_integer(byte_array[2:4])
        frequencies_length = self._byte_array_to_integer(byte_array[4:6])

        # Perform some sanity checks
        if total_length != len(byte_array):
            print(f"Warning, audio packet expected length is {total_length} but received length is {len(byte_array)}, aborting...")
            return

        if frequencies_length % 10 != 0:
            print(f"Warning, audio packet frequencies data length is {frequencies_length} which is not a multiple of 10, aborting...")
            return

        # Extract the audio data
        self._audio_data = byte_array[6:6 + audio_length]

        # Extract the frequencies
        offset = 6 + audio_length
        for idx in range(frequencies_length // 10):
            self._frequencies.append({
                'frequency': self._byte_array_to_double(byte_array[offset:offset + 8]),
                'modulation': byte_array[offset + 8],
                'encryption': byte_array[offset + 9]
            })
            offset += 10

        # Extract the remaining data
        self._unit_id = self._byte_array_to_integer(byte_array[offset:offset + 4])
        offset += 4
        self._packet_id = self._byte_array_to_integer(byte_array[offset:offset + 8])
        offset += 8
        self._hops = self._byte_array_to_integer(byte_array[offset:offset + 1])
        offset += 1
        self._transmission_guid = byte_array[offset:offset + 22].decode('utf-8', errors='ignore')
        offset += 22
        self._client_guid = byte_array[offset:offset + 22].decode('utf-8', errors='ignore')
        offset += 22
        

    def to_byte_array(self) -> Optional[bytes]:
        global packet_id
        
        # Perform some sanity checks
        if len(self._frequencies) == 0:
            print("Warning, could not encode audio packet, no frequencies data provided, aborting...")
            return None

        if self._audio_data is None:
            print("Warning, could not encode audio packet, no audio data provided, aborting...")
            return None

        if self._transmission_guid is None:
            print("Warning, could not encode audio packet, no transmission GUID provided, aborting...")
            return None

        if self._client_guid is None:
            print("Warning, could not encode audio packet, no client GUID provided, aborting...")
            return None

        # Prepare the array for the header
        header = [0, 0, 0, 0, 0, 0]

        # Encode the frequencies data
        frequencies_data = []
        for data in self._frequencies:
            frequencies_data.extend(self._double_to_byte_array(data['frequency']))
            frequencies_data.append(data['modulation'])
            frequencies_data.append(data['encryption'])

        # If necessary increase the packet_id
        if self._packet_id is None:
            self._packet_id = packet_id
            packet_id += 1

        # Encode unitID, packetID, hops
        enc_unit_id = self._integer_to_byte_array(self._unit_id, 4)
        enc_packet_id = self._integer_to_byte_array(self._packet_id, 8)
        enc_hops = [self._hops]

        # Assemble packet
        encoded_data = []
        encoded_data.extend(header)
        encoded_data.extend(list(self._audio_data))
        encoded_data.extend(frequencies_data)
        encoded_data.extend(enc_unit_id)
        encoded_data.extend(enc_packet_id)
        encoded_data.extend(enc_hops)
        encoded_data.extend(list(self._transmission_guid.encode('utf-8')))
        encoded_data.extend(list(self._client_guid.encode('utf-8')))

        # Set the lengths of the parts
        enc_packet_len = self._integer_to_byte_array(len(encoded_data), 2)
        encoded_data[0] = enc_packet_len[0]
        encoded_data[1] = enc_packet_len[1]

        enc_audio_len = self._integer_to_byte_array(len(self._audio_data), 2)
        encoded_data[2] = enc_audio_len[0]
        encoded_data[3] = enc_audio_len[1]

        frequency_audio_len = self._integer_to_byte_array(len(frequencies_data), 2)
        encoded_data[4] = frequency_audio_len[0]
        encoded_data[5] = frequency_audio_len[1]

        return bytes([0] + encoded_data)

    # Utility methods for byte array conversion
    def _byte_array_to_integer(self, byte_array: bytes) -> int:
        if len(byte_array) == 1:
            return struct.unpack('<B', byte_array)[0]
        elif len(byte_array) == 2:
            return struct.unpack('<H', byte_array)[0]
        elif len(byte_array) == 4:
            return struct.unpack('<I', byte_array)[0]
        elif len(byte_array) == 8:
            return struct.unpack('<Q', byte_array)[0]
        else:
            raise ValueError(f"Unsupported byte array length: {len(byte_array)}")

    def _byte_array_to_double(self, byte_array: bytes) -> float:
        return struct.unpack('<d', byte_array)[0]

    def _integer_to_byte_array(self, value: int, length: int) -> List[int]:
        if length == 1:
            return list(struct.pack('<B', value))
        elif length == 2:
            return list(struct.pack('<H', value))
        elif length == 4:
            return list(struct.pack('<I', value))
        elif length == 8:
            return list(struct.pack('<Q', value))
        else:
            raise ValueError(f"Unsupported length: {length}")

    def _double_to_byte_array(self, value: float) -> List[int]:
        return list(struct.pack('<d', value))

    # Getters and Setters
    def set_frequencies(self, frequencies: List[Dict[str, int]]):
        self._frequencies = frequencies

    def get_frequencies(self) -> List[Dict[str, int]]:
        return self._frequencies

    def set_audio_data(self, audio_data: bytes):
        self._audio_data = audio_data

    def get_audio_data(self) -> Optional[bytes]:
        return self._audio_data

    def set_transmission_guid(self, transmission_guid: str):
        self._transmission_guid = transmission_guid

    def get_transmission_guid(self) -> Optional[str]:
        return self._transmission_guid

    def set_client_guid(self, client_guid: str):
        self._client_guid = client_guid

    def get_client_guid(self) -> Optional[str]:
        return self._client_guid

    def set_unit_id(self, unit_id: int):
        self._unit_id = unit_id

    def get_unit_id(self) -> int:
        return self._unit_id

    def set_packet_id(self, packet_id: int):
        self._packet_id = packet_id

    def get_packet_id(self) -> Optional[int]:
        return self._packet_id

    def set_hops(self, hops: int):
        self._hops = hops

    def get_hops(self) -> int:
        return self._hops