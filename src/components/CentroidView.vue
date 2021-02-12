<template>
  <div>
    <h4 class="ml-1">Global View</h4>
    <v-chart
      :scale="chartOpts.scale"
      :padding="chartOpts.padding"
      :forceFit="true"
      :height="height"
      :on-click="expand"
    >
      <v-legend data-key="count" :show="false" />
      <v-legend :useHtml="true" />

      <v-tooltip :showTitle="false" />
      <!-- <v-brush :onBrushstart="drag" :onBrushend="drag"></v-brush> -->

      <!-- individual samples -->
      <v-view :data="centroidData.individual.current">
        <v-point
          v-if="userOptions.global.individual.selected === 'focus'"
          :position="'x*y'"
          shape="circle"
          :color="chartOpts.generateColor"
          tooltip="type"
        />

        <v-point
          v-else-if="userOptions.global.individual.selected === 'context'"
          :position="'x*y'"
          shape="circle"
          :color="legend.greyColor"
          tooltip="type"
        />
      </v-view>

      <!-- controids -->
      <v-view :data="centroidData.centroid.current">
        <v-point
          v-if="userOptions.global.centroid.selected === 'focus'"
          :position="'x*y'"
          shape="circle"
          :vStyle="centroidOpts.pointStyle"
          :color="chartOpts.generateColor"
          :opacity="1"
          :size="centroidOpts.pointSize"
          tooltip="type"
        />
        <v-point
          v-else-if="userOptions.global.centroid.selected === 'context'"
          :position="'x*y'"
          shape="circle"
          :vStyle="centroidOpts.pointStyle"
          :color="legend.greyColor"
          :opacity="1"
          :size="centroidOpts.pointSize"
        />
      </v-view>

      <!-- search edges -->
      <v-view :data="centroidData.searchEdge.current">
        <v-edge
          v-if="userOptions.global.edge.selected === 'focus'"
          :vStyle="searchEdgeOpts.searchEdgeStyle"
          tooltip="source*target"
          :position="'x*y'"
          :color="'#000'"
        />

        <v-edge
          v-if="userOptions.global.edge.selected === 'context'"
          :vStyle="searchEdgeOpts.searchEdgeStyle"
          tooltip="source*target"
          :position="'x*y'"
          :color="legend.greyColor"
        />
      </v-view>

      <!-- edges -->
      <v-view :data="centroidData.edge.current">
        <v-edge
          v-if="userOptions.global.edge.selected === 'focus'"
          :position="'x*y'"
          :color="'#000'"
          tooltip="type"
        />
        <v-edge
          v-if="userOptions.global.edge.selected === 'context'"
          :position="'x*y'"
          :color="legend.greyColor"
          tooltip="type"
        />
      </v-view>

      <!-- individual samples at the top -->
      <v-view :data="centroidData.individual.top">
        <v-point :position="'x*y'" shape="circle" :color="chartOpts.generateColor" tooltip="type" />
      </v-view>

      <!-- controids at the top -->
      <v-view :data="centroidData.centroid.top">
        <v-point
          :position="'x*y'"
          shape="circle"
          :vStyle="centroidOpts.pointStyle"
          :color="chartOpts.generateColor"
          :opacity="1"
          :size="centroidOpts.pointSize"
          tooltip="type"
        />
      </v-view>
    </v-chart>
  </div>
</template>

<script>
import { mapState } from "vuex";
import { cloneDeep } from "lodash";
// import { Chart } from "@antv/g2";

import { registerShape } from "viser-vue";

registerShape("edge", "line-arrow", {
  draw(cfg, group) {
    const points = this.parsePoints(cfg.points);

    const x = cfg.points[1].x - cfg.points[0].x;
    const y = cfg.points[1].y - cfg.points[0].y;

    // eslint-disable-next-line no-unused-vars
    let d = 0;
    if (x >= 0) {
      if (y >= 0) {
        points[0].x += 15;
        points[0].y += 5;

        points[1].x -= 2.5;
        points[1].y -= 5;
      } else {
        points[0].x += 10;
        points[0].y += 5;

        points[1].x -= 10;
        points[1].y -= 5;
      }
    } else {
      points[0].x -= 5;
      if (y >= 0) {
        points[0].x -= 5;
        // points[0].y += 2;

        points[1].x += 5;
        points[1].y -= 5;
      } else {
        points[0].x += 2.5;
        points[0].y += 5;

        points[1].x -= 2.5;
        points[1].y -= 5;
      }
    }

    var keyShape = group.addShape("path", {
      attrs: {
        path: [
          ["M", points[0].x, points[0].y],
          ["L", points[1].x, points[1].y],
        ],
        stroke: cfg.color,
        lineWidth: 1,
        endArrow: true,
      },
    });
    return keyShape;
  },
});

