export class Broadcast {
  static _channel = new BroadcastChannel("auth-data");

  static subscribe(onMessage) {
    this._channel.addEventListener("message", evt => {
      onMessage(evt.data.data);
    });
  }

  static notify(data) {
    this._channel.postMessage({
      data
    });
  }
}
