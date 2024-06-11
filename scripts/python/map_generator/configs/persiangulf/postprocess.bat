cd ../..

call .venv/scripts/activate

python main.py ./configs/persiangulf/boundary.yaml -s
python main.py ./configs/persiangulf/lowresolution.yaml -s -l 11
python main.py ./configs/persiangulf/mediumresolution.yaml -s -l 13
python main.py ./configs/persiangulf/highresolution.yaml -s -l 15

