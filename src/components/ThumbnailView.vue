<template>
  <div :class="data.opaque ? 'opaque thumbnailViewChart' : 'thumbnailViewChart'">
    <p @click="chartClick(data.title)" style="text-align: center; margin-bottom: 0">
      {{ data.title }}
    </p>
    <v-chart
      :height="100"
      :width="100 / 1.414"
      :scale="chartOpts.scale"
      :padding="[15, 5, 0, 5]"
      :on-click="expand"
    >
      <v-legend :useHtml="true" />

      <!-- individual samples -->
      <v-view :data="localData.localIndividual.current">
        <v-point
          v-if="this.userOptions.thumbnail.individual.selected === 'focus'"
          :color="generateColor"
          shape="circle"
          position="x*y"
          :size="2"
          :opacity="1"
        />
        <v-point
          v-if="this.userOptions.thumbnail.individual.selected === 'context'"
          :color="legend.greyColor"
          shape="circle"
          position="x*y"
          :size="2"
          :opacity="1"
        />
      </v-view>

      <!-- controids -->
      <v-view :data="localData.localCentroid.current">
        <v-point
          v-if="this.userOptions.thumbnail.centroid.selected === 'focus'"
          :color="generateColor"
          shape="circle"
          :vStyle="centroidOpts.pointStyle"
          position="x*y"
          :size="4"
          :opacity="1"
        />
        <v-point
          v-if="this.userOptions.thumbnail.centroid.selected === 'context'"
          :color="legend.greyColor"
          shape="circle"
          :vStyle="centroidOpts.pointStyle"
          position="x*y"
          :size="4"
          :opacity="1"
        />
      </v-view>

      <!-- search edges -->
      <v-view :data="localData.searchEdge.current">
        <v-edge
          v-if="userOptions.thumbnail.edge.selected === 'focus'"
          :vStyle="searchEdgeOpts.searchEdgeStyle"
          :position="'x*y'"
          :color="'#000'"
        />

        <v-edge
          v-if="userOptions.thumbnail.edge.selected === 'context'"
          :vStyle="searchEdgeOpts.searchEdgeStyle"
          :position="'x*y'"
          :color="legend.greyColor"
        />
      </v-view>

      <!-- edges -->
      <v-view :data="localData.localEdge.current">
        <v-edge
          v-if="this.userOptions.thumbnail.edge.selected === 'focus'"
          :position="'x*y'"
          :color="'#000'"
        />
        <v-edge
          v-if="this.userOptions.thumbnail.edge.selected === 'context'"
          :position="'x*y'"
          :color="legend.greyColor"
        />
      </v-view>

      <!-- Top layer: where centroids in Global View are clicked -->
      <!-- individual samples -->
      <v-view :data="localData.localIndividual.top">
        <v-point :color="generateColor" shape="circle" position="x*y" :size="2" :opacity="1" />
      </v-view>

      <!-- controids -->
      <v-view :data="localData.localCentroid.top">
        <v-point
          :color="generateColor"
          shape="circle"
          :vStyle="centroidOpts.pointStyle"
          position="x*y"
          :size="4"
          :opacity="1"
        />
      </v-view>
    </v-chart>
  </div>
</template>

<script>
import { mapState } from "vuex";

import { isCategory } from "../util/helper";

