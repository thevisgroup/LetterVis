const moment = require("moment");
const Color = require("color");

const escapeRegExp = require("lodash/escapeRegExp");

const {
  isCategory,
  parseQuery,
  generateQuerystack,
  wordwrap,
  getRandomColor,
} = require("../util/helper");

const DATA = require("./../store/data");

// "other" between 1970 and 2020, tag it as "date"
const checkSpecialYear = (match) => {
  if (match.length == 4) {
    const m = parseInt(match);
    if (!isNaN(m) && m >= 1970 && m <= 2020) {
      return "DATE";
    }
  }
  return "OTHER";
};

const checkDrugList = (match) => {
  match = match.toLowerCase();
  return Object.keys(DATA.drugList).includes(match) ? DATA.getGenericDrugName(match) : -1;
};

const calRealPosition = (leftPart) => {
  const spanLength = leftPart.match(/(?=<span).*(?<=<\/span>)/g).join("").length;
  return leftPart.length - spanLength;
};

const processCore = (file, options = {}) => {
  let title;

  let {
    _searchTerm = null,
    _stopWhenFound = false,
    _isQueryStack = false,
    _returnFocusViewOnly = false,
    _colorScheme = {},
  } = options;

  if (_searchTerm) {
    title = file.title;
  }
  title = file.title.split("/").pop().replace(".txt", "").replace(".", "");

  let thumbnailArray = [];
  let drugChain = [];
  let centroids = {};
  let gender = { male: 0, female: 0 };
  let maxLength = 0;
  let firstDate = 0;
  let dob = 0;
  let age = "N/A";

  const focusOpts = {
    results: [],
    // number of lines between two lines with numbers
    //    today is 4th July
    //    the weather is nice             < gap 1
    //    it's raining cats and dogs      < gap 2
    //    let's go for a 5 minutes walk
    gap: 0,
    text: "",
  };

  let content = "";
  file.text.split("\n").forEach((e) => {
    if (e.length > 100) {
      e = wordwrap(e, 100, "\n");
    }

    content += "\n" + e;
  });

  content = content.split("\n");

  const documentLineCount = content.length;

  for (let index = 0; index < content.length; index++) {
    let line = content[index];
    let lineNo = index;
    lineNo += 1;
    const currentLineNo = documentLineCount - lineNo;

    const originalLine = line;
    let patterns = DATA.regexPatterns;

    let focusCurrent = {
      lineNo,
      hasMatch: false,
    };

    const pushIntoThumbnailArray = (type, match, index, pattern = false) => {
      const { isCategory, isDrug, category } = checkCategory(type);

      const checkDrug = checkDrugList(type);

      if (isDrug) {
        type = category;
      }

      // special case for Chain View
      if (checkDrug !== -1) {
        drugChain.push({ type, x: index, y: currentLineNo });
      }

      if (!isCategory) {
        type = type === type.toUpperCase() ? type : type.toLowerCase();
      }

      // reset gap count
      focusOpts.gap = 0;
      // current line has number
      focusCurrent.hasMatch = true;

      thumbnailArray.push({
        text: line,
        type,
        number: match,
        title,
        length: match.length,
        y: currentLineNo,
        x: index,
        lineNo,
      });

      const child = {
        x: index,
        y: currentLineNo,
        count: 1,
        type,
        title,
      };

      // special case for drug, the real match is needed for Matrix View
      if (type === "DRUG") {
        child.drug = match.toLowerCase();
        // special case for Chain View
        drugChain.push({
          type: DATA.getGenericDrugName(match.toLowerCase()),
          x: index,
          y: currentLineNo,
        });
      }

      if (centroids[type]) {
        centroids[type].x += index;
        centroids[type].y += currentLineNo;
        centroids[type].count += 1;
        centroids[type].children.push(child);
      } else {
        centroids[type] = {
          type,
          id: Object.keys(centroids).length,
          x: index,
          y: currentLineNo,
          operator: pattern ? pattern.operator : null,
          isCategory,
          count: 1,
          children: [child],
        };
        if (_isQueryStack) {
          centroids[type].id = _searchTerm
            .map((item) => {
              return pattern.isCategory ? item.text : item.text.toLowerCase();
            })
            .indexOf(type);
        }
        if (pattern && !pattern.isCategory) {
          centroids[type].color = _colorScheme[type].color;
        } else {
          centroids[type].color = DATA.colorLegend()[type].color;
        }
      }

      return { type, color: centroids[type].color };
    };

    // eslint-disable-next-line no-unused-vars
    const initColor = (term) => {
      if (!term.isCategory && !_colorScheme[term.category]) {
        const color = getRandomColor();
        _colorScheme[term.category] = {
          type: "search",
          color: color,
          colorStore: color,
        };
      }
    };

    let matchPattern;
    if (_searchTerm) {
      if (_isQueryStack) {
        matchPattern = _searchTerm.map((s) => {
          const check = checkCategory(s);
          initColor(check);
          return check;
        });
      } else {
        matchPattern = checkCategory(_searchTerm);
        initColor(matchPattern);
      }
      patterns = [matchPattern];
    } else {
      matchPattern = /[0-9]*\.?[0-9]+/g;
    }

    if (!_returnFocusViewOnly) {
      if (hasMatch(line, patterns)) {
        if (_stopWhenFound) {
          return true;
        }

        let lineLength = line.toString().length;
        maxLength = lineLength > maxLength ? lineLength : maxLength;

        const pushSearchLine = (type, match, position, pattern) => {
          const res = pushIntoThumbnailArray(type, match, position, pattern);

          const style = `color:${
            Color(res.color).isDark() ? "#FFFFFF" : "#000000"
          };background-color:${res.color}`;

          return `<span class="badge badge-pill pattern-badge" pattern="${res.type}" style="${style}" style-data="${style}">${match}</span>`;
        };

        const pushLine = (type, match, position) => {
          const res = pushIntoThumbnailArray(type, match, position);

          return `<span class="badge badge-pill pattern-badge" pattern="${res.type}">${match}</span>`;
        };

        // skip already matched sections in the line
        const skipExistingMatchInLine = (pattern, type) => {
          let regexp;

          // check for special case
          const checkAndPush = (match, position) => {
            if (!(type === "OTHER" && type !== checkSpecialYear(match))) {
              return _isQueryStack
                ? pushSearchLine(type, match, position, pattern)
                : pushLine(type, match, position);
            }
          };

          if (_isQueryStack) {
            regexp = pattern.regexp;
          } else {
            regexp = pattern;
          }

          // before first <span>
          line = line.replace(/.*?(?=<span class)/i, (match, index) => {
            return match.replace(regexp, (m, subIndex) => {
              return checkAndPush(m, index + subIndex);
            });
          });

          // between </span> and <span>
          line = line.replace(/(?<=<\/span>).*?(?=<span class)/gi, (match, index) => {
            if (match.includes("</span>")) {
              return match.replace(/(?<=<\/span>).*/gi, (m, index) => {
                return m.replace(regexp, (n, subIndex) => {
                  return checkAndPush(n, index + subIndex);
                });
              });
            } else {
              return match.replace(regexp, (m, subIndex) => {
                const realPosition = calRealPosition(line.substring(0, index + subIndex));
                return checkAndPush(m, realPosition);
              });
            }
          });

          // after last </span>
          line = line.replace(/(?<=<\/span>(?!.*<\/span>)).*?$/gi, (match, index) => {
            return match.replace(regexp, (m, subIndex) => {
              const realPosition = calRealPosition(line.substring(0, index + subIndex));
              return checkAndPush(m, realPosition);
            });
          });
        };

        // current line has no existing match of any type
        const searchLineReplace = (pattern) => {
          line = line.replace(pattern.regexp, (match, index) => {
            let type = pattern.isCategory ? pattern.category : match;

            if (!(type === "OTHER" && type !== checkSpecialYear(match))) {
              return pushSearchLine(type, match, index, pattern);
            }
          });
        };

        if (_searchTerm) {
          // if in search mode
          if (_isQueryStack) {
            // if it's a querystack
            for (const p of matchPattern) {
              if (line.includes("<span class=")) {
                // the line has existing match
                skipExistingMatchInLine(p, p.category);
              } else {
                // the line does not have existing match
                searchLineReplace(p);
              }
            }
          } else {
            searchLineReplace(matchPattern);
          }
        } else {
          // not in search mode
          for (const key in DATA.regexPatterns) {
            const p = DATA.regexPatterns[key];

            if (p.type === "OTHER") {
              // other patterns

              if (line.includes("<span class=")) {
                // line is matched previously with other types
                skipExistingMatchInLine(matchPattern, p.type);
                break;
              }
            }
            // normal patterns
            originalLine.replace(p.regexp, (match, index) => {
              // use the original line for matching
              let type = p.type;
              if (type === "OTHER") {
                type = checkSpecialYear(match);
              }

              pushIntoThumbnailArray(type, match, index);
            });
            line = line.replace(p.regexp, (match) => {
              // use the modified line for creating focus view HTML
              let type = p.type;
              if (type === "OTHER") {
                type = checkSpecialYear(match);
              }

              return `<span class="badge badge-pill pattern-badge" pattern="${type}">${match}</span>`;
            });
          }
        }
      } else {
        // increment gap count
        focusOpts.gap++;
      }
    }

    // capture the first date appeared in the letter
    if (firstDate === 0) {
      let dateMatched = originalLine.match(DATA.regexPatterns.DATE.regexp);

      if (dateMatched) {
        firstDate = moment(dateMatched[0], ["Do MMM YYYY", "DD/MM/YYYY", "DD.MM.YYYY"]);
      }
    }

    // capture the date of birth
    if (dob === 0) {
      let dateMatched = originalLine.match(DATA.regexPatterns.DOB.regexp);

      if (dateMatched) {
        dob = moment(dateMatched[0].replace(/[^0-9.]/g, ""), [
          "Do MMM YYYY",
          "DD/MM/YYYY",
          "DD.MM.YYYY",
        ]);

        let calAge = Math.round(moment.duration(moment().diff(dob)).asYears());

        if (calAge > 0 && calAge < 120) {
          age = calAge;
        }
      }
    }

    // capture the gender
    let femaleMatched = originalLine.match(DATA.regexPatterns.GENDER.female);
    if (femaleMatched) {
      gender.female += femaleMatched.length;
    }

    let maleMatched = originalLine.match(DATA.regexPatterns.GENDER.male);
    if (maleMatched) {
      gender.male += maleMatched.length;
    }

    // append the original text directly
    focusOpts.text += line + "</br>";

    focusCurrent.gap = focusOpts.gap;
    focusCurrent.value = line;
    focusOpts.results.push(focusCurrent);
  }

  if (_stopWhenFound) {
    return false;
  }

  gender = gender.male > gender.female ? "male" : "female";

  const focusView = {
    title,
    originalText: file.text,
    text: focusOpts.text,
    content: focusOpts.results,
    gender,
  };

  // calculating local centroids
  const cList = Object.values(centroids).sort((a, b) => a.id - b.id);
  let edgeLength = 0;
  for (let i = 0; i < cList.length; i++) {
    const centroid = cList[i];

    // calculate local centroids
    if (centroid.count > 1) {
      centroid.x = +(centroid.x / centroid.count).toFixed(2);
      centroid.y = +(centroid.y / centroid.count).toFixed(2);
    }

    // calculate max document length and line length
    centroid.maxLine = 0;
    centroid.maxLength = 0;
    centroid.children.forEach((c) => {
      if (c.x > centroid.maxLength) {
        centroid.maxLength = c.x;
      }

      if (c.y > centroid.maxLine) {
        centroid.maxLine = c.y;
      }
    });

    // calculate edge Length
    if (centroid.operator === "AND") {
      // use search term sequence to find the correct next centroid for AND operator, as cList does not store repeated centroids
      const centroidNext = cList.filter((c) => c.type === _searchTerm[centroid.id + 1].text)[0];

      if (centroidNext) {
        const a = Math.pow(
          Math.abs(centroid.x) - Math.abs((centroidNext.x / centroidNext.count).toFixed(2)),
          2
        );
        const b = Math.pow(
          Math.abs(centroid.y) - Math.abs(centroidNext.y / centroidNext.count.toFixed(2)),
          2
        );
        const c = Math.sqrt(a + b);
        edgeLength += c;
      }
    }
  }
  return {
    centroids: Object.values(centroids).sort((a, b) => a.id - b.id),
    count: thumbnailArray.length,
    documentLineCount,
    dob: dob === 0 ? 0 : dob.unix(),
    age,
    firstDate,
    firstDay: firstDate === 0 ? 0 : firstDate.day(),
    firstMonth: firstDate === 0 ? 0 : firstDate.month(),
    firstYear: firstDate === 0 ? 0 : firstDate.year(),
    focusView,
    drugChain: drugChain
      .sort((a, b) => {
        return a.y < b.y ? 1 : a.y === b.y ? (a.x > b.x ? 1 : -1) : -1;
      })
      .map((d) => ({
        type: d.type.toLowerCase(),
      })),
    individual: thumbnailArray,
    length: file.text.length,
    maxLength,
    timestamp: firstDate === 0 ? 0 : firstDate.unix(),
    colorScheme: _colorScheme,
    queryStack: _isQueryStack ? _searchTerm : [_searchTerm],
    edgeLength: edgeLength.toFixed(2),
  };
};

