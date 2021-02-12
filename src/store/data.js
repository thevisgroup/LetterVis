const Color = require("color");
const d3 = require("d3");
// const scheme = d3.interpolateRainbow;
// const scheme = d3.interpolateSinebow;
// const scheme = d3.interpolateSpectral;
const scheme = d3.interpolateRdYlBu;

const categoryType = [
  "PHONE",
  "POSTCODE",
  "HOSPITAL",
  "DOB",
  "AGE",
  "DATE",
  "OTHER",
  "TIME",
  "DOSAGE",
  "FREQUENCY",
  "MEASUREMENT",
  "DRUG",
];

const drugList = {
  acetazolamide: ["0", "acetazolamide", "#313695"],
  carbamazepine: ["17", "carbamazepine", "#FDB76C"],
  tegretol: ["17", "carbamazepine", "#FDB76C"],
  "tegretol pr": ["17", "carbamazepine", "#FDB76C"],
  "tegretol retard": ["17", "carbamazepine", "#FDB76C"],
  clobazam: ["2", "clobazam", "#4368AE"],
  frisium: ["2", "clobazam", "#4368AE"],
  perizam: ["2", "clobazam", "#4368AE"],
  clonazepam: ["3", "clonazepam", "#5180BA"],
  "eslicarbazepine acetate": ["4", "eslicarbazepine acetate", "#6296C5"],
  zebinix: ["4", "eslicarbazepine acetate", "#6296C5"],
  ethosuximide: ["9", "ethosuximide", "#CAE8EF"],
  zarontin: ["9", "ethosuximide", "#CAE8EF"],
  gabapentin: ["6", "gabapentin", "#8ABEDA"],
  neurontin: ["6", "gabapentin", "#8ABEDA"],
  lacosamide: ["7", "lacosamide", "#A0CFE3"],
  vimpat: ["7", "lacosamide", "#A0CFE3"],
  lamotrigine: ["21", "lamotrigine", "#E75538"],
  lamictal: ["21", "lamotrigine", "#E75538"],
  levetiracetam: ["5", "levetiracetam", "#75ABD0"],
  keppra: ["5", "levetiracetam", "#75ABD0"],
  desitrend: ["5", "levetiracetam", "#75ABD0"],
  nitrazepam: ["10", "nitrazepam", "#DCF1EC"],
  oxcarbazepine: ["11", "oxcarbazepine", "#EBF7DF"],
  trileptal: ["11", "oxcarbazepine", "#EBF7DF"],
  perampanel: ["12", "perampanel", "#F6F9CB"],
  fycompa: ["12", "perampanel", "#F6F9CB"],
  phenobarbital: ["13", "phenobarbital", "#FCF5B6"],
  phenytoin: ["14", "phenytoin", "#FEEBA3"],
  epanutin: ["14", "phenytoin", "#FEEBA3"],
  piracetam: ["15", "piracetam", "#FEDD90"],
  pregabalin: ["16", "pregabalin", "#FECB7D"],
  primidone: ["1", "primidone", "#394FA1"],
  retigabine: ["18", "retigabine", "#FAA05C"],
  rufinamide: ["19", "rufinamide", "#F7874F"],
  inovelon: ["19", "rufinamide", "#F7874F"],
  "sodium valproate": ["20", "sodium valproate", "#F16E43"],
  epilim: ["20", "sodium valproate", "#F16E43"],
  "epilim chrono": ["20", "sodium valproate", "#F16E43"],
  episenta: ["20", "sodium valproate", "#F16E43"],
  "valproic acid": ["20", "sodium valproate", "#F16E43"],
  stiripentol: ["8", "stiripentol", "#B5DDEB"],
  tiagabine: ["22", "tiagabine", "#DB3D2F"],
  gabitril: ["22", "tiagabine", "#DB3D2F"],
  topiramate: ["23", "topiramate", "#CB2829"],
  topamax: ["23", "topiramate", "#CB2829"],
  vigabatrin: ["24", "vigabatrin", "#B91327"],
  sabril: ["24", "vigabatrin", "#B91327"],
  zonisamide: ["25", "zonisamide", "#A50026"],
  zonegran: ["25", "zonisamide", "#A50026"],
};

