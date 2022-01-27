const API_KEY =
  "2b70203fac70acc9404c946a44a52dda47258e9fcee16f68472f89336c74a817";
const BASE_URL = "https://min-api.cryptocompare.com/data";

const ALL_TICKER_NAMES_URL = `${BASE_URL}/all/coinlist?summary=true`;

const tickersHandlers = {};

export const getAllTickerNames = async () => {
  const res = await fetch(ALL_TICKER_NAMES_URL);

  if (!res.ok) {
    console.log("Request for tickers failed");
    return;
  }

  const data = await res.json();

  return Object.entries(data.Data).map(([name, tickerData]) => ({
    name,
    fullname: tickerData.FullName
  }));
};

export const getAddedTickersPrice = async () => {
  const ticker_query = `?fsyms=${Object.keys(tickersHandlers).join(
    ","
  )}&tsyms=USD&api_key=${API_KEY}`;
  const res = await fetch(`${BASE_URL}/pricemulti` + ticker_query);
  const data = await res.json();

  const formattedTickers = Object.entries(data).map(([name, priceObj]) => ({
    name,
    price: priceObj.USD || "-"
  }));

  formattedTickers.forEach(ticker => {
    tickersHandlers[ticker.name].forEach(fn => {
      fn(ticker.price);
    });
  });
};

export const subscribeToTickerUpdate = (ticker, cb) => {
  const subscribers = tickersHandlers[ticker] || [];
  tickersHandlers[ticker] = [...subscribers, cb];
};

export const unsubscribeFromTickerUpdate = (ticker, cb) => {
  const subscribers = tickersHandlers[ticker] || [];
  tickersHandlers[ticker] = subscribers.filter(fn => fn !== cb);
};

setInterval(() => {
  getAddedTickersPrice();
}, 5000);
