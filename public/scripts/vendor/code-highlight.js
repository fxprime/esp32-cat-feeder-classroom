function jt(p) {
  return p && p.__esModule && Object.prototype.hasOwnProperty.call(p, "default") ? p.default : p;
}
var Oe, Ke;
function $t() {
  if (Ke) return Oe;
  Ke = 1;
  function p(e) {
    return e instanceof Map ? e.clear = e.delete = e.set = function() {
      throw new Error("map is read-only");
    } : e instanceof Set && (e.add = e.clear = e.delete = function() {
      throw new Error("set is read-only");
    }), Object.freeze(e), Object.getOwnPropertyNames(e).forEach((t) => {
      const i = e[t], u = typeof i;
      (u === "object" || u === "function") && !Object.isFrozen(i) && p(i);
    }), e;
  }
  class R {
    /**
     * @param {CompiledMode} mode
     */
    constructor(t) {
      t.data === void 0 && (t.data = {}), this.data = t.data, this.isMatchIgnored = !1;
    }
    ignoreMatch() {
      this.isMatchIgnored = !0;
    }
  }
  function N(e) {
    return e.replace(/&/g, "&amp;").replace(/</g, "&lt;").replace(/>/g, "&gt;").replace(/"/g, "&quot;").replace(/'/g, "&#x27;");
  }
  function b(e, ...t) {
    const i = /* @__PURE__ */ Object.create(null);
    for (const u in e)
      i[u] = e[u];
    return t.forEach(function(u) {
      for (const S in u)
        i[S] = u[S];
    }), /** @type {T} */
    i;
  }
  const D = "</span>", ge = (e) => !!e.scope, fe = (e, { prefix: t }) => {
    if (e.startsWith("language:"))
      return e.replace("language:", "language-");
    if (e.includes(".")) {
      const i = e.split(".");
      return [
        `${t}${i.shift()}`,
        ...i.map((u, S) => `${u}${"_".repeat(S + 1)}`)
      ].join(" ");
    }
    return `${t}${e}`;
  };
  class F {
    /**
     * Creates a new HTMLRenderer
     *
     * @param {Tree} parseTree - the parse tree (must support `walk` API)
     * @param {{classPrefix: string}} options
     */
    constructor(t, i) {
      this.buffer = "", this.classPrefix = i.classPrefix, t.walk(this);
    }
    /**
     * Adds texts to the output stream
     *
     * @param {string} text */
    addText(t) {
      this.buffer += N(t);
    }
    /**
     * Adds a node open to the output stream (if needed)
     *
     * @param {Node} node */
    openNode(t) {
      if (!ge(t)) return;
      const i = fe(
        t.scope,
        { prefix: this.classPrefix }
      );
      this.span(i);
    }
    /**
     * Adds a node close to the output stream (if needed)
     *
     * @param {Node} node */
    closeNode(t) {
      ge(t) && (this.buffer += D);
    }
    /**
     * returns the accumulated buffer
    */
    value() {
      return this.buffer;
    }
    // helpers
    /**
     * Builds a span element
     *
     * @param {string} className */
    span(t) {
      this.buffer += `<span class="${t}">`;
    }
  }
  const de = (e = {}) => {
    const t = { children: [] };
    return Object.assign(t, e), t;
  };
  class k {
    constructor() {
      this.rootNode = de(), this.stack = [this.rootNode];
    }
    get top() {
      return this.stack[this.stack.length - 1];
    }
    get root() {
      return this.rootNode;
    }
    /** @param {Node} node */
    add(t) {
      this.top.children.push(t);
    }
    /** @param {string} scope */
    openNode(t) {
      const i = de({ scope: t });
      this.add(i), this.stack.push(i);
    }
    closeNode() {
      if (this.stack.length > 1)
        return this.stack.pop();
    }
    closeAllNodes() {
      for (; this.closeNode(); ) ;
    }
    toJSON() {
      return JSON.stringify(this.rootNode, null, 4);
    }
    /**
     * @typedef { import("./html_renderer").Renderer } Renderer
     * @param {Renderer} builder
     */
    walk(t) {
      return this.constructor._walk(t, this.rootNode);
    }
    /**
     * @param {Renderer} builder
     * @param {Node} node
     */
    static _walk(t, i) {
      return typeof i == "string" ? t.addText(i) : i.children && (t.openNode(i), i.children.forEach((u) => this._walk(t, u)), t.closeNode(i)), t;
    }
    /**
     * @param {Node} node
     */
    static _collapse(t) {
      typeof t != "string" && t.children && (t.children.every((i) => typeof i == "string") ? t.children = [t.children.join("")] : t.children.forEach((i) => {
        k._collapse(i);
      }));
    }
  }
  class j extends k {
    /**
     * @param {*} options
     */
    constructor(t) {
      super(), this.options = t;
    }
    /**
     * @param {string} text
     */
    addText(t) {
      t !== "" && this.add(t);
    }
    /** @param {string} scope */
    startScope(t) {
      this.openNode(t);
    }
    endScope() {
      this.closeNode();
    }
    /**
     * @param {Emitter & {root: DataNode}} emitter
     * @param {string} name
     */
    __addSublanguage(t, i) {
      const u = t.root;
      i && (u.scope = `language:${i}`), this.add(u);
    }
    toHTML() {
      return new F(this, this.options).value();
    }
    finalize() {
      return this.closeAllNodes(), !0;
    }
  }
  function H(e) {
    return e ? typeof e == "string" ? e : e.source : null;
  }
  function J(e) {
    return C("(?=", e, ")");
  }
  function Y(e) {
    return C("(?:", e, ")*");
  }
  function pe(e) {
    return C("(?:", e, ")?");
  }
  function C(...e) {
    return e.map((i) => H(i)).join("");
  }
  function he(e) {
    const t = e[e.length - 1];
    return typeof t == "object" && t.constructor === Object ? (e.splice(e.length - 1, 1), t) : {};
  }
  function G(...e) {
    return "(" + (he(e).capture ? "" : "?:") + e.map((u) => H(u)).join("|") + ")";
  }
  function Q(e) {
    return new RegExp(e.toString() + "|").exec("").length - 1;
  }
  function _e(e, t) {
    const i = e && e.exec(t);
    return i && i.index === 0;
  }
  const Ee = new RegExp(G(
    /\[(?:[^\\\]]|\\.)*\]/,
    // a character class, inside which ( and \ lose their meaning
    /\(\?<(?![=!])[^>]+>/,
    // a named capture group `(?<name>` (not a lookbehind `(?<=` / `(?<!`)
    /\(\?'[^']+'/,
    // a named capture group `(?'name'`
    /\(\??/,
    // an opening parenthesis, capturing or non-capturing / lookahead
    /\\([1-9][0-9]*)/,
    // a backreference like `\1`
    /\\./
    // any other escape sequence
  ));
  function ee(e, { joinWith: t }) {
    let i = 0;
    return e.map((u) => {
      i += 1;
      const S = i;
      let y = H(u), o = "";
      for (; y.length > 0; ) {
        const s = Ee.exec(y);
        if (!s) {
          o += y;
          break;
        }
        o += y.substring(0, s.index), y = y.substring(s.index + s[0].length), s[0][0] === "\\" && s[1] ? o += "\\" + String(Number(s[1]) + S) : (o += s[0], (s[0] === "(" || /^\(\?[<']/.test(s[0])) && i++);
      }
      return o;
    }).map((u) => `(${u})`).join(t);
  }
  const Te = /\b\B/, m = "[a-zA-Z]\\w*", $ = "[a-zA-Z_]\\w*", z = "\\b\\d+(\\.\\d+)?", te = "(-?)(\\b0[xX][a-fA-F0-9]+|(\\b\\d+(\\.\\d*)?|\\.\\d+)([eE][-+]?\\d+)?)", ne = "\\b(0b[01]+)", $e = "!|!=|!==|%|%=|&|&&|&=|\\*|\\*=|\\+|\\+=|,|-|-=|/=|/|:|;|<<|<<=|<=|<|===|==|=|>>>=|>>=|>=|>>>|>>|>|\\?|\\[|\\{|\\(|\\^|\\^=|\\||\\|=|\\|\\||~", ze = (e = {}) => {
    const t = /^#![ ]*\//;
    return e.binary && (e.begin = C(
      t,
      /.*\b/,
      e.binary,
      /\b.*/
    )), b({
      scope: "meta",
      begin: t,
      end: /$/,
      relevance: 0,
      /** @type {ModeCallback} */
      "on:begin": (i, u) => {
        i.index !== 0 && u.ignoreMatch();
      }
    }, e);
  }, V = {
    begin: "\\\\[\\s\\S]",
    relevance: 0
  }, qe = {
    scope: "string",
    begin: "'",
    end: "'",
    illegal: "\\n",
    contains: [V]
  }, Xe = {
    scope: "string",
    begin: '"',
    end: '"',
    illegal: "\\n",
    contains: [V]
  }, Ye = {
    begin: /\b(a|an|the|are|I'm|isn't|don't|doesn't|won't|but|just|should|pretty|simply|enough|gonna|going|wtf|so|such|will|you|your|they|like|more)\b/
  }, ie = function(e, t, i = {}) {
    const u = b(
      {
        scope: "comment",
        begin: e,
        end: t,
        contains: []
      },
      i
    );
    u.contains.push({
      scope: "doctag",
      // hack to avoid the space from being included. the space is necessary to
      // match here to prevent the plain text rule below from gobbling up doctags
      begin: "[ ]*(?=(TODO|FIXME|NOTE|BUG|OPTIMIZE|HACK|XXX):)",
      end: /(TODO|FIXME|NOTE|BUG|OPTIMIZE|HACK|XXX):/,
      excludeBegin: !0,
      relevance: 0
    });
    const S = G(
      // list of common 1 and 2 letter words in English
      "I",
      "a",
      "is",
      "so",
      "us",
      "to",
      "at",
      "if",
      "in",
      "it",
      "on",
      // note: this is not an exhaustive list of contractions, just popular ones
      /[A-Za-z]+['](d|ve|re|ll|t|s|n)/,
      // contractions - can't we'd they're let's, etc
      /[A-Za-z]+[-][a-z]+/,
      // `no-way`, etc.
      /[A-Za-z][a-z]{2,}/
      // allow capitalized words at beginning of sentences
    );
    return u.contains.push(
      {
        // TODO: how to include ", (, ) without breaking grammars that use these for
        // comment delimiters?
        // begin: /[ ]+([()"]?([A-Za-z'-]{3,}|is|a|I|so|us|[tT][oO]|at|if|in|it|on)[.]?[()":]?([.][ ]|[ ]|\))){3}/
        // ---
        // this tries to find sequences of 3 english words in a row (without any
        // "programming" type syntax) this gives us a strong signal that we've
        // TRULY found a comment - vs perhaps scanning with the wrong language.
        // It's possible to find something that LOOKS like the start of the
        // comment - but then if there is no readable text - good chance it is a
        // false match and not a comment.
        //
        // for a visual example please see:
        // https://github.com/highlightjs/highlight.js/issues/2827
        begin: C(
          /[ ]+/,
          // necessary to prevent us gobbling up doctags like /* @author Bob Mcgill */
          "(",
          S,
          /[.]?[:]?([.][ ]|[ ])/,
          "){3}"
        )
        // look for 3 words in a row
      }
    ), u;
  }, Ve = ie("//", "$"), Ze = ie("/\\*", "\\*/"), Je = ie("#", "$"), Qe = {
    scope: "number",
    begin: z,
    relevance: 0
  }, et = {
    scope: "number",
    begin: te,
    relevance: 0
  }, tt = {
    scope: "number",
    begin: ne,
    relevance: 0
  }, nt = {
    scope: "regexp",
    begin: /\/(?=[^/\n]*\/)/,
    end: /\/[gimuy]*/,
    contains: [
      V,
      {
        begin: /\[/,
        end: /\]/,
        relevance: 0,
        contains: [V]
      }
    ]
  }, it = {
    scope: "title",
    begin: m,
    relevance: 0
  }, rt = {
    scope: "title",
    begin: $,
    relevance: 0
  }, st = {
    // excludes method names from keyword processing
    begin: "\\.\\s*" + $,
    relevance: 0
  };
  var re = /* @__PURE__ */ Object.freeze({
    __proto__: null,
    APOS_STRING_MODE: qe,
    BACKSLASH_ESCAPE: V,
    BINARY_NUMBER_MODE: tt,
    BINARY_NUMBER_RE: ne,
    COMMENT: ie,
    C_BLOCK_COMMENT_MODE: Ze,
    C_LINE_COMMENT_MODE: Ve,
    C_NUMBER_MODE: et,
    C_NUMBER_RE: te,
    END_SAME_AS_BEGIN: function(e) {
      return Object.assign(
        e,
        {
          /** @type {ModeCallback} */
          "on:begin": (t, i) => {
            i.data._beginMatch = t[1];
          },
          /** @type {ModeCallback} */
          "on:end": (t, i) => {
            i.data._beginMatch !== t[1] && i.ignoreMatch();
          }
        }
      );
    },
    HASH_COMMENT_MODE: Je,
    IDENT_RE: m,
    MATCH_NOTHING_RE: Te,
    METHOD_GUARD: st,
    NUMBER_MODE: Qe,
    NUMBER_RE: z,
    PHRASAL_WORDS_MODE: Ye,
    QUOTE_STRING_MODE: Xe,
    REGEXP_MODE: nt,
    RE_STARTERS_RE: $e,
    SHEBANG: ze,
    TITLE_MODE: it,
    UNDERSCORE_IDENT_RE: $,
    UNDERSCORE_TITLE_MODE: rt
  });
  function ot(e, t) {
    e.input[e.index - 1] === "." && t.ignoreMatch();
  }
  function at(e, t) {
    e.className !== void 0 && (e.scope = e.className, delete e.className);
  }
  function ct(e, t) {
    t && e.beginKeywords && (e.begin = "\\b(" + e.beginKeywords.split(" ").join("|") + ")(?!\\.)(?=\\b|\\s)", e.__beforeBegin = ot, e.keywords = e.keywords || e.beginKeywords, delete e.beginKeywords, e.relevance === void 0 && (e.relevance = 0));
  }
  function lt(e, t) {
    Array.isArray(e.illegal) && (e.illegal = G(...e.illegal));
  }
  function ut(e, t) {
    if (e.match) {
      if (e.begin || e.end) throw new Error("begin & end are not supported with match");
      e.begin = e.match, delete e.match;
    }
  }
  function gt(e, t) {
    e.relevance === void 0 && (e.relevance = 1);
  }
  const ft = (e, t) => {
    if (!e.beforeMatch) return;
    if (e.starts) throw new Error("beforeMatch cannot be used with starts");
    const i = Object.assign({}, e);
    Object.keys(e).forEach((u) => {
      delete e[u];
    }), e.keywords = i.keywords, e.begin = C(i.beforeMatch, J(i.begin)), e.starts = {
      relevance: 0,
      contains: [
        Object.assign(i, { endsParent: !0 })
      ]
    }, e.relevance = 0, delete i.beforeMatch;
  }, dt = [
    "of",
    "and",
    "for",
    "in",
    "not",
    "or",
    "if",
    "then",
    "parent",
    // common variable name
    "list",
    // common variable name
    "value"
    // common variable name
  ], pt = "keyword";
  function xe(e, t, i = pt) {
    const u = /* @__PURE__ */ Object.create(null);
    return typeof e == "string" ? S(i, e.split(" ")) : Array.isArray(e) ? S(i, e) : Object.keys(e).forEach(function(y) {
      Object.assign(
        u,
        xe(e[y], t, y)
      );
    }), u;
    function S(y, o) {
      t && (o = o.map((s) => s.toLowerCase())), o.forEach(function(s) {
        const l = s.split("|");
        u[l[0]] = [y, ht(l[0], l[1])];
      });
    }
  }
  function ht(e, t) {
    return t ? Number(t) : _t(e) ? 0 : 1;
  }
  function _t(e) {
    return dt.includes(e.toLowerCase());
  }
  const Ae = {}, W = (e) => {
    console.error(e);
  }, me = (e, ...t) => {
    console.log(`WARN: ${e}`, ...t);
  }, q = (e, t) => {
    Ae[`${e}/${t}`] || (console.log(`Deprecated as of ${e}. ${t}`), Ae[`${e}/${t}`] = !0);
  }, se = new Error();
  function Ie(e, t, { key: i }) {
    let u = 0;
    const S = e[i], y = {}, o = {};
    for (let s = 1; s <= t.length; s++)
      o[s + u] = S[s], y[s + u] = !0, u += Q(t[s - 1]);
    e[i] = o, e[i]._emit = y, e[i]._multi = !0;
  }
  function Et(e) {
    if (Array.isArray(e.begin)) {
      if (e.skip || e.excludeBegin || e.returnBegin)
        throw W("skip, excludeBegin, returnBegin not compatible with beginScope: {}"), se;
      if (typeof e.beginScope != "object" || e.beginScope === null)
        throw W("beginScope must be object"), se;
      Ie(e, e.begin, { key: "beginScope" }), e.begin = ee(e.begin, { joinWith: "" });
    }
  }
  function bt(e) {
    if (Array.isArray(e.end)) {
      if (e.skip || e.excludeEnd || e.returnEnd)
        throw W("skip, excludeEnd, returnEnd not compatible with endScope: {}"), se;
      if (typeof e.endScope != "object" || e.endScope === null)
        throw W("endScope must be object"), se;
      Ie(e, e.end, { key: "endScope" }), e.end = ee(e.end, { joinWith: "" });
    }
  }
  function St(e) {
    e.scope && typeof e.scope == "object" && e.scope !== null && (e.beginScope = e.scope, delete e.scope);
  }
  function yt(e) {
    St(e), typeof e.beginScope == "string" && (e.beginScope = { _wrap: e.beginScope }), typeof e.endScope == "string" && (e.endScope = { _wrap: e.endScope }), Et(e), bt(e);
  }
  function Mt(e) {
    function t(o, s) {
      return new RegExp(
        H(o),
        "m" + (e.case_insensitive ? "i" : "") + (e.unicodeRegex ? "u" : "") + (s ? "g" : "")
      );
    }
    class i {
      constructor() {
        this.matchIndexes = {}, this.regexes = [], this.matchAt = 1, this.position = 0;
      }
      // @ts-ignore
      addRule(s, l) {
        l.position = this.position++, this.matchIndexes[this.matchAt] = l, this.regexes.push([l, s]), this.matchAt += Q(s) + 1;
      }
      compile() {
        this.regexes.length === 0 && (this.exec = () => null);
        const s = this.regexes.map((l) => l[1]);
        this.matcherRe = t(ee(s, { joinWith: "|" }), !0), this.lastIndex = 0;
      }
      /** @param {string} s */
      exec(s) {
        this.matcherRe.lastIndex = this.lastIndex;
        const l = this.matcherRe.exec(s);
        if (!l)
          return null;
        const O = l.findIndex((Z, Se) => Se > 0 && Z !== void 0), M = this.matchIndexes[O];
        return l.splice(0, O), Object.assign(l, M);
      }
    }
    class u {
      constructor() {
        this.rules = [], this.multiRegexes = [], this.count = 0, this.lastIndex = 0, this.regexIndex = 0;
      }
      // @ts-ignore
      getMatcher(s) {
        if (this.multiRegexes[s]) return this.multiRegexes[s];
        const l = new i();
        return this.rules.slice(s).forEach(([O, M]) => l.addRule(O, M)), l.compile(), this.multiRegexes[s] = l, l;
      }
      resumingScanAtSamePosition() {
        return this.regexIndex !== 0;
      }
      considerAll() {
        this.regexIndex = 0;
      }
      // @ts-ignore
      addRule(s, l) {
        this.rules.push([s, l]), l.type === "begin" && this.count++;
      }
      /** @param {string} s */
      exec(s) {
        const l = this.getMatcher(this.regexIndex);
        l.lastIndex = this.lastIndex;
        let O = l.exec(s);
        if (this.resumingScanAtSamePosition() && !(O && O.index === this.lastIndex)) {
          const M = this.getMatcher(0);
          M.lastIndex = this.lastIndex + 1, O = M.exec(s);
        }
        return O && (this.regexIndex += O.position + 1, this.regexIndex === this.count && this.considerAll()), O;
      }
    }
    function S(o) {
      const s = new u();
      return o.contains.forEach((l) => s.addRule(l.begin, { rule: l, type: "begin" })), o.terminatorEnd && s.addRule(o.terminatorEnd, { type: "end" }), o.illegal && s.addRule(o.illegal, { type: "illegal" }), s;
    }
    function y(o, s) {
      const l = (
        /** @type CompiledMode */
        o
      );
      if (o.isCompiled) return l;
      [
        at,
        // do this early so compiler extensions generally don't have to worry about
        // the distinction between match/begin
        ut,
        yt,
        ft
      ].forEach((M) => M(o, s)), e.compilerExtensions.forEach((M) => M(o, s)), o.__beforeBegin = null, [
        ct,
        // do this later so compiler extensions that come earlier have access to the
        // raw array if they wanted to perhaps manipulate it, etc.
        lt,
        // default to 1 relevance if not specified
        gt
      ].forEach((M) => M(o, s)), o.isCompiled = !0;
      let O = null;
      return typeof o.keywords == "object" && o.keywords.$pattern && (o.keywords = Object.assign({}, o.keywords), O = o.keywords.$pattern, delete o.keywords.$pattern), O = O || /\w+/, o.keywords && (o.keywords = xe(o.keywords, e.case_insensitive)), l.keywordPatternRe = t(O, !0), s && (o.begin || (o.begin = /\B|\b/), l.beginRe = t(l.begin), !o.end && !o.endsWithParent && (o.end = /\B|\b/), o.end && (l.endRe = t(l.end)), l.terminatorEnd = H(l.end) || "", o.endsWithParent && s.terminatorEnd && (l.terminatorEnd += (o.end ? "|" : "") + s.terminatorEnd)), o.illegal && (l.illegalRe = t(
        /** @type {RegExp | string} */
        o.illegal
      )), o.contains || (o.contains = []), o.contains = [].concat(...o.contains.map(function(M) {
        return Rt(M === "self" ? o : M);
      })), o.contains.forEach(function(M) {
        y(
          /** @type Mode */
          M,
          l
        );
      }), o.starts && y(o.starts, s), l.matcher = S(l), l;
    }
    if (e.compilerExtensions || (e.compilerExtensions = []), e.contains && e.contains.includes("self"))
      throw new Error("ERR: contains `self` is not supported at the top-level of a language.  See documentation.");
    return e.classNameAliases = b(e.classNameAliases || {}), y(
      /** @type Mode */
      e
    );
  }
  function ke(e) {
    return e ? e.endsWithParent || ke(e.starts) : !1;
  }
  function Rt(e) {
    return e.variants && !e.cachedVariants && (e.cachedVariants = e.variants.map(function(t) {
      return b(e, { variants: null }, t);
    })), e.cachedVariants ? e.cachedVariants : ke(e) ? b(e, { starts: e.starts ? b(e.starts) : null }) : Object.isFrozen(e) ? b(e) : e;
  }
  var wt = "11.12.0";
  class Nt extends Error {
    constructor(t, i) {
      super(t), this.name = "HTMLInjectionError", this.html = i;
    }
  }
  const be = N, Ce = b, ve = /* @__PURE__ */ Symbol("nomatch"), Ot = 7, Pe = function(e) {
    const t = /* @__PURE__ */ Object.create(null), i = /* @__PURE__ */ Object.create(null), u = [];
    let S = !0;
    const y = "Could not find the language '{}', did you forget to load/include a language module?", o = { disableAutodetect: !0, name: "Plain text", contains: [] };
    let s = {
      ignoreUnescapedHTML: !1,
      throwUnescapedHTML: !1,
      noHighlightRe: /^(no-?highlight)$/i,
      languageDetectRe: /\blang(?:uage)?-([\w-]+)\b/i,
      classPrefix: "hljs-",
      cssSelector: "pre code",
      languages: null,
      // beta configuration options, subject to change, welcome to discuss
      // https://github.com/highlightjs/highlight.js/issues/1086
      __emitter: j
    };
    function l(n) {
      return s.noHighlightRe.test(n);
    }
    function O(n) {
      let c = n.className + " ";
      c += n.parentNode ? n.parentNode.className : "";
      const d = s.languageDetectRe.exec(c);
      if (d) {
        const _ = B(d[1]);
        return _ || (me(y.replace("{}", d[1])), me("Falling back to no-highlight mode for this block.", n)), _ ? d[1] : "no-highlight";
      }
      return c.split(/\s+/).find((_) => l(_) || B(_));
    }
    function M(n, c, d) {
      let _ = "", w = "";
      typeof c == "object" ? (_ = n, d = c.ignoreIllegals, w = c.language) : (q("10.7.0", "highlight(lang, code, ...args) has been deprecated."), q("10.7.0", `Please use highlight(code, options) instead.
https://github.com/highlightjs/highlight.js/issues/2277`), w = n, _ = c), d === void 0 && (d = !0);
      const I = {
        code: _,
        language: w
      };
      ae("before:highlight", I);
      const U = I.result ? I.result : Z(I.language, I.code, d);
      return U.code = I.code, ae("after:highlight", U), U;
    }
    function Z(n, c, d, _) {
      const w = /* @__PURE__ */ Object.create(null);
      function I(r, a) {
        return r.keywords[a];
      }
      function U() {
        if (!g.keywords) {
          T.addText(E);
          return;
        }
        let r = 0;
        g.keywordPatternRe.lastIndex = 0;
        let a = g.keywordPatternRe.exec(E), f = "";
        for (; a; ) {
          f += E.substring(r, a.index);
          const h = P.case_insensitive ? a[0].toLowerCase() : a[0], x = I(g, h);
          if (x) {
            const [L, Wt] = x;
            if (T.addText(f), f = "", w[h] = (w[h] || 0) + 1, w[h] <= Ot && (ue += Wt), L.startsWith("_"))
              f += a[0];
            else {
              const Kt = P.classNameAliases[L] || L;
              v(a[0], Kt);
            }
          } else
            f += a[0];
          r = g.keywordPatternRe.lastIndex, a = g.keywordPatternRe.exec(E);
        }
        f += E.substring(r), T.addText(f);
      }
      function ce() {
        if (E === "") return;
        let r = null;
        if (typeof g.subLanguage == "string") {
          if (!t[g.subLanguage]) {
            T.addText(E);
            return;
          }
          r = Z(g.subLanguage, E, !0, We[g.subLanguage]), We[g.subLanguage] = /** @type {CompiledMode} */
          r._top;
        } else
          r = ye(E, g.subLanguage.length ? g.subLanguage : null);
        g.relevance > 0 && (ue += r.relevance), T.__addSublanguage(r._emitter, r.language);
      }
      function A() {
        g.subLanguage != null ? ce() : U(), E = "";
      }
      function v(r, a) {
        r !== "" && (T.startScope(a), T.addText(r), T.endScope());
      }
      function Ue(r, a) {
        let f = 1;
        const h = a.length - 1;
        for (; f <= h; ) {
          if (!r._emit[f]) {
            f++;
            continue;
          }
          const x = P.classNameAliases[r[f]] || r[f], L = a[f];
          x ? v(L, x) : (E = L, U(), E = ""), f++;
        }
      }
      function Fe(r, a) {
        return r.scope && typeof r.scope == "string" && T.openNode(P.classNameAliases[r.scope] || r.scope), r.beginScope && (r.beginScope._wrap ? (v(E, P.classNameAliases[r.beginScope._wrap] || r.beginScope._wrap), E = "") : r.beginScope._multi && (Ue(r.beginScope, a), E = "")), g = Object.create(r, { parent: { value: g } }), g;
      }
      function He(r, a, f) {
        let h = _e(r.endRe, f);
        if (h) {
          if (r["on:end"]) {
            const x = new R(r);
            r["on:end"](a, x), x.isMatchIgnored && (h = !1);
          }
          if (h) {
            for (; r.endsParent && r.parent; )
              r = r.parent;
            return r;
          }
        }
        if (r.endsWithParent)
          return He(r.parent, a, f);
      }
      function Bt(r) {
        return g.matcher.regexIndex === 0 ? (E += r[0], 1) : (Ne = !0, 0);
      }
      function Ut(r) {
        const a = r[0], f = r.rule, h = new R(f), x = [f.__beforeBegin, f["on:begin"]];
        for (const L of x)
          if (L && (L(r, h), h.isMatchIgnored))
            return Bt(a);
        return f.skip ? E += a : (f.excludeBegin && (E += a), A(), !f.returnBegin && !f.excludeBegin && (E = a)), Fe(f, r), f.returnBegin ? 0 : a.length;
      }
      function Ft(r) {
        const a = r[0], f = c.substring(r.index), h = He(g, r, f);
        if (!h)
          return ve;
        const x = g;
        g.endScope && g.endScope._wrap ? (A(), v(a, g.endScope._wrap)) : g.endScope && g.endScope._multi ? (A(), Ue(g.endScope, r)) : x.skip ? E += a : (x.returnEnd || x.excludeEnd || (E += a), A(), x.excludeEnd && (E = a));
        do
          g.scope && T.closeNode(), !g.skip && !g.subLanguage && (ue += g.relevance), g = g.parent;
        while (g !== h.parent);
        return h.starts && Fe(h.starts, r), x.returnEnd ? 0 : a.length;
      }
      function Ht() {
        const r = [];
        for (let a = g; a !== P; a = a.parent)
          a.scope && r.unshift(a.scope);
        r.forEach((a) => T.openNode(a));
      }
      let le = {};
      function Ge(r, a) {
        const f = a && a[0];
        if (E += r, f == null)
          return A(), 0;
        if (le.type === "begin" && a.type === "end" && le.index === a.index && f === "") {
          if (E += c.slice(a.index, a.index + 1), !S) {
            const h = new Error(`0 width match regex (${n})`);
            throw h.languageName = n, h.badRule = le.rule, h;
          }
          return 1;
        }
        if (le = a, a.type === "begin")
          return Ut(a);
        if (a.type === "illegal" && !d) {
          const h = new Error('Illegal lexeme "' + f + '" for mode "' + (g.scope || "<unnamed>") + '"');
          throw h.mode = g, h;
        } else if (a.type === "end") {
          const h = Ft(a);
          if (h !== ve)
            return h;
        }
        if (a.type === "illegal" && f === "")
          return a.index === c.length || (E += `
`), 1;
        if (we > 1e5 && we > a.index * 3)
          throw new Error("potential infinite loop, way more iterations than matches");
        return E += f, f.length;
      }
      const P = B(n);
      if (!P)
        throw W(y.replace("{}", n)), new Error('Unknown language: "' + n + '"');
      const Gt = Mt(P);
      let Re = "", g = _ || Gt;
      const We = {}, T = new s.__emitter(s);
      Ht();
      let E = "", ue = 0, K = 0, we = 0, Ne = !1;
      try {
        if (P.__emitTokens)
          P.__emitTokens(c, T);
        else {
          for (g.matcher.considerAll(); ; ) {
            we++, Ne ? Ne = !1 : g.matcher.considerAll(), g.matcher.lastIndex = K;
            const r = g.matcher.exec(c);
            if (!r) break;
            const a = c.substring(K, r.index), f = Ge(a, r);
            K = r.index + f;
          }
          Ge(c.substring(K));
        }
        return T.finalize(), Re = T.toHTML(), {
          language: n,
          value: Re,
          relevance: ue,
          illegal: !1,
          _emitter: T,
          _top: g
        };
      } catch (r) {
        if (r.message && r.message.includes("Illegal"))
          return {
            language: n,
            value: be(c),
            illegal: !0,
            relevance: 0,
            _illegalBy: {
              message: r.message,
              index: K,
              context: c.slice(K - 100, K + 100),
              mode: r.mode,
              resultSoFar: Re
            },
            _emitter: T
          };
        if (S)
          return {
            language: n,
            value: be(c),
            illegal: !1,
            relevance: 0,
            errorRaised: r,
            _emitter: T,
            _top: g
          };
        throw r;
      }
    }
    function Se(n) {
      const c = {
        value: be(n),
        illegal: !1,
        relevance: 0,
        _top: o,
        _emitter: new s.__emitter(s)
      };
      return c._emitter.addText(n), c;
    }
    function ye(n, c) {
      c = c || s.languages || Object.keys(t);
      const d = Se(n), _ = c.filter(B).filter(Be).map(
        (A) => Z(A, n, !1)
      );
      _.unshift(d);
      const w = _.sort((A, v) => {
        if (A.relevance !== v.relevance) return v.relevance - A.relevance;
        if (A.language && v.language) {
          if (B(A.language).supersetOf === v.language)
            return 1;
          if (B(v.language).supersetOf === A.language)
            return -1;
        }
        return 0;
      }), [I, U] = w, ce = I;
      return ce.secondBest = U, ce;
    }
    function Tt(n, c, d) {
      const _ = c && i[c] || d;
      n.classList.add("hljs"), n.classList.add(`language-${_}`);
    }
    function Me(n) {
      let c = null;
      const d = O(n);
      if (l(d)) return;
      if (ae(
        "before:highlightElement",
        { el: n, language: d }
      ), n.dataset.highlighted) {
        console.log("Element previously highlighted. To highlight again, first unset `dataset.highlighted`.", n);
        return;
      }
      if (n.children.length > 0 && (s.ignoreUnescapedHTML || (console.warn("One of your code blocks includes unescaped HTML. This is a potentially serious security risk."), console.warn("https://github.com/highlightjs/highlight.js/wiki/security"), console.warn("The element with unescaped HTML:"), console.warn(n)), s.throwUnescapedHTML))
        throw new Nt(
          "One of your code blocks includes unescaped HTML.",
          n.innerHTML
        );
      c = n;
      const _ = c.textContent, w = d ? M(_, { language: d, ignoreIllegals: !0 }) : ye(_);
      n.innerHTML = w.value, n.dataset.highlighted = "yes", Tt(n, d, w.language), n.result = {
        language: w.language,
        // TODO: remove with version 11.0
        re: w.relevance,
        relevance: w.relevance
      }, w.secondBest && (n.secondBest = {
        language: w.secondBest.language,
        relevance: w.secondBest.relevance
      }), ae("after:highlightElement", { el: n, result: w, text: _ });
    }
    function xt(n) {
      s = Ce(s, n);
    }
    const At = () => {
      oe(), q("10.6.0", "initHighlighting() deprecated.  Use highlightAll() now.");
    };
    function mt() {
      oe(), q("10.6.0", "initHighlightingOnLoad() deprecated.  Use highlightAll() now.");
    }
    let Le = !1;
    function oe() {
      function n() {
        oe();
      }
      if (document.readyState === "loading") {
        Le || window.addEventListener("DOMContentLoaded", n, !1), Le = !0;
        return;
      }
      document.querySelectorAll(s.cssSelector).forEach(Me);
    }
    function It(n, c) {
      let d = null;
      try {
        d = c(e);
      } catch (_) {
        if (W("Language definition for '{}' could not be registered.".replace("{}", n)), S)
          W(_);
        else
          throw _;
        d = o;
      }
      d.name || (d.name = n), t[n] = d, d.rawDefinition = c.bind(null, e), d.aliases && De(d.aliases, { languageName: n });
    }
    function kt(n) {
      delete t[n];
      for (const c of Object.keys(i))
        i[c] === n && delete i[c];
    }
    function Ct() {
      return Object.keys(t);
    }
    function B(n) {
      return n = (n || "").toLowerCase(), t[n] || t[i[n]];
    }
    function De(n, { languageName: c }) {
      typeof n == "string" && (n = [n]), n.forEach((d) => {
        i[d.toLowerCase()] = c;
      });
    }
    function Be(n) {
      const c = B(n);
      return c && !c.disableAutodetect;
    }
    function vt(n) {
      n["before:highlightBlock"] && !n["before:highlightElement"] && (n["before:highlightElement"] = (c) => {
        n["before:highlightBlock"](
          Object.assign({ block: c.el }, c)
        );
      }), n["after:highlightBlock"] && !n["after:highlightElement"] && (n["after:highlightElement"] = (c) => {
        n["after:highlightBlock"](
          Object.assign({ block: c.el }, c)
        );
      });
    }
    function Pt(n) {
      vt(n), u.push(n);
    }
    function Lt(n) {
      const c = u.indexOf(n);
      c !== -1 && u.splice(c, 1);
    }
    function ae(n, c) {
      const d = n;
      u.forEach(function(_) {
        _[d] && _[d](c);
      });
    }
    function Dt(n) {
      return q("10.7.0", "highlightBlock will be removed entirely in v12.0"), q("10.7.0", "Please use highlightElement now."), Me(n);
    }
    Object.assign(e, {
      highlight: M,
      highlightAuto: ye,
      highlightAll: oe,
      highlightElement: Me,
      // TODO: Remove with v12 API
      highlightBlock: Dt,
      configure: xt,
      initHighlighting: At,
      initHighlightingOnLoad: mt,
      registerLanguage: It,
      unregisterLanguage: kt,
      listLanguages: Ct,
      getLanguage: B,
      registerAliases: De,
      autoDetection: Be,
      inherit: Ce,
      addPlugin: Pt,
      removePlugin: Lt
    }), e.debugMode = function() {
      S = !1;
    }, e.safeMode = function() {
      S = !0;
    }, e.versionString = wt, e.regex = {
      concat: C,
      lookahead: J,
      either: G,
      optional: pe,
      anyNumberOfTimes: Y
    };
    for (const n in re)
      typeof re[n] == "object" && p(re[n]);
    return Object.assign(e, re), e;
  }, X = Pe({});
  return X.newInstance = () => Pe({}), Oe = X, X.HighlightJS = X, X.default = X, Oe;
}
var zt = /* @__PURE__ */ $t();
const je = /* @__PURE__ */ jt(zt);
function qt(p) {
  const R = p.regex, N = p.COMMENT("//", "$", { contains: [{ begin: /\\\n/ }] }), b = "decltype\\(auto\\)", D = "[a-zA-Z_]\\w*::", fe = "(?!struct)(" + b + "|" + R.optional(D) + "[a-zA-Z_]\\w*" + R.optional("<[^<>]+>") + ")", F = {
    className: "type",
    begin: "\\b[a-z\\d_]*_t\\b"
  }, k = {
    className: "string",
    variants: [
      {
        begin: '(u8?|U|L)?"',
        end: '"',
        illegal: "\\n",
        contains: [p.BACKSLASH_ESCAPE]
      },
      {
        begin: "(u8?|U|L)?'(" + "\\\\(x[0-9A-Fa-f]{2}|u[0-9A-Fa-f]{4,8}|[0-7]{3}|\\S)" + "|.)",
        end: "'",
        illegal: "."
      },
      // https://en.cppreference.com/w/cpp/language/string_literal
      // a d-char-sequence never contains parentheses, backslashes or whitespace;
      // quotes are excluded as well so the closing delimiter cannot swallow the
      // quote that actually terminates the literal
      p.END_SAME_AS_BEGIN({
        begin: /(?:u8?|U|L)?R"([^()\\\s"]{0,16})\(/,
        end: /\)([^()\\\s"]{0,16})"/
      })
    ]
  }, j = {
    className: "number",
    variants: [
      // Floating-point literal.
      {
        begin: "[+-]?(?:(?:\\b[0-9](?:'?[0-9])*\\.(?:[0-9](?:'?[0-9])*)?|\\.[0-9](?:'?[0-9])*)(?:[Ee][+-]?[0-9](?:'?[0-9])*)?|\\b[0-9](?:'?[0-9])*[Ee][+-]?[0-9](?:'?[0-9])*|\\b0[Xx](?:[0-9A-Fa-f](?:'?[0-9A-Fa-f])*(?:\\.(?:[0-9A-Fa-f](?:'?[0-9A-Fa-f])*)?)?|\\.[0-9A-Fa-f](?:'?[0-9A-Fa-f])*)[Pp][+-]?[0-9](?:'?[0-9])*)(?:[Ff](?:16|32|64|128)?|(BF|bf)16|[Ll]|)"
      },
      // Integer literal.
      {
        begin: "[+-]?\\b(?:0[Bb][01](?:'?[01])*|0[Xx][0-9A-Fa-f](?:'?[0-9A-Fa-f])*|0(?:'?[0-7])*|[1-9](?:'?[0-9])*)(?:[Uu](?:LL?|ll?)|[Uu][Zz]?|(?:LL?|ll?)[Uu]?|[Zz][Uu]|)"
        // Note: there are user-defined literal suffixes too, but perhaps having the custom suffix not part of the
        // literal highlight actually makes it stand out more.
      }
    ],
    relevance: 0
  }, H = {
    scope: "meta",
    begin: /#\s*include\b/,
    end: /$/,
    keywords: { keyword: "include" },
    contains: [
      {
        // the `\` at the end of a line signaling continuation
        begin: /\\\n/
      },
      k,
      {
        scope: "string",
        begin: /<.*?>/
      },
      N,
      p.C_BLOCK_COMMENT_MODE
    ]
  }, J = {
    className: "meta",
    begin: /#\s*[a-z]+\b/,
    end: /$/,
    keywords: { keyword: "if else elif endif define undef warning error line pragma _Pragma ifdef ifndef include" },
    contains: [
      {
        begin: /\\\n/,
        relevance: 0
      },
      p.inherit(k, { className: "string" }),
      N,
      p.C_BLOCK_COMMENT_MODE
    ]
  }, Y = [
    H,
    J
  ], pe = {
    className: "title",
    begin: R.optional(D) + p.IDENT_RE,
    relevance: 0
  }, C = R.optional(D) + p.IDENT_RE + "\\s*\\(", he = 12, G = [
    "alignas",
    "alignof",
    "and",
    "and_eq",
    "asm",
    "atomic_cancel",
    "atomic_commit",
    "atomic_noexcept",
    "auto",
    "bitand",
    "bitor",
    "break",
    "case",
    "catch",
    "class",
    "co_await",
    "co_return",
    "co_yield",
    "compl",
    "concept",
    "const_cast|10",
    "consteval",
    "constexpr",
    "constinit",
    "continue",
    "decltype",
    "default",
    "delete",
    "do",
    "dynamic_cast|10",
    "else",
    "enum",
    "explicit",
    "export",
    "extern",
    "false",
    "final",
    "for",
    "friend",
    "goto",
    "if",
    "import",
    "inline",
    "module",
    "mutable",
    "namespace",
    "new",
    "noexcept",
    "not",
    "not_eq",
    "nullptr",
    "operator",
    "or",
    "or_eq",
    "override",
    "private",
    "protected",
    "public",
    "reflexpr",
    "register",
    "reinterpret_cast|10",
    "requires",
    "return",
    "sizeof",
    "static_assert",
    "static_cast|10",
    "struct",
    "switch",
    "synchronized",
    "template",
    "this",
    "thread_local",
    "throw",
    "transaction_safe",
    "transaction_safe_dynamic",
    "true",
    "try",
    "typedef",
    "typeid",
    "typename",
    "union",
    "using",
    "virtual",
    "volatile",
    "while",
    "xor",
    "xor_eq"
  ], Q = [
    "bool",
    "char",
    "char16_t",
    "char32_t",
    "char8_t",
    "double",
    "float",
    "int",
    "long",
    "short",
    "void",
    "wchar_t",
    "unsigned",
    "signed",
    "const",
    "static"
  ], _e = [
    "any",
    "auto_ptr",
    "barrier",
    "binary_semaphore",
    "bitset",
    "complex",
    "condition_variable",
    "condition_variable_any",
    "counting_semaphore",
    "deque",
    "false_type",
    "flat_map",
    "flat_set",
    "future",
    "imaginary",
    "initializer_list",
    "istringstream",
    "jthread",
    "latch",
    "lock_guard",
    "multimap",
    "multiset",
    "mutex",
    "optional",
    "ostringstream",
    "packaged_task",
    "pair",
    "promise",
    "priority_queue",
    "queue",
    "recursive_mutex",
    "recursive_timed_mutex",
    "scoped_lock",
    "set",
    "shared_future",
    "shared_lock",
    "shared_mutex",
    "shared_timed_mutex",
    "shared_ptr",
    "stack",
    "string_view",
    "stringstream",
    "timed_mutex",
    "thread",
    "true_type",
    "tuple",
    "unique_lock",
    "unique_ptr",
    "unordered_map",
    "unordered_multimap",
    "unordered_multiset",
    "unordered_set",
    "variant",
    "vector",
    "weak_ptr",
    "wstring",
    "wstring_view"
  ], Ee = [
    "abort",
    "abs",
    "acos",
    "apply",
    "as_const",
    "asin",
    "atan",
    "atan2",
    "calloc",
    "ceil",
    "cerr",
    "cin",
    "clog",
    "cos",
    "cosh",
    "cout",
    "declval",
    "endl",
    "exchange",
    "exit",
    "exp",
    "fabs",
    "floor",
    "fmod",
    "forward",
    "fprintf",
    "fputs",
    "free",
    "frexp",
    "fscanf",
    "future",
    "invoke",
    "isalnum",
    "isalpha",
    "iscntrl",
    "isdigit",
    "isgraph",
    "islower",
    "isprint",
    "ispunct",
    "isspace",
    "isupper",
    "isxdigit",
    "labs",
    "launder",
    "ldexp",
    "log",
    "log10",
    "make_pair",
    "make_shared",
    "make_shared_for_overwrite",
    "make_tuple",
    "make_unique",
    "malloc",
    "memchr",
    "memcmp",
    "memcpy",
    "memset",
    "modf",
    "move",
    "pow",
    "printf",
    "putchar",
    "puts",
    "realloc",
    "scanf",
    "sin",
    "sinh",
    "snprintf",
    "sprintf",
    "sqrt",
    "sscanf",
    "std",
    "stderr",
    "stdin",
    "stdout",
    "strcat",
    "strchr",
    "strcmp",
    "strcpy",
    "strcspn",
    "strlen",
    "strncat",
    "strncmp",
    "strncpy",
    "strpbrk",
    "strrchr",
    "strspn",
    "strstr",
    "swap",
    "tan",
    "tanh",
    "terminate",
    "to_underlying",
    "tolower",
    "toupper",
    "vfprintf",
    "visit",
    "vprintf",
    "vsprintf"
  ], m = {
    type: Q,
    keyword: G,
    literal: [
      "NULL",
      "false",
      "nullopt",
      "nullptr",
      "true"
    ],
    built_in: ["_Pragma"],
    _type_hints: _e
  }, $ = {
    className: "function.dispatch",
    relevance: 0,
    keywords: {
      // Only for relevance, not highlighting.
      _hint: Ee
    },
    begin: R.concat(
      /\b/,
      `(?!${G.join("|")})`,
      p.IDENT_RE,
      R.lookahead(/(<[^<>]+>|)\s*\(/)
    )
  }, z = [
    $,
    ...Y,
    F,
    N,
    p.C_BLOCK_COMMENT_MODE,
    j,
    k
  ], te = {
    // This mode covers expression context where we can't expect a function
    // definition and shouldn't highlight anything that looks like one:
    // `return some()`, `else if()`, `(x*sum(1, 2))`
    variants: [
      {
        begin: /=/,
        end: /;/
      },
      {
        begin: /\(/,
        end: /\)/
      },
      {
        beginKeywords: "new throw return else",
        end: /;/
      }
    ],
    keywords: m,
    contains: z.concat([
      {
        begin: /\(/,
        end: /\)/,
        keywords: m,
        contains: z.concat(["self"]),
        relevance: 0
      }
    ]),
    relevance: 0
  }, ne = {
    className: "function",
    begin: "(" + fe + "[\\*&\\s]+){1," + he + "}" + C,
    returnBegin: !0,
    end: /[{;=]/,
    excludeEnd: !0,
    keywords: m,
    illegal: /[^\w\s\*&:<>.]/,
    contains: [
      {
        // to prevent it from being confused as the function title
        begin: b,
        keywords: m,
        relevance: 0
      },
      {
        begin: C,
        returnBegin: !0,
        contains: [pe],
        relevance: 0
      },
      // needed because we do not have look-behind on the below rule
      // to prevent it from grabbing the final : in a :: pair
      {
        begin: /::/,
        relevance: 0
      },
      // initializers
      {
        begin: /:/,
        endsWithParent: !0,
        contains: [
          k,
          j
        ]
      },
      // allow for multiple declarations, e.g.:
      // extern void f(int), g(char);
      {
        relevance: 0,
        match: /,/
      },
      {
        className: "params",
        begin: /\(/,
        end: /\)/,
        keywords: m,
        relevance: 0,
        contains: [
          N,
          p.C_BLOCK_COMMENT_MODE,
          k,
          j,
          F,
          // Count matching parentheses.
          {
            begin: /\(/,
            end: /\)/,
            keywords: m,
            relevance: 0,
            contains: [
              "self",
              N,
              p.C_BLOCK_COMMENT_MODE,
              k,
              j,
              F
            ]
          }
        ]
      },
      F,
      N,
      p.C_BLOCK_COMMENT_MODE,
      ...Y
    ]
  };
  return {
    name: "C++",
    aliases: [
      "cc",
      "c++",
      "h++",
      "hpp",
      "hh",
      "hxx",
      "cxx"
    ],
    keywords: m,
    illegal: "</",
    classNameAliases: { "function.dispatch": "built_in" },
    contains: [].concat(
      te,
      ne,
      $,
      z,
      [
        ...Y,
        {
          // containers: ie, `vector <int> rooms (9);`
          begin: "\\b(deque|list|queue|priority_queue|pair|stack|vector|map|set|bitset|multiset|multimap|unordered_map|unordered_set|unordered_multiset|unordered_multimap|array|tuple|optional|variant|function|flat_map|flat_set)\\s*<(?!<)",
          end: ">",
          keywords: m,
          contains: [
            "self",
            F
          ]
        },
        {
          begin: p.IDENT_RE + "::",
          keywords: m
        },
        {
          match: [
            // extra complexity to deal with `enum class` and `enum struct`
            /\b(?:enum(?:\s+(?:class|struct))?|class|struct|union)/,
            /\s+/,
            /\w+/
          ],
          className: {
            1: "keyword",
            3: "title.class"
          }
        }
      ]
    )
  };
}
function Xt(p) {
  const R = {
    type: [
      "boolean",
      "byte",
      "word",
      "String"
    ],
    built_in: [
      "KeyboardController",
      "MouseController",
      "SoftwareSerial",
      "EthernetServer",
      "EthernetClient",
      "LiquidCrystal",
      "RobotControl",
      "GSMVoiceCall",
      "EthernetUDP",
      "EsploraTFT",
      "HttpClient",
      "RobotMotor",
      "WiFiClient",
      "GSMScanner",
      "FileSystem",
      "Scheduler",
      "GSMServer",
      "YunClient",
      "YunServer",
      "IPAddress",
      "GSMClient",
      "GSMModem",
      "Keyboard",
      "Ethernet",
      "Console",
      "GSMBand",
      "Esplora",
      "Stepper",
      "Process",
      "WiFiUDP",
      "GSM_SMS",
      "Mailbox",
      "USBHost",
      "Firmata",
      "PImage",
      "Client",
      "Server",
      "GSMPIN",
      "FileIO",
      "Bridge",
      "Serial",
      "EEPROM",
      "Stream",
      "Mouse",
      "Audio",
      "Servo",
      "File",
      "Task",
      "GPRS",
      "WiFi",
      "Wire",
      "TFT",
      "GSM",
      "SPI",
      "SD"
    ],
    _hints: [
      "setup",
      "loop",
      "runShellCommandAsynchronously",
      "analogWriteResolution",
      "retrieveCallingNumber",
      "printFirmwareVersion",
      "analogReadResolution",
      "sendDigitalPortPair",
      "noListenOnLocalhost",
      "readJoystickButton",
      "setFirmwareVersion",
      "readJoystickSwitch",
      "scrollDisplayRight",
      "getVoiceCallStatus",
      "scrollDisplayLeft",
      "writeMicroseconds",
      "delayMicroseconds",
      "beginTransmission",
      "getSignalStrength",
      "runAsynchronously",
      "getAsynchronously",
      "listenOnLocalhost",
      "getCurrentCarrier",
      "readAccelerometer",
      "messageAvailable",
      "sendDigitalPorts",
      "lineFollowConfig",
      "countryNameWrite",
      "runShellCommand",
      "readStringUntil",
      "rewindDirectory",
      "readTemperature",
      "setClockDivider",
      "readLightSensor",
      "endTransmission",
      "analogReference",
      "detachInterrupt",
      "countryNameRead",
      "attachInterrupt",
      "encryptionType",
      "readBytesUntil",
      "robotNameWrite",
      "readMicrophone",
      "robotNameRead",
      "cityNameWrite",
      "userNameWrite",
      "readJoystickY",
      "readJoystickX",
      "mouseReleased",
      "openNextFile",
      "scanNetworks",
      "noInterrupts",
      "digitalWrite",
      "beginSpeaker",
      "mousePressed",
      "isActionDone",
      "mouseDragged",
      "displayLogos",
      "noAutoscroll",
      "addParameter",
      "remoteNumber",
      "getModifiers",
      "keyboardRead",
      "userNameRead",
      "waitContinue",
      "processInput",
      "parseCommand",
      "printVersion",
      "readNetworks",
      "writeMessage",
      "blinkVersion",
      "cityNameRead",
      "readMessage",
      "setDataMode",
      "parsePacket",
      "isListening",
      "setBitOrder",
      "beginPacket",
      "isDirectory",
      "motorsWrite",
      "drawCompass",
      "digitalRead",
      "clearScreen",
      "serialEvent",
      "rightToLeft",
      "setTextSize",
      "leftToRight",
      "requestFrom",
      "keyReleased",
      "compassRead",
      "analogWrite",
      "interrupts",
      "WiFiServer",
      "disconnect",
      "playMelody",
      "parseFloat",
      "autoscroll",
      "getPINUsed",
      "setPINUsed",
      "setTimeout",
      "sendAnalog",
      "readSlider",
      "analogRead",
      "beginWrite",
      "createChar",
      "motorsStop",
      "keyPressed",
      "tempoWrite",
      "readButton",
      "subnetMask",
      "debugPrint",
      "macAddress",
      "writeGreen",
      "randomSeed",
      "attachGPRS",
      "readString",
      "sendString",
      "remotePort",
      "releaseAll",
      "mouseMoved",
      "background",
      "getXChange",
      "getYChange",
      "answerCall",
      "getResult",
      "voiceCall",
      "endPacket",
      "constrain",
      "getSocket",
      "writeJSON",
      "getButton",
      "available",
      "connected",
      "findUntil",
      "readBytes",
      "exitValue",
      "readGreen",
      "writeBlue",
      "startLoop",
      "IPAddress",
      "isPressed",
      "sendSysex",
      "pauseMode",
      "gatewayIP",
      "setCursor",
      "getOemKey",
      "tuneWrite",
      "noDisplay",
      "loadImage",
      "switchPIN",
      "onRequest",
      "onReceive",
      "changePIN",
      "playFile",
      "noBuffer",
      "parseInt",
      "overflow",
      "checkPIN",
      "knobRead",
      "beginTFT",
      "bitClear",
      "updateIR",
      "bitWrite",
      "position",
      "writeRGB",
      "highByte",
      "writeRed",
      "setSpeed",
      "readBlue",
      "noStroke",
      "remoteIP",
      "transfer",
      "shutdown",
      "hangCall",
      "beginSMS",
      "endWrite",
      "attached",
      "maintain",
      "noCursor",
      "checkReg",
      "checkPUK",
      "shiftOut",
      "isValid",
      "shiftIn",
      "pulseIn",
      "connect",
      "println",
      "localIP",
      "pinMode",
      "getIMEI",
      "display",
      "noBlink",
      "process",
      "getBand",
      "running",
      "beginSD",
      "drawBMP",
      "lowByte",
      "setBand",
      "release",
      "bitRead",
      "prepare",
      "pointTo",
      "readRed",
      "setMode",
      "noFill",
      "remove",
      "listen",
      "stroke",
      "detach",
      "attach",
      "noTone",
      "exists",
      "buffer",
      "height",
      "bitSet",
      "circle",
      "config",
      "cursor",
      "random",
      "IRread",
      "setDNS",
      "endSMS",
      "getKey",
      "micros",
      "millis",
      "begin",
      "print",
      "write",
      "ready",
      "flush",
      "width",
      "isPIN",
      "blink",
      "clear",
      "press",
      "mkdir",
      "rmdir",
      "close",
      "point",
      "yield",
      "image",
      "BSSID",
      "click",
      "delay",
      "read",
      "text",
      "move",
      "peek",
      "beep",
      "rect",
      "line",
      "open",
      "seek",
      "fill",
      "size",
      "turn",
      "stop",
      "home",
      "find",
      "step",
      "tone",
      "sqrt",
      "RSSI",
      "SSID",
      "end",
      "bit",
      "tan",
      "cos",
      "sin",
      "pow",
      "map",
      "abs",
      "max",
      "min",
      "get",
      "run",
      "put"
    ],
    literal: [
      "DIGITAL_MESSAGE",
      "FIRMATA_STRING",
      "ANALOG_MESSAGE",
      "REPORT_DIGITAL",
      "REPORT_ANALOG",
      "INPUT_PULLUP",
      "SET_PIN_MODE",
      "INTERNAL2V56",
      "SYSTEM_RESET",
      "LED_BUILTIN",
      "INTERNAL1V1",
      "SYSEX_START",
      "INTERNAL",
      "EXTERNAL",
      "DEFAULT",
      "OUTPUT",
      "INPUT",
      "HIGH",
      "LOW"
    ]
  }, N = qt(p), b = (
    /** @type {Record<string,any>} */
    N.keywords
  );
  return b.type = [
    ...b.type,
    ...R.type
  ], b.literal = [
    ...b.literal,
    ...R.literal
  ], b.built_in = [
    ...b.built_in,
    ...R.built_in
  ], b._hints = R._hints, N.name = "Arduino", N.aliases = ["ino"], N.supersetOf = "cpp", N;
}
je.registerLanguage("arduino", Xt);
function Yt(p) {
  return je.highlight(String(p), { language: "arduino", ignoreIllegals: !0 }).value;
}
function Zt(p) {
  const R = [];
  return Yt(p).split(`
`).map((N) => {
    const b = R.join("");
    for (const [D] of N.matchAll(/<\/?span\b[^>]*>/g))
      D.startsWith("</") ? R.pop() : R.push(D);
    return b + N + "</span>".repeat(R.length);
  });
}
export {
  Yt as highlightCode,
  Zt as highlightLines
};
