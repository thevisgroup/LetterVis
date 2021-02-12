<template>
  <div class="matrix_view">
    <h4 class="ml-1">Matrix View ({{ this.matrixData.nodes.length }})</h4>
    <b-row align-v="end">
      <b-col cols="3">
        <label for="matrix_order">Sort matrix by: </label>
      </b-col>
      <b-col cols="4">
        <b-form-select id="matrix_order" v-model="selected" :options="options"></b-form-select>
      </b-col>
    </b-row>
    <div id="matrix_containcer"></div>
  </div>
</template>

<script>
import * as d3 from "d3";
import { mapState } from "vuex";

export default {
  name: "MatrixView",
  computed: {
    ...mapState(["matrixData", "userOptions"]),
  },
  data() {
    return {
      selected: "count",
      options: [
        { value: "name", text: "Alphabetical" },
        { value: "count", text: "Co-occurrence" },
      ],
    };
  },
  methods: {
    updateSearch(term) {
      this.userOptions.shared.searchOpts.term = term;
      this.userOptions.shared.searchOpts.matrixClicked = true;
      this.$parent.searchSubmit();
    },
  },
  mounted() {
    // eslint-disable-next-line no-unused-vars
    const __VM = this;
    const matrix = [];
    const nodes = this.matrixData.nodes;
    const links = this.matrixData.links;
    // console.log(links);
    const nodesLength = nodes.length;

    const widthFlag = nodesLength * 20 < 350;

    let margin = { top: 130, right: 80, bottom: 20, left: 150 },
      width = widthFlag ? nodesLength * 20 : 350,
      height = width;

    const svg = d3
      .select("#matrix_containcer")
      .append("svg")
      .attr("width", width + margin.left + margin.right)
      .attr("height", height + margin.top + margin.bottom)
      .append("g")
      .attr("transform", "translate(" + margin.left + "," + margin.top + ")");

    // Compute index per node.
    nodes.forEach((node, i) => {
      node.index = i;
      node.count = 0;
      matrix[i] = d3.range(nodesLength).map((j) => ({ x: j, y: i, z: 0 }));
    });
    // console.log(JSON.parse(JSON.stringify(matrix)));

    // Convert links to matrix; count character occurrences.
    links.forEach((link) => {
      matrix[link.source][link.target].z += link.value;
      matrix[link.target][link.source].z += link.value;
      nodes[link.source].count += link.value;
      nodes[link.target].count += link.value;
    });

    const max = d3.max(matrix, (d) => d3.max(d, (e) => e.z));
    const band = d3.scaleBand([0, width]);
    const color = d3.interpolateTurbo;
    const generateLine = d3
      .line()
      .x((d) => d.x)
      .y((d) => d.y)
      .curve(d3.curveCatmullRom);

    // console.log(Math.max(...matrix[0].map((o) => o.z)));

    // Precompute the orders.
    const orders = {
      name: d3.range(nodesLength).sort((a, b) => d3.ascending(nodes[a].name, nodes[b].name)),
      // count: d3.range(nodesLength).sort((a, b) => {
      //   let x = Math.max(...matrix[a].map((o) => o.z));
      //   let y = Math.max(...matrix[b].map((o) => o.z));
      //   console.log(a, x, b, y);
      //   return x - y;
      // }),
      count: d3.range(nodesLength).sort((a, b) => nodes[b].count - nodes[a].count),
    };

    // The default sort order.
    band.domain(orders.count);

    svg.append("rect").attr("class", "background").attr("width", width).attr("height", height);

    const row = svg
      .selectAll(".row")
      .data(matrix)
      .enter()
      .append("g")
      .attr("class", "row")
      .attr("transform", (d, i) => "translate(0," + band(i) + ")")
      .each(rowFunction);

    row.append("line").attr("x2", width);

    row
      .append("text")
      .attr("x", -1)
      .attr("y", band.bandwidth() / 2)
      .attr("dy", ".32em")
      .attr("text-anchor", "end")
      .attr("drug", (d, i) => nodes[i].name)
      .text((d, i) => nodes[i].name);

    const column = svg
      .selectAll(".column")
      .data(matrix)
      .enter()
      .append("g")
      .attr("class", "column")
      .attr("transform", (d, i) => "translate(" + band(i) + ")rotate(-90)");

    column.append("line").attr("x1", -width);

    column
      .append("text")
      .attr("x", 8)
      .attr("y", band.bandwidth() / 2 + 8)
      .attr("dy", "-0.7em")
      .attr("text-anchor", "start")
      .attr("drug", (d, i) => nodes[i].name)
      .attr("transform", "rotate(35)")
      .text((d, i) => nodes[i].name);

    function rowFunction(row) {
      d3.select(this)
        .selectAll(".cell")
        .data(row.filter((d) => d.z))
        .enter()
        .append("rect")
        .attr("class", "cell")
        .attr("x", (d) => band(d.x))
        .attr("width", band.bandwidth())
        .attr("height", band.bandwidth())
        .style("fill", (d) => color(1 - d.z / max))
        .on("mouseover", (event, p) => mouseover(event, p))
        .on("mouseout", mouseout)
        .on("click", (event, p) => click(event, p));
    }

    const tooltip = d3.select("body").append("div").attr("class", "tooltip");

    svg
      .append("svg:defs")
      .append("svg:marker")
      .attr("id", "triangle")
      .attr("refX", 6)
      .attr("refY", 6)
      .attr("markerWidth", 30)
      .attr("markerHeight", 30)
      .attr("markerUnits", "userSpaceOnUse")
      .attr("orient", "auto")
      .append("path")
      .attr("d", "M 0 0 12 6 0 12 3 6")
      .style("fill", "black");

    function click(event, p) {
      const current = event.currentTarget;

      if (!d3.select(current).classed("clicked")) {
        const y = nodes[p.y].name;
        const x = nodes[p.x].name;
        mouseout();

        const count = __VM.userOptions.shared.searchOpts.history.length + 1;

        d3.select(current).classed("clicked", true);
        d3.select(current).classed("matrix_click_" + count, true);
        d3.select(current).attr("matrix_click", count);

        d3.select(current.parentNode)
          .append("text")
          .style("fill", "red")
          .attr("id", `matrix_click_${count}`)
          .attr("class", `matrix_click`)
          .attr("text-anchor", "start")
          .attr("x", +current.getAttribute("x") + band.bandwidth() / 4)
          .attr("y", (band.bandwidth() / 3) * 2)
          .text(count);

        __VM.updateSearch(y + " AND " + x);
      }
    }

    function mouseover(event, p) {
      const current = event.currentTarget;
      // hihglight text labels
      d3.selectAll(".row text:not(.matrix_click)").classed("selected", (d, i) => i === p.y);
      d3.selectAll(".column text:not(.matrix_click)").classed("selected", (d, i) => i === p.x);

      d3.select(current).classed("selected", true);
      tooltip.style("visibility", "visible");
      tooltip
        .html(nodes[p.y].name + " - " + nodes[p.x].name + "<br>Count: " + p.z)
        .style("left", event.pageX + 30 + "px")
        .style("top", event.pageY - 40 + "px");

      const currentOrders = orders[document.querySelector("#matrix_order option:checked").value];

      const currentPosition = {
        x: currentOrders.indexOf(nodes[p.x].index),
        y: currentOrders.indexOf(nodes[p.y].index),
      };

      // edge connecting drugs on x-axis
      const yShift = widthFlag ? 20 : 350 / nodesLength;

      const edge = [
        { x: 0, y: currentPosition.y * yShift + 10 },
        { x: margin.left / 4, y: ((currentPosition.x + currentPosition.y) / 2) * yShift + 10 },
        { x: 0, y: currentPosition.x * yShift + 10 },
      ];

      svg
        .append("path")
        .attr("class", "highlight-line")
        .attr("d", generateLine(edge))
        .attr("marker-end", "url(#triangle)");

      // y-axis highlight
      svg
        .append("rect")
        .attr("x", 0)
        .attr("y", band(p.y))
        .attr("class", "highlight-bar")
        .attr("width", band(p.x))
        .attr("height", band.bandwidth());

      // x-axis highlight
      svg
        .append("rect")
        .attr("x", band(p.x))
        .attr("y", 0)
        .attr("class", "highlight-bar")
        .attr("width", band.bandwidth())
        .attr("height", band(p.y));
    }

    function mouseout() {
      d3.selectAll("text").classed("selected", false);
      d3.selectAll("rect").classed("selected", false);

      d3.selectAll(".highlight-bar,.highlight-line").remove();

      tooltip.style("visibility", "hidden");
    }

    d3.select("#matrix_order").on("change", () => {
      // remove clicked count
      d3.selectAll("text.matrix_click").remove();

      order(this.selected);
    });

    const order = (value) => {
      band.domain(orders[value]);

      let t = svg.transition().duration(1500).on("end", reAddClickCount);

      function reAddClickCount() {
        document.querySelectorAll(".cell.clicked").forEach((d) => {
          const count = d.getAttribute("matrix_click");
          d3.select(d.parentNode)
            .append("text")
            .style("fill", "red")
            .attr("id", `matrix_click_${count}`)
            .attr("class", `matrix_click`)
            .attr("text-anchor", "start")
            .attr("x", +d.getAttribute("x") + band.bandwidth() / 4)
            .attr("y", (band.bandwidth() / 3) * 2)
            .text(count);
        });
      }

      t.selectAll(".row")
        // .delay((d, i) => band(i) * 4)
        .attr("transform", (d, i) => "translate(0," + band(i) + ")")
        .selectAll(".cell")
        // .delay((d) => band(d.x) * 4)
        .attr("x", (d) => band(d.x));

      t.selectAll(".column")
        .delay((d, i) => band(i) * 4)
        .attr("transform", (d, i) => "translate(" + band(i) + ")rotate(-90)");
    };
  },
};
</script>

<style>
.background {
  fill: #eee;
}

#matrix_containcer path {
  fill: none;
  stroke: #000;
}

.highlight-bar {
  fill: black;
  stroke: white;
  opacity: 0.1;
}

.highlight-line {
  fill: black;
  stroke-width: 2px;
}

line {
  stroke: #fff;
}

text {
  font-size: 0.8em;
}

text.selected {
  font-size: 1em;
  fill: red;
}

rect.selected {
  stroke: #000;
  stroke-width: 2px;
}

rect.clicked {
  stroke: red;
  stroke-width: 3px;
}

.tooltip {
  position: absolute;
  font-size: 0.8em;
  text-align: center;
  text-shadow: -1px -1px 1px #ffffff, -1px 0px 1px #ffffff, -1px 1px 1px #ffffff,
    0px -1px 1px #ffffff, 0px 1px 1px #ffffff, 1px -1px 1px #ffffff, 1px 0px 1px #ffffff,
    1px 1px 1px #ffffff;
  border-radius: 5px;
  background-color: white;
  border: solid;
  border-width: 2px;
  padding: 5px;
  visibility: hidden;
  opacity: 1;
}
</style>
