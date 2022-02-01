<template>
  <div class="container mx-auto flex flex-col items-center bg-gray-100 p-4">
    <div
      :class="{ hidden: addedTickers.length }"
      class="fixed w-100 h-100 opacity-80 bg-purple-800 inset-0 z-50 flex items-center justify-center"
    >
      <loading-circle-icon />
    </div>

    <div class="container">
      <add-ticker-form :addedTickers="addedTickers" @addTicker="addTicker" />

      <added-tickers-list
        v-if="addedTickers.length"
        :addedTickers="addedTickers"
        :selectedTicker="selectedTicker"
        @selectTicker="selectTicker"
        @handleDelete="handleDelete"
      />

      <tickers-graph
        v-if="selectedTicker"
        :graph="graph"
        :tickerName="selectedTicker.name"
        @closeGraph="selectedTicker = null"
      />
    </div>
  </div>
</template>

<script>
import { subscribeToTickerUpdate, unsubscribeFromTickerUpdate } from "./api.js";

import LoadingCircleIcon from "./icons/LoadingCircleIcon.vue";
import TickersGraph from "./components/TickersGraph.vue";
import AddedTickersList from "./components/AddedTickersList.vue";
import AddTickerForm from "./components/AddTickerForm.vue";

export default {
  name: "App",
  components: {
    LoadingCircleIcon,
    TickersGraph,
    AddedTickersList,
    AddTickerForm
  },

  data() {
    return {
      addedTickers: [],
      graph: [],
      selectedTicker: null,
      addingError: null
    };
  },

  created() {
    this.setAddedTickersOnLoad();
  },

  computed: {
    tickerInputUppercase() {
      return this.tickerInput.toUpperCase();
    }
  },

  methods: {
    addTicker(ticker) {
      this.addedTickers = [...this.addedTickers, ticker];
      subscribeToTickerUpdate(ticker.name, newPrice =>
        this.updateTickerPrice(ticker.name, newPrice)
      );
    },

    handleDelete(tickerToRemove) {
      this.addedTickers = this.addedTickers.filter(t => t !== tickerToRemove);

      if (this.selectedTicker === tickerToRemove) this.selectedTicker = null;

      unsubscribeFromTickerUpdate(tickerToRemove.name, () => {
        this.addedTickers = this.addedTickers.filter(
          t => t.name === tickerToRemove.name
        );
      });
    },

    setAddedTickersOnLoad() {
      this.addedTickers =
        JSON.parse(localStorage.getItem("cryptonomicon-list")) || [];
      this.addedTickers.forEach(t => {
        subscribeToTickerUpdate(t.name, newPrice =>
          this.updateTickerPrice(t.name, newPrice)
        );
      });
    },

    updateTickerPrice(tickerName, price) {
      this.addedTickers = this.addedTickers.map(t => {
        if (t.name !== tickerName) return t;

        return {
          name: tickerName,
          price
        };
      });
    },

    selectTicker(t) {
      this.selectedTicker = t;
    }
  },

  watch: {
    selectedTicker() {
      this.graph = [];
    },

    addedTickers() {
      localStorage.setItem(
        "cryptonomicon-list",
        JSON.stringify(this.addedTickers)
      );

      if (this.selectedTicker?.name) {
        const currentTicker = this.addedTickers.find(
          t => t.name === this.selectedTicker.name
        );

        //Снятия фокуса с монеты при её удалении из массива addedTickers
        if (!currentTicker) {
          this.selectedTicker = null;
          return;
        }

        if (
          currentTicker.price !== null &&
          currentTicker.price !== this.graph[this.graph.length - 1]
        ) {
          this.graph.push(currentTicker.price);
        }
      }
    }
  }
};
</script>
