<template>
  <div class="highlight-number-in-text">
    <h4 class="mb-4">
      Focus View
      <span class="float-right"
        >{{ data.data.title }}, {{ data.age }} YO, {{ data.data.gender }}, {{ data.drugNo }} AED(s)
        <b-button
          v-b-modal="'modal-text' + button_id_anchor"
          variant="primary"
          class="activate-modal ml-3"
          :id="button_id_anchor"
          >View Document</b-button
        ></span
      >
    </h4>

    <b-modal :id="'modal-text' + button_id_anchor" size="lg">
      <template v-slot:modal-title>
        {{ data.data.title }} <icon :icon="data.data.gender === 'male' ? 'mars' : 'venus'"></icon>
      </template>
      <b-container fluid>
        <p v-html="data.data.text"></p>
      </b-container>
      <div slot="modal-footer" class="w-100">
        <b-button
          variant="primary"
          size="sm"
          class="float-right"
          @click="$bvModal.hide('modal-text' + button_id_anchor)"
        >
          Close
        </b-button>
      </div>
    </b-modal>
    <div v-for="(line, index) in formatData" :key="index">
      <div v-if="line.hasMatch">
        <b-list-group-item :id="data.data.title + '-' + line.lineNo">
          <b-row>
            <b-col>
              <b-badge class="line-badge" variant="light" pill>{{ line.lineNo }}</b-badge>
              <span v-html="line.value"></span>
            </b-col>
          </b-row>
        </b-list-group-item>
      </div>
      <div v-else>
        <div class="separator">
          <hr
            :style="'border:' + (line.gap / 2 + 1 > 5 ? 5 : line.gap / 2 + 1) + 'px solid #aeb3ba;'"
          />
          <b-button block variant="light" href="#" v-b-toggle="'collapse-' + index">
            <span class="chevron when-opened">
              <icon icon="chevron-up" />
            </span>
            <span class="chevron when-closed">
              <icon icon="chevron-down" />
            </span>
          </b-button>
        </div>

        <b-collapse :collapse="'collapse-' + data.data.title" :id="'collapse-' + index">
          <div v-for="(item, index) in line.value" :key="index">
            <b-list-group-item variant="light" :id="data.data.title + line.lineNo">
              <b-row>
                <b-col>
                  <b-badge class="line-badge" variant="light" pill>{{ item.lineNo }}</b-badge>
                  <span v-html="item.value"></span>
                </b-col>
              </b-row>
            </b-list-group-item>
          </div>
        </b-collapse>
      </div>
    </div>
  </div>
</template>

<script>
export default {
  name: "FocusView",
  props: ["data"],
  computed: {
    formatData() {
      let previousLineHasMatch = true;

      let result = [];
      let collapseSection = { value: [] };
      this.data.data.content.forEach((line) => {
        if (line.hasMatch) {
          // push the collapseSection into result
          if (!previousLineHasMatch) {
            result.push(collapseSection);
            previousLineHasMatch = true;
          }
          // push current line into result
          result.push(line);
        } else {
          // start a new collapseSection
          if (previousLineHasMatch) {
            previousLineHasMatch = false;
            collapseSection = { value: [] };
          }
          // push current line into collapseSection
          collapseSection.value.push(line);
          collapseSection.hasMatch = false;
          collapseSection.gap = line.gap;
        }
      });

      // check for any lines left
      if (collapseSection.value.length > 0) {
        result.push(collapseSection);
      }

      return result;
    },
  },
  data() {
    return {
      button_id_anchor: `button-anchor-${this.data.data.title}`,
    };
  },
};
</script>

<style>
.collapsed > .when-opened,
:not(.collapsed) > .when-closed {
  display: none;
}

.card-body {
  text-align: left;
  white-space: pre;
  /* max-width: max-content;
  min-width: max-content; */
}

.separator > hr {
  border: 1px solid #4d4d5c;
  margin: 0 0 0 0;
}

.separator > .btn {
  position: relative;
  margin: -9px 4%;
  width: 10px;
  height: 10px;
  z-index: 999;
}

.separator .when-closed,
.when-opened {
  position: absolute;
  margin: -13px 0 0 -6px;
}

.number-position {
  padding-bottom: 3%;
}

.highlight-number-in-text {
  /* text-align: left; */
  white-space: pre;
  max-width: fit-content;
  min-width: 860px;
  max-height: fit-content;
}

.title-badge {
  margin-bottom: 1rem;
  font-size: 1rem;
}

.activate-modal {
  margin: 0.5rem;
}

.line-badge {
  margin-right: 0.5rem;
}

.badge-pill[pattern="pattern"] {
  margin: 0 3px;
}

.badge-pill[pattern="search"] {
  color: #fff;
  background-color: #265581;
}

.badge-pill[pattern="POSTCODE"] {
  color: #000000;
  background-color: #68b0fc;
}

.badge-pill[pattern="PHONE"] {
  color: #ffffff;
  background-color: #265581;
}

.badge-pill[pattern="HOSPITAL"] {
  color: #000000;
  background-color: #55af79;
}

.badge-pill[pattern="DOSAGE"] {
  color: #ffffff;
  background-color: #30693c;
}

.badge-pill[pattern="DATE"] {
  color: #000000;
  background-color: #aee64f;
}

.badge-pill[pattern="TIME"] {
  color: #000000;
  background-color: #ff9149;
}

.badge-pill[pattern="AGE"] {
  color: #000000;
  background-color: #e4ad82;
}

.badge-pill[pattern="MEASUREMENT"] {
  color: #ffffff;
  background-color: #922d18;
}

.badge-pill[pattern="DOB"] {
  color: #000000;
  background-color: #f85e17;
}

