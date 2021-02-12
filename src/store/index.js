import Vue from "vue";
import Vuex from "vuex";
Vue.use(Vuex);

import DATA from "./data";
import HELPER from "../util/helper";

const colorData = () => Object.assign({}, DATA.colorLegend());

const legendData = () =>
  DATA.categoryType.map((name, index) => ({
    name,
    order: index,
    count: 0,
    checked: true,
  }));

const legend = {
  namespaced: true,
  state: {
    colorScheme: colorData(),
    list: legendData(),
    greyColor: "#C0C0C0",
    isVisible: true,
    searchedTerms: [],
  },
  getters: {
    getColor: (state) => (payload) => {
      if (HELPER.isCategory(payload)) {
        return state.colorScheme[payload];
      } else {
        return state.colorScheme[payload.toUpperCase() ? payload : payload.toLowerCase()];
      }
    },
  },
  mutations: {
    addCount(state, payload) {
      for (let i = 0; i < state.list.length; i++) {
        const l = state.list[i];
        if (l.name === payload.name) {
          l.count += payload.count;
          break;
        }
      }
    },
    toggleAll(state) {
      state.list.forEach((l) => {
        l.checked = !state.isVisible;
      });

      state.isVisible = !state.isVisible;
    },
    greyscaleLegend(state, type) {
      for (const [key] of Object.entries(state.colorScheme)) {
        if (key !== type) {
          state.colorScheme[key].color = HELPER.greyscaleColor(state.colorScheme[key].color);
        }
      }
    },
    resetColorScheme(state) {
      for (const [key] of Object.entries(state.colorScheme)) {
        if (state.colorScheme[key].type === "original") {
          state.colorScheme[key].color = colorData()[key].color;
        } else if (state.colorScheme[key].type === "search") {
          state.colorScheme[key].color = state.colorScheme[key].colorStore;
        }
      }
    },
    resetLegend(state) {
      state.list = legendData();
    },
    clearSearchedTerms(state) {
      state.searchedTerms = [];
    },
    addSearchResultAndColor(state, payload) {
      for (const centroid of payload) {
        const { color, type } = centroid;
        if (!state.colorScheme[type]) {
          state.colorScheme[type] = {
            type: "search",
            color: color,
            colorStore: color,
          };
        }

        const searchedTerms = state.searchedTerms;

        if (searchedTerms.indexOf(type) === -1) {
          searchedTerms.push(type);
        }
      }
    },
  },
};

const resetCentroidData = (state) => {
  return {
    centroid: { current: [], data: [], top: [], hide: [] },
    searchEdge: { current: [], data: [], calculation: {} },
    edge: { current: [], data: [], hide: [] },
    individual: { current: [], data: [], top: [], hide: [] },
    data: state ? state.data : [],
  };
};

const centroidData = {
  namespaced: true,
  state: resetCentroidData(),
  mutations: {
    clear(state) {
      Object.assign(state, resetCentroidData(state));
    },
    addSearchEdges(state, payload) {
      payload.forEach((value) => {
        const key = value.type;

        if (key in state.searchEdge.calculation) {
          let current = state.searchEdge.calculation[key];
          current.x = +(
            (current.x * current.count + value.x * value.count) /
            (current.count + value.count)
          ).toFixed(1);
          current.y = +(
            (current.y * current.count + value.y * value.count) /
            (current.count + value.count)
          ).toFixed(1);
          current.count += value.count;
          current.children.push(...value.children);

          state.searchEdge.calculation[key] = current;
        } else {
          state.searchEdge.calculation[key] = value;
        }
      });
    },
    calSearchEdges(state, payload) {
      const cals = Object.values(payload);
      state.searchEdge.current = [];
      state.searchEdge.data = [];

      for (let i = 0; i < cals.length - 1; i++) {
        let source = cals[i];
        if (!HELPER.isCategory(source.text)) {
          source.text = source.text.toLowerCase();
        }

        const a = state.searchEdge.calculation[source.text];

        let target = cals[i + 1];
        if (!HELPER.isCategory(target.text)) {
          target.text = target.text.toLowerCase();
        }
        const b = state.searchEdge.calculation[target.text];

        if (source.operator === "AND" && b) {
          const edge = {
            source: a.type,
            target: b.type,
            x: [a.x, b.x],
            y: [a.y, b.y],
          };
          state.searchEdge.current.push(edge);
          state.searchEdge.data.push(edge);
        }
      }
    },
  },
};

