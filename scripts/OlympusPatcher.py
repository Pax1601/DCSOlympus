import shutil
import sys

START_STRING = "-- Olympus START\n"
END_STRING = "-- Olympus END\n"
EXPORT_STRING = "local Olympuslfs=require('lfs');dofile(Olympuslfs.writedir()..'Scripts/OlympusExport.lua')\n"

def main(flag):
    if flag == "-i":
        try:
            with open("Export.lua", "r") as f:
                shutil.copyfile("Export.lua", "Export.lua.bak")
                lines = f.readlines()
                if START_STRING in lines:
                    return
        except FileNotFoundError:
            print('File does not exist')

        with open("Export.lua", "a") as f:
            f.writelines(["\n", START_STRING, EXPORT_STRING, END_STRING, "\n"])
    elif flag == "-u":
        try:
            with open("Export.lua", "r") as f:
                shutil.copyfile("Export.lua", "Export.lua.bak")
                lines = f.readlines()
        except FileNotFoundError:
            print('File does not exist')

        with open("Export.lua", "w") as f:
            block = False
            for line in lines:
                if line == START_STRING:
                    block = True
                
                if not block:
                    f.write(line)

                if line == END_STRING:
                    block = False
    
if __name__ == "__main__":
    main(sys.argv[1])