export default {
  name: "ThumbnailView",
  props: ["data"],
  mounted() {
    this.init();
  },
  data() {
    return {
      localData: {
        localIndividual: { top: [], current: [], data: [] },
        localCentroid: { top: [], current: [], data: [] },
        localEdge: { current: [], data: [] },
        searchEdge: { current: [], data: [] },
      },
      chartOpts: {
        scale: [
          {
            dataKey: "x",
            min: 0,
            max: this.data.maxLength,
          },
          {
            dataKey: "y",
            min: 0,
            max: this.data.documentLineCount,
          },
        ],
      },
      generateColor: [
        "type",
        (value) => {
          return this.$store.getters["legend/getColor"](value).color;
        },
      ],
      centroidOpts: {
        pointStyle: [
          "type",
          {
            lineWidth: 1,
            strokeOpacity: 1,
            fillOpacity: 0.3,
            opacity: 0.65,
            stroke: (value) => {
              return this.$store.getters["legend/getColor"](value).color;
            },
          },
        ],
      },
      searchEdgeOpts: {
        searchEdgeStyle: {
          endArrow: {
            path: "M 0,0 L -3,2 L -3,-2 Z",
          },
        },
      },
    };
  },
  computed: {
    ...mapState(["legend", "userOptions", "focusData"]),
  },
  methods: {
    init() {
      this.localData.searchEdge = { current: [], data: [] };
      if (this.userOptions.shared.inSearchMode && this.data.queryStack) {
        const cals = Object.values(this.data.queryStack);

        for (let i = 0; i < cals.length - 1; i++) {
          const source = cals[i];
          if (!isCategory(source.text)) {
            source.text = source.text.toLowerCase();
          }
          const a = this.data.centroid.filter((f) => f.type === source.text)[0];

          const target = cals[i + 1];
          if (!isCategory(target.text)) {
            target.text = target.text.toLowerCase();
          }
          const b = this.data.centroid.filter((f) => f.type === target.text)[0];

          if (a && b && source.operator === "AND") {
            this.localData.searchEdge.data.push({
              source: a.type,
              target: b.type,
              x: [a.x, b.x],
              y: [a.y, b.y],
            });
          }
        }
        this.localData.searchEdge.current = this.localData.searchEdge.data;
      }

      this.localData.localCentroid.data = [];
      this.localData.localIndividual.data = [];

      this.localData.localIndividual.data = this.data.individual;

      for (let value of Object.values(this.data.centroid)) {
        value.x = +value.x;
        value.y = +value.y;
        this.localData.localCentroid.data.push(value);
      }

      this.localData.localIndividual.current = this.localData.localIndividual.data;
      this.localData.localCentroid.current = this.localData.localCentroid.data;

      let { centroid, individual, edge } = this.userOptions.thumbnail;
      if (centroid.selected === "") {
        centroid.selected = "focus";
        individual.selected = "context";
        edge.selected = "focus";
      }
    },
    chartClick(title) {
      document
        .querySelectorAll(".highlight-number-in-text a.not-collapsed")
        .forEach((c) => c.dispatchEvent(new Event("click")));
      this.$store.commit("focusData/updateCurrentFocusView", title);
    },
    scrollTo(point) {
      document
        .querySelector(`#${point.title}-${point.lineNo}`)
        .scrollIntoView({ behavior: "smooth" });
    },
    expand(point) {
      // disable when global centroid is hidden
      if (this.userOptions.thumbnail.centroid.selected === "hide") {
        return;
      }
      // check if clicking on a data point
      if (point.data) {
        point = point.data["_origin"];
        if (point.children) {
          // if not expanded, expand child points
          if (this.centroid_expanded) this.collapse();
          this.showEdges(point);

          this.localData.localIndividual.top = [];
          this.localData.localCentroid.top = [point];
          this.localData.localIndividual.top.push(...point.children);
          this.centroid_expanded = true;

          // this.$store.commit("legend/greyscaleLegend", point.type);
        } else if (point.title) {
          this.scrollTo(point);
        } else {
          this.collapse();
        }
      }
      // clicking on empty space
      else if (this.centroid_expanded) {
        //if expanded, collapse child points
        this.collapse();
      }

      this.$forceUpdate();
    },
    collapse: function () {
      this.localData.localEdge.data = [];
      this.localData.localEdge.current = [];
      this.localData.localIndividual.top = [];
      this.localData.localCentroid.top = [];
      this.centroid_expanded = false;
    },
    showEdges(point) {
      if (this.userOptions.thumbnail.edge.selected !== "hide") {
        this.localData.localEdge.data = point.children.map((child) => {
          return {
            x: [+point.x, +child.x],
            y: [+point.y, +child.y],
          };
        });
        this.localData.localEdge.current = this.localData.localEdge.data;
      }
    },
  },
  watch: {
    data: {
      deep: true,
      handler: function () {
        this.init();
      },
    },
    "userOptions.thumbnail.edge.selected": {
      handler: function () {
        const edge = this.localData.localEdge;

        const searchEdge = this.localData.searchEdge;

        if (this.userOptions.thumbnail.edge.selected === "hide") {
          edge.current = [];
          searchEdge.current = [];
        } else {
          edge.current = edge.data;
          searchEdge.current = searchEdge.data;
        }

        this.$forceUpdate();
      },
    },
    "userOptions.thumbnail.individual.selected": {
      handler: function () {
        const individual = this.localData.localIndividual;

        if (this.userOptions.thumbnail.individual.selected === "hide") {
          individual.current = [];
        } else {
          individual.current = individual.data;
        }
        this.$forceUpdate();
      },
    },
    "userOptions.thumbnail.centroid.selected": {
      handler: function () {
        const centroid = this.localData.localCentroid;

        if (this.userOptions.thumbnail.centroid.selected === "hide") {
          centroid.current = [];
        } else {
          centroid.current = centroid.data;
        }
        this.$forceUpdate();
      },
    },
    "userOptions.shared.showEdgeType": {
      handler: function (type) {
        if (!type) {
          return this.collapse();
        }
        for (let [key, value] of Object.entries(this.localData.localCentroid.data)) {
          if (value.type === type) {
            return this.expand({ data: { _origin: this.localData.localCentroid.data[key] } });
          }
        }
        this.$forceUpdate();
      },
    },
  },
};
</script>
<style scoped>
div.opaque {
  opacity: 40%;
}
</style>
