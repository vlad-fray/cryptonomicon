<template>
  <div
    :class="{ hidden: allTickerNames.length }"
    class="fixed w-100 h-100 opacity-80 bg-purple-800 inset-0 z-50 flex items-center justify-center"
  >
    <loading-circle-icon />
  </div>
  <div class="flex flex-col max-w-xs">
    <label for="wallet" class="block text-sm font-medium text-gray-700">
      Тикер
    </label>
    <div class="mt-1 relative rounded-md shadow-md">
      <input
        v-model.trim="tickerInput"
        @input="addingError = null"
        @keydown.enter="addTicker"
        type="text"
        name="wallet"
        id="wallet"
        class="block w-full pr-10 border-gray-300 text-gray-900 focus:outline-none focus:ring-gray-500 focus:border-gray-500 sm:text-sm rounded-md"
        placeholder="Например DOGE"
      />
    </div>

    <div
      v-if="similarTickersList.length"
      class="flex bg-white shadow-md p-1 rounded-md flex-wrap"
    >
      <button
        type="button"
        v-for="ticker in similarTickersList"
        :key="ticker"
        @click="tickerInput = ticker"
        class="inline-flex items-center px-2 m-1 rounded-md text-xs font-medium bg-gray-300 text-gray-800 cursor-pointer"
      >
        {{ ticker }}
      </button>
    </div>

    <div v-if="addingError" class="text-sm text-red-600">
      {{ addingError }}
    </div>
  </div>

  <button
    @click="addTicker"
    type="button"
    class="my-4 inline-flex items-center py-2 px-4 border border-transparent shadow-sm text-sm leading-4 font-medium rounded-full text-white bg-gray-600 hover:bg-gray-700 transition-colors duration-300 focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-gray-500"
  >
    <add-circle-icon />
    Добавить
  </button>
</template>

<script>
import AddCircleIcon from "../icons/AddCircleIcon.vue";
import LoadingCircleIcon from "../icons/LoadingCircleIcon.vue";
import { getAllTickerNames } from "../api.js";

export default {
  props: {
    addedTickers: {
      type: Array,
      required: true
    }
  },
  emits: ["addTicker"],
  components: {
    LoadingCircleIcon,
    AddCircleIcon
  },
  data() {
    return {
      tickerInput: "",
      addingError: null,
      allTickerNames: []
    };
  },
  created() {
    this.loadAllTickerNames();
  },
  computed: {
    tickerInputUppercase() {
      return this.tickerInput.toUpperCase();
    },
    similarTickersList() {
      if (this.tickerInputUppercase === "") return [];

      const similarTickers = [];

      // Такой цикл нужен из-за длины массива allTickerNames >7000
      for (let i = 0; i < this.allTickerNames.length; i++) {
        if (
          this.allTickerNames[i].name.includes(this.tickerInputUppercase) ||
          this.allTickerNames[i].fullname.includes(this.tickerInputUppercase)
        ) {
          similarTickers.push(this.allTickerNames[i].name);
        }

        if (similarTickers.length === 4) break;
      }

      return similarTickers;
    }
  },
  methods: {
    addTicker() {
      if (!this.checkIsValidInput()) return;

      const currentTicker = {
        name: this.tickerInputUppercase,
        price: null
      };

      this.$emit("addTicker", currentTicker);
      this.tickerInput = "";
    },
    checkIsValidInput() {
      if (this.tickerInputUppercase === "") {
        this.addingError = "Пустое поле ввода";
        return false;
      }

      if (
        !this.allTickerNames.find(
          tickerName => this.tickerInputUppercase === tickerName.name
        )
      ) {
        this.addingError = "Такой монеты не существует";
        return false;
      }

      if (
        this.addedTickers.find(
          ticker => ticker.name === this.tickerInputUppercase
        )
      ) {
        this.addingError = "Эта монета уже добавлена";
        return false;
      }

      this.addingError = null;
      return true;
    },
    async loadAllTickerNames() {
      this.allTickerNames = await getAllTickerNames();
    }
  }
};
</script>