const focusData = {
  namespaced: true,
  state: { data: [], current: null },
  mutations: {
    clear(state) {
      Object.assign(state, { data: [], current: null });
    },
    updateCurrentFocusView(state, title) {
      state.current = state.data.filter((d) => d.data.title === title)[0];
    },
  },
};

const thumbnailData = {
  namespaced: true,
  state: { data: [] },
  mutations: {
    clear(state) {
      Object.assign(state, { data: [] });
    },
  },
};

const matrixData = {
  namespaced: true,
  state: { nodes: [], links: [], visible: false, count: 0 },
  mutations: {
    clear(state) {
      Object.assign(state, { nodes: [], links: [], visible: false });
    },
    addDrug(state, payload) {
      payload = payload.map((p) => DATA.getGenericDrugName(p.drug));
      const getNodePosition = (name) => state.nodes.map((n) => n.name).indexOf(name);

      const insertNode = (name) => {
        const pos = getNodePosition(name);
        if (pos == -1) {
          state.nodes.push({
            name,
          });
        }
      };

      const insertLink = (source, target) => {
        source = getNodePosition(source);
        target = getNodePosition(target);

        const pos = state.links.filter(
          (l) =>
            (l.source === source && l.target === target) ||
            (l.source === target && l.target === source)
        );

        if (pos.length > 0) {
          pos[0].value += 1;
        } else {
          state.links.push({ source, target, value: 1 });
        }
      };

      if (payload.length === 1) {
        insertNode(payload[0]);
      } else if (payload.length > 1) {
        for (let i = 0; i < payload.length - 1; i++) {
          const source = payload[i];
          const target = payload[i + 1];
          insertNode(source);

          if (source !== target) {
            insertNode(target);
            insertLink(source, target);
          }
        }
      }
    },
  },
};

const chainData = {
  namespaced: true,
  state: {
    chains: [],
    visible: false,
    key: 0,
    refresh: false,
    clicked: null,
    showFullColor: "false",
  },
  mutations: {
    restore(state) {
      state.chains.forEach((c) => {
        c.show = false;

        c.chain.forEach((cc) => {
          cc.show = false;
        });
      });

      state.visible = false;
      state.key = 0;
      state.refresh = false;
    },
    add(state, payload) {
      const pos = state.chains.findIndex((c) => c.title === payload.title);
      if (pos !== -1) {
        state.chains[pos].show = true;
        state.chains[pos].chain.forEach((c) => {
          if (payload.drugChain.includes(c.type)) {
            c.show = true;
          }
        });

        state.key++;
        state.visible = true;
      }
    },
  },
};

