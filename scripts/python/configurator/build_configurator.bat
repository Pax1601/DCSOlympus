python -m venv venv
call ./venv/Scripts/activate
pip install pyinstaller
pip install PySimpleGUI
python -m PyInstaller configurator.py --onefile --noconsole