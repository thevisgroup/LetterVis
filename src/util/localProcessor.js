/* eslint-disable no-unused-vars */
const dir = require("node-dir");
const fs = require("fs");
const pathLib = require("path");
const textract = require("textract");

const { processCore } = require("./preprocessor");

const { wordwrap } = require("../util/helper");

const wordToText = () => {
  dir.readFiles("private/word", { match: /\.docx/ }, (err, content, path, next) => {
    if (err) throw err;

    let res;

    textract.fromFileWithPath(path, { preserveLineBreaks: true }, function (error, text) {
      let result = "";

      text.split("\n").forEach((e) => {
        if (e.length > 100) {
          e = wordwrap(e, 100, "\n");
        }

        result += "\n" + e;
      });

      let file = pathLib.basename(path.toString()).split(".")[0];

      const dir = pathLib.join("private", "txt");
      file = pathLib.join(dir, file);

      if (!fs.existsSync(dir)) {
        fs.mkdirSync(dir);
      }

      // console.log(file.split("/")[file.split("/").length - 1].split("-")[1]);

      fs.writeFileSync(file + ".txt", result, { encoding: "utf8", flag: "w" });
      next();
    });
  });
};

const textToJson = () => {
  dir.readFiles("private/txt", { match: /\.txt$/ }, (err, content, path, next) => {
    if (err) throw err;

    let file = pathLib.basename(path.toString()).split(".")[0];
    console.log(file);

    const dir = pathLib.join("private", "json");
    file = pathLib.join(dir, file);

    if (!fs.existsSync(dir)) {
      fs.mkdirSync(dir);
    }
    const result = processCore({ title: file, text: content });

    fs.writeFileSync(file + ".json", JSON.stringify(result), { encoding: "utf8", flag: "w" });
    next();
  });
};

const generateSpacyJsonl = () => {
  let res = "";

  dir.readFiles(
    "private/original json",
    { match: /.json$/ },
    (err, content, path, next) => {
      if (err) throw err;
      content = JSON.parse(content);

      content.text.split("\n").forEach((l) => {
        if (l) {
          res += `{"text": "${l.trim()}"}\n`;
        }
      });

      next();
    },
    () => {
      const dir2 = pathLib.join("src", "util", "spacy");

      const file = pathLib.join(dir2, "prodigy.jsonl");

      const stream = fs.createWriteStream(file, { flags: "w" });

      stream.write(res);
    }
  );
};

// wordToText();
textToJson();
