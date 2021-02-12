<template>
  <b-container fluid>
    <b-row>
      <b-col cols="5">
        <b-card no-body>
          <template v-slot:header>
            <b-input-group>
              <b-button class="mr-1" variant="outline-primary" v-b-toggle:dropzone>
                <span class="when-open">Hide</span><span class="when-closed">Show</span> Settings
              </b-button>
              <b-input-group-prepend is-text>
                <b-icon icon="upload"></b-icon>
              </b-input-group-prepend>
              <b-form-file
                ref="file-input"
                v-model="fileOpts.file"
                :state="Boolean(fileOpts.file)"
                :file-name-formatter="openFiles"
                placeholder="Upload files..."
                drop-placeholder="Drop file here..."
                accept="application/json,text/plain"
                multiple
              ></b-form-file>
            </b-input-group>
          </template>
          <b-collapse id="dropzone" class="m-2" visible>
            <b-tabs card>
              <!-- Search options -->
              <b-tab title="Search Options">
                <b-card-text>
                  <b-row>
                    <b-col cols="5">
                      <b class="m-0">Color Legend</b>
                      <draggable
                        class="list-group"
                        v-model="legend.list"
                        v-bind="dragOptions"
                        :group="{ name: 'legend', pull: 'clone', put: false }"
                        @start="dragStart"
                      >
                        <transition-group type="transition">
                          <li
                            style="list-style: none"
                            v-for="l in legend.list"
                            :class="'legend-' + l.name"
                            :key="'color legend ' + l.name"
                          >
                            <b-form-checkbox
                              v-model="l.checked"
                              class="Data_Type_Switch"
                              @change="toggleLegend(l.name, !l.checked)"
                            >
                              <span
                                :style="
                                  'height: 25px;width: 30px;background-color:' +
                                  greyscaleLegendColor(l) +
                                  ';display:inline-block;'
                                "
                              ></span>

                              <span v-if="l.count > 0"> {{ l.name }}: {{ l.count }}</span
                              ><span v-else> {{ l.name }}</span>
                            </b-form-checkbox>
                          </li>
                        </transition-group>
                      </draggable>
                      <b-button
                        class="mt-2"
                        variant="danger"
                        size="sm"
                        v-if="legend.isVisible"
                        @click="toggleAllLegend()"
                        >Hide All</b-button
                      >

                      <b-button
                        class="mt-2"
                        variant="primary"
                        size="sm"
                        v-else
                        @click="toggleAllLegend()"
                        >Show All</b-button
                      >

                      <!-- search settings -->
                      <b-form-checkbox
                        v-model="userOptions.shared.searchOpts.toggle"
                        value="On"
                        unchecked-value="Off"
                        switch
                      >
                        Search Mode: {{ userOptions.shared.searchOpts.toggle }}
                      </b-form-checkbox>
                      <b-form-checkbox
                        v-model="userOptions.shared.searchOpts.clickMode"
                        value="On"
                        unchecked-value="Off"
                        switch
                        v-if="visibleInSearchOnly()"
                      >
                        Click and Search: {{ userOptions.shared.searchOpts.clickMode }}
                      </b-form-checkbox>
                      <b-form-checkbox
                        v-model="userOptions.shared.searchOpts.aggregateMode"
                        value="On"
                        unchecked-value="Off"
                        switch
                        v-if="visibleInSearchOnly()"
                      >
                        Aggregate Mode: {{ userOptions.shared.searchOpts.aggregateMode }}
                      </b-form-checkbox>

                      <!-- logical operator -->

                      <draggable
                        class="dragArea btn-group mx-auto"
                        :list="userOptions.shared.searchOpts.logicalOperator"
                        @start="dragStart"
                        v-if="visibleInSearchOnly()"
                      >
                        <b-button
                          :variant="getOperatorClass(element)"
                          v-for="element in userOptions.shared.searchOpts.logicalOperator"
                          :key="'operator-' + element"
                          @click="dropSearch($event, element)"
                        >
                          {{ element }}
                        </b-button>
                      </draggable>
                    </b-col>

                    <!-- search history -->
                    <b-col cols="7" class="pl-0" v-if="visibleInSearchOnly()">
                      <b class="m-0">Query History</b>
                      <perfect-scrollbar style="max-height: 450px">
                        <b-list-group style="width: auto">
                          <div
                            v-for="(val, key) in userOptions.shared.searchOpts.history"
                            v-bind:key="key"
                            :class="
                              val.checked === 'true'
                                ? 'list-group-item list-group-item-secondary'
                                : 'list-group-item'
                            "
                          >
                            <b-form-checkbox
                              class="float-left"
                              v-model="val.checked"
                              value="true"
                              unchecked-value="false"
                              @change="checkHistory(val.term, val.checked)"
                            >
                            </b-form-checkbox>
                            <!-- style="vertical-align: text-top; display: inline-block;" -->
                            <div v-html="integrateSearchResultAndLegend(val.term)"></div>
                          </div>
                        </b-list-group>
                      </perfect-scrollbar>
                    </b-col>
                  </b-row>
                </b-card-text>
                <!-- search bar -->
                <b-form @submit="searchSubmit" @reset="undoSearch">
                  <b-form-group
                    label-for="userOptions.shared.searchOpts.term"
                    v-if="visibleInSearchOnly()"
                  >
                    <b-input-group>
                      <b-input-group-prepend is-text>
                        <b-icon icon="search"></b-icon>
                      </b-input-group-prepend>
                      <b-form-input
                        v-model="userOptions.shared.searchOpts.term"
                        required
                        placeholder="Search"
                        v-on:drop="dropSearch($event)"
                      />
                      <b-input-group-append>
                        <b-button
                          type="reset"
                          variant="danger"
                          v-if="
                            visibleInSearchOnly() &&
                            userOptions.shared.searchOpts.history.length > 0
                          "
                          >Undo</b-button
                        >
                        <b-button
                          type="submit"
                          variant="primary"
                          :disabled="
                            userOptions.shared.searchOpts.toggle === 'Off' ||
                            userOptions.shared.searchOpts.term.length === 0
                          "
                          >Search</b-button
                        >
                      </b-input-group-append>
                    </b-input-group>
                  </b-form-group>
                </b-form>
              </b-tab>

              <!-- Rendering Options -->
              <b-tab title="Rendering Options">
                <b-card-text>
                  <p class="m-0"><b>Global View</b></p>
                  <b-form-group class="mb-0" label-cols="5" label="Centroids">
                    <b-form-radio-group
                      v-model="userOptions.global.centroid.selected"
                      :options="userOptions.global.centroid.options"
                      buttons
                      button-variant="outline-primary"
                      size="sm"
                    >
                    </b-form-radio-group>
                  </b-form-group>

                  <b-form-group class="mb-0" label-cols="5" label="Individual Samples">
                    <b-form-radio-group
                      v-model="userOptions.global.individual.selected"
                      :options="userOptions.global.individual.options"
                      buttons
                      button-variant="outline-primary"
                      size="sm"
                    >
                    </b-form-radio-group>
                  </b-form-group>

                  <b-form-group class="mb-0" label-cols="5" label="Edge">
                    <b-form-radio-group
                      v-model="userOptions.global.edge.selected"
                      :options="userOptions.global.edge.options"
                      buttons
                      button-variant="outline-primary"
                      size="sm"
                    ></b-form-radio-group>
                  </b-form-group>

                  <p class="m-0"><b>Thumbnail View</b></p>

                  <b-form-group class="mb-0" label-cols="5" label="Centroids">
                    <b-form-radio-group
                      v-model="userOptions.thumbnail.centroid.selected"
                      :options="userOptions.thumbnail.centroid.options"
                      buttons
                      button-variant="outline-primary"
                      size="sm"
                    ></b-form-radio-group>
                  </b-form-group>

                  <b-form-group class="mb-0" label-cols="5" label="Individual Samples">
                    <b-form-radio-group
                      v-model="userOptions.thumbnail.individual.selected"
                      :options="userOptions.thumbnail.individual.options"
                      buttons
                      button-variant="outline-primary"
                      size="sm"
                    >
                    </b-form-radio-group>
                  </b-form-group>

                  <b-form-group class="mb-0" label-cols="5" label="Edges">
                    <b-form-radio-group
                      v-model="userOptions.thumbnail.edge.selected"
                      :options="userOptions.thumbnail.edge.options"
                      buttons
                      button-variant="outline-primary"
                      size="sm"
                    >
                    </b-form-radio-group>
                  </b-form-group>
                </b-card-text>
              </b-tab>

              <!-- sorting options -->
              <b-tab title="Sorting Options">
                <b-card-text>
                  <b-form-group>
                    <b-form-radio-group
                      id="radio-group-1"
                      v-model="userOptions.shared.sortingOpts.Sorting_Selected"
                      :options="userOptions.shared.sortingOpts.Sorting_Type"
                      name="radio-sort"
                      class="mt-2"
                      stacked
                    ></b-form-radio-group>
                  </b-form-group>

                  <b-form-group class="mt-1 mb-0">
                    <b-input-group>
                      <b-input-group-prepend is-text>
                        <b-icon icon="bar-chart-fill"></b-icon>
                      </b-input-group-prepend>
                      <b-form-input
                        id="fileOpts.limit"
                        v-model="fileOpts.limit"
                        placeholder="Number of files to visualize"
                        type="number"
                      ></b-form-input>
                    </b-input-group>
                  </b-form-group>
                </b-card-text>
              </b-tab>
            </b-tabs>
          </b-collapse>
        </b-card>
      </b-col>
      <b-col cols="7" v-if="matrixData.visible">
        <b-row>
          <b-col cols="7">
            <MatrixView></MatrixView>
          </b-col>
          <b-col cols="5">
            <ChainView v-if="chainData.visible"></ChainView>
          </b-col>
        </b-row>
      </b-col>
    </b-row>
    <b-row>
      <b-col cols="12">
        <div class="drug-legend">
          <div class="legend-title">Colormap for AEDs</div>
          <div class="legend-scale">
            <ul class="legend-labels" v-html="generateDrugLegend()"></ul>
          </div>
        </div>
      </b-col>
    </b-row>
    <hr />
    <b-row align-v="center">
      <b-col cols="2">
        <div v-if="fileOpts.progressTotal > 0 && fileOpts.progressCurrent < fileOpts.progressTotal">
          <b-progress
            :value="fileOpts.progressCurrent + 1"
            :max="fileOpts.progressTotal"
            animated
          ></b-progress>
          Processing {{ fileOpts.progressCurrent }} of {{ fileOpts.progressTotal }} files.
        </div>
      </b-col>
    </b-row>
    <b-row class="visSection">
      <hr />
      <Split class="splitParent" style="height: 750px" ref="Split" @onDrag="resizeAll">
        <SplitArea
          class="globalCentroid"
          :size="initOpts.centroid_init_width_ratio * 100"
          :minSize="150"
        >
          <div v-if="centroidData.data.length > 0">
            <CentroidView :data="centroidData.data" :height="680"></CentroidView>
          </div>
        </SplitArea>
        <SplitArea :size="initOpts.thumbnail_init_width_ratio * 100" :minSize="250">
          <h4 class="ml-1">
            Thumbnail View ({{ thumbnailData.data.filter((t) => t.count > 0).length }})
          </h4>
          <div v-if="thumbnailData.data.length > 0">
            <perfect-scrollbar>
              <!-- if sorting method is gender -->
              <div
                v-if="userOptions.shared.sortingOpts.Sorting_Selected === 'gender'"
                class="thumbnailContainer"
              >
                <div
                  v-for="(tn, key) in thumbnailData.data.filter(
                    (t) => t.count > 0 && t.gender === 'male'
                  )"
                  v-bind:key="'male' + key"
                >
                  <ThumbnailView :data="tn" :id="'male' + key"></ThumbnailView>
                </div>
                <div
                  v-if="
                    thumbnailData.data.filter((t) => t.count > 0 && t.gender === 'male').length > 0
                  "
                  class="thumbnailViewbreak"
                ></div>
                <div
                  v-for="(tn, key) in thumbnailData.data.filter(
                    (t) => t.count > 0 && t.gender === 'female'
                  )"
                  v-bind:key="'female' + key"
                >
                  <ThumbnailView :data="tn" :id="'female' + key"></ThumbnailView>
                </div>
              </div>
              <div v-else class="thumbnailContainer">
                <div
                  v-for="(tn, key) in thumbnailData.data.filter((t) => t.count > 0)"
                  v-bind:key="key"
                >
                  <ThumbnailView :data="tn" :id="key"></ThumbnailView>
                </div>
              </div>
            </perfect-scrollbar>
          </div>
        </SplitArea>
        <SplitArea :size="initOpts.focus_init_width_ratio * 100" :minSize="630" id="focusViewSplit">
          <FocusView v-if="focusData.current" :data="focusData.current"></FocusView>
        </SplitArea>
      </Split>
    </b-row>
  </b-container>
