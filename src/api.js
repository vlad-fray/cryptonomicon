const API_KEY =
  "2b70203fac70acc9404c946a44a52dda47258e9fcee16f68472f89336c74a817";
const BASE_URL = "https://min-api.cryptocompare.com/data";

const ALL_TICKER_NAMES_URL = `${BASE_URL}/all/coinlist?summary=true`;
const WEBSOCKET_BASE_URL = "wss://streamer.cryptocompare.com/v2";
const AGGREGATE_INDEX = "5";

const tickersHandlers = {};

const socket = new WebSocket(`${WEBSOCKET_BASE_URL}?api_key=${API_KEY}`);
socket.addEventListener("message", e => {
  const { TYPE, FROMSYMBOL, PRICE } = JSON.parse(e.data);
  if (TYPE !== AGGREGATE_INDEX) return;

  if (PRICE) {
    const ticker = {
      name: FROMSYMBOL,
      price: PRICE
    };
    tickersHandlers[ticker.name].forEach(fn => {
      fn(ticker.price);
    });
  }
});

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

const subscribeToTickerOnWS = ticker => {
    const message = {
        action: "SubAdd",
        subs: [`5~CCCAGG~${ticker}~USD`]
    };
    
    sendToWebSocket(message);
};

const unsubscribeFromTickerOnWS = ticker => {
    const message = {
        action: "SubRemove",
        subs: [`5~CCCAGG~${ticker}~USD`]
    };
    
    sendToWebSocket(message);
};

const sendToWebSocket = message => {
    const stringifiedMessage = JSON.stringify(message);
    if (socket.readyState === WebSocket.OPEN) {
        socket.send(stringifiedMessage);
        return;
    }
    
    socket.addEventListener(
        "open",
        () => {
            socket.send(stringifiedMessage);
        },
        { once: true }
        );
    };
    
    export const subscribeToTickerUpdate = (ticker, cb) => {
        const subscribers = tickersHandlers[ticker] || [];
        tickersHandlers[ticker] = [...subscribers, cb];
        subscribeToTickerOnWS(ticker);
    };
    
    export const unsubscribeFromTickerUpdate = (ticker, cb) => {
        const subscribers = tickersHandlers[ticker] || [];
        tickersHandlers[ticker] = subscribers.filter(fn => fn !== cb);
        unsubscribeFromTickerOnWS(ticker);
    };
    
    //TODO: Понять, почему сокеты работают в нескольких вкладках без шеринга данных
    // const channel = new BroadcastChannel("app-data");
    // channel.addEventListener("message", event => {
    //   if (event.data) {
    //     const ticker = event.data;
    //     console.log(ticker);
    //     tickersHandlers[ticker.name].forEach(fn => {
    //       fn(ticker.price);
    //     });
    //   }
    // });