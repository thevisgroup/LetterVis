<template>
  <div class="histogram">
    <div ref="histogram"></div>
    <div ref="histogram2"></div>
  </div>
</template>

<script>
import plotly from "plotly.js";

export default {
  mounted() {
    const maleCount = [
      0,
      17328,
      14774,
      25190,
      18985,
      16792,
      14268,
      12062,
      10303,
      9317,
      8230,
      7601,
      6689,
      6225,
      5532,
      5686,
      6939,
      8741,
      12498,
    ];
    const femaleCount = [
      0,
      13887,
      13200,
      19469,
      14814,
      11966,
      10382,
      9174,
      8824,
      8571,
      8063,
      8161,
      7842,
      6996,
      6668,
      7390,
      8725,
      10983,
      16178,
    ];

    const age = [];

    for (let i = 0; i < 18; i += 1) {
      if (i === 0) age[i] = "0 - 4";
      else if (i === 17) age[i] = "85+";
      else age[i] = `${(i - 1) * 5} - ${i * 5 - 1}`;
    }

    const data = [
      {
        x: age,
        y: femaleCount,
        histfunc: "sum",
        name: "female",
        type: "histogram",
        opacity: 0.6,
        autobinx: false,
        xbins: {
          end: 85,
          size: 1,
          start: 0,
        },
      },
      {
        x: age,
        y: maleCount,
        histfunc: "sum",
        name: "male",
        type: "histogram",
        opacity: 0.6,
        autobinx: false,
        xbins: {
          end: 85,
          size: 1,
          start: 0,
        },
      },
    ];

    const layout = {
      barmode: "overlay",
      title: "Injury A and E attendances in 2017",
      xaxis: { title: "Age", showticklabels: false },
      yaxis: { title: "Count" },
      bargap: 0,
      // bargroupgap: 0.006
    };

    plotly.plot(this.$refs.histogram, data, layout);

    const all = [];

    for (let i = 0; i < maleCount.length; i += 1) {
      all[i] = maleCount[i] + femaleCount[i];
    }

    const data2 = [
      {
        x: age,
        y: all,
        name: "female",
        type: "histogram",
        histfunc: "sum",
        opacity: 0.6,
        autobinx: false,
        xbins: {
          end: 85,
          size: 1,
          start: 0,
        },
      },
    ];

    const layout2 = {
      title: "Injury A and E attendances in 2017 (All)",
      xaxis: { title: "Age", showticklabels: false },
      yaxis: { title: "Count" },
      bargap: 0,
      // bargroupgap: 0.006
    };

    plotly.plot(this.$refs.histogram2, data2, layout2);
  },
};
</script>