.badge-pill[pattern="FREQUENCY"] {
  color: #000000;
  background-color: #29f385;
}

.badge-pill[pattern="OTHER"] {
  color: #ffffff;
  background-color: #81174c;
}

.badge-pill[pattern="DRUG"] {
  color: #000000;
  background-color: #f07796;
}

.badge-pill[pattern="acetazolamide"] {
  color: #ffffff;
  background-color: #313695;
}

.badge-pill[pattern="carbamazepine"] {
  color: #ffffff;
  background-color: #394fa1;
}

.badge-pill[pattern="tegretol"] {
  color: #ffffff;
  background-color: #394fa1;
}

.badge-pill[pattern="tegretol pr"] {
  color: #ffffff;
  background-color: #394fa1;
}

.badge-pill[pattern="tegretol retard"] {
  color: #ffffff;
  background-color: #394fa1;
}

.badge-pill[pattern="clobazam"] {
  color: #ffffff;
  background-color: #4368ae;
}

.badge-pill[pattern="frisium"] {
  color: #ffffff;
  background-color: #4368ae;
}

.badge-pill[pattern="perizam"] {
  color: #ffffff;
  background-color: #4368ae;
}

.badge-pill[pattern="clonazepam"] {
  color: #ffffff;
  background-color: #5180ba;
}

.badge-pill[pattern="eslicarbazepine acetate"] {
  color: #000000;
  background-color: #6296c5;
}

.badge-pill[pattern="zebinix"] {
  color: #000000;
  background-color: #6296c5;
}

.badge-pill[pattern="ethosuximide"] {
  color: #000000;
  background-color: #75abd0;
}

.badge-pill[pattern="zarontin"] {
  color: #000000;
  background-color: #75abd0;
}

.badge-pill[pattern="gabapentin"] {
  color: #000000;
  background-color: #8abeda;
}

.badge-pill[pattern="neurontin"] {
  color: #000000;
  background-color: #8abeda;
}

.badge-pill[pattern="lacosamide"] {
  color: #000000;
  background-color: #a0cfe3;
}

.badge-pill[pattern="vimpat"] {
  color: #000000;
  background-color: #a0cfe3;
}

.badge-pill[pattern="lamotrigine"] {
  color: #000000;
  background-color: #b5ddeb;
}

.badge-pill[pattern="lamictal"] {
  color: #000000;
  background-color: #b5ddeb;
}

.badge-pill[pattern="levetiracetam"] {
  color: #000000;
  background-color: #cae8ef;
}

.badge-pill[pattern="keppra"] {
  color: #000000;
  background-color: #cae8ef;
}

.badge-pill[pattern="desitrend"] {
  color: #000000;
  background-color: #cae8ef;
}

.badge-pill[pattern="nitrazepam"] {
  color: #000000;
  background-color: #dcf1ec;
}

.badge-pill[pattern="oxcarbazepine"] {
  color: #000000;
  background-color: #ebf7df;
}

.badge-pill[pattern="trileptal"] {
  color: #000000;
  background-color: #ebf7df;
}

.badge-pill[pattern="perampanel"] {
  color: #000000;
  background-color: #f6f9cb;
}

.badge-pill[pattern="fycompa"] {
  color: #000000;
  background-color: #f6f9cb;
}

.badge-pill[pattern="phenobarbital"] {
  color: #000000;
  background-color: #fcf5b6;
}

.badge-pill[pattern="phenytoin"] {
  color: #000000;
  background-color: #feeba3;
}

.badge-pill[pattern="epanutin"] {
  color: #000000;
  background-color: #feeba3;
}

.badge-pill[pattern="piracetam"] {
  color: #000000;
  background-color: #fedd90;
}

.badge-pill[pattern="pregabalin"] {
  color: #000000;
  background-color: #fecb7d;
}

.badge-pill[pattern="primidone"] {
  color: #000000;
  background-color: #fdb76c;
}

.badge-pill[pattern="retigabine"] {
  color: #000000;
  background-color: #faa05c;
}

.badge-pill[pattern="rufinamide"] {
  color: #000000;
  background-color: #f7874f;
}

.badge-pill[pattern="inovelon"] {
  color: #000000;
  background-color: #f7874f;
}

.badge-pill[pattern="sodium valproate"] {
  color: #000000;
  background-color: #f16e43;
}

.badge-pill[pattern="epilim"] {
  color: #000000;
  background-color: #f16e43;
}

.badge-pill[pattern="epilim chrono"] {
  color: #000000;
  background-color: #f16e43;
}

.badge-pill[pattern="episenta"] {
  color: #000000;
  background-color: #f16e43;
}

.badge-pill[pattern="valproic acid"] {
  color: #000000;
  background-color: #f16e43;
}

.badge-pill[pattern="stiripentol"] {
  color: #ffffff;
  background-color: #e75538;
}

.badge-pill[pattern="tiagabine"] {
  color: #ffffff;
  background-color: #db3d2f;
}

.badge-pill[pattern="gabitril"] {
  color: #ffffff;
  background-color: #db3d2f;
}

.badge-pill[pattern="topiramate"] {
  color: #ffffff;
  background-color: #cb2829;
}

.badge-pill[pattern="topamax"] {
  color: #ffffff;
  background-color: #cb2829;
}

.badge-pill[pattern="vigabatrin"] {
  color: #ffffff;
  background-color: #b91327;
}

.badge-pill[pattern="sabril"] {
  color: #ffffff;
  background-color: #b91327;
}

.badge-pill[pattern="zonisamide"] {
  color: #ffffff;
  background-color: #a50026;
}

.badge-pill[pattern="zonegran"] {
  color: #ffffff;
  background-color: #a50026;
}
</style>