export default {
  name: "CentroidView",
  props: ["data", "height"],
  mounted() {
    this.calWeightedCentroid();
    this.userOptions.global.centroid.selected = "focus";
    this.userOptions.global.individual.selected = "context";
    this.userOptions.global.edge.selected = "focus";
  },
  data() {
    return {
      local: {
        final: [],
        centroids: {},
        children: {
          postcode: [],
          phone: [],
          hospital: [],
          dosage: [],
          date: [],
          time: [],
          age: [],
          measurement: [],
          dob: [],
          frequency: [],
          other: [],
        },
        centroid_expanded: false,
        maxLength: 0,
        maxLine: 0,
      },
      chartOpts: {
        padding: [0, 10, 0, 15],
        scale: [
          {
            dataKey: "x",
            min: 0,
            max: 0,
          },
          {
            dataKey: "y",
            min: 0,
            max: 0,
          },
        ],
        generateColor: [
          "type",
          (value) => {
            return this.$store.getters["legend/getColor"](value).color;
          },
        ],
      },
      centroidOpts: {
        pointSize: ["count", [6, 10]],
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
            path: "M 0,0 L -10,7 L -10,-7 Z",
          },
          lineAppendWidth: 3,
        },
      },
    };
  },
  computed: {
    ...mapState(["legend", "centroidData", "userOptions"]),
  },
  methods: {
    expand(point) {
      // disable when global centroid is hidden
      if (this.userOptions.global.centroid.selected === "hide") return;

      // check if clicking on a data point
      if (point.data) {
        // return when an edge is clicked
        if (point.shape.name !== "point") {
          return;
        }

        point = point.data["_origin"];
        // check if is in click and search mode
        const searchOpts = this.userOptions.shared.searchOpts;

        if (searchOpts.clickMode === "On") {
          if (!(searchOpts.term === "")) {
            searchOpts.term += " ";
          }
          searchOpts.term += point.type;
        } else {
          // only centroids have children
          if (point.children) {
            // if no expanded, expand child points
            this.collapse();
            const typeName = point.type;
            if (this.userOptions.global.edge.selected !== "hide") {
              this.centroidData.edge.data = this.calEdges(typeName);
              this.centroidData.edge.current = this.centroidData.edge.data;

              this.userOptions.shared.showEdgeType = typeName;
            }

            this.centroidData.centroid.top.push(point);
            this.centroidData.individual.top.push(...this.local.children[typeName]);

            this.local.centroid_expanded = true;

            this.$store.commit("legend/greyscaleLegend", typeName);
          } else {
            // if it's a child point, set Focus View to the corresponding letter
            this.$store.commit("focusData/updateCurrentFocusView", point.title);
            this.collapse();
          }
        }
      }
      // clicking on empty space
      else if (this.local.centroid_expanded) {
        //if expanded, collapse child points
        this.collapse();
      }
    },
    collapse() {
      this.swap("centroid");
      this.centroidData.edge.data = [];
      this.centroidData.edge.current = [];
      this.centroidData.centroid.top = [];
      this.centroidData.individual.top = [];
      this.local.centroid_expanded = false;

      this.userOptions.shared.showEdgeType = null;

      this.$store.commit("legend/resetColorScheme");
    },
    calWeightedCentroid() {
      let result = {};

      const copy = cloneDeep(this.data);

      // loop every document
      for (let d of copy) {
        // loop every centroid category
        for (let value of Object.values(d)) {
          // update the scale to the max values
          this.chartOpts.scale[0].max =
            value.maxLength > this.chartOpts.scale[0].max
              ? value.maxLength
              : this.chartOpts.scale[0].max;

          this.chartOpts.scale[1].max =
            value.maxLine > this.chartOpts.scale[1].max
              ? value.maxLine
              : this.chartOpts.scale[1].max;

          // calculate or update the global centroid for the category
          if (value.type in result) {
            let current = result[value.type];
            current.x = +(
              (current.x * current.count + value.x * value.count) /
              (current.count + value.count)
            ).toFixed(2);
            current.y = +(
              (current.y * current.count + value.y * value.count) /
              (current.count + value.count)
            ).toFixed(2);
            current.count += value.count;
            current.children.push(...value.children);

            // store the centroid of the category
            this.local.centroids[value.type] = current;
          } else {
            result[value.type] = value;
            // store the centroid of the category
            this.local.centroids[value.type] = value;
          }

          // combine all children of the category into one

          if (value.children.length > 0) {
            if (!this.local.children[value.type]) {
              this.local.children[value.type] = [];
            }
            this.local.children[value.type].push(...value.children);
            this.centroidData.individual.data.push(...value.children);
          }
        }
      }

      let final = [];

      // loop the calculated global centroids
      for (let [key, value] of Object.entries(result)) {
        value.type = key.toString();

        value.x = +(+value.x).toFixed(2);
        value.y = +(+value.y).toFixed(2);

        final.push(value);

        // Update legend count
        if (!this.userOptions.shared.inSearchMode) {
          this.$store.commit("legend/addCount", { name: value.type, count: value.count });
        }
      }
      this.local.final = [...cloneDeep(final)];
      this.centroidData.centroid.data = [...cloneDeep(final)];

      this.swap("centroid");
      this.swap("individual");
    },
    calEdges(key) {
      // create edges for children to the centroid
      return this.local.children[key].map((child) => ({
        x: [child.x, this.local.centroids[key].x],
        y: [child.y, this.local.centroids[key].y],
      }));
    },
    swap(type) {
      const selected = this.userOptions.global[type].selected;

      this.centroidData[type].current = [];
      if (selected !== "hide") {
        this.centroidData[type].current = [...cloneDeep(this.centroidData[type].data)];
      }

      this.$forceUpdate();
    },
  },
  watch: {
    data: {
      handler: function () {
        this.calWeightedCentroid();

        // this.chart = new Chart({
        //   container: "c1",
        //   width: 200,
        //   height: 300,
        // });

        // this.chart.source(this.centroidData.individual.current);

        // this.chart.point().position("x*y");

        // this.chart.render();
      },
    },
    "userOptions.global.centroid.selected": {
      handler: function () {
        const type = "centroid";
        this.swap(type);
      },
    },
    "userOptions.global.individual.selected": {
      handler: function () {
        const type = "individual";
        this.swap(type);
      },
    },
    "userOptions.global.edge.selected": {
      handler: function () {
        const edge = this.centroidData.edge;
        const searchEdge = this.centroidData.searchEdge;

        if (this.userOptions.global.edge.selected === "hide") {
          edge.current = [];
          searchEdge.current = [];
        } else {
          edge.current = edge.data;
          searchEdge.current = searchEdge.data;
        }

        this.$forceUpdate();
      },
    },
  },
};
</script>
