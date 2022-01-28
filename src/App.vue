<template>
  <div class="container mx-auto flex flex-col items-center bg-gray-100 p-4">
    <div
      :class="{ hidden: allTickerNames.length }"
      class="fixed w-100 h-100 opacity-80 bg-purple-800 inset-0 z-50 flex items-center justify-center"
    >
      <loading-circle-icon />
    </div>

    <div class="container">
      <section>
        <div class="flex flex-col max-w-xs">
          <label for="wallet" class="block text-sm font-medium text-gray-700">
            Тикер
          </label>
          <div class="mt-1 relative rounded-md shadow-md">
            <input
              v-model.trim="tickerInput"
              @input="addingError = null"
              @keydown.enter="add"
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
            <span
              v-for="ticker in similarTickersList"
              :key="ticker"
              @click="tickerInput = ticker"
              class="inline-flex items-center px-2 m-1 rounded-md text-xs font-medium bg-gray-300 text-gray-800 cursor-pointer"
            >
              {{ ticker }}
            </span>
          </div>

          <div v-if="addingError" class="text-sm text-red-600">
            {{ addingError }}
          </div>
        </div>

        <button
          @click="add"
          type="button"
          class="my-4 inline-flex items-center py-2 px-4 border border-transparent shadow-sm text-sm leading-4 font-medium rounded-full text-white bg-gray-600 hover:bg-gray-700 transition-colors duration-300 focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-gray-500"
        >
          <add-circle-icon />
          Добавить
        </button>
      </section>

      <template v-if="addedTickers.length">
        <p>
          <span class="text-gray-700 font-medium mr-4">
            Страница: {{ page }}
          </span>
          <button
            :disabled="page <= 1"
            :class="{ 'opacity-20': page <= 1 }"
            @click="page = page - 1"
            class="mx-1 inline-flex items-center py-2 px-4 border border-transparent shadow-sm text-sm leading-4 font-medium rounded-full text-white bg-gray-600 hover:bg-gray-700 transition-colors duration-300 focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-gray-500"
          >
            Назад
          </button>
          <button
            :disabled="page >= maxPage"
            :class="{ 'opacity-20': page >= maxPage }"
            @click="page = page + 1"
            class="mx-1 inline-flex items-center py-2 px-4 border border-transparent shadow-sm text-sm leading-4 font-medium rounded-full text-white bg-gray-600 hover:bg-gray-700 transition-colors duration-300 focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-gray-500"
          >
            Вперёд
          </button>

          <label for="filter" class="ml-4 text-sm font-medium text-gray-700">
            Фильтр:
          </label>

          <input
            type="text"
            id="filter"
            v-model="filter"
            @input="page = 1"
            class="pr-10 ml-1 border-gray-300 text-gray-900 focus:outline-none focus:ring-gray-500 focus:border-gray-500 rounded-md"
          />
        </p>
        <hr class="w-full border-t border-gray-600 my-4" />
        <dl class="mt-5 grid grid-cols-1 gap-5 sm:grid-cols-3">
          <div
            v-for="t in paginatedTickers"
            :key="t.name"
            @click="selectedTicker = t"
            :class="{
              'shadow-xl': selectedTicker?.name === t.name,
              shadow: !(selectedTicker?.name === t.name)
            }"
            class="bg-white overflow-hidden rounded-lg border-purple-800 border-solid cursor-pointer"
          >
            <div
              :class="{ 'bg-red-300': !t.price }"
              class="px-4 py-5 sm:p-6 text-center"
            >
              <dt class="text-sm font-medium text-gray-500 truncate">
                {{ t.name }} - USD
              </dt>
              <dd class="mt-1 text-3xl font-semibold text-gray-900">
                {{ t.price || "-" }}
              </dd>
            </div>
            <div class="w-full border-t border-gray-200"></div>
            <button
              @click.stop="handleDelete(t)"
              class="flex items-center justify-center font-medium w-full bg-gray-100 px-4 py-4 sm:px-6 text-md text-gray-500 hover:text-gray-600 hover:bg-gray-200 hover:opacity-20 transition-all focus:outline-none"
            >
              <delete-bucket-icon />
              Удалить
            </button>
          </div>

          <h3 v-show="!paginatedTickers.length" class="text-gray-900">
            No matches
          </h3>
        </dl>
        <hr class="w-full border-t border-gray-600 my-4" />
      </template>

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
import {
  getAllTickerNames,
  subscribeToTickerUpdate,
  unsubscribeFromTickerUpdate
} from "./api.js";

import DeleteBucketIcon from "./icons/DeleteBucketIcon.vue";
import AddCircleIcon from "./icons/AddCircleIcon.vue";
import LoadingCircleIcon from "./icons/LoadingCircleIcon.vue";
import TickersGraph from "./components/TickersGraph.vue";

const TICKERS_PER_PAGE = 6;

export default {
  name: "App",
  components: {
    DeleteBucketIcon,
    AddCircleIcon,
    LoadingCircleIcon,
    TickersGraph
  },

  data() {
    return {
      tickerInput: "",
      addedTickers: [],
      allTickerNames: [],
      graph: [],
      selectedTicker: null,
      addingError: null,
      filter: "",
      page: 1
    };
  },

  created() {
    this.setAddedTickersOnLoad();
    this.loadAllTickerNames();
    this.setPageStateQueryOnLoad();
  },

  computed: {
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
    },

    tickerInputUppercase() {
      return this.tickerInput.toUpperCase();
    },

    filteredTickers() {
      return this.addedTickers.filter(ticker =>
        ticker.name.includes(this.filter.toUpperCase())
      );
    },

    paginatedTickers() {
      return this.filteredTickers.slice(
        TICKERS_PER_PAGE * (this.page - 1),
        TICKERS_PER_PAGE * this.page
      );
    },

    maxPage() {
      return Math.ceil(this.filteredTickers.length / TICKERS_PER_PAGE) || 1;
    },

    pageStateQuery() {
      return {
        filter: this.filter,
        page: this.page
      };
    }
  },

  methods: {
    add() {
      if (!this.checkIsValidInput()) return;

      const currentTicker = {
        name: this.tickerInputUppercase,
        price: null
      };

      this.addedTickers = [...this.addedTickers, currentTicker];
      subscribeToTickerUpdate(currentTicker.name, newPrice =>
        this.updateTickerPrice(currentTicker.name, newPrice)
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

    async loadAllTickerNames() {
      this.allTickerNames = await getAllTickerNames();
    },

    setPageStateQueryOnLoad() {
      const windowData = Object.fromEntries(
        new URL(window.location).searchParams.entries()
      );

      this.filter = windowData.filter || "";
      this.page = +windowData.page || 1;
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

    updateTickerPrice(tickerName, price) {
      this.addedTickers = this.addedTickers.map(t => {
        if (t.name !== tickerName) return t;

        return {
          name: tickerName,
          price
        };
      });
    }
  },

  watch: {
    paginatedTickers() {
      if (this.maxPage < this.page) this.page = this.maxPage;
    },

    selectedTicker() {
      this.graph = [];
    },

    addedTickers(newArr, prevArr) {
      //Чистка полей ввода монеты при её добавлении
      if (prevArr.length < newArr.length) {
        this.tickerInput = "";
        this.filter = "";
      }

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
    },

    pageStateQuery() {
      const { pathname } = window.location;
      const filter = this.filter ? `filter=${this.filter}` : "";
      const page = this.page ? `page=${this.page}` : "";

      window.history.pushState(
        null,
        document.title,
        `${pathname}?${[page, filter].filter(query => query !== "").join("&")}`
      );
    }
  }
};
</script>
