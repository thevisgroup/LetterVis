<template>
  <div class="chain_view">
    <h4 class="ml-1">Drug Chain View ({{ alignment.length }})</h4>
    <perfect-scrollbar style="max-height: 730px">
      <b-form-checkbox
        v-model="chainData.showFullColor"
        value="true"
        unchecked-value="false"
        switch
      >
        Highlight {{ chainData.showFullColor === "true" ? "All" : "Selected" }} AEDs
      </b-form-checkbox>
      <div id="chain_containcer"></div>
    </perfect-scrollbar>
  </div>
</template>

<script>
import * as d3 from "d3";
import { orderBy } from "lodash";
import { mapState } from "vuex";

export default {
  name: "ChainView",
  computed: {
    ...mapState(["thumbnailData", "chainData", "userOptions"]),
  },
  data() {
    return {
      alignment: [],
    };
  },
  methods: {
    init() {
      // eslint-disable-next-line no-unused-vars
      const __VM = this;

      const { Sorting_Selected } = this.userOptions.shared.sortingOpts;
      if (Sorting_Selected === "alignment") {
        this.sortByAlignment();
        this.syncThumbnailData();
      }

      this.alignment = this.chainData.chains.filter((c) => c.show);

      // get the max number of drugs in one row
      const maxLength = Math.max(...this.alignment.map((d) => d.chain.length));
      // calculate the correct rect size
      const rectSize = 10;

      const margin = { top: 20, right: 10, bottom: 40, left: 10, block: 1.2 },
        width = maxLength * (rectSize + 2) + margin.left + margin.right,
        height = this.alignment.length * (rectSize + 2) + margin.top * 2 + margin.bottom;

      d3.select("#chain_containcer > svg").remove();

      const svg = d3
        .select("#chain_containcer")
        .append("svg")
        .style("width", width)
        .style("height", height)
        .append("g")
        .attr("transform", "translate(" + margin.left + "," + margin.top + ")");

      // row.append("text").text(chain.title).attr("fill", "#000");

      const tooltip = d3.select("body").append("div").attr("class", "tooltip");

      function mouseover(event, p) {
        // d3.select(this.parentNode).append("text").text(p.type);

        const current = event.currentTarget;

        const gender = d3.select(current.parentNode.parentNode).attr("gender");

        const icon =
          gender === "male"
            ? '<svg aria-hidden="true" focusable="false" data-prefix="fas" data-icon="mars" role="img" xmlns="http://www.w3.org/2000/svg" viewBox="0 0 384 512" class="svg-inline--fa fa-mars fa-w-12"><path fill="currentColor" d="M372 64h-79c-10.7 0-16 12.9-8.5 20.5l16.9 16.9-80.7 80.7c-22.2-14-48.5-22.1-76.7-22.1C64.5 160 0 224.5 0 304s64.5 144 144 144 144-64.5 144-144c0-28.2-8.1-54.5-22.1-76.7l80.7-80.7 16.9 16.9c7.6 7.6 20.5 2.2 20.5-8.5V76c0-6.6-5.4-12-12-12zM144 384c-44.1 0-80-35.9-80-80s35.9-80 80-80 80 35.9 80 80-35.9 80-80 80z" class=""></path></svg>'
            : '<svg aria-hidden="true" focusable="false" data-prefix="fas" data-icon="venus" role="img" xmlns="http://www.w3.org/2000/svg" viewBox="0 0 288 512" class="svg-inline--fa fa-venus fa-w-9"><path fill="currentColor" d="M288 176c0-79.5-64.5-144-144-144S0 96.5 0 176c0 68.5 47.9 125.9 112 140.4V368H76c-6.6 0-12 5.4-12 12v40c0 6.6 5.4 12 12 12h36v36c0 6.6 5.4 12 12 12h40c6.6 0 12-5.4 12-12v-36h36c6.6 0 12-5.4 12-12v-40c0-6.6-5.4-12-12-12h-36v-51.6c64.1-14.5 112-71.9 112-140.4zm-224 0c0-44.1 35.9-80 80-80s80 35.9 80 80-35.9 80-80 80-80-35.9-80-80z" class=""></path></svg>';

        tooltip.style("visibility", "visible");
        tooltip
          .html(
            d3.select(current.parentNode.parentNode).attr("title") + " " + icon + "<br>" + p.type
          )
          .style("left", event.pageX + 10 + "px")
          .style("top", event.pageY - 40 + "px");
      }

      function mouseout() {
        tooltip.style("visibility", "hidden");
      }

      function click(event, p) {
        mouseout();

        const current = event.currentTarget;
        if (
          d3.select(current).attr("fill") !== "#C0C0C0" &&
          !d3.select(current).classed("chain-clicked")
        ) {
          // let shift = rectSize * margin.block;
          const row = d3.select(current.parentNode.parentNode);
          const title = row.attr("title");

          const index = +d3.select(current.parentNode).attr("colIndex");
          let temp = [];

          // handling the clicked row
          temp.push({
            title,
            gender: row.attr("gender"),
            index,
            flag: true,
          });

          __VM.setAlignFlag(title, true);

          __VM.chainData.clicked = {
            title,
            index,
          };

          const chains = __VM.alignment.filter((c) => c.title !== title);

          for (let index = 0; index < chains.length; index++) {
            const cc = chains[index];
            let flag = false;
            // get the same drug position in the chain
            for (const [i, b] of cc.chain.entries()) {
              // handling other rows
              if (b.type === p.type) {
                flag = true;
                temp.push({ title: cc.title, gender: cc.gender, index: i, flag });
                break;
              }
            }

            __VM.setAlignFlag(cc.title, flag);

            if (!flag) {
              temp.push({ title: cc.title, gender: cc.gender, index: 0, flag });
            }
          }

          const maxIndex = Math.max(...temp.map((d) => d.index));
          const maxShift = margin.left + maxIndex * rectSize * margin.block + rectSize / 2;

          // draw the alignment edge
          d3.select("path.align-edge").remove();

          svg
            .append("path")
            .attr(
              "d",
              d3.line()([
                [maxShift, 0],
                [maxShift, (chains.length + 2) * rectSize * margin.block + margin.bottom],
              ])
            )
            .attr("class", "align-edge")
            .attr("stroke-width", 2)
            .attr("stroke", "black");

          // reset clicked border
          // d3.selectAll("rect.align-border").classed("align-border", false);
          d3.selectAll("rect.chain-clicked").classed("chain-clicked", false);

          // apply clicked border
          d3.select(current).classed("chain-clicked", true);

          // remove old edges
          d3.selectAll("line.align-edge").remove();

          // reset opacity
          d3.selectAll("rect.align-opacity").classed("align-opacity", false);

          // shifting columns
          for (let index = 0; index < temp.length; index++) {
            const t = temp[index];

            const currentRow = d3.select(`#chain_containcer g[title="${t.title}"]`);
            const nodes = currentRow.selectAll("rect");

            let shift;

            // calculate shift position
            if (t.flag) {
              shift = margin.left + (maxIndex - t.index) * rectSize * margin.block;
            } else {
              // restore to the left-most position
              shift = margin.left;
              // set color opacity when it's not aligned
              d3.selectAll(nodes.nodes()).classed("align-opacity", true);
            }

            let genderMargin = calGenderMargin(t);

            // actual shifting happens here
            currentRow.attr(
              "transform",
              `translate(${shift},${
                genderMargin + currentRow.attr("rowIndex") * rectSize * margin.block
              })`
            );

            if (genderMargin > 0 && !document.querySelector("path.gender-edge")) {
              const y = genderMargin + currentRow.attr("rowIndex") * rectSize * margin.block;
              svg
                .append("path")
                .attr(
                  "d",
                  d3.line()([
                    [0, y],
                    [genderMargin + margin.left + maxLength * rectSize * margin.block, y],
                  ])
                )
                .attr("class", "gender-edge")
                .attr("stroke-width", 5)
                .attr("stroke", "grey");
            }
          }
        } else {
          __VM.chainData.clicked = null;
        }
        __VM.chainData.refresh = true;
        __VM.chainData.key++;

        if (__VM.userOptions.shared.sortingOpts.Sorting_Selected === "alignment") {
          __VM.syncThumbnailData();
        }
      }

      // add rect for each drug in the row
      for (let index = 0; index < this.alignment.length; index++) {
        const chain = this.alignment[index];

        let genderMargin = calGenderMargin(chain);

        const row = svg
          .append("g")
          .attr("title", chain.title)
          .attr("gender", chain.gender)
          .attr("rowIndex", index)
          .attr(
            "transform",
            `translate(${margin.left},${genderMargin + margin.block * index * rectSize})`
          );

        // the left most title
        // svg
        //   .append("text")
        //   .text(chain.title)
        //   .attr("fill", "#000")
        //   .attr("y", margin.block * index * rectSize + (rectSize - 1) * 2);

        const square = row
          .selectAll("g")
          .data(chain.chain)
          .enter()
          .append("g")
          .attr("drug", (d) => d.type)
          .attr("colIndex", (d, i) => i)
          .attr("transform", (d, i) => `translate(${margin.block * i * rectSize},${rectSize})`);

        square
          .append("rect")
          .attr("width", rectSize)
          .attr("height", rectSize)
          .attr("fill", (d) => {
            if (d.show || this.chainData.showFullColor === "true") {
              return this.$store.getters["legend/getColor"](d.type).color;
            } else {
              return "#C0C0C0";
            }
          })
          .on("mouseover", (event, p) => mouseover(event, p))
          .on("mouseout", mouseout)
          .on("click", (event, p) => click(event, p));
      }

      function calGenderMargin(chain) {
        if (__VM.userOptions.shared.sortingOpts.Sorting_Selected === "gender") {
          if (chain.gender !== __VM.alignment[0].gender) {
            return margin.bottom / 2;
          }
        }

        return 0;
      }

      // restore previous alignment
      if (__VM.chainData.clicked) {
        document
          .querySelector(
            `#chain_containcer g[title="${__VM.chainData.clicked.title}"] > g:nth-child(${
              __VM.chainData.clicked.index + 1
            }) > rect`
          )
          .dispatchEvent(new Event("click"));
      }
    },
    setAlignFlag(title, flag) {
      const vmChain = this.alignment.find((c) => c.title === title);
      vmChain.aligned = flag;
    },
    sortByAlignment() {
      Object.assign(this.chainData.chains, orderBy(this.chainData.chains, ["aligned"], ["desc"]));
    },
    syncThumbnailData() {
      this.thumbnailData.data = this.chainData.chains.map((c) => {
        const match = this.thumbnailData.data.filter((t) => t.title === c.title)[0];

        match.opaque = c.show && !c.aligned;

        return match;
      });
    },
  },
  mounted() {
    this.init();
  },
  watch: {
    "chainData.key": {
      handler: function () {
        if (this.chainData.refresh) {
          this.init();
          this.chainData.refresh = false;
        }
      },
    },
    "chainData.showFullColor": {
      handler: function () {
        this.chainData.refresh = true;
        this.chainData.key++;
      },
    },
    "userOptions.shared.sortingOpts.Sorting_Selected": {
      handler: function () {
        this.chainData.refresh = true;
        this.chainData.key++;
      },
    },
  },
};
</script>

<style>
rect.chain-clicked {
  /* outline: 2px solid red; */
  stroke: red;
  stroke-width: 3px;
}

rect.align-border {
  stroke: red;
  stroke-width: 2px;
  stroke-dasharray: 4, 4;
}

rect.align-opacity {
  fill-opacity: 25%;
}
</style>
