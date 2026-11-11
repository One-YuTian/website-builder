(function (global) {
  'use strict';
  if (global.Toast && global.Toast.websiteBuilder) return;
  var pending = [], sequence = 0;
  var escape = function (value) { return String(value).replace(/[&<>"']/g, function (char) { return {'&':'&amp;','<':'&lt;','>':'&gt;','"':'&quot;',"'":'&#39;'}[char]; }); };
  class ToastComponent extends HTMLElement {
    constructor() {
      super(); this.items = []; this.timers = new Map(); this.bound = false;
      this.onClick = (event) => { var button = event.target.closest('[data-toast-dismiss]'); if (button && this.contains(button)) this.dismiss(button.dataset.toastDismiss); };
      this.onPause = (event) => { var row = event.target.closest('[data-toast-id]'); if (row && !row.contains(event.relatedTarget)) clearTimeout(this.timers.get(row.dataset.toastId)); };
      this.onResume = (event) => { var row = event.target.closest('[data-toast-id]'); if (row && !row.contains(event.relatedTarget)) { var item = this.items.find(item => item.id === row.dataset.toastId); if (item) this.arm(item); } };
    }
    connectedCallback() {
      if (this.bound) return; this.bound = true;
      this.className = 'pointer-events-none fixed right-4 top-4 z-[100] flex w-[calc(100%-2rem)] max-w-sm flex-col gap-2';
      this.addEventListener('click', this.onClick);
      this.addEventListener('mouseover', this.onPause); this.addEventListener('focusin', this.onPause);
      this.addEventListener('mouseout', this.onResume); this.addEventListener('focusout', this.onResume);
      this.refresh(); this.items.forEach(item => this.arm(item));
    }
    disconnectedCallback() {
      this.removeEventListener('click', this.onClick);
      this.removeEventListener('mouseover', this.onPause); this.removeEventListener('focusin', this.onPause);
      this.removeEventListener('mouseout', this.onResume); this.removeEventListener('focusout', this.onResume);
      this.timers.forEach(timer => clearTimeout(timer)); this.timers.clear(); this.bound = false;
    }
    template(data) {
      var styles = global.uiStyles || {}, close = (global.uiMessages && global.uiMessages.close) || 'Close';
      return data.map(item => '<div data-toast-id="' + escape(item.id) + '" data-type="' + escape(item.type) + '" role="' + (item.type === 'error' ? 'alert' : 'status') + '" aria-live="' + (item.type === 'error' ? 'assertive' : 'polite') + '" aria-atomic="true" class="' + escape(styles.toast || 'pointer-events-auto flex items-start gap-3 border border-outline bg-surface text-content rounded-md px-4 py-3 shadow-lg') + '"><span class="min-w-0 flex-1 break-words text-sm leading-relaxed">' + escape(item.message) + '</span><button type="button" data-toast-dismiss="' + escape(item.id) + '" class="' + escape(styles.toastClose || 'shrink-0 rounded-md px-2 py-1 text-xs hover:bg-accent focus-visible:outline focus-visible:outline-2 focus-visible:outline-primary') + '">' + escape(close) + '</button></div>').join('');
    }
    refresh() { this.innerHTML = this.template(this.items); }
    arm(item) { clearTimeout(this.timers.get(item.id)); if (this.isConnected && item.duration > 0) this.timers.set(item.id, setTimeout(() => this.dismiss(item.id), item.duration)); }
    show(item) { if (this.items.length >= 4) this.dismiss(this.items[0].id); this.items.push(item); this.refresh(); this.arm(item); return item.id; }
    dismiss(id) { clearTimeout(this.timers.get(id)); this.timers.delete(id); this.items = this.items.filter(item => item.id !== id); this.refresh(); }
    clear() { this.timers.forEach(timer => clearTimeout(timer)); this.timers.clear(); this.items = []; this.refresh(); }
  }
  if (!customElements.get('toast-component')) customElements.define('toast-component', ToastComponent);
  function host() {
    if (!document.body) return null;
    var element = document.querySelector('toast-component');
    if (!element) { element = document.createElement('toast-component'); document.body.append(element); }
    return element;
  }
  var Toast = {
    websiteBuilder: true,
    show: function (message, options) {
      options = options || {}; var duration = Number(options.duration);
      var item = {id:String(++sequence), message:String(message), type:options.type || 'info', duration:Number.isFinite(duration) && duration >= 0 ? duration : 4500};
      var element = host(); if (element) element.show(item); else { if (pending.length >= 4) pending.shift(); pending.push(item); }
      return item.id;
    },
    dismiss: function (id) { pending = pending.filter(item => item.id !== id); var element = document.querySelector('toast-component'); if (element) element.dismiss(id); },
    clear: function () { pending = []; var element = document.querySelector('toast-component'); if (element) element.clear(); }
  };
  ['success','error','info','warning'].forEach(function (type) { Toast[type] = function (message, options) { return Toast.show(message, Object.assign({}, options, {type:type})); }; });
  global.Toast = Toast;
  function ready() { var element = host(); if (element) { pending.forEach(item => element.show(item)); pending = []; } }
  if (document.readyState === 'loading') document.addEventListener('DOMContentLoaded', ready, {once:true}); else ready();
})(window);