const searcher = (file, query, _colorScheme) => {
  if (query) {
    let parsedQuery = parseQuery(query);

    // simple query without operators
    if (parsedQuery.length < 2) {
      return processCore(file, {
        _searchTerm: { text: parsedQuery[0].text, operator: undefined },
        _colorScheme,
      });
    } else {
      let queryStack = generateQuerystack(parsedQuery);
      let final = parsedQuery
        .map((r) => {
          if (r.type === "text") {
            const res = processCore(file, { _searchTerm: r.text, _stopWhenFound: true });
            r.text = res;
          }
          return r.text;
        })
        .join(" ");

      if (eval(final)) {
        // perform the actual search
        const res = processCore(file, {
          _searchTerm: queryStack,
          _isQueryStack: true,
          _colorScheme,
        });

        return res;
      } else {
        // if no match, return a focus view only
        return processCore(file, {
          _searchTerm: queryStack,
          _returnFocusViewOnly: true,
          _isQueryStack: true,
          _colorScheme,
        });
      }
    }
  } else {
    return processCore(file);
  }
};

const checkCategory = (_searchTerm) => {
  let text, operator;

  // if it's a querystack, _searchTerm should have 'text' property
  if (_searchTerm.text) {
    text = _searchTerm.text;
    operator = _searchTerm.operator;
  } else {
    text = _searchTerm;
  }
  if (isCategory(text)) {
    return {
      isCategory: true,
      category: text,
      operator,
      regexp: new RegExp(DATA.regexPatterns[`${escapeRegExp(text)}`].regexp.source, "gi"),
    };
  } else {
    // special case for generic drug names and trade names
    // let drugName = DATA.drugTradeNameList[text.toLowerCase()];

    let drugName = DATA.drugList[text.toLowerCase()];

    let regexp;
    let isDrug = false;
    if (drugName) {
      regexp = new RegExp(`(?:${DATA.drugTradeNameList[drugName[1]].join("|")})`, "gi");
      text = drugName[1];
      isDrug = true;
    } else {
      regexp = new RegExp(escapeRegExp(text), "gi");
    }

    return {
      isCategory: false,
      isDrug,
      category: text,
      operator,
      regexp,
    };
  }
};

const hasMatch = (line, patterns) => {
  for (const key in patterns) {
    const p = patterns[key];
    if (line.match(p.regexp) !== null) {
      return true;
    }
  }
  return false;
};

module.exports = {
  processCore,
  searcher,
};
