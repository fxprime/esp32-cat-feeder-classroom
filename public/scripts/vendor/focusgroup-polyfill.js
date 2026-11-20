var n = {
  INFERRED_ROLE: "data-fg-ir",
  ITEM: "data-fg-item",
  AUTHOR_TABINDEX: "data-fg-ati",
  SEGMENT: "data-fg-seg",
  SEGMENT_START: "data-fg-segs"
}, c = {
  TOOLBAR: "toolbar",
  TABLIST: "tablist",
  RADIOGROUP: "radiogroup",
  LISTBOX: "listbox",
  MENU: "menu",
  MENUBAR: "menubar",
  NONE: "none"
}, P = [
  c.TOOLBAR,
  c.TABLIST,
  c.RADIOGROUP,
  c.LISTBOX,
  c.MENU,
  c.MENUBAR,
  c.NONE
], _ = {
  toolbar: {
    ownerRole: "toolbar",
    childRole: null,
    wrap: !1,
    axis: "inline"
  },
  tablist: {
    ownerRole: "tablist",
    childRole: "tab",
    wrap: !0,
    axis: "inline"
  },
  radiogroup: {
    ownerRole: "radiogroup",
    childRole: "radio",
    wrap: !0,
    axis: void 0
  },
  listbox: {
    ownerRole: "listbox",
    childRole: "option",
    wrap: !1,
    axis: "block"
  },
  menu: {
    ownerRole: "menu",
    childRole: "menuitem",
    wrap: !0,
    axis: "block"
  },
  menubar: {
    ownerRole: "menubar",
    childRole: "menuitem",
    wrap: !0,
    axis: "inline"
  }
};
function R(t, e) {
  if (!t || !e) return null;
  if (t instanceof ShadowRoot) return R(t.host, e);
  const i = t.assignedSlot;
  return i ? t.matches(e) ? t : R(i, e) : t.closest(e) ?? (t.getRootNode() instanceof ShadowRoot ? R(t.getRootNode().host, e) : null);
}
function N(t, e) {
  if (!t || !e) return !1;
  let i = e;
  for (; i; ) {
    if (i === t) return !0;
    typeof i.assignedElements != "function" && i.assignedSlot?.parentNode ? i = i.assignedSlot?.parentNode : i.nodeType === document.DOCUMENT_FRAGMENT_NODE ? i = i.host : i = i.parentNode;
  }
  return !1;
}
function S(t) {
  if (!t) return null;
  if (typeof t.assignedElements != "function" && t.assignedSlot) return t.assignedSlot;
  const e = t.getRootNode();
  return e instanceof ShadowRoot ? t.parentElement ?? e.host : t.parentElement;
}
function I(t) {
  return t ? t.lastElementChild ?? I(t.shadowRoot) : null;
}
function B(t) {
  let e = null;
  for (let i = I(t); i; i = I(i)) e = i;
  return e;
}
var U = class {
  filter;
  root;
  whatToShow;
  get currentNode() {
    return this.#t;
  }
  set currentNode(t) {
    if (!N(this.root, t)) throw new Error("Cannot set currentNode to a node that is not contained by the root node.");
    this.#t = t, this.#i = null, this.#r = null, this.#h(), this.#n = !1;
  }
  /** @type {Document} */
  #e;
  /** @type {Node} */
  #t;
  /** @type {Array<{walker: TreeWalker, hostNode: Element|null}> | null} */
  #i = null;
  /** @type {Array<{walker: TreeWalker, hostNode: Element|null}> | null} */
  #r = null;
  /** @type {Element[]} */
  #s = [];
  /**
  * Tracks slotted elements whose children have been queued
  * @type {WeakSet<Element>}
  */
  #o = /* @__PURE__ */ new WeakSet();
  /** @type {boolean} */
  #n = !0;
  constructor(t, e, i, s) {
    this.#e = t, this.root = e, this.filter = s ?? null, this.whatToShow = i ?? NodeFilter.SHOW_ALL, this.#t = e;
  }
  nextNode() {
    this.#n || (this.#i = null, this.#h(), this.#n = !0), this.#i === null && (this.#i = this.#u(!0));
    const t = this.#t, e = this.#f();
    return e === null && (this.#t = t, this.#i = null, this.#h()), e;
  }
  previousNode() {
    this.#n && (this.#r = null, this.#h(), this.#n = !1), this.#r === null && (this.#r = this.#u(!1));
    const t = this.#t, e = this.#E();
    return e === null && (this.#t = t, this.#r = null, this.#h()), e;
  }
  #h() {
    this.#s = [], this.#o = /* @__PURE__ */ new WeakSet();
  }
  #l = (t) => typeof this.filter == "function" ? this.filter(t) : this.filter?.acceptNode ? this.filter.acceptNode(t) : NodeFilter.FILTER_ACCEPT;
  /**
  * Creates a native TreeWalker scoped to the given root, using the
  * direction-specific filter produced by `#makeFilter`.
  * @param {Node} root
  * @param {boolean} isForward
  * @returns {TreeWalker}
  */
  #a(t, e) {
    return this.#e.createTreeWalker(t, this.whatToShow, { acceptNode: this.#d(e) });
  }
  /**
  * Returns a filter callback for native TreeWalker nodes.
  *
  * Both directions accept shadow hosts and apply `#filterNode` to regular
  * elements. The only difference is a side effect: forward filters push a
  * new shadow walker onto `#forwardStack` when a shadow host is encountered
  * (the backward path handles shadow entry explicitly in `#walkBackward`).
  *
  * @param {boolean} isForward
  */
  #d(t) {
    return (e) => {
      if (e.nodeType === Node.ELEMENT_NODE) {
        if (e.parentNode?.shadowRoot) return NodeFilter.FILTER_REJECT;
        if (e.localName === "slot" && e.getRootNode() instanceof ShadowRoot) return NodeFilter.FILTER_ACCEPT;
        const i = e.shadowRoot;
        if (i) {
          if (t) {
            const s = this.#i[0];
            if (!s || s.walker.root !== i) {
              const o = this.#a(i, !0);
              this.#i.unshift({
                walker: o,
                hostNode: e
              });
            }
          }
          return NodeFilter.FILTER_ACCEPT;
        } else return this.#l(e);
      }
      return NodeFilter.FILTER_SKIP;
    };
  }
  /**
  * Builds a direction-specific stack from `#currentNode` by walking up
  * through shadow roots to the walker's `root`.
  *
  * The stack is ordered innermost-first: index 0 is the walker whose root
  * contains `#currentNode` directly.
  *
  * @param {boolean} isForward
  * @returns {Array<{walker: TreeWalker, hostNode: Element|null}>}
  */
  #u(t) {
    N(this.root, this.#t) || (this.#t = this.root);
    const e = [];
    let i = this.#t, s = this.#t;
    const o = (a) => {
      const l = a.assignedSlot;
      if (!l || !N(this.root, l)) return [];
      const u = [...l.assignedElements({ flatten: !0 })], f = u.indexOf(a);
      let b = [];
      return t ? f >= 0 && f < u.length - 1 && (b = u.slice(f + 1)) : f > 0 && (b = u.slice(0, f).reverse()), i = s = l, b;
    }, r = o(this.#t);
    for (this.#s = r; i && i !== this.root; ) if (i.nodeType === Node.DOCUMENT_FRAGMENT_NODE) {
      const a = i, l = this.#a(a, t);
      l.currentNode = s, e.push({
        walker: l,
        hostNode: a.host
      }), i = s = a.host;
      const u = o(i);
      u.length && (e[e.length - 1].savedSlotted = u);
    } else i = i.parentNode;
    const h = this.#a(this.root, t);
    h.currentNode = s, e.push({
      walker: h,
      hostNode: null
    });
    const d = this.root.shadowRoot;
    if (d && !e.some((a) => a.walker.root === d)) {
      const a = this.#a(d, t);
      e.unshift({
        walker: a,
        hostNode: this.root
      });
    }
    if (t && this.#t !== this.root) {
      const a = this.#t.shadowRoot;
      if (a && !e.some((l) => l.walker.root === a)) {
        const l = {
          walker: this.#a(a, t),
          hostNode: this.#t
        };
        r.length && (l.savedSlotted = r, this.#s = []), e.unshift(l);
      }
    }
    return e;
  }
  /**
  * Forward traversal engine. Operates on `#forwardStack`.
  * Functionally identical to the old `nextNode()` body.
  */
  #f() {
    for (; ; ) {
      if (this.#s.length > 0) {
        const i = this.#s.shift();
        if (i.shadowRoot) {
          const o = this.#l(i);
          if (o === NodeFilter.FILTER_REJECT) continue;
          const r = i.shadowRoot, h = this.#a(r, !0), d = this.#s;
          if (this.#s = [], this.#i.unshift({
            walker: h,
            hostNode: i,
            savedSlotted: d
          }), o === NodeFilter.FILTER_ACCEPT)
            return this.#t = i, i;
          continue;
        }
        const s = this.#l(i);
        if (s !== NodeFilter.FILTER_REJECT && i.firstElementChild && this.#s.unshift(...i.children), s === NodeFilter.FILTER_ACCEPT)
          return this.#t = i, i;
        continue;
      }
      const t = this.#i[0];
      if (!t) return null;
      const e = t.walker.nextNode();
      if (e) {
        if (e.localName === "slot") {
          this.#s = [...e.assignedElements({ flatten: !0 })];
          continue;
        }
        if (e.shadowRoot) {
          if (this.#l(e) === NodeFilter.FILTER_ACCEPT)
            return this.#t = e, e;
          continue;
        }
        return this.#t = e, e;
      } else if (this.#i.length > 1) {
        const i = this.#i.shift();
        i.savedSlotted?.length && (this.#s = i.savedSlotted);
      } else return null;
    }
  }
  /**
  * Backward traversal engine. Operates on `#backwardStack`.
  *
  * Unlike `#walkForward()`, this does NOT rely on filter side effects to
  * push shadow walkers. Instead, when a shadow host is encountered via
  * native `previousNode()`, it explicitly creates and pushes a shadow walker
  * positioned at the last descendant of the shadow root, then recurses.
  *
  * When a shadow walker is exhausted, the host is returned (if accepted by
  * the user filter), because in reverse tree order shadow children come
  * before the host.
  */
  #E() {
    for (; ; ) {
      if (this.#s.length > 0) {
        const i = this.#s.shift();
        if (i.shadowRoot) {
          if (this.#l(i) === NodeFilter.FILTER_REJECT) continue;
          this.#t = i;
          const o = this.#s;
          this.#s = [], this.#r.unshift({
            walker: this.#a(i.shadowRoot, !1),
            hostNode: i,
            savedSlotted: o
          });
          continue;
        }
        const s = this.#l(i);
        if (s === NodeFilter.FILTER_REJECT) continue;
        if (i.firstElementChild && !this.#o.has(i)) {
          this.#o.add(i), this.#s.unshift(...[...i.children].reverse(), i);
          continue;
        }
        if (s === NodeFilter.FILTER_ACCEPT)
          return this.#t = i, i;
        continue;
      }
      const t = this.#r[0];
      if (!t) return null;
      if (t.walker.currentNode === t.walker.root && t.walker.root !== this.root) {
        const i = B(t.walker.root);
        if (i) {
          if (t.walker.currentNode = i, i.localName === "slot") {
            this.#s = [...i.assignedElements({ flatten: !0 })].reverse();
            continue;
          }
          if (i.shadowRoot) {
            this.#t = i, this.#r.unshift({
              walker: this.#a(i.shadowRoot, !1),
              hostNode: i
            });
            continue;
          }
          if (this.#l(i) === NodeFilter.FILTER_ACCEPT)
            return this.#t = i, i;
        }
      }
      const e = t.walker.previousNode();
      if (e) {
        if (e.localName === "slot") {
          this.#s = [...e.assignedElements({ flatten: !0 })].reverse();
          continue;
        }
        if (e.shadowRoot) {
          this.#t = e, this.#r.unshift({
            walker: this.#a(e.shadowRoot, !1),
            hostNode: e
          });
          continue;
        }
        return this.#l(e) === NodeFilter.FILTER_ACCEPT ? (this.#t = e, e) : (this.#t = e, e);
      } else if (this.#r.length > 1) {
        const i = this.#r.shift();
        i.savedSlotted?.length && (this.#s = i.savedSlotted);
        const s = i.hostNode;
        if (s && this.#l(s) === NodeFilter.FILTER_ACCEPT)
          return this.#t = s, s;
      } else
        return this.#t !== this.root && this.#l(this.root) === NodeFilter.FILTER_ACCEPT ? (this.#t = this.root, this.root) : null;
    }
  }
};
function p(t, e, i, s) {
  return new U(t, e, i, s);
}
function y() {
  return typeof document < "u";
}
function F() {
  return "focusgroup" in (globalThis?.HTMLElement?.prototype ?? {}) || "focusGroup" in (globalThis?.HTMLElement?.prototype ?? {});
}
function C(t) {
  const e = (t.getAttribute("focusgroup") ?? "").split(" "), i = e.find((d) => P.includes(d)) ?? null, s = _[i];
  let o = s?.wrap ?? !1;
  e.includes("wrap") ? o = !0 : e.includes("nowrap") && (o = !1);
  const r = e.includes("inline"), h = r === e.includes("block") ? r ? void 0 : s?.axis : r ? "inline" : "block";
  return {
    behavior: i,
    wrap: o,
    axis: h,
    memory: !e.includes("nomemory")
  };
}
var G = 0;
function H() {
  return String(G++);
}
function A(t, e) {
  return (t.isContentEditable || t.matches(":is(audio, video)[controls]") || t.tabIndex > -1) && !(t.disabled || t.hasAttribute("disabled") || t.matches(":is(a, area):not([href])") || t.inert || !x(t, e) || t.matches(":is(audio, video):not([controls])") || t.hasAttribute(n.AUTHOR_TABINDEX));
}
function W(t, e, i) {
  const s = "forward", o = "backward", r = "block", h = "inline";
  if (K(t.composedPath()[0])) return t.key === "Tab" ? t.shiftKey ? o : s : null;
  if (t.shiftKey || t.ctrlKey || t.metaKey) return null;
  const { writingMode: d, direction: a } = window.getComputedStyle(e), l = !d.startsWith("horizontal-"), u = a === "rtl", f = l ? r : h, b = l ? h : r, O = l ? d.endsWith("-rl") !== u : u, k = l && u, g = {
    ArrowUp: {
      axis: b,
      dir: k ? s : o
    },
    ArrowDown: {
      axis: b,
      dir: k ? o : s
    },
    ArrowLeft: {
      axis: f,
      dir: O ? s : o
    },
    ArrowRight: {
      axis: f,
      dir: O ? o : s
    },
    Home: { dir: "start" },
    End: { dir: "end" }
  }[t.key];
  return !g || i && g.axis && g.axis !== i ? null : g.dir;
}
function K(t) {
  return t?.nodeType === Node.ELEMENT_NODE && ([
    "INPUT",
    "TEXTAREA",
    "SELECT"
  ].includes(t.nodeName) && !["checkbox", "radio"].includes(t.getAttribute("type")) || t.isContentEditable || ["AUDIO", "VIDEO"].includes(t.nodeName) && t.hasAttribute("controls") || ["IFRAME", "OBJECT"].includes(t.nodeName));
}
function X(t, e) {
  if (!x(t)) return !1;
  if (A(t, e)) return t.getAttribute("focusgroup").includes(c.NONE);
  const i = p(document, t, NodeFilter.SHOW_ELEMENT);
  for (; i.nextNode(); ) if (i.currentNode !== t && A(i.currentNode, e)) return !0;
  return !1;
}
function x(t, e) {
  if ("checkVisibility" in Element.prototype) return t.checkVisibility({
    visibilityProperty: !0,
    contentVisibilityAuto: !0
  });
  if (t.getClientRects().length === 0) return !1;
  let i = t;
  for (; i; ) {
    const { visibility: s, contentVisibility: o } = window.getComputedStyle(i);
    if (["hidden", "collapse"].includes(s) || i !== t && o === "hidden") return !1;
    if (!e || i === e) break;
    i = S(i);
  }
  return !0;
}
function L(t, e, i) {
  const s = V(t) || i === "child" && t.nodeName === "BUTTON", o = _[e], r = s ? i === "owner" ? o?.ownerRole : o?.childRole : void 0;
  r ? (!t.hasAttribute("role") || t.hasAttribute(n.INFERRED_ROLE)) && (t.setAttribute("role", r), t.setAttribute(n.INFERRED_ROLE, "")) : t.hasAttribute(n.INFERRED_ROLE) && (t.removeAttribute("role"), t.removeAttribute(n.INFERRED_ROLE));
}
function V(t) {
  return "computedRole" in HTMLElement.prototype ? t.computedRole === "generic" : ["DIV", "SPAN"].includes(t.nodeName) || t.nodeName.includes("-");
}
globalThis.__FOCUSGROUP_POLYFILL__ ??= {
  o: /* @__PURE__ */ new Set(),
  b: !1
};
var T = globalThis.__FOCUSGROUP_POLYFILL__, v = T.o;
function m() {
  for (const t of v) t.takeRecords();
}
var J = class {
  /**
  * The focus group owner element.
  * @type {HTMLElement!}
  */
  #e;
  /**
  * The items collection — exposes the focus group's items and answers
  * queries about them. Reconciliation is triggered externally via
  * `FocusGroup#update()`.
  * @type {FocusGroupItemCollection}
  */
  #t;
  /**
  * The focus group behavior.
  * @type {BehaviorToken | null}
  */
  #i = null;
  /**
  * The focus group navigation axis limitation.
  * @type {("inline" | "block" | undefined)}
  */
  #r = void 0;
  /**
  * Whether the focus group wraps. Defaults to `false`.
  * @type {boolean}
  */
  #s = !1;
  /**
  * Whether the focus group remembers the previously focused element.
  * Defaults to `true`.
  * @type {boolean}
  */
  #o = !0;
  /**
  * The focus group start element (initial tab stop after decoration).
  * @type {HTMLElement}
  */
  #n;
  /**
  * The current item — the most recently focused item within the group.
  * Serves as the keyboard-navigation cursor while focus is inside, and (in
  * memory mode) as the tab stop to restore on re-entry. Updated by
  * `#handleFocusin`, plus directly by `#handleKeydown` for shadow-internal
  * navigation (where focus events don't cross the shadow boundary).
  * Cleared in nomemory mode on focusout and when validation fails after
  * re-decoration.
  * @type {HTMLElement|null}
  */
  #h = null;
  /**
  * Whether the owner currently has `tabindex=0` set as a Tab-entry proxy so
  * sequential focus navigation can reach a tab stop inside a shadow root.
  * @type {boolean}
  */
  #l = !1;
  /**
  * The owner's original `tabindex` attribute value (or `null` if it had no
  * `tabindex`), saved before the polyfill sets `tabindex=0` for proxy duty.
  * @type {string|null}
  */
  #a = null;
  /**
  * The abort controller for when `disconnect()` is called.
  * @type {AbortController}
  */
  #d = new AbortController();
  /**
  * Optional owner-decoration hook injected via `options.decorateOwner`.
  * Called with `(owner, behavior)` on decoration and `(owner, null)` on
  * undecoration. When absent, no owner decoration happens.
  * @type {((element: HTMLElement, behavior: BehaviorToken|null) => void) | undefined}
  */
  #u;
  /**
  * Optional item-decoration hook injected via `options.decorateItem`.
  * Called with `(item, behavior)` on decoration and `(item, null)` on
  * undecoration. When absent, no item decoration happens.
  * @type {((element: HTMLElement, behavior: BehaviorToken|null) => void) | undefined}
  */
  #f;
  /**
  * @param {HTMLElement!} owner - The focus group owner element.
  * @param {FocusGroupItemCollection} items - The items collection providing
  *     item discovery and queries.
  * @param {FocusGroupOptions} [options]
  */
  constructor(t, e, i = {}) {
    if (F() || !t) return;
    this.#e = t, this.#t = e, this.#u = i.decorateOwner, this.#f = i.decorateItem, this.#E(i.definition), this.#u?.(this.#e, this.#i), this.#N();
    const s = { signal: this.#d.signal };
    this.#e.addEventListener("keydown", this.#R.bind(this), s), this.#e.addEventListener("focusin", this.#g.bind(this), s), this.#e.addEventListener("focusout", this.#p.bind(this), s);
  }
  /**
  * Tears down the focus group: disables the owner proxy, removes all event
  * listeners (via the abort signal), then disconnects the items collection
  * if it supports it.
  *
  * Ordering matters: owner-proxy teardown can trigger `flushAllObservers()`,
  * which expects the items' observer to still be in the global registry.
  * The items' own `disconnect()` is therefore called last.
  *
  * NOTE: This method does not undecorate the elements. Call it only after
  * the focusgroup owner has been removed from the DOM.
  */
  disconnect() {
    this.#c(), this.#d.abort(), this.#t?.disconnect?.(), this.#e = null;
  }
  /**
  * Reconciles decoration state in response to relevant changes. Call this
  * whenever the focus group should refresh — e.g. items were added or
  * removed, the owner's `focusgroup` attribute changed, or an author set
  * `tabindex` on a decorated item.
  *
  * The polyfill's default `TreeWalkerItemCollection` calls this from a
  * `MutationObserver`. App-supplied collections (or app code that knows
  * when its model changed) can call it directly.
  *
  * @param {FocusGroupUpdateInfo} [info]
  */
  update(t = {}) {
    if (this.#e) {
      if (t.definition !== void 0 && (this.#E(t.definition), this.#u?.(this.#e, this.#i)), t.authorTabindexChanges) for (const e of t.authorTabindexChanges) e.setAttribute(n.AUTHOR_TABINDEX, e.getAttribute("tabindex") ?? "none");
      this.#b(), this.#N();
    }
  }
  /** @param {FocusGroupDefinition} [def] */
  #E(t) {
    this.#i = t?.behavior ?? null, this.#s = t?.wrap ?? !1, this.#r = t?.axis, this.#o = t?.memory ?? !0, this.#o || (this.#h = null);
  }
  #N() {
    if (!this.#i || this.#i === c.NONE) {
      this.#b();
      return;
    }
    this.#t.decorate?.();
    for (const { element: e, segmentBoundary: i } of this.#t.items())
      this.#f?.(e, this.#i), e.setAttribute(n.AUTHOR_TABINDEX, e.getAttribute("tabindex") ?? "none"), e.tabIndex = i ? 0 : -1;
    (!this.#h?.isConnected || !(this.#t.isItem?.(this.#h) ?? this.#t.contains(this.#h))) && (this.#h = null);
    const t = this.#h ?? this.#t.start ?? this.#t.first?.() ?? null;
    t && (t.tabIndex = 0, this.#n = t, this.#c(), this.#T(t)), this.#t.flush?.();
  }
  #b() {
    this.#c();
    let t = !1;
    for (const { element: e } of this.#t.items()) {
      t = !0, this.#f?.(e, null);
      const i = e.getAttribute(n.AUTHOR_TABINDEX);
      i && (i === "none" ? e.removeAttribute("tabindex") : e.setAttribute("tabindex", i), e.removeAttribute(n.AUTHOR_TABINDEX));
    }
    this.#t.undecorate?.(), t && this.#t.flush?.();
  }
  /** @param {KeyboardEvent} evt */
  #R(t) {
    const e = t.composedPath()[0];
    if (t.defaultPrevented || e === this.#e || !this.#t.contains(e)) return;
    let i;
    switch (W(t, e, this.#r)) {
      case "start":
        i = this.#t.first();
        break;
      case "end":
        i = this.#t.last();
        break;
      case "forward":
        i = this.#t.next(e), !i && this.#s && (i = this.#t.first());
        break;
      case "backward":
        i = this.#t.previous(e), !i && this.#s && (i = this.#t.last());
        break;
    }
    i && i !== e && (this.#w(e, i, !0), this.#h = i, t.preventDefault());
  }
  /** @param {FocusEvent} evt */
  #g(t) {
    const e = t.composedPath()[0];
    if (e === this.#e && this.#l && (!t.relatedTarget || !N(this.#e, t.relatedTarget))) {
      const s = this.#h || this.#n;
      this.#c(), s && s.focus(), t.stopPropagation();
      return;
    }
    if (!this.#t.contains(e)) return;
    this.#l && this.#c();
    const i = this.#h;
    if (this.#h = e, i !== e && e.tabIndex < 0) {
      const s = i ?? this.#n;
      s && this.#w(s, e);
    }
  }
  /** @param {FocusEvent} evt */
  #p(t) {
    if (!t.relatedTarget || !N(this.#e, t.relatedTarget)) {
      const s = this.#o ? this.#h || this.#n : this.#n;
      s && this.#T(s);
    }
    if (t.relatedTarget && N(this.#e, t.relatedTarget) || this.#o || !this.#n) return;
    const e = this.#h;
    this.#h = null;
    const i = this.#t.start ?? this.#t.first?.() ?? null;
    if (e !== this.#n || i !== this.#n) {
      for (const { element: s, segmentBoundary: o } of this.#t.items()) s.tabIndex = o ? 0 : -1;
      i && (i.tabIndex = 0, this.#n = i), this.#t.flush?.();
    }
  }
  /**
  * If the tab stop is inside a shadow DOM, sets `tabindex=0` on the
  * focusgroup owner so the browser's Tab navigation can land on it, at
  * which point `#handleFocusin` will redirect focus to the real tab stop.
  * @param {HTMLElement} tabStop - The actual focusable tab stop element.
  */
  #T(t) {
    const e = (t.assignedSlot ?? t).getRootNode(), i = e instanceof ShadowRoot && e.host.hasAttribute(n.AUTHOR_TABINDEX);
    this.#l || !i || (this.#a = this.#e.getAttribute("tabindex"), this.#e.tabIndex = 0, this.#l = !0, m());
  }
  /** Undoes `#enableFocusabilityProxy`. */
  #c() {
    this.#l && (this.#a !== null ? this.#e.setAttribute("tabindex", this.#a) : this.#e.removeAttribute("tabindex"), this.#l = !1, this.#a = null, this.#t.flush?.(), m());
  }
  /**
  * Advances the focusgroup's active tab stop from one item to another. Sets
  * the target's `tabindex` to `0` and optionally calls `focus()` on it. The
  * previous item's `tabindex` is set to `-1` unless it belongs to a different
  * segment (in which case it remains `0` as a segment tab stop). Also disables
  * the owner proxy.
  *
  * @param {HTMLElement} prev - The currently focused item.
  * @param {HTMLElement} next - The item to receive focus.
  * @param {boolean} [shouldCallFocus=false] - Whether to programmatically
  *     call `focus()` on the target element.
  */
  #w(t, e, i = !1) {
    e.tabIndex = 0, i && e.focus(), t.tabIndex = this.#t.sameSegment?.(t, e) ?? !0 ? -1 : 0, this.#c(), m();
  }
}, z = class w {
  static #e = /* @__PURE__ */ new Set();
  #t;
  #i;
  #r;
  #s;
  #o;
  #n = !1;
  static #h(e) {
    const i = e.Element.prototype.attachShadow;
    i.__origAttachShadow || (Element.prototype.attachShadow = function(s) {
      const o = i.call(this, s);
      for (const r of w.#e) r.#a(o);
      return o;
    }, Element.prototype.attachShadow.__origAttachShadow = i);
  }
  constructor(e) {
    this.#r = e, this.#s = new MutationObserver(this.#l), this.#o = /* @__PURE__ */ new Map();
  }
  #l = (e, i) => {
    for (const s of e) if (s.type === "childList") {
      const o = s.removedNodes, r = s.addedNodes;
      for (let h = 0; h < o.length; h++) this.#u(o[h], !0);
      for (let h = 0; h < r.length; h++) this.#u(r[h]);
    }
    this.#r(e, i);
  };
  #a(e) {
    if (!(!this.#i || !this.#r || this.#o.has(e)) && this.#i.subtree && N(this.#t, e)) {
      const i = new MutationObserver(this.#l);
      this.#o.set(e, i), this.#n && i.observe(e, this.#i), this.#u(e);
    }
  }
  #d(e) {
    const i = this.#o.get(e);
    i && (i.disconnect(), this.#o.delete(e)), this.#o.size || this.#o.clear();
  }
  disconnect() {
    this.#n = !1, this.#i = {}, w.#e.delete(this);
    for (const e of this.#o.keys()) this.#d(e);
    this.#s.disconnect();
  }
  observe(e, i) {
    const s = e.nodeType === Node.DOCUMENT_NODE ? e : e.ownerDocument, o = s?.defaultView;
    !s || !o || (w.#h(o), w.#e.add(this), this.#t = e, this.#i = i, this.#n = !0, this.#s.observe(e, i), this.#u(e));
  }
  #u(e, i) {
    const s = e.nodeType === Node.DOCUMENT_NODE ? e : e.ownerDocument;
    if (s) {
      if (e === s) e = s.body;
      else {
        const o = e.shadowRoot;
        if (o) {
          if (i) {
            const r = this.#o.get(o);
            r && (r.disconnect(), this.#o.delete(o));
          } else this.#a(o);
          return;
        }
      }
      s.createTreeWalker(e, NodeFilter.SHOW_ELEMENT, { acceptNode: (o) => {
        if (o.nodeType === Node.ELEMENT_NODE) if (i) {
          const r = this.#o.get(o);
          r && (r.disconnect(), this.#o.delete(o));
        } else {
          const r = o.shadowRoot;
          r && this.#a(r);
        }
        return NodeFilter.FILTER_SKIP;
      } }).nextNode();
    }
  }
  takeRecords() {
    const e = this.#s.takeRecords();
    for (const i of this.#o.values()) e.push(...i.takeRecords());
    return e;
  }
};
function M(t) {
  return new z(t);
}
var q = class {
  /**
  * Unique id used by `FocusGroup` to tag decorated items via the
  * `data-fg-item` attribute. Used here to disambiguate items of this group
  * from items of overlapping groups (possible via shadow-DOM slotting).
  * @type {string}
  */
  id = H();
  /**
  * First descendant with the `focusgroupstart` attribute (shadow-aware),
  * or the first item as fallback, or `null` if none exist. `FocusGroup`
  * reads this to choose the initial tab stop after decoration.
  * @returns {HTMLElement | null}
  */
  get start() {
    if (!this.#e) return null;
    let t = null;
    for (const { element: e } of this.items()) {
      if (e.hasAttribute("focusgroupstart")) return e;
      t ??= e;
    }
    return t;
  }
  /** @type {HTMLElement} */
  #e;
  /** @type {ShadowTreeWalker} */
  #t;
  /** @type {MutationObserver | null} */
  #i = null;
  /**
  * @param {HTMLElement!} owner - The focus group owner element.
  */
  constructor(t) {
    this.#e = t, this.#t = p(document, this.#e, NodeFilter.SHOW_ELEMENT, (e) => this.#r(e));
  }
  /**
  * Starts observing the owner subtree for mutations. Each relevant batch
  * is delivered to `focusGroup.update(info)`. Call this once, after the
  * paired `FocusGroup` has been constructed.
  *
  * @param {FocusGroup} focusGroup
  */
  observe(t) {
    this.#i = M((e) => {
      const i = this.#n(e);
      i && t.update(i);
    }), this.#i.observe(this.#e, {
      attributes: !0,
      attributeFilter: [
        "focusgroup",
        "focusgroupstart",
        "controls",
        "contenteditable",
        "disabled",
        "href",
        "hidden",
        "tabindex",
        "type"
      ],
      childList: !0,
      subtree: !0
    }), v.add(this.#i);
  }
  /**
  * Releases the mutation observer and removes it from the global flush
  * registry. Called from `FocusGroup#disconnect()`; safe to call directly.
  */
  disconnect() {
    v.delete(this.#i), this.#i?.disconnect(), this.#e = null, this.#t = null, this.#i = null;
  }
  /**
  * Flushes this collection's mutation observer by calling `takeRecords()`,
  * dropping any pending records (typically caused by polyfill-managed
  * attribute writes during decoration). Called by `FocusGroup` after writing
  * `tabindex`/`data-fg-*` to avoid re-entering `#handleItemsMutate`.
  */
  flush() {
    this.#i?.takeRecords();
  }
  /**
  * Discovers items in the owner subtree and writes the marker attributes
  * (`data-fg-item`, `data-fg-seg`, `data-fg-segs`). Heavy walk — uses the
  * full candidacy filter (`isKeyboardFocusable` + ownership) and respects
  * nested-focusgroup opt-out subtrees and segmentor boundaries.
  *
  * After this call, `items()` will yield the marked items, and
  * `isItem()` / the persistent walker (used by `first/last/next/previous`)
  * will recognize them.
  */
  decorate() {
    const t = p(document, this.#e, NodeFilter.SHOW_ELEMENT, (o) => this.#s(o) || this.#o(o) ? NodeFilter.FILTER_ACCEPT : NodeFilter.FILTER_SKIP);
    let e = !1, i = 0, s = null;
    for (; t.nextNode(); ) {
      const o = t.currentNode;
      if (!(s && N(s, o))) {
        if (s = null, this.#o(o)) {
          if (X(o, this.#e) && (e = !0), o.getAttribute("focusgroup").includes(c.NONE)) {
            s = o;
            continue;
          }
          if (!A(o, this.#e)) continue;
        }
        o.setAttribute(n.ITEM, this.id), e ? (i++, o.setAttribute(n.SEGMENT, String(i)), o.setAttribute(n.SEGMENT_START, ""), e = !1) : i > 0 && o.setAttribute(n.SEGMENT, String(i));
      }
    }
  }
  /**
  * Yields all items previously marked by `decorate()` in document order.
  * Light walk — iterates only `data-fg-item="${id}"` nodes via the
  * persistent walker (which rejects foreign-focusgroup subtrees). Reads
  * `segmentBoundary` from the DOM marker.
  *
  * @returns {Generator<FocusGroupItem>}
  */
  *items() {
    for (this.#t.currentNode = this.#e; this.#t.nextNode(); ) {
      const t = this.#t.currentNode;
      yield {
        element: t,
        segmentBoundary: t.hasAttribute(n.SEGMENT_START)
      };
    }
  }
  /**
  * Clears all marker attributes (`data-fg-item`, `data-fg-seg`,
  * `data-fg-segs`) written by `decorate()`. Light walk over marked nodes.
  */
  undecorate() {
    const t = [];
    for (this.#t.currentNode = this.#e; this.#t.nextNode(); ) t.push(this.#t.currentNode);
    for (const e of t)
      e.removeAttribute(n.ITEM), e.removeAttribute(n.SEGMENT), e.removeAttribute(n.SEGMENT_START);
  }
  /**
  * Whether `el` is the first item of a non-initial segment (i.e. the item
  * that immediately follows a segmentor in document order).
  * @param {HTMLElement} el
  * @returns {boolean}
  */
  isSegmentStart(t) {
    return t.hasAttribute(n.SEGMENT_START);
  }
  /**
  * Whether `a` and `b` belong to the same segment.
  * @param {HTMLElement} a
  * @param {HTMLElement} b
  * @returns {boolean}
  */
  sameSegment(t, e) {
    return t.getAttribute(n.SEGMENT) === e.getAttribute(n.SEGMENT);
  }
  /** @returns {HTMLElement | null} The first item, or null. */
  first() {
    return this.#t.currentNode = this.#e, this.#t.nextNode() ?? null;
  }
  /** @returns {HTMLElement | null} The last item, or null. */
  last() {
    this.#t.currentNode = this.#e;
    let t = null;
    for (; this.#t.nextNode(); ) t = this.#t.currentNode;
    return t;
  }
  /**
  * @param {HTMLElement} current
  * @returns {HTMLElement | null}
  */
  next(t) {
    return this.#t.currentNode = t, this.#t.nextNode() ?? null;
  }
  /**
  * @param {HTMLElement} current
  * @returns {HTMLElement | null}
  */
  previous(t) {
    return this.#t.currentNode = t, this.#t.previousNode() ?? null;
  }
  /**
  * @param {Element} element
  * @returns {boolean} Whether `element` is currently an item of this group.
  */
  contains(t) {
    return this.#r(t) !== NodeFilter.FILTER_REJECT;
  }
  /**
  * Strict membership: is `element` currently a decorated item of *this*
  * collection?
  * @param {Element} element
  * @returns {boolean}
  */
  isItem(t) {
    return t.getAttribute(n.ITEM) === this.id;
  }
  /**
  * The persistent walker's filter — accepts elements decorated as items of
  * this items collection (matching `id`) and rejects nested groups whose
  * decoration belongs to another collection.
  *
  * @param {Element} node
  * @returns {number}
  */
  #r(t) {
    if (t.hasAttribute("focusgroup") && t.getAttribute(n.ITEM) !== this.id) return NodeFilter.FILTER_REJECT;
    const e = R(S(t), `[focusgroup]:not([${n.ITEM}="${this.id}"])`);
    return e && e !== this.#e ? NodeFilter.FILTER_REJECT : this.isItem(t) ? NodeFilter.FILTER_ACCEPT : NodeFilter.FILTER_SKIP;
  }
  /**
  * @param {Element} node
  * @returns {boolean}
  */
  #s(t) {
    return A(t, this.#e) && R(S(t), "[focusgroup]") === this.#e;
  }
  /**
  * @param {Element} node
  * @returns {boolean}
  */
  #o(t) {
    return t.hasAttribute("focusgroup") && t !== this.#e;
  }
  /**
  * Translates a `MutationRecord` batch into a `FocusGroupUpdateInfo`,
  * or `null` if the batch contains nothing relevant. Filters out:
  *
  * - `tabindex` writes on items decorated by *other* focusgroups
  *   (identified by the presence of `AUTHOR_TABINDEX` and a non-matching
  *   `data-fg-item`), and
  * - `tabindex` writes on the owner element itself (caused by the paired
  *   `FocusGroup` toggling its owner-proxy tabindex).
  *
  * @param {MutationRecord[]} records
  * @returns {FocusGroupUpdateInfo | null}
  */
  #n(t) {
    const e = t.filter((r) => !(r.type === "attributes" && r.attributeName === "tabindex" && (r.target.hasAttribute(n.AUTHOR_TABINDEX) && r.target.getAttribute(n.ITEM) !== this.id || r.target === this.#e)));
    if (e.length === 0) return null;
    const i = e.some((r) => r.target === this.#e && r.attributeName === "focusgroup"), s = [];
    for (const r of e) r.type === "childList" && r.removedNodes.length > 0 && s.push(...r.removedNodes);
    const o = [];
    for (const r of e) r.type === "attributes" && r.attributeName === "tabindex" && r.target.hasAttribute(n.AUTHOR_TABINDEX) && r.target.getAttribute(n.ITEM) === this.id && o.push(r.target);
    return {
      definition: i ? C(this.#e) : void 0,
      removedNodes: s,
      authorTabindexChanges: o
    };
  }
}, E;
if (y() && typeof MutationObserver < "u" && !F() && (E = T.m ??= /* @__PURE__ */ new Map(), !T.g)) {
  const t = M((e) => {
    for (const i of e)
      if (i.type === "childList") {
        for (const s of i.removedNodes) E.has(s) && (E.get(s)?.disconnect(), E.delete(s));
        if (T.b)
          for (const s of i.addedNodes) s.nodeType === Node.ELEMENT_NODE && D(s);
      }
  });
  t.observe(document.body, {
    childList: !0,
    subtree: !0
  }), T.g = t;
}
function D(t) {
  if (F() || !y()) return;
  t ??= document.body;
  const e = p(document, t, NodeFilter.SHOW_ELEMENT, (i) => i.hasAttribute("focusgroup") ? NodeFilter.FILTER_ACCEPT : NodeFilter.FILTER_SKIP);
  do {
    const i = e.currentNode;
    !i.hasAttribute?.("focusgroup") || E.has(i) || (E.set(i, null), requestAnimationFrame(() => {
      if (!E.has(i)) return;
      const s = new q(i), o = new J(i, s, {
        definition: C(i),
        decorateOwner: (r, h) => L(r, h, "owner"),
        decorateItem: (r, h) => L(r, h, "child")
      });
      s.observe(o), E.set(i, o);
    }));
  } while (e.nextNode());
}
D();
