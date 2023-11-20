python -m venv venv
call ./venv/Scripts/activate
pip install pyinstaller
python -m PyInstaller configurator.py --onefile