import struct
from typing import List
from data_types import LatLng, TACAN, Radio, GeneralSettings, Ammo, Contact, Offset

class DataExtractor:
    def __init__(self, buffer: bytes):
        self._seek_position = 0
        self._buffer = buffer
        self._length = len(buffer)
    
    def set_seek_position(self, seek_position: int):
        self._seek_position = seek_position
    
    def get_seek_position(self) -> int:
        return self._seek_position
    
    def extract_bool(self) -> bool:
        value = struct.unpack_from('<B', self._buffer, self._seek_position)[0]
        self._seek_position += 1
        return value > 0
    
    def extract_uint8(self) -> int:
        value = struct.unpack_from('<B', self._buffer, self._seek_position)[0]
        self._seek_position += 1
        return value
    
    def extract_uint16(self) -> int:
        value = struct.unpack_from('<H', self._buffer, self._seek_position)[0]
        self._seek_position += 2
        return value
    
    def extract_uint32(self) -> int:
        value = struct.unpack_from('<I', self._buffer, self._seek_position)[0]
        self._seek_position += 4
        return value
    
    def extract_uint64(self) -> int:
        value = struct.unpack_from('<Q', self._buffer, self._seek_position)[0]
        self._seek_position += 8
        return value
    
    def extract_float64(self) -> float:
        value = struct.unpack_from('<d', self._buffer, self._seek_position)[0]
        self._seek_position += 8
        return value
    
    def extract_lat_lng(self) -> LatLng:
        lat = self.extract_float64()
        lng = self.extract_float64()
        alt = self.extract_float64()
        return LatLng(lat, lng, alt)
    
    def extract_from_bitmask(self, bitmask: int, position: int) -> bool:
        return ((bitmask >> position) & 1) > 0
    
    def extract_string(self, length: int = None) -> str:
        if length is None:
            length = self.extract_uint16()
        
        string_buffer = self._buffer[self._seek_position:self._seek_position + length]
        
        # Find null terminator
        string_length = length
        for idx, byte_val in enumerate(string_buffer):
            if byte_val == 0:
                string_length = idx
                break
        
        try:
            value = string_buffer[:string_length].decode('utf-8').strip()
        except UnicodeDecodeError:
            value = string_buffer[:string_length].decode('utf-8', errors='ignore').strip()
        
        self._seek_position += length
        return value
    
    def extract_char(self) -> str:
        return self.extract_string(1)
    
    def extract_tacan(self) -> TACAN:
        return TACAN(
            is_on=self.extract_bool(),
            channel=self.extract_uint8(),
            xy=self.extract_char(),
            callsign=self.extract_string(4)
        )
    
    def extract_radio(self) -> Radio:
        return Radio(
            frequency=self.extract_uint32(),
            callsign=self.extract_uint8(),
            callsign_number=self.extract_uint8()
        )
    
    def extract_general_settings(self) -> GeneralSettings:
        return GeneralSettings(
            prohibit_jettison=self.extract_bool(),
            prohibit_aa=self.extract_bool(),
            prohibit_ag=self.extract_bool(),
            prohibit_afterburner=self.extract_bool(),
            prohibit_air_wpn=self.extract_bool()
        )
    
    def extract_ammo(self) -> List[Ammo]:
        value = []
        size = self.extract_uint16()
        for _ in range(size):
            value.append(Ammo(
                quantity=self.extract_uint16(),
                name=self.extract_string(33),
                guidance=self.extract_uint8(),
                category=self.extract_uint8(),
                missile_category=self.extract_uint8()
            ))
        return value
    
    def extract_contacts(self) -> List[Contact]:
        value = []
        size = self.extract_uint16()
        for _ in range(size):
            value.append(Contact(
                id=self.extract_uint32(),
                detection_method=self.extract_uint8()
            ))
        return value
    
    def extract_active_path(self) -> List[LatLng]:
        value = []
        size = self.extract_uint16()
        for _ in range(size):
            value.append(self.extract_lat_lng())
        return value
    
    def extract_offset(self) -> Offset:
        return Offset(
            x=self.extract_float64(),
            y=self.extract_float64(),
            z=self.extract_float64()
        )