</template>
<script>
import { sortBy } from "lodash";

import draggable from "vuedraggable";

import Darkmode from "darkmode-js";
const options = {
  bottom: "75px",
  time: "0.2s",
  saveInCookies: false,
  label: "🌓",
};

const darkmode = new Darkmode(options);
darkmode.showWidget();

import Hasher from "md5";
import { mapState } from "vuex";
// eslint-disable-next-line no-unused-vars
import { processCore, searcher } from "../util/preprocessor";
import { parseQuery, greyscaleColor, generateDrugLegend } from "../util/helper";

const HEIGHT = "500px";

let SPLIT_STYLE;

export default {
  components: {
    draggable,
  },
  data() {
    return {
      fileOpts: {
        file: null,
        limit: null,
        progressTotal: 0,
        progressCurrent: 0,
        hash_list: [],
        count: 0,
      },
      initOpts: {
        centroid_init_width_ratio: 0.31,
        thumbnail_init_width_ratio: 0.24,
        focus_init_width_ratio: 0.45,
      },
      Temp_centroidData: [],
    };
  },
  methods: {
    toggleAllLegend() {
      if (this.legend.isVisible) {
        this.userOptions.global.centroid.selected = "hide";
        this.userOptions.thumbnail.centroid.selected = "hide";
      } else {
        this.userOptions.global.centroid.selected = "focus";
        this.userOptions.thumbnail.centroid.selected = "focus";
      }

      this.$store.commit("legend/toggleAll");

      this.legend.list.forEach((l) => {
        this.toggleTextColorInFV(l.name, this.legend.isVisible);
      });

      this.legend.searchedTerms.forEach((l) => {
        this.toggleTextColorInFV(l, this.legend.isVisible);
      });
    },
    toggleLegend(name, show) {
      if (document.querySelectorAll(`.g2-legend-list-item[data-value='${name}']`).length > 0) {
        document
          .querySelectorAll(
            `.g2-legend-list-item[data-value='${name}'].${show ? "unChecked" : "checked"}`
          )
          .forEach((n) => {
            n.click();
          });
      }
      this.toggleTextColorInFV(name, show);
    },
    toggleTextColorInFV(name, show) {
      document
        .querySelectorAll(
          `.pattern-badge[pattern="${name}"], .pattern-badge[pattern="${name}-removed"]`
        )
        .forEach((e) => {
          const pattern = e.getAttribute("pattern");
          if (pattern === `${name}-removed` && show) {
            if (e.getAttribute("style-data")) {
              e.setAttribute("style", e.getAttribute("style-data"));
            }
            e.setAttribute("pattern", name);
          } else if (pattern === name && !show) {
            if (e.getAttribute("style-data")) {
              e.setAttribute("style", "");
            }
            e.setAttribute("pattern", `${name}-removed`);
          }
        });
    },
    greyscaleLegendColor(l) {
      const color = this.legend.colorScheme[l.name].color;
      if (l.checked) {
        return color;
      } else {
        return greyscaleColor(color);
      }
    },
    getOperatorClass(e) {
      let res = "btn ";
      if (e === "AND") {
        return (res += "btn-outline-primary");
      } else if (e === "OR") {
        return (res += "btn-outline-success");
      } else if (e === "NOT") {
        return (res += "btn-outline-danger");
      }
    },
    undoSearch(e) {
      const searchOpts = this.userOptions.shared.searchOpts;
      const history = searchOpts.history;
      if (Number.isInteger(e)) {
        const term = history[e];
        this.userOptions.shared.inSearchMode = true;
        this.runProcessor(term);
      } else {
        e.preventDefault();

        // remove Matrix View clicked highlights
        document.querySelector(`#matrix_click_${history.length}`)?.remove();
        const cell = document.querySelector(`.matrix_click_${history.length}`)?.classList;
        if (cell) {
          cell.remove("clicked");
          cell.remove(`matrix_click_${history.length}`);
        }

        // remove search history
        if (history.length > 0) {
          this.userOptions.shared.inSearchMode = true;
          let term = history[history.length - 1];

          if (searchOpts.currentTerm === term.term) {
            history.pop();
          }

          // restore Chain View data
          this.$store.commit("chainData/restore");

          if (history.length == 0) {
            this.userOptions.shared.inSearchMode = false;
            // disable matrixClicked flag
            searchOpts.matrixClicked = false;
            this.runProcessor();
          } else {
            this.userOptions.shared.inSearchMode = true;
            term = history[history.length - 1];
            this.runProcessor(term);
          }
        } else {
          history.pop();
          this.toggleSearchMode();
        }
      }
    },
    // 😠 something funny is going on here, each type in search bar will somehow trigger this method, which should not be the case
    integrateSearchResultAndLegend(query) {
      return parseQuery(query)
        .map((r) => {
          let res = "";
          switch (r.type) {
            case "text": {
              let color = this.$store.getters["legend/getColor"](r.text);
              res = `<span><span style="height: 15px;width: 15px;background-color:${color.color};display:inline-block;"></span> ${r.text}</span>`;
              break;
            }
            case "sign": {
              res += r.text;
              break;
            }
            case "operator": {
              if (r.text.trim() === "&&") {
                res += " AND ";
              } else if (r.text.trim() === "||") {
                res += " OR ";
              }
              break;
            }
            default:
              break;
          }
          return res;
        })
        .join(" ");
    },
    generateDrugLegend() {
      return generateDrugLegend();
    },
    toggleSearchMode() {
      this.$store.commit("legend/resetLegend");

      this.userOptions.shared.inSearchMode = false;
      this.runProcessor();
    },
    visibleInSearchOnly() {
      return this.userOptions.shared.searchOpts.toggle === "On" && this.fileOpts.count > 0;
    },
    visibleWhenHasResults() {
      const { searchOpts } = this.userOptions.shared;
      return searchOpts.toggle === "On" && searchOpts.history.length > 0;
    },
    searchSubmit(e) {
      if (e) {
        e.preventDefault();
      }

      if (this.focusData.data.length === 0) {
        alert("No documents uploaded.");
        return;
      }
      // Check if the query is already in history
      const { history, term } = this.userOptions.shared.searchOpts;

      if (history.map((h) => h.term).indexOf(term) === -1) {
        this.$store.commit("userOptions/addHistory");
        this.runProcessor({
          term,
        });
      }
    },
    dropSearch(e, operator) {
      e.preventDefault();

      const searchOpts = this.userOptions.shared.searchOpts;

      if (e.type === "click") {
        searchOpts.term += " " + operator;
      } else {
        if (searchOpts.currentDrag.type === "legend") {
          searchOpts.currentDrag.text = searchOpts.currentDrag.text.toUpperCase();
        }

        searchOpts.term += " " + searchOpts.currentDrag.text;
        searchOpts.currentDrag = null;
      }
    },
    dragStart(e) {
      if (e.item.className.includes("legend")) {
        // legend
        this.userOptions.shared.searchOpts.currentDrag = {
          type: "legend",
          text: e.item.classList[0].split("-")[1],
        };
      } else {
        // logical operator
        this.userOptions.shared.searchOpts.currentDrag = {
          type: "operator",
          text: e.item.innerText,
        };
      }
    },
    runProcessor(term = null) {
      const searchOpts = this.userOptions.shared.searchOpts;

      // this.userOptions.shared.inSearchMode = term !== null || searchOpts.sortingHistory;

      searchOpts.currentTerm = term !== null ? term.term : null;
      let query = null;
      if (term) {
        query = term.term;
      }

      this.$store.commit("centroidData/clear");

      this.$store.commit("legend/clearSearchedTerms");

      this.fileOpts.progressCurrent = 0;

      const results = [];

      let queryStack;

      this.focusData.data.forEach((f) => {
        let result;
        // search mode
        if (this.userOptions.shared.inSearchMode) {
          // aggregate mode
          if (
            (searchOpts.aggregateMode === "On" &&
              searchOpts.history.filter((l) => l.checked).length > 1) ||
            searchOpts.sortingHistory
          ) {
            query = this.$store.getters["userOptions/getAggregateQuery"];
          }

          if (query) {
            result = searcher(
              { title: f.data.title, text: f.data.originalText },
              query,
              this.legend.colorScheme
            );

            // Object.assign(this.legend.colorScheme, result.colorScheme);
            queryStack = result.queryStack;

            // search edges only exist when there are at least 2 centroids
            if (result.centroids.length > 1) {
              this.$store.commit("centroidData/addSearchEdges", result.centroids);
            }

            this.$store.commit("legend/addSearchResultAndColor", result.centroids);
          } else {
            result = searcher({ title: f.data.title, text: f.data.originalText });
          }
        }
        // undo mode
        else {
          result = searcher({ title: f.data.title, text: f.data.originalText });
        }

        results.push(JSON.parse(JSON.stringify(result)));
      });

      this.clearAllViews();

      for (let i = 0; i < results.length; i++) {
        this.updateData(results[i]);
      }

      if (this.userOptions.shared.inSearchMode && queryStack) {
        this.$store.commit("centroidData/calSearchEdges", queryStack);
      }

      // push data into store to generate a new global centroid view
      // use Temp_centroidData as a holder to push data only once, to avoid repeat rendering of global centroid view
      this.centroidData.data.push(...this.Temp_centroidData);

      // this.matrixData.visible = this.matrixData.nodes.length > 0;

      this.updateSortingData();
    },
    checkHistory(term, checked) {
      // flip the checked property of each search term, before Vue's update
      const searchOpts = this.userOptions.shared.searchOpts;
      const history = searchOpts.history;
      const pos = history.map((h) => h.term).indexOf(term);

      // update clicked matrix cell
      document.querySelector(`text#matrix_click_${pos + 1}`).textContent = checked ? "" : pos + 1;

      document.querySelector(`rect.matrix_click_${pos + 1}`).style.stroke = checked
        ? "none"
        : "red";

      history[pos].checked = !checked;
      // value here doesn't get picked up in runPorcessor(), because there is a final check in runPorcessor()
      this.runProcessor({ term });
    },
    clearAllViews() {
      this.Temp_centroidData = [];
      this.centroidData.data = [];
      this.thumbnailData.data = [];
      this.$store.commit("focusData/clear");
      // this.$store.commit("chainData/clear");
      // this.$store.commit("matrixData/clear");
    },
    // eslint-disable-next-line no-unused-vars
    resizeAll(size) {
      window.dispatchEvent(new Event("resize"));
    },
    openFiles(files) {
      // check if user option limit is unset or exceeds total number of files
      this.fileOpts.count =
        this.fileOpts.limit && this.fileOpts.limit < files.length
          ? this.fileOpts.limit
          : files.length;

      if (this.fileOpts.limit && this.fileOpts.limit < files.length) {
        files.splice(this.fileOpts.limit, files.length - this.fileOpts.limit);
      }

      this.fileOpts.progressTotal += files.length;

      this.renderData(files);

      this.setSplitStyle(true);

      return `${this.fileOpts.count} ${this.fileOpts.count === 1 ? "file" : "files"} loaded.`;
    },
    renderData: async function (files) {
      let len = files.length;
      this.resetProgressBar();
      for (let x = 0; x < len; x++) {
        const file = files[x];
        let result = await this.readFileAsText(file);

        if (result) {
          const extensionName = file.name.split(".").pop();
          if (extensionName === "txt") {
            result = processCore({ title: file.name, text: result });
          } else if (extensionName === "json") {
            result = JSON.parse(result);
          }
          if (result) {
            this.updateData(result);

            // adding the original chain view data
            this.chainData.chains.push({
              title: result.focusView.title,
              gender: result.focusView.gender,
              chain: result.drugChain,
              show: false,
              aligned: false,
            });
          }
        } else {
          this.fileOpts.progressTotal -= 1;
        }
      }

      this.centroidData.data.push(...this.Temp_centroidData);
      this.matrixData.visible = this.matrixData.nodes.length > 0;

      this.updateSortingData();
      this.completeProgressBar();
      this.clearFiles();
    },
    updateSortingData() {
      // let fd = [...this.focusData.data];
      let td = [...this.thumbnailData.data];
      const sortingOpts = this.userOptions.shared.sortingOpts;

      sortingOpts.Sorting_Type.map((s) => s.value).forEach((e) => {
        sortingOpts.Sorting_Array[e]["Thumbnail"] = sortBy(td, [e, "title"]);
      });
    },
    updateData(result) {
      this.thumbnailData.data.push({
        individual: [...result.individual],
        centroid: result.centroids,
        maxLength: result.maxLength,
        title: result.focusView.title,
        documentLineCount: result.documentLineCount,
        length: result.length,
        count: result.count,
        timestamp: result.timestamp,
        day: result.firstDay,
        month: result.firstMonth,
        year: result.firstYear,
        queryStack: result.queryStack,
        edgeLength: result.edgeLength,
        dob: result.dob,
        gender: result.focusView.gender,
        drugNo: result.drugChain.length,
      });

      this.focusData.data.push({
        data: result.focusView,
        length: result.length,
        count: result.count,
        timestamp: result.timestamp,
        day: result.firstDay,
        month: result.firstMonth,
        year: result.firstYear,
        edgeLength: result.edgeLength,
        age: result.age,
        dob: result.dob,
        drugNo: result.drugChain.length,
      });

      // the current focus view must have one search result
      if (!this.focusData.current && result.count > 0) {
        document
          .querySelectorAll(".highlight-number-in-text a.not-collapsed")
          .forEach((c) => c.dispatchEvent(new Event("click")));
        this.$store.commit("focusData/updateCurrentFocusView", result.focusView.title);
      }

      if (result.centroids.length > 0) {
        this.Temp_centroidData.push(result.centroids);

        // filter results with DRUG centroid, add drugs to Matrix View
        const drugs = result.centroids.filter((c) => c.type === "DRUG");

        if (drugs.length > 0) {
          this.$store.commit("matrixData/addDrug", drugs[0].children);
        }

        // eslint-disable-next-line no-unused-vars
        const { matrixClicked, history } = this.userOptions.shared.searchOpts;

        if (matrixClicked) {
          // generate Chain View data
          if (result.drugChain.length > 0) {
            this.chainData.refresh = true;
            this.$store.commit("chainData/add", {
              title: result.focusView.title,
              drugChain: result.drugChain.map((d) => d.type),
            });
          }
        }
      }
      this.fileOpts.progressCurrent += 1;
    },
    toggleRenderOption(scope, type, option) {
      this.$store.commit("userOptions/toggleRenderOption", { scope, type, option });
    },
    clearFiles() {
      this.$refs["file-input"].reset();
    },
    resetProgressBar() {
      this.fileOpts.progressCurrent = 0;
    },
    completeProgressBar() {
      this.fileOpts.progressCurrent = this.fileOpts.progressTotal;
    },
    readFileAsText(file) {
      const reader = new FileReader();

      return new Promise((resolve, reject) => {
        reader.onerror = () => {
          reader.abort();
          reject(new DOMException("Problem parsing input file."));
        };

        reader.onload = (e) => {
          const hash = Hasher(e.target.result);
          let result;
          // do not include repeated files
          if (!this.fileOpts.hash_list.includes(hash)) {
            result = e.target.result;
            this.fileOpts.hash_list.push(hash);
          }
          resolve(result);
        };
        reader.readAsText(file);
      });
    },
    getPageHeight() {
      // return document.body.scrollHeight / 2;
      return 550;
    },
    setSplitStyle(show) {
      SPLIT_STYLE.height = HEIGHT + "px";
      SPLIT_STYLE.visibility = show ? "visible" : "hidden";
    },
  },
  watch: {
    "userOptions.shared.sortingOpts.Sorting_Selected": {
      handler: function () {
        const sortingOpts = this.userOptions.shared.sortingOpts;

        if (sortingOpts.Sorting_Selected === "drugNo") {
          this.userOptions.shared.searchOpts.sortingHistory = "DRUG";
          this.userOptions.shared.inSearchMode = true;
          this.runProcessor();
        } else if (sortingOpts.Sorting_Selected === "dob") {
          this.userOptions.shared.searchOpts.sortingHistory = "DOB";
          this.userOptions.shared.inSearchMode = true;
          this.runProcessor();
        } else if (this.userOptions.shared.searchOpts.sortingHistory) {
          this.userOptions.shared.searchOpts.sortingHistory = true;
          this.userOptions.shared.inSearchMode = true;
          this.runProcessor();
          this.userOptions.shared.searchOpts.sortingHistory = null;
        }

        const td = sortingOpts.Sorting_Array[sortingOpts.Sorting_Selected]["Thumbnail"];
        // this.focusData.data = [];
        this.thumbnailData.data = [];

        this.resetProgressBar();

        let newChains = [];

        for (let x = 0; x < td.length; x++) {
          // a delay to enable progressive rendering
          // await new Promise((resolve) => setTimeout(resolve, 100));
          this.fileOpts.progressCurrent += 1;
          // this.focusData.data.push(fd[x]);
          this.thumbnailData.data.push(td[x]);

          newChains.push(...this.chainData.chains.filter((c) => c.title === td[x].title));
        }

        Object.assign(this.chainData.chains, newChains);

        this.completeProgressBar();
      },
    },
    "userOptions.shared.searchOpts.toggle": {
      handler: function () {
        if (this.userOptions.shared.searchOpts.toggle === "On") {
          this.userOptions.shared.inSearchMode = true;

          const query = this.$store.getters["userOptions/getCurrentTerm"];
          this.runProcessor({ term: query });
        } else {
          this.toggleSearchMode();
        }
      },
    },
  },
  computed: {
    ...mapState([
      "legend",
      "centroidData",
      "focusData",
      "thumbnailData",
      "matrixData",
      "chainData",
      "userOptions",
    ]),
    dragOptions() {
      return {
        animation: 200,
        group: "description",
        disabled: false,
        ghostClass: "ghost",
      };
    },
  },
  mounted() {
    SPLIT_STYLE = document.getElementsByClassName("splitParent")[0].style;
    this.setSplitStyle(false);
  },
};
</script>

