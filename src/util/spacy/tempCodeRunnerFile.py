# source .env/bin/activate
import spacy

import scispacy

from scispacy.umls_linking import UmlsEntityLinker

import os.path
from spacy.matcher import Matcher
from spacy import displacy
from spacy.tokens import Span
from spacy.pipeline import EntityRuler

nlp = spacy.load("en_core_sci_sm")

linker = UmlsEntityLinker(resolve_abbreviations=True)

nlp.add_pipe(linker)

path = os.path.dirname(__file__) + ("../../../private/result/letter-1.txt")

f = open(path, "r")

# # for token in doc:
# #     print(token.text, token.lemma_, token.pos_, token.tag_, token.dep_,
# #           token.shape_, token.is_alpha, token.is_stop)

# # # finding date
# # for ent in doc.ents:
# #     if ent.label_ == 'DATE':
# #         print(ent.text)

# ruler = EntityRuler(nlp, overwrite_ents=True)

# patterns = []
# patterns.append({"label": "Hospital Number", "pattern": [{"LOWER": "hospital"}, {
#                 "LOWER": "no"}, {"ORTH": ".", "OP": "?"}, {}, {"is_digit": True}]})

# patterns.append({"label": "Date", "pattern": [{"SHAPE": "dd/dd/dddd"}]})

# # NHS number
# patterns.append({"label": "NHS Number", "pattern": [{"LOWER": "nhs"}, {
#                 "LOWER": "no"}, {"ORTH": "."}, {"SHAPE": "ddd"}, {"SHAPE": "ddd"}, {"SHAPE": "dddd"}]})

# # Case for DOB: 21.12.1991
# patterns.append({"label": "DOB", "pattern": [{"LOWER": "dob"}, {
#     "IS_PUNCT": True}, {"OP": "?"}, {"SHAPE": "dd.dd.dddd"}]})

# # Case for D.O.B: 21/12/1991
# patterns.append({"label": "DOB", "pattern": [{"LOWER": "d.o.b"}, {
#     "ORTH": ":"}, {"OP": "?"}]})

# # UK POSTCODE patterns
# # AA9A 9AA
# # A9A 9AA
# # A9 9AA
# # A99 9AA
# # AA9 9AA
# # AA99 9AA
# patterns.append({"label": "POSTCODE", "pattern": [
#                 {"SHAPE": "XXdd"}, {"SHAPE": "dXX"}]})
# patterns.append({"label": "POSTCODE", "pattern": [
#                 {"SHAPE": "XdX"}, {"SHAPE": "dXX"}]})
# patterns.append({"label": "POSTCODE", "pattern": [
#                 {"SHAPE": "Xd"}, {"SHAPE": "dXX"}]})
# patterns.append({"label": "POSTCODE", "pattern": [
#                 {"SHAPE": "XXd"}, {"SHAPE": "dXX"}]})
# patterns.append({"label": "POSTCODE", "pattern": [
#                 {"SHAPE": "XXdX"}, {"SHAPE": "dXX"}]})

# # AGE
# patterns.append({"label": "AGE", "pattern": [
#                 {"LOWER": "age"}, {"IS_DIGIT": True}]})
# patterns.append({"label": "AGE", "pattern": [
#                 {"IS_DIGIT": True}, {"LOWER": "years old"}]})

# # patterns.append({"label": "ADDRESS", "pattern": [
# #                 {"ent_type": "CARDINAL"}, {
# #                     "IS_PUNCT": True}, {"ent_type": "GPE"}, {
# #                     "IS_SPACE": True, "OP": "?"}, {
# #                     "ent_type": "GPE", "OP": "?"}, {
# #                     "IS_PUNCT": True, "OP": "?"}, {"ent_type": "GPE"}, {
# #                     "IS_SPACE": True, "OP": "?"}, {
# #                     "ent_type": "GPE", "OP": "?"}, {
# #                     "IS_PUNCT": True, "OP": "?"}, {"ent_type": "GPE"}]})


# # patterns.append({"label": "ADDRESS", "pattern": [
# #                 {"ent_type": "CARDINAL"}, {"ORTH": ","}, {"ent_type": "GPE"}]})

# # patterns.append({"label": "ADDRESS2", "pattern": [
# #                 {"SHAPE": "dd"}, {"ORTH": ","}, {"IS_SPACE": True}, {"ent_type": "GPE"}]})

# # patterns.append({"label": "ADDRESS2", "pattern": [
# #                 {"ent_type": "GPE"}, {"OP": "+"}, {"ent_type": "POSTCODE"}]})

# # UK phone number
# patterns.append({"label": "PHONE EXT", "pattern": [
#                 {"LOWER": "ext"}, {"ORTH": ":", "OP": "?"},  {"IS_DIGIT": True, "LENGTH": 4}]})

# patterns.append({"label": "PHONE", "pattern": [
#                 {"IS_DIGIT": True, "LENGTH": 5}, {"IS_DIGIT": True, "LENGTH": 6}]})

# ruler.add_patterns(patterns)
# nlp.add_pipe(ruler, after='ner')
doc = nlp(f.read())


# for ent in doc.ents:
#     # Check if the token resembles a number
#     if ent.label_ == 'CARDINAL':
#         # Get the next token in the document
#         next_token = doc.ents[i + 1]
#         # Check if the next token's text equals '%'
#         if next_token.label_ == 'GPE':
#             next_token = doc.ents[i + 2]
#             if next_token.label_ == 'GPE':
#                 next_token = doc.ents[i + 3]
#                 if next_token.label_ == 'GPE':
#                     next_token = doc.ents[i + 4]
#                     if next_token.label_ == 'POSTCODE':
#                         print(next_token)

entity = doc.ents[1]

for umls_ent in entity._.umls_ents:
    print(linker.umls.cui_to_entity[umls_ent[0]])

displacy.serve(doc, style="ent")