const userOptions = {
  namespaced: true,
  state: {
    global: {
      centroid: {
        options: [
          { text: "Focus", value: "focus" },
          { text: "Context", value: "context" },
          { text: "Hide", value: "hide" },
        ],
        selected: "",
      },
      individual: {
        options: [
          { text: "Focus", value: "focus" },
          { text: "Context", value: "context" },
          { text: "Hide", value: "hide" },
        ],
        selected: "",
      },
      edge: {
        options: [
          { text: "Focus", value: "focus" },
          { text: "Context", value: "context" },
          { text: "Hide", value: "hide" },
        ],
        selected: "",
      },
    }, // NOT boolean!
    thumbnail: {
      centroid: {
        options: [
          { text: "Focus", value: "focus" },
          { text: "Context", value: "context" },
          { text: "Hide", value: "hide" },
        ],
        selected: "",
      },
      individual: {
        options: [
          { text: "Focus", value: "focus" },
          { text: "Context", value: "context" },
          { text: "Hide", value: "hide" },
        ],
        selected: "",
      },
      edge: {
        options: [
          { text: "Focus", value: "focus" },
          { text: "Context", value: "context" },
          { text: "Hide", value: "hide" },
        ],
        selected: "",
      },
      searchEdge: {
        options: [
          { text: "Focus", value: "focus" },
          { text: "Context", value: "context" },
          { text: "Hide", value: "hide" },
        ],
        selected: "focus",
      },
    },
    shared: {
      showEdgeType: null,
      inSearchMode: false,
      searchOpts: {
        logicalOperator: ["AND", "OR", "NOT"],
        currentDrag: null,
        currentTerm: "",
        aggregateTerm: "",
        aggregateMode: "On",
        matrixClicked: false,
        term: "",
        history: [],
        sortingHistory: null,
        colors: {},
        toggle: "On",
        clickMode: "Off",
      },
      sortingOpts: {
        Sorting_Type: [
          { text: "Length of Documents", value: "length" },
          { text: "Count of Numbers", value: "count" },
          { text: "Day", value: "day" },
          { text: "Month", value: "month" },
          { text: "Year", value: "year" },
          { text: "Date", value: "timestamp" },
          { text: "Date of Birth", value: "dob" },
          { text: "Gender", value: "gender" },
          { text: "Edge Length", value: "edgeLength" },
          { text: "No of AEDs", value: "drugNo" },
          { text: "Chain Alignment", value: "alignment" },
        ],
        Sorting_Selected: [
          "length",
          "count",
          "day",
          "month",
          "year",
          "timestamp",
          "edgeLength",
          "dob",
          "gender",
          "drugNo",
          "alignment",
        ],
        Sorting_Array: {
          length: { Focus: [], Thumbnail: [] },
          count: { Focus: [], Thumbnail: [] },
          day: { Focus: [], Thumbnail: [] },
          month: { Focus: [], Thumbnail: [] },
          year: { Focus: [], Thumbnail: [] },
          timestamp: { Focus: [], Thumbnail: [] },
          edgeLength: { Focus: [], Thumbnail: [] },
          dob: { Focus: [], Thumbnail: [] },
          gender: { Focus: [], Thumbnail: [] },
          drugNo: { Focus: [], Thumbnail: [] },
          alignment: { Focus: [], Thumbnail: [] },
        },
      },
    },
  },
  mutations: {
    addHistory(state) {
      const { history, term } = state.shared.searchOpts;

      history.push({
        term,
        checked: true,
      });

      state.shared.inSearchMode = true;
    },
  },
  getters: {
    getAggregateQuery(state) {
      let list = state.shared.searchOpts.history
        //checked is not a boolean, so check for non-false and non-empty value here
        .filter((l) => l.checked)
        .map((m) => (m.term.match(/(AND|OR)/) ? `(${m.term})` : m.term))
        .join(" OR ");

      if (
        state.shared.searchOpts.sortingHistory !== null &&
        state.shared.searchOpts.sortingHistory !== true
      ) {
        if (list) {
          list += " AND " + state.shared.searchOpts.sortingHistory;
        } else {
          list = state.shared.searchOpts.sortingHistory;
        }
      }
      // state.shared.searchOpts.aggregateTerm = query;
      return list;
    },
    getCurrentTerm(state) {
      const searchOpts = state.shared.searchOpts;
      let { currentTerm, history } = searchOpts;

      if (currentTerm === null) {
        currentTerm = searchOpts.currentTerm = history[history.length - 1].term;

        history[history.length - 1].checked = true;
      }

      return currentTerm;
    },
  },
};

export default new Vuex.Store({
  modules: {
    legend,
    centroidData,
    focusData,
    thumbnailData,
    matrixData,
    chainData,
    userOptions,
  },
});
