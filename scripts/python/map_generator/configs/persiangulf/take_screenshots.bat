cd ../..

call .venv/scripts/activate

python main.py ./configs/persiangulf/boundary.yaml -r -o -w 0.2
python main.py ./configs/persiangulf/lowresolution.yaml -r -o -w 0.2
python main.py ./configs/persiangulf/mediumresolution.yaml -r -o -w 0.2
python main.py ./configs/persiangulf/highresolution.yaml -r -o -w 0.2