const drugTradeNameList = {
  acetazolamide: ["acetazolamide"],
  carbamazepine: ["carbamazepine", "tegretol", "tegretol pr", "tegretol retard"],
  clobazam: ["clobazam", "frisium", "perizam"],
  clonazepam: ["clonazepam"],
  "eslicarbazepine acetate": ["eslicarbazepine acetate", "zebinix"],
  ethosuximide: ["ethosuximide", "zarontin"],
  gabapentin: ["gabapentin", "neurontin"],
  lacosamide: ["lacosamide", "vimpat"],
  lamotrigine: ["lamotrigine", "lamictal"],
  levetiracetam: ["levetiracetam", "keppra", "desitrend"],
  nitrazepam: ["nitrazepam"],
  oxcarbazepine: ["oxcarbazepine", "trileptal"],
  perampanel: ["perampanel", "fycompa"],
  phenobarbital: ["phenobarbital"],
  phenytoin: ["phenytoin", "epanutin"],
  piracetam: ["piracetam"],
  pregabalin: ["pregabalin"],
  primidone: ["primidone"],
  retigabine: ["retigabine"],
  rufinamide: ["rufinamide", "inovelon"],
  "sodium valproate": ["sodium valproate", "epilim", "epilim chrono", "episenta", "valproic acid"],
  stiripentol: ["stiripentol"],
  tiagabine: ["tiagabine", "gabitril"],
  topiramate: ["topiramate", "topamax"],
  vigabatrin: ["vigabatrin", "sabril"],
  zonisamide: ["zonisamide", "zonegran"],
};

const getGenericDrugName = (name) => drugList[name][1];

// for (let drug in drugList) {
//   let a = drugList[drug];
//   a[2] = Color(scheme(1 - a[0] / 25)).hex();
// }

// console.log(drugList);

const regexPatterns = {
  DOB: {
    type: "DOB",
    // eslint-disable-next-line no-useless-escape
    regexp: /(?:d\.o\.b|(?:dob)|(?:date of birth))[:\.]? {0,}\t?\d{1,2}[\\\/ \.]{1}\d{1,2}[\/ \.]{1}\d{2,4}/gi,
  },
  MEASUREMENT: {
    type: "MEASUREMENT",
    regexp: /\d+.?\d+ ?(?:kg|cm)s?/gi,
  },
  DATE: {
    type: "DATE",
    // eslint-disable-next-line no-useless-escape
    regexp: /(?:(?:(?:\d{1,2})(?:st|nd|rd|th))? ?\b(?:Jan(?:uary)?|Feb(?:ruary)?|Mar(?:ch)?|Apr(?:il)?|May|Jun(?:e)?|Jul(?:y)?|Aug(?:ust)?|Sep(?:tember)?|Oct(?:ober)?|(?:Nov|Dec)(?:ember)? )\b(?:<=,)? ?\d{0,4}(?:(?!<))|(?:\d{1,2}[\/\.]\d{1,2}[\/\.]\d{4}))(?:(?!<))/gi,
  },
  POSTCODE: {
    type: "POSTCODE",
    regexp: /[A-Z]{1,2}\d[A-Z\d]? {0,}\d{1,2}[A-Z]{2}/gi,
  },
  AGE: {
    type: "AGE",
    regexp: /(?:\d+ ?½?-? ?years?-? ?old)|(?:age of \d{0,}½?)/gi,
  },
  PHONE: {
    type: "PHONE",
    regexp: /(?:tel:)?\t? {0,}(?:(?:(?:\+44\s?\d{4}|\(?:?0\d{4}\)?)\s?\d{3}\s?\d{3})|(?:(?:\+44\s?\d{3}|\(?:?0\d{3}\)?)\s?\d{3}\s?\d{4})|(?:(?:\+44\s?\d{2}|\(?:?0\d{2}\)?)\s?\d{4}\s?\d{4}))(?:\s?(?:\d{4}|\d{3}))?/gi,
  },
  HOSPITAL: {
    type: "HOSPITAL",
    // eslint-disable-next-line no-useless-escape
    regexp: /hospital n(?:o|umber)[\.:]? ?\t? ?\w?\d+/gi,
  },
  NHS: {
    type: "HOSPITAL",
    // eslint-disable-next-line no-useless-escape
    regexp: /nhs n(?:o|umber)[\.:]? \d{3} ?\d{3} ?\d{4}/gi,
  },
  DOSAGE: {
    type: "DOSAGE",
    regexp: /(?:\d+\.?\d{0,4}? ?(?:mg|g)s?(?: ?-? ?\d+ ?(?:mg|g)s?)?)\b/gi,
  },
  TIME: {
    type: "TIME",
    regexp: /(?:(?:\d{1,}\.?:?)?\d{1,}[ap]m|(?:(?:\d{0,} ?½? ?(?:-|to|in|from) ?)?\d{1,} ?½? ?(?:second|minute|hour|day|week|month|year)s?)(?:(?!(?: {0,}old)))|(?:morning|noon|night)|(?:(?:in|last) ?\d{1,2} ?(?:year)?s)|(?:(?:in) ?\d{4} ?(?:year)?))/gi,
  },
  FREQUENCY: {
    type: "FREQUENCY",
    regexp: /(?:every|once|twice)?-? ?(?:\d{0,} ?(?:-|to)? ?)?\d{0,}? ?(?:\w+)? ?(?:per|a)-? ?(?:second|minute|hour|day|week|month)s?/gi,
  },
  DRUG: {
    type: "DRUG",
    regexp: /(?:Acetazolamide|Carbamazepine|Clobazam|Clonazepam|Eslicarbazepine Acetate|Ethosuximide|Gabapentin|Lacosamide|Lamotrigine|Levetiracetam|Nitrazepam|Oxcarbazepine|Perampanel|Phenobarbital|Phenytoin|Piracetam|Pregabalin|Primidone|Retigabine|Rufinamide|Sodium Valproate|Valproic Acid|Stiripentol|Tiagabine|Topiramate|Vigabatrin|Zonisamide|(?:Tegretol(?: PR)?(?: Retard)?)|Frisium|Perizam|Zebinix|Zarontin|Neurontin|Vimpat|Lamictal|Keppra|Desitrend|Trileptal|Fycompa|Epanutin|Inovelon|(?:Epilim(?: Chrono)?)|Episenta|Gabitril|Topamax|Sabril|Zonegran)/gi,
  },
  GENDER: {
    female: /\b(?:she|hers?)\b/gi,
    male: /\b(?:he|him|his)\b/gi,
  },
  OTHER: {
    type: "OTHER",
    regexp: /[0-9]*\.?[0-9]+/g,
  },
};

