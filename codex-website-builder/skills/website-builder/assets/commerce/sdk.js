(function () {
  "use strict";

  var _data = [];
  var _cfg = { currency: "USD", locale: "en-US" };

  function fmtPrice(val) {
    if (val == null) return "";
    return new Intl.NumberFormat(_cfg.locale, {
      style: "currency",
      currency: _cfg.currency,
      minimumFractionDigits: 2,
      maximumFractionDigits: 2,
    }).format(val);
  }

  // ------- QueryBuilder -------
  function QueryBuilder(items) {
    this._items = items ? items.slice() : [];
  }

  QueryBuilder.prototype.filter = function (criteria) {
    var self = this;
    this._items = this._items.filter(function (item) {
      for (var key in criteria) {
        if (!criteria.hasOwnProperty(key)) continue;
        var val = criteria[key];
        if (key === "rating" && val && typeof val.min === "number") {
          if ((item.rating || 0) < val.min) return false;
          continue;
        }
        if (key === "priceRange") {
          if (val.min !== undefined && item.final_price < val.min) return false;
          if (val.max !== undefined && item.final_price > val.max) return false;
          continue;
        }
        var itemVal = item[key];
        if (typeof val === "string") {
          if (itemVal !== val) return false;
        } else if (Array.isArray(val)) {
          if (val.indexOf(itemVal) === -1) return false;
        }
      }
      return true;
    });
    return this;
  };

  QueryBuilder.prototype.sort = function (field, order) {
    var dir = order === "desc" ? -1 : 1;
    this._items.sort(function (a, b) {
      var va = a[field] || 0,
        vb = b[field] || 0;
      if (typeof va === "string") return dir * va.localeCompare(vb);
      return dir * (va - vb);
    });
    return this;
  };

  QueryBuilder.prototype.limit = function (n) {
    this._items = this._items.slice(0, n);
    return this;
  };

  QueryBuilder.prototype.slice = function (start, end) {
    this._items = this._items.slice(start, end);
    return this;
  };

  QueryBuilder.prototype.result = function () {
    return this._items.map(function (item) {
      var copy = Object.assign({}, item);
      copy.price = fmtPrice(copy.final_price);
      copy.original_price_formatted = copy.original_price
        ? fmtPrice(copy.original_price)
        : "";
      return copy;
    });
  };

  QueryBuilder.prototype.count = function () {
    return this._items.length;
  };

  function _qb(arr) {
    return new QueryBuilder(arr);
  }

  // ------- Public API -------
  var SDK = {
    init: function (data, cfg) {
      if (data) {
        _data = data;
      } else if (window.productData) {
        _data = window.productData;
      } else {
        _data = [];
      }
      if (cfg && cfg.currency) {
        _cfg.currency = cfg.currency;
      }
      if (cfg && cfg.locale) {
        _cfg.locale = cfg.locale;
      }
    },

    list: function (opts) {
      var items = _data.slice();
      if (opts) {
        items = _qb(items)
          .filter(opts.filter || {})
          .result();
        if (opts.sort) {
          items = _qb(items).sort(opts.sort.field, opts.sort.order).result();
        }
        if (opts.limit) items = items.slice(0, opts.limit);
      }
      return opts ? items : _qb(items);
    },

    search: function (query) {
      var items = _data.slice();
      if (!query) return _qb(items);
      if (typeof query === "string") {
        var q = query.toLowerCase();
        items = items.filter(function (item) {
          return (
            (item.name && item.name.toLowerCase().indexOf(q) !== -1) ||
            (item.brand && item.brand.toLowerCase().indexOf(q) !== -1) ||
            (item.category && item.category.toLowerCase().indexOf(q) !== -1) ||
            (item.description &&
              item.description.toLowerCase().indexOf(q) !== -1)
          );
        });
      } else {
        for (var key in query) {
          if (!query.hasOwnProperty(key)) continue;
          var v = query[key].toLowerCase();
          items = items.filter(function (item) {
            return item[key] && item[key].toLowerCase().indexOf(v) !== -1;
          });
        }
      }
      return _qb(items);
    },

    deals: function (opts) {
      var items = _data.filter(function (item) {
        return item.original_price && item.original_price > item.final_price;
      });
      opts = opts || {};
      if (opts.sort)
        items = _qb(items).sort(opts.sort.field, opts.sort.order).result();
      if (opts.limit) items = items.slice(0, opts.limit);
      return opts.sort || opts.limit ? _qb(items).result() : _qb(items);
    },

    popular: function (opts) {
      var items = _data.slice().sort(function (a, b) {
        return (b.rating || 0) - (a.rating || 0);
      });
      opts = opts || {};
      if (opts.limit) items = items.slice(0, opts.limit);
      return _qb(items);
    },

    newest: function (opts) {
      var items = _data.slice().sort(function (a, b) {
        return (b.monthly_sales || 0) - (a.monthly_sales || 0);
      });
      opts = opts || {};
      if (opts.limit) items = items.slice(0, opts.limit);
      return _qb(items);
    },

    random: function (seed) {
      var items = _data.slice();
      if (seed) {
        var hash = 0;
        for (var i = 0; i < seed.length; i++) {
          hash = (hash << 5) - hash + seed.charCodeAt(i);
          hash |= 0;
        }
        items.sort(function () {
          return 0.5 - ((Math.sin(hash++) * 10000) % 1);
        });
      } else {
        items.sort(function () {
          return 0.5 - Math.random();
        });
      }
      return _qb(items);
    },

    get: function (id) {
      if (Array.isArray(id)) {
        return _qb(
          _data.filter(function (item) {
            return id.indexOf(item.id) !== -1;
          }),
        );
      }
      var item = _data.find(function (item) {
        return item.id === id;
      });
      if (!item) return null;
      var copy = Object.assign({}, item);
      copy.price = fmtPrice(copy.final_price);
      copy.original_price_formatted = copy.original_price
        ? fmtPrice(copy.original_price)
        : "";
      return copy;
    },

    brands: function (filter) {
      var brands = [];
      _data.forEach(function (item) {
        if (item.brand && brands.indexOf(item.brand) === -1)
          brands.push(item.brand);
      });
      if (filter) {
        var f = filter.toLowerCase();
        return _qb(
          _data.filter(function (item) {
            return item.brand && item.brand.toLowerCase() === f;
          }),
        );
      }
      return brands;
    },

    categories: function (filter) {
      var cats = [];
      _data.forEach(function (item) {
        if (item.category && cats.indexOf(item.category) === -1)
          cats.push(item.category);
      });
      if (filter) {
        var f = filter.toLowerCase();
        return _qb(
          _data.filter(function (item) {
            return item.category && item.category.toLowerCase() === f;
          }),
        );
      }
      return cats;
    },

    price: function (val) {
      return fmtPrice(val);
    },

    count: function (opts) {
      if (opts) {
        return _qb(_data).filter(opts).count();
      }
      return _data.length;
    },
  };

  window.SDK = SDK;
})();