<style scoped>
.dropzone {
  margin: 1em !important;
}

.dropzone em {
  color: white;
  background: #a61b29;
  border-radius: 2px;
}

.dropzone strong {
  color: white;
  font-weight: 300;
  background: #3170a7;
  border-radius: 2px;
}

.row {
  margin-top: 5px;
}
</style>

<style>
.modal-content {
  width: 56.5vh;
  margin: auto;
}
.modal-body {
  min-height: 80vh;
  min-width: 56vh;
  max-height: 80vh;
  max-width: 56vh;
  overflow-y: auto;
  font-size: 0.5vw;
}

.modal-body span {
  font-size: 0.5vw !important;
}

.thumbnailContainer {
  display: flex;
  flex-wrap: wrap;
}

.thumbnailViewChart {
  border: 1px dashed rgba(155, 155, 155, 0.5);
  width: 80px;
}

.thumbnailViewbreak {
  flex-basis: 100%;
  border: 10px solid rgba(155, 155, 155, 0.5);
}

.g2-legend {
  display: none !important;
}

.Data_Type_Switch > .custom-control-label > span:first-of-type {
  margin-bottom: -0.4rem;
  margin-left: -1.5rem;
}

.Data_Type_Switch > .custom-control-label > span {
  margin-left: none;
}

