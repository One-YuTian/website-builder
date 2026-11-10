/*!
 * ec-sdk.js v1.0.0
 * Adapted frontend demo SDK. Requires Web Crypto for demo account operations.
 * Passwords are salted PBKDF2 hashes; this is not production authentication.
 *
 * Global: window.APP
 * Keys:  user / users / cart / wishlist / orders / coupons
 * IDs:  user.id / cart.id / order.id  -> 32-char uppercase alphanumeric UUID (string)
 */
(function (global) {
  "use strict";

  /* ====== Storage Keys ====== */
  var K_USER = "user";
  var K_USERS = "users";
  var K_CART = "cart";
  var K_WISH = "wishlist";
  var K_ORDERS = "orders";
  var K_COUPONS = "coupons";
  var K_APPLIED = "applied_coupon";

  function storageKey(key) {
    var config = global.commerceConfig || {};
    var scope = config.storageKey || "website-builder-demo";
    if (key === K_CART || key === K_WISH || key === K_APPLIED) {
      var user = null;
      try {
        user = JSON.parse(global.localStorage.getItem(scope + ":" + K_USER));
      } catch (error) {}
      key += ":" + (user ? user.id : "guest");
    }
    return scope + ":" + key;
  }

  function publicUser(user) {
    if (!user) return null;
    return {
      id: user.id,
      username: user.username,
      email: user.email,
      phone: user.phone,
      ext: user.ext,
    };
  }

  async function passwordHash(password, salt) {
    if (!global.crypto || !global.crypto.subtle) {
      throw new Error("Demo accounts require Web Crypto in a secure context");
    }
    var key = await global.crypto.subtle.importKey(
      "raw",
      new TextEncoder().encode(password),
      "PBKDF2",
      false,
      ["deriveBits"],
    );
    var bits = await global.crypto.subtle.deriveBits(
      {
        name: "PBKDF2",
        salt: new Uint8Array(salt),
        iterations: 100000,
        hash: "SHA-256",
      },
      key,
      256,
    );
    return Array.from(new Uint8Array(bits))
      .map(function (byte) {
        return byte.toString(16).padStart(2, "0");
      })
      .join("");
  }

  /* ====== Internal Storage Helpers ====== */
  function _get(key, def) {
    try {
      var raw = global.localStorage.getItem(storageKey(key));
      return raw ? JSON.parse(raw) : def === undefined ? null : def;
    } catch (e) {
      return def === undefined ? null : def;
    }
  }
  function _set(key, val) {
    try {
      global.localStorage.setItem(storageKey(key), JSON.stringify(val));
    } catch (e) {}
  }
  function _del(key) {
    try {
      global.localStorage.removeItem(storageKey(key));
    } catch (e) {}
  }

  /* ====== Event System ====== */
  var _events = {};
  function _on(event, handler) {
    if (!_events[event]) {
      _events[event] = [];
    }
    _events[event].push(handler);
    return APP;
  }
  function _off(event, handler) {
    if (!_events[event]) {
      return APP;
    }
    if (!handler) {
      _events[event] = [];
      return APP;
    }
    var arr = _events[event];
    for (var i = 0; i < arr.length; i++) {
      if (arr[i] === handler) {
        arr.splice(i, 1);
        break;
      }
    }
    return APP;
  }
  function _emit(event, data) {
    var arr = _events[event];
    if (!arr) {
      return;
    }
    for (var i = 0; i < arr.length; i++) {
      try {
        arr[i](data || {});
      } catch (e) {}
    }
  }

  /* ====== utils ====== */
  var _UUID_CHARS = "ABCDEFGHIJKLMNOPQRSTUVWXYZ0123456789";
  var utils = {
    id: function () {
      var s = "";
      for (var i = 0; i < 32; i++) {
        s += _UUID_CHARS.charAt(Math.floor(Math.random() * _UUID_CHARS.length));
      }
      return s;
    },
    now: function () {
      return new Date().toISOString();
    },
    on: function (event, el, fn) {
      if (el && el.addEventListener) {
        el.addEventListener(event, fn, false);
      } else if (el && el.attachEvent) {
        el.attachEvent("on" + event, fn);
      } else if (global.attachEvent) {
        global.attachEvent("on" + event, fn);
      }
      return utils;
    },
    storage: {
      get: function (key) {
        return _get(key, null);
      },
      set: function (key, val) {
        _set(key, val);
        return utils;
      },
      remove: function (key) {
        _del(key);
        return utils;
      },
    },
  };

  /* ====== Error Codes ====== */
  var E = {
    ACCOUNT_EMAIL_REGISTERED: 1001,
    ACCOUNT_INVALID_CREDENTIALS: 1002,
    ACCOUNT_NOT_LOGGED_IN: 1003,
    CART_NOT_LOGGED_IN: 2001,
    CART_PRODUCT_NOT_FOUND: 2002,
    WISHLIST_NOT_LOGGED_IN: 3001,
    ORDER_NOT_LOGGED_IN: 4001,
    ORDER_CART_EMPTY: 4002,
    ORDER_NOT_FOUND: 4003,
    ORDER_CANNOT_CANCEL: 4004,
    COUPON_NOT_FOUND: 5001,
    COUPON_ALREADY_USED: 5002,
    COUPON_INSUFFICIENT_TOTAL: 5003,
  };
  function _err(code, message) {
    return { success: false, code: code, message: message };
  }

  /* ====== Module Factory ====== */
  function module2() {
    return this;
  }

  /* ====== account ====== */
  var account = {
    register: async function (data) {
      if (
        !data ||
        !data.email ||
        typeof data.password !== "string" ||
        data.password.length < 8
      ) {
        return _err(
          1004,
          "email and a password of at least 8 characters are required",
        );
      }
      data.email = String(data.email).trim().toLowerCase();
      var users = _get(K_USERS, []);
      var i,
        existing = null;
      for (i = 0; i < users.length; i++) {
        if (users[i].email === data.email) {
          existing = users[i];
          break;
        }
      }
      if (existing) {
        var er = _err(E.ACCOUNT_EMAIL_REGISTERED, "email already registered");
        _emit("ACCOUNT_REGISTER", er);
        return er;
      }
      var user = {
        id: utils.id(),
        username: data.username || "",
        email: data.email || "",
        phone: data.phone || "",
        salt: Array.from(global.crypto.getRandomValues(new Uint8Array(16))),
        ext: data.ext || {},
      };
      user.passwordhash = await passwordHash(data.password, user.salt);
      users.push(user);
      _set(K_USERS, users);
      var visible = publicUser(user);
      _set(K_USER, visible);
      _emit("ACCOUNT_REGISTER", { success: true, user: visible });
      return { success: true, user: visible };
    },
    login: async function (email, password) {
      email = String(email || "")
        .trim()
        .toLowerCase();
      var users = _get(K_USERS, []);
      var i,
        user = null;
      for (i = 0; i < users.length; i++) {
        if (
          users[i].email === email &&
          users[i].salt &&
          users[i].passwordhash ===
            (await passwordHash(String(password || ""), users[i].salt))
        ) {
          user = users[i];
          break;
        }
      }
      if (!user) {
        var er = _err(
          E.ACCOUNT_INVALID_CREDENTIALS,
          "invalid email or password",
        );
        _emit("ACCOUNT_LOGIN", er);
        return er;
      }
      var visible = publicUser(user);
      _set(K_USER, visible);
      _emit("ACCOUNT_LOGIN", { success: true, user: visible });
      return { success: true, user: visible };
    },
    logout: function () {
      _del(K_USER);
      _emit("ACCOUNT_LOGOUT", {});
      return account;
    },
    logged: function () {
      return _get(K_USER, null) !== null;
    },
    current: function () {
      return _get(K_USER, null);
    },
    update: async function (data) {
      var user = _get(K_USER, null);
      if (!user) {
        return _err(E.ACCOUNT_NOT_LOGGED_IN, "not logged in");
      }
      if (data.username !== undefined) {
        user.username = data.username;
      }
      if (data.phone !== undefined) {
        user.phone = data.phone;
      }
      if (
        data.password !== undefined &&
        (typeof data.password !== "string" || data.password.length < 8)
      ) {
        return _err(1004, "password must contain at least 8 characters");
      }
      if (data.ext !== undefined) {
        user.ext = data.ext;
      }
      _set(K_USER, user);
      var users = _get(K_USERS, []);
      for (var i = 0; i < users.length; i++) {
        if (users[i].id === user.id) {
          if (data.password !== undefined) {
            users[i].salt = Array.from(
              global.crypto.getRandomValues(new Uint8Array(16)),
            );
            users[i].passwordhash = await passwordHash(
              data.password,
              users[i].salt,
            );
          }
          Object.assign(users[i], user);
          break;
        }
      }
      _set(K_USERS, users);
      _emit("ACCOUNT_UPDATE", { success: true, user: user });
      return { success: true, user: user };
    },
    delete: function () {
      var user = _get(K_USER, null);
      if (!user) {
        var er = _err(E.ACCOUNT_NOT_LOGGED_IN, "not logged in");
        _emit("ACCOUNT_DELETE", er);
        return er;
      }
      var users = _get(K_USERS, []);
      var filtered = [];
      for (var i = 0; i < users.length; i++) {
        if (users[i].id !== user.id) {
          filtered.push(users[i]);
        }
      }
      _set(K_USERS, filtered);
      _del(K_CART);
      _del(K_WISH);
      _del(K_APPLIED);
      _del(K_USER);
      var orders = _get(K_ORDERS, []);
      var kept = [];
      for (var j = 0; j < orders.length; j++) {
        if (orders[j].userid !== user.id) {
          kept.push(orders[j]);
        }
      }
      _set(K_ORDERS, kept);
      _emit("ACCOUNT_DELETE", { success: true, message: "account deleted" });
      return { success: true, message: "account deleted" };
    },
    list: function () {
      return _get(K_USERS, []).map(publicUser);
    },
    exists: function (email) {
      var users = _get(K_USERS, []);
      for (var i = 0; i < users.length; i++) {
        if (
          users[i].email ===
          String(email || "")
            .trim()
            .toLowerCase()
        ) {
          return true;
        }
      }
      return false;
    },
  };

  /* ====== cart ====== */
  function _cartList() {
    if (!account.logged()) {
      return [];
    }
    return _get(K_CART, []);
  }
  function _cartSave(cart) {
    if (!account.logged()) {
      return;
    }
    _set(K_CART, cart);
  }

  var cart = {
    add: function (product, qty) {
      if (!account.logged()) {
        _emit(
          "CART_ADD",
          _err(E.CART_NOT_LOGGED_IN, "not logged in, cart operation ignored"),
        );
        return cart;
      }
      qty = qty || 1;
      var list2 = _cartList();
      var pid = String(product.id);
      var i,
        found = null;
      for (i = 0; i < list2.length; i++) {
        if (list2[i].productid === pid) {
          found = list2[i];
          break;
        }
      }
      if (found) {
        found.qty += qty;
      } else {
        list2.push({
          id: utils.id(),
          productid: pid,
          name: product.name || "",
          image: product.image || "",
          price: product.price || 0,
          qty: qty,
        });
      }
      _cartSave(list2);
      _emit("CART_ADD", { product: product, qty: qty });
      return cart;
    },
    list: function () {
      return _cartList();
    },
    get: function (id) {
      var list2 = _cartList();
      for (var i = 0; i < list2.length; i++) {
        if (list2[i].id === id) {
          return list2[i];
        }
      }
      return null;
    },
    update: function (id, qty) {
      if (!account.logged()) {
        _emit(
          "CART_UPDATE",
          _err(E.CART_NOT_LOGGED_IN, "not logged in, cart operation ignored"),
        );
        return cart;
      }
      var list2 = _cartList();
      var found = false;
      for (var i = 0; i < list2.length; i++) {
        if (list2[i].id === id) {
          found = true;
          if (qty <= 0) {
            list2.splice(i, 1);
          } else {
            list2[i].qty = qty;
          }
          break;
        }
      }
      _cartSave(list2);
      if (found) {
        _emit("CART_UPDATE", { id: id, qty: qty });
      } else {
        _emit(
          "CART_UPDATE",
          _err(E.CART_PRODUCT_NOT_FOUND, "product not found in cart"),
        );
      }
      return cart;
    },
    delete: function (id) {
      if (!account.logged()) {
        _emit(
          "CART_DELETE",
          _err(E.CART_NOT_LOGGED_IN, "not logged in, cart operation ignored"),
        );
        return cart;
      }
      var list2 = _cartList();
      var found = false;
      for (var i = 0; i < list2.length; i++) {
        if (list2[i].id === id) {
          list2.splice(i, 1);
          found = true;
          break;
        }
      }
      _cartSave(list2);
      if (found) {
        _emit("CART_DELETE", { id: id });
      } else {
        _emit(
          "CART_DELETE",
          _err(E.CART_PRODUCT_NOT_FOUND, "product not found in cart"),
        );
      }
      return cart;
    },
    clear: function () {
      if (!account.logged()) {
        _emit(
          "CART_CLEAR",
          _err(E.CART_NOT_LOGGED_IN, "not logged in, cart operation ignored"),
        );
        return cart;
      }
      _cartSave([]);
      _emit("CART_CLEAR", {});
      return cart;
    },
    count: function () {
      var list2 = _cartList();
      var c = 0;
      for (var i = 0; i < list2.length; i++) {
        c += list2[i].qty;
      }
      return c;
    },
    total: function () {
      var list2 = _cartList();
      var s = 0;
      for (var i = 0; i < list2.length; i++) {
        s += list2[i].price * list2[i].qty;
      }
      return s;
    },
    empty: function () {
      return _cartList().length === 0;
    },
    has: function (id) {
      return cart.get(id) !== null;
    },
    qty: function (id) {
      var item = cart.get(id);
      return item ? item.qty : 0;
    },
  };

  /* ====== wishlist ====== */
  function _wishList() {
    if (!account.logged()) {
      return [];
    }
    return _get(K_WISH, []);
  }
  function _wishSave(list2) {
    if (!account.logged()) {
      return;
    }
    _set(K_WISH, list2);
  }

  var wishlist = {
    add: function (productid) {
      if (!account.logged()) {
        _emit(
          "WISHLIST_ADD",
          _err(
            E.WISHLIST_NOT_LOGGED_IN,
            "not logged in, wishlist operation ignored",
          ),
        );
        return wishlist;
      }
      var list2 = _wishList();
      var found = false;
      for (var i = 0; i < list2.length; i++) {
        if (list2[i] === productid) {
          found = true;
          break;
        }
      }
      if (!found) {
        list2.push(productid);
        _wishSave(list2);
        _emit("WISHLIST_ADD", { productid: productid });
      }
      return wishlist;
    },
    list: function () {
      return _wishList();
    },
    has: function (productid) {
      var list2 = _wishList();
      for (var i = 0; i < list2.length; i++) {
        if (list2[i] === productid) {
          return true;
        }
      }
      return false;
    },
    delete: function (productid) {
      if (!account.logged()) {
        _emit(
          "WISHLIST_DELETE",
          _err(
            E.WISHLIST_NOT_LOGGED_IN,
            "not logged in, wishlist operation ignored",
          ),
        );
        return wishlist;
      }
      var list2 = _wishList();
      for (var i = 0; i < list2.length; i++) {
        if (list2[i] === productid) {
          list2.splice(i, 1);
          break;
        }
      }
      _wishSave(list2);
      _emit("WISHLIST_DELETE", { productid: productid });
      return wishlist;
    },
    clear: function () {
      if (!account.logged()) {
        _emit(
          "WISHLIST_CLEAR",
          _err(
            E.WISHLIST_NOT_LOGGED_IN,
            "not logged in, wishlist operation ignored",
          ),
        );
        return wishlist;
      }
      _wishSave([]);
      _emit("WISHLIST_CLEAR", {});
      return wishlist;
    },
    count: function () {
      return _wishList().length;
    },
    empty: function () {
      return _wishList().length === 0;
    },
    toggle: function (productid) {
      if (!account.logged()) {
        _emit(
          "WISHLIST_TOGGLE",
          _err(
            E.WISHLIST_NOT_LOGGED_IN,
            "not logged in, wishlist operation ignored",
          ),
        );
        return wishlist;
      }
      var list2 = _wishList();
      var found = false;
      for (var i = 0; i < list2.length; i++) {
        if (list2[i] === productid) {
          list2.splice(i, 1);
          _wishSave(list2);
          _emit("WISHLIST_TOGGLE", { productid: productid, added: false });
          found = true;
          break;
        }
      }
      if (!found) {
        list2.push(productid);
        _wishSave(list2);
        _emit("WISHLIST_TOGGLE", { productid: productid, added: true });
      }
      return wishlist;
    },
  };

  /* ====== coupon ====== */
  function _coupons() {
    return _get(K_COUPONS, []);
  }
  function _couponsSave(list2) {
    _set(K_COUPONS, list2);
  }

  var coupon = {
    create: function (data) {
      var list2 = _coupons();
      var existing = null;
      for (var i = 0; i < list2.length; i++) {
        if (list2[i].code === data.code) {
          existing = list2[i];
          break;
        }
      }
      if (existing) {
        existing.amount = data.amount;
      } else {
        list2.push({ code: data.code, amount: data.amount, used: false });
      }
      _couponsSave(list2);
      _emit("COUPON_CREATE", { code: data.code, amount: data.amount });
      return coupon;
    },
    list: function () {
      return _coupons();
    },
    get: function (code) {
      var list2 = _coupons();
      for (var i = 0; i < list2.length; i++) {
        if (list2[i].code === code) {
          return list2[i];
        }
      }
      return null;
    },
    apply: function (code) {
      var c = coupon.get(code);
      if (!c) {
        var er1 = _err(E.COUPON_NOT_FOUND, "coupon not found");
        _emit("COUPON_APPLY", er1);
        return er1;
      }
      if (c.used) {
        var er2 = _err(E.COUPON_ALREADY_USED, "coupon already used");
        _emit("COUPON_APPLY", er2);
        return er2;
      }
      var total = cart.total();
      if (total <= c.amount) {
        var er3 = _err(
          E.COUPON_INSUFFICIENT_TOTAL,
          "cart total must be greater than coupon amount",
        );
        _emit("COUPON_APPLY", er3);
        return er3;
      }
      _set(K_APPLIED, c);
      _emit("COUPON_APPLY", { success: true, code: code, discount: c.amount });
      return { success: true, discount: c.amount };
    },
    remove: function () {
      _del(K_APPLIED);
      _emit("COUPON_REMOVE", {});
      return coupon;
    },
    applied: function () {
      return _get(K_APPLIED, null);
    },
    calculate: function (total) {
      var ap = coupon.applied();
      if (!ap || ap.used) {
        return total;
      }
      var after = total - ap.amount;
      return after < 0 ? 0 : after;
    },
    available: function (total) {
      var list2 = _coupons();
      var result = [];
      for (var i = 0; i < list2.length; i++) {
        var c = list2[i];
        if (!c.used) {
          if (total === undefined || total === null || total > c.amount) {
            result.push(c);
          }
        }
      }
      return result;
    },
    use: function (code) {
      var list2 = _coupons();
      for (var i = 0; i < list2.length; i++) {
        if (list2[i].code === code) {
          list2[i].used = true;
          _couponsSave(list2);
          _del(K_APPLIED);
          _emit("COUPON_USE", { code: code });
          return;
        }
      }
    },
    delete: function (code) {
      var list2 = _coupons();
      for (var i = 0; i < list2.length; i++) {
        if (list2[i].code === code) {
          list2.splice(i, 1);
          break;
        }
      }
      _couponsSave(list2);
      _emit("COUPON_DELETE", { code: code });
      return coupon;
    },
  };

  /* ====== order ====== */
  var order = {
    uuid: function () {
      return utils.id();
    },
    create: function (data) {
      var user = account.current();
      if (!user) {
        var failUser = _err(E.ORDER_NOT_LOGGED_IN, "please login first");
        _emit("ORDER_CREATE", failUser);
        return failUser;
      }
      var cartItems = cart.list();
      if (cartItems.length === 0) {
        var failEmpty = _err(E.ORDER_CART_EMPTY, "cart is empty");
        _emit("ORDER_CREATE", failEmpty);
        return failEmpty;
      }
      var subtotal = cart.total();
      var ap = coupon.applied();
      var discount = 0;
      var couponCode = "";
      if (ap && !ap.used && subtotal > ap.amount) {
        discount = ap.amount;
        couponCode = ap.code;
      }
      var total = subtotal - discount;
      var newOrder = {
        id: utils.id(),
        userid: user.id,
        items: (function () {
          var snapshot = [];
          for (var i = 0; i < cartItems.length; i++) {
            snapshot.push({
              productid: cartItems[i].productid,
              name: cartItems[i].name,
              image: cartItems[i].image,
              price: cartItems[i].price,
              qty: cartItems[i].qty,
            });
          }
          return snapshot;
        })(),
        ext: data.ext || {},
        paymentmethod: data.paymentmethod || "cod",
        subtotal: subtotal,
        discount: discount,
        total: total,
        coupon: couponCode
          ? { code: couponCode, amount: discount, used: true }
          : null,
        status: "pending",
        orderdate: utils.now(),
        notes: data.notes || "",
      };
      var orders = _get(K_ORDERS, []);
      orders.push(newOrder);
      _set(K_ORDERS, orders);
      if (couponCode) {
        coupon.use(couponCode);
      }
      cart.clear();
      _emit("ORDER_CREATE", { success: true, order: newOrder });
      return { success: true, order: newOrder };
    },
    list: function (filter) {
      var user = account.current();
      if (!user) {
        return [];
      }
      var orders = _get(K_ORDERS, []);
      var result = [];
      for (var i = 0; i < orders.length; i++) {
        if (orders[i].userid !== user.id) {
          continue;
        }
        if (filter && filter.status && orders[i].status !== filter.status) {
          continue;
        }
        result.push(orders[i]);
      }
      result.sort(function (a, b) {
        return a.orderdate < b.orderdate ? 1 : -1;
      });
      if (filter) {
        if (filter.page && filter.limit) {
          var start = (filter.page - 1) * filter.limit;
          result = result.slice(start, start + filter.limit);
        }
      }
      return result;
    },
    get: function (orderid) {
      var user = account.current();
      if (!user) {
        return null;
      }
      var orders = _get(K_ORDERS, []);
      for (var i = 0; i < orders.length; i++) {
        if (orders[i].userid === user.id && orders[i].id === orderid) {
          return orders[i];
        }
      }
      return null;
    },
    cancel: function (orderid) {
      var user = account.current();
      if (!user) {
        var erl = _err(E.ORDER_NOT_LOGGED_IN, "please login first");
        _emit("ORDER_CANCEL", {
          success: false,
          code: erl.code,
          message: erl.message,
          orderid: orderid,
        });
        return erl;
      }
      var orders = _get(K_ORDERS, []);
      for (var i = 0; i < orders.length; i++) {
        if (orders[i].userid === user.id && orders[i].id === orderid) {
          if (orders[i].status !== "pending") {
            var erc = _err(
              E.ORDER_CANNOT_CANCEL,
              "only pending orders can be cancelled",
            );
            _emit("ORDER_CANCEL", {
              success: false,
              code: erc.code,
              message: erc.message,
              orderid: orderid,
            });
            return erc;
          }
          orders[i].status = "cancelled";
          _set(K_ORDERS, orders);
          _emit("ORDER_CANCEL", {
            success: true,
            message: "order cancelled",
            orderid: orderid,
          });
          return { success: true, message: "order cancelled" };
        }
      }
      var erf = _err(E.ORDER_NOT_FOUND, "order not found");
      _emit("ORDER_CANCEL", {
        success: false,
        code: erf.code,
        message: erf.message,
        orderid: orderid,
      });
      return erf;
    },
    count: function (filter) {
      var list2 = order.list(filter);
      return list2.length;
    },
  };

  /* ====== Global Mount ====== */
  var APP = {
    version: "1.0.0",
    account: account,
    cart: cart,
    wishlist: wishlist,
    order: order,
    coupon: coupon,
    utils: utils,
    on: _on,
    off: _off,
  };

  global.APP = APP;
})(typeof window !== "undefined" ? window : this);
