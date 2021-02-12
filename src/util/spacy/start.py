# source .env/bin/activate
# prodigy textcat.manual test ./prodigy.jsonl --label 'DRUG,AGE,DOB,POSTCODE,DATE'

import spacy

import scispacy

from scispacy.umls_linking import UmlsEntityLinker

import os.path
from spacy.matcher import Matcher
from spacy import displacy
from spacy.tokens import Span
from spacy.pipeline import EntityRuler

import random

nlp = spacy.load('en_core_web_sm')

# linker = UmlsEntityLinker(resolve_abbreviations=True)

# nlp.add_pipe(linker)

# nlp = spacy.load('en_core_web_sm')

THIS_FOLDER = os.path.dirname(os.path.abspath(__file__))
path = os.path.join(THIS_FOLDER, '../../../private/result/letter-1.txt')

f = open(path, 'r')

# # for token in doc:
# #     print(token.text, token.lemma_, token.pos_, token.tag_, token.dep_,
# #           token.shape_, token.is_alpha, token.is_stop)

# # # finding date
# # for ent in doc.ents:
# #     if ent.label_ == 'DATE':
# #         print(ent.text)

ruler = EntityRuler(nlp, overwrite_ents=True)

patterns = []

# Hospital Number

patterns.append({'label': 'HOSPITAL', 'pattern': [
    {'LOWER': 'hospital'},
    {'LOWER': 'no'},
    {'IS_PUNCT': True},
    {'IS_SPACE': True, 'OP': '?'},
    {'IS_DIGIT': True}]})

# Date

patterns.append({'label': 'DATE', 'pattern': [
    {'SHAPE': 'dd/dd/dddd'}]})

# NHS number

patterns.append({'label': 'NHS', 'pattern': [
    {'LOWER': 'nhs'},
    {'LOWER': 'no'},
    {'ORTH': '.'},
    {'SHAPE': 'ddd'},
    {'SHAPE': 'ddd'},
    {'SHAPE': 'dddd'}]})

# Case for DOB: 21.12.1991

patterns.append({'label': 'DOB', 'pattern': [
    {'LOWER': 'dob', 'OP': '?'},
    {'LOWER': 'd.o.b', 'OP': '?'},
    {'IS_PUNCT': True, 'OP': '?'},
    {'SHAPE': 'dd.dd.dddd', 'OP': '?'},
    {'SHAPE': 'dd/dd/dddd', 'OP': '?'}]})

# UK POSTCODE patterns
# AA9A 9AA
# A9A 9AA
# A9 9AA
# A99 9AA
# AA9 9AA
# AA99 9AA

patterns.append({'label': 'POSTCODE', 'pattern': [
                {'SHAPE': 'XXdd'},
                {'SHAPE': 'dXX'}]})

patterns.append({'label': 'POSTCODE', 'pattern': [
                {'SHAPE': 'XdX'},
                {'SHAPE': 'dXX'}]})

patterns.append({'label': 'POSTCODE', 'pattern': [
                {'SHAPE': 'Xd'},
                {'SHAPE': 'dXX'}]})

patterns.append({'label': 'POSTCODE', 'pattern': [
                {'SHAPE': 'XXd'},
                {'SHAPE': 'dXX'}]})

patterns.append({'label': 'POSTCODE', 'pattern': [
                {'SHAPE': 'XXdX'},
                {'SHAPE': 'dXX'}]})

# AGE

patterns.append({'label': 'AGE', 'pattern': [
                {'LOWER': 'age'},
                {'IS_DIGIT': True}]})

patterns.append({'label': 'AGE', 'pattern': [
                {'IS_DIGIT': True},
                {'LOWER': 'years old'}]})

# ADDRESS

patterns.append({'label': 'ADDRESS', 'pattern': [
                {'ent_type': 'CARDINAL'},
                {'IS_PUNCT': True}, {'ent_type': 'GPE'},
                {'IS_SPACE': True, 'OP': '?'},
                {'ent_type': 'GPE', 'OP': '?'},
                {'IS_PUNCT': True, 'OP': '?'},
                {'ent_type': 'GPE'},
                {'IS_SPACE': True, 'OP': '?'},
                {'ent_type': 'GPE', 'OP': '?'},
                {'IS_PUNCT': True, 'OP': '?'},
                {'ent_type': 'GPE'}]})

patterns.append({'label': 'ADDRESS', 'pattern': [
                {'ent_type': 'CARDINAL'},
                {'ORTH': ','},
                {'ent_type': 'GPE'}]})

patterns.append({'label': 'ADDRESS', 'pattern': [
                {'SHAPE': 'dd'},
                {'ORTH': ','},
                {'IS_SPACE': True},
                {'ent_type': 'GPE'}]})

patterns.append({'label': 'ADDRESS', 'pattern': [
                {'ent_type': 'GPE'},
                {'OP': '+'},
                {'ent_type': 'POSTCODE'}]})

# UK phone number

patterns.append({'label': 'PHONE', 'pattern': [
                {'LOWER': 'ext'},
                {'ORTH': ':', 'OP': '?'},
                {'IS_DIGIT': True, 'LENGTH': 4}]})

patterns.append({'label': 'PHONE', 'pattern': [
                {'IS_DIGIT': True, 'LENGTH': 5},
                {'IS_DIGIT': True, 'LENGTH': 6}]})

# dosage

patterns.append({'label': 'DOSAGE', 'pattern': [
                {"TEXT": {"REGEX": "([0-9]{1,4})"}},
                {'ORTH': '-'},
                {"TEXT": {"REGEX": "([0-9]{1,4})(mgs)"}}]})


ruler.add_patterns(patterns)
nlp.add_pipe(ruler, after='ner')
# doc = nlp(f.read())
doc = nlp("Hospital No.	 127682 \n Diagnosis: 1. Intractable symptomatic epilepsy \nHospital No. 4017777\n presenting with complex partial seizures with secondary generalised tonic clonic seizures d.o.b: 12/12/2019")

ents = set()

for entity in doc.ents:
    ents.add(entity.label_)
#     for umls_ent in entity._.umls_ents:
#         print(linker.umls.cui_to_entity[umls_ent[0]])

ents = list(ents)
colors = {}

for e in ents:
    colors[e] = '#'+''.join([random.choice('0123456789ABCDEF')
                             for j in range(6)])

# ents.append('ENTITY')
# colors['ENTITY'] = '#FDD'

displacy.serve(doc, style='ent', options={
               'ents': ents, 'colors': colors})