.Data_Type_Switch > .custom-control-label::before,
.Data_Type_Switch > .custom-control-label::after {
  display: none;
}

.darkmode-layer,
.darkmode-toggle {
  z-index: 500;
}

.col-2,
.col {
  padding-left: 5px !important;
  padding-right: 5px !important;
}

.collapsed > .when-open,
.not-collapsed > .when-closed {
  display: none;
}

.drug-legend .legend-title {
  text-align: left;
  margin-bottom: 8px;
  font-weight: bold;
  font-size: 90%;
}
.drug-legend .legend-scale ul {
  margin: 0;
  padding: 0;
  float: left;
  list-style: none;
}
.drug-legend .legend-scale ul li {
  display: block;
  float: left;
  width: 20px;
  margin-bottom: -2rem;
  text-align: center;
  list-style: none;
}
.drug-legend .tooltip {
  display: table;
  visibility: hidden;
  position: relative;
  top: 15px;
  width: auto;
  white-space: nowrap;
  z-index: 1;
}

.drug-legend ul.legend-labels li span {
  display: block;
  float: left;
  height: 15px;
  width: 20px;
}

.drug-legend ul.legend-labels li:hover .tooltip {
  visibility: visible;
}

.drug-legend ul.legend-labels li:hover span {
  border-style: solid;
}
</style>
