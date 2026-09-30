// A stand-in for YOUR cart API, so the demo runs without a server.
// It keeps the cart in this browser and answers like a fetch() response would.
// Replace every demoCart call with a request to your own backend.
window.demoCart = (function () {
  var KEY = "demo_cart_v1";

  function read() {
    try {
      return JSON.parse(localStorage.getItem(KEY) || "[]");
    } catch (e) {
      return [];
    }
  }

  function write(items) {
    try {
      localStorage.setItem(KEY, JSON.stringify(items));
    } catch (e) {
      /* private browsing: the cart simply does not persist */
    }
  }

  function count(items) {
    return items.reduce(function (n, item) {
      return n + item.quantity;
    }, 0);
  }

  return {
    // like: POST /api/cart/add  ->  200 { item_count }
    add: function (line) {
      var items = read();
      var found = items.filter(function (item) {
        return item.sku === line.sku;
      })[0];
      if (found) found.quantity += line.quantity;
      else items.push({ sku: line.sku, quantity: line.quantity, price: line.price || "0.00" });
      write(items);
      return Promise.resolve({ ok: true, status: 200, item_count: count(items) });
    },
    // like: GET /api/cart  ->  200 { items, item_count }
    get: function () {
      var items = read();
      return Promise.resolve({ ok: true, status: 200, items: items, item_count: count(items) });
    },
    clear: function () {
      write([]);
    },
  };
})();
