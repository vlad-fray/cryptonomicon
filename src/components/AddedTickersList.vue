<template>
  <div class="flex flex-wrap items-center gap-4">
    <span class="text-gray-700 font-medium"> Страница: {{ page }} </span>
    <div>
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
    </div>

    <label for="filter" class="text-sm font-medium text-gray-700 max-w-sm">
      Фильтр:
      <input
        type="text"
        id="filter"
        v-model.trim="filter"
        @input="page = 1"
        class="ml-1 border-gray-300 text-gray-900 focus:outline-none focus:ring-gray-500 focus:border-gray-500 rounded-md"
      />
    </label>
  </div>
  <hr class="w-full border-t border-gray-600 my-4" />
  <dl class="mt-5 grid grid-cols-1 gap-5 sm:grid-cols-3">
    <div
      v-for="t in paginatedTickers"
      :key="t.name"
      @click="$emit('selectTicker', t)"
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
        @click.stop="$emit('handleDelete', t)"
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

<script>
import DeleteBucketIcon from "../icons/DeleteBucketIcon.vue";

const TICKERS_PER_PAGE = 6;

export default {
  props: {
    addedTickers: {
      type: Array,
      required: true
    },
    selectedTicker: {
      // Не получилось обработать null
      // type: Object,
      required: true
    }
  },
  emits: {
    selectTicker: null,
    handleDelete: null
  },
  components: {
    DeleteBucketIcon
  },
  data() {
    return {
      filter: "",
      page: 1
    };
  },
  created() {
    this.setPageStateQueryOnLoad();
  },
  methods: {
    setPageStateQueryOnLoad() {
      const windowData = Object.fromEntries(
        new URL(window.location).searchParams.entries()
      );

      this.filter = windowData.filter || "";
      this.page = +windowData.page || 1;
    }
  },
  computed: {
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
  watch: {
    pageStateQuery() {
      const { pathname } = window.location;
      const filter = this.filter ? `filter=${this.filter}` : "";
      const page = this.page ? `page=${this.page}` : "";

      window.history.pushState(
        null,
        document.title,
        `${pathname}?${[page, filter].filter(query => query !== "").join("&")}`
      );
    },
    paginatedTickers() {
      if (this.maxPage < this.page) this.page = this.maxPage;
    }
  }
};
</script>