// eslint-disable-next-line no-unused-vars
const colorScheme = [
  "#68b0fc",
  "#265581",
  "#55af79",
  "#30693c",
  "#aee64f",
  "#ff9149",
  "#e4ad82",
  "#922d18",
  "#f85e17",
  "#29f385",
  "#81174c",
  "#f07796",
  "#ff0085",
  "#e9d737",
];

const colorLegend = () => {
  let res = {
    POSTCODE: { type: "original", color: "#68b0fc" },
    PHONE: { type: "original", color: "#265581" },
    HOSPITAL: { type: "original", color: "#55af79" },
    DOSAGE: { type: "original", color: "#30693c" },
    DATE: { type: "original", color: "#aee64f" },
    TIME: { type: "original", color: "#ff9149" },
    AGE: { type: "original", color: "#e4ad82" },
    MEASUREMENT: { type: "original", color: "#922d18" },
    DOB: { type: "original", color: "#f85e17" },
    FREQUENCY: { type: "original", color: "#29f385" },
    OTHER: { type: "original", color: "#81174c" },
    DRUG: { type: "original", color: "#f07796" },
  };

  for (let drug in drugList) {
    res[drug] = { type: "original", color: drugList[drug][2] };
  }

  return res;
};

// eslint-disable-next-line no-unused-vars
const generateCSS = () => {
  let css = "";
  const legend = colorLegend();
  for (const c in legend) {
    const bg = legend[c].color;
    const font = Color(bg).isDark() ? "#FFFFFF" : "#000000";

    css += `
    .badge-pill[pattern="${c}"] {
      color: ${font};
      background-color: ${bg};
    }
    `;
  }
  console.log(css);
};

// generateCSS();

module.exports = {
  categoryType,
  drugList,
  drugTradeNameList,
  getGenericDrugName,
  regexPatterns,
  colorLegend,
  scheme,
};
