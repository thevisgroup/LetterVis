const Color = require("color");
const lucene = require("lucene");
const escapeRegExp = require("lodash/escapeRegExp");
const { categoryType, drugList } = require("../store/data");

const isCategory = (text) => categoryType.includes(text);

const parseQuery = (query) => {
  const res = lucene.parse(query.trim());

  let stack = [];
  let parenthesized = false;
  const recursive = (node, closeParenthesis = false) => {
    if (node.left !== undefined) {
      if (node.parenthesized !== undefined) {
        parenthesized = true;

        stack.push({ type: "sign", text: "(" });
      }
      recursive(node.left, false);

      if (node.operator !== undefined) {
        stack.push({ type: "operator", text: node.operator });
      }

      if (node.right !== undefined) {
        recursive(node.right, parenthesized);
      }
    } else {
      stack.push({ type: "text", text: node.term });
      if (closeParenthesis) {
        stack.push({ type: "sign", text: ")" });
        parenthesized = false;
      }
    }
  };

  recursive(res);

  let result = [];

  // first loop to combine implicit operators
  for (let index = 0; index < stack.length; index++) {
    const s = stack[index];
    if (s.type === "operator") {
      if (s.text === "<implicit>") {
        // if there is a space connecting two words
        let combine = result.pop().text + " " + stack[index + 1].text;
        result.push({ type: "text", text: combine });
        stack.splice(index, 1);
        continue;
      } else {
        result[result.length - 1].operator = s.text;
        if (s.text === "AND") {
          s.text = " && ";
        } else if (s.text === "OR") {
          s.text = " || ";
        } else if (s.text === "NOT") {
          s.text = " && !";
        }
      }
    }

    result.push({ type: s.type, text: s.text });
  }

  return result;
};

const generateQuerystack = (parsedQuery) => {
  let queryStack = parsedQuery
    .filter((r) => r.type === "text")
    .map((r) => ({ text: escapeRegExp(r.text), operator: r.operator }));

  return queryStack;
};

const wordwrap = (str, width, join) => {
  let regex = ".{1," + width + "}(\\s|$)|.{" + width + "}|.+$";

  return str.match(RegExp(regex, "g")).join(join);
};

const getRandomColor = () => {
  return "#" + Math.random().toString(16).substr(2, 6);
};

const greyscaleColor = (c) => Color(c).grayscale().hex();

const generateDrugLegend = () => {
  let res = [];

  for (let drug in drugList) {
    let c = drugList[drug];
    if (!res[c[0]]) {
      res[c[0]] = { name: `<b>${c[1]}</b><br>`, color: c[2] };
    } else {
      res[c[0]].name += `${drug}<br>`;
    }
  }

  return res
    .map(
      (d) =>
        `<li><span style="background: ${d.color}"></span><div class="tooltip">${d.name}</div></li>`
    )
    .join("");
};

module.exports = {
  isCategory,
  parseQuery,
  generateQuerystack,
  wordwrap,
  getRandomColor,
  greyscaleColor,
  generateDrugLegend,
};
