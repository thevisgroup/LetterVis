python -m venv .env
source .env/bin/activate
pip install spacy
python -m spacy download en

pip install scispacy
pip install https://s3-us-west-2.amazonaws.com/ai2-s2-scispacy/releases/v0.2.4/en_core_sci_sm-0.2.4.tar.gz