import 'regenerator-runtime/runtime';
import uuid from 'uuid/v4';
import debounce from 'lodash.debounce';
import BigNumber from 'bignumber.js';
import blocknativeSdk from 'bnc-sdk';

function noop() { }
const identity = x => x;
function run(fn) {
    return fn();
}
function blank_object() {
    return Object.create(null);
}
function run_all(fns) {
    fns.forEach(run);
}
function is_function(thing) {
    return typeof thing === 'function';
}
function safe_not_equal(a, b) {
    return a != a ? b == b : a !== b || ((a && typeof a === 'object') || typeof a === 'function');
}
function subscribe(store, callback) {
    const unsub = store.subscribe(callback);
    return unsub.unsubscribe ? () => unsub.unsubscribe() : unsub;
}
function get_store_value(store) {
    let value;
    subscribe(store, _ => value = _)();
    return value;
}
function component_subscribe(component, store, callback) {
    component.$$.on_destroy.push(subscribe(store, callback));
}

const is_client = typeof window !== 'undefined';
let now = is_client
    ? () => window.performance.now()
    : () => Date.now();
let raf = is_client ? cb => requestAnimationFrame(cb) : noop;

const tasks = new Set();
let running = false;
function run_tasks() {
    tasks.forEach(task => {
        if (!task[0](now())) {
            tasks.delete(task);
            task[1]();
        }
    });
    running = tasks.size > 0;
    if (running)
        raf(run_tasks);
}
function loop(fn) {
    let task;
    if (!running) {
        running = true;
        raf(run_tasks);
    }
    return {
        promise: new Promise(fulfil => {
            tasks.add(task = [fn, fulfil]);
        }),
        abort() {
            tasks.delete(task);
        }
    };
}

function append(target, node) {
    target.appendChild(node);
}
function insert(target, node, anchor) {
    target.insertBefore(node, anchor || null);
}
function detach(node) {
    node.parentNode.removeChild(node);
}
function element(name) {
    return document.createElement(name);
}
function svg_element(name) {
    return document.createElementNS('http://www.w3.org/2000/svg', name);
}
function text(data) {
    return document.createTextNode(data);
}
function space() {
    return text(' ');
}
function empty() {
    return text('');
}
function listen(node, event, handler, options) {
    node.addEventListener(event, handler, options);
    return () => node.removeEventListener(event, handler, options);
}
function attr(node, attribute, value) {
    if (value == null)
        node.removeAttribute(attribute);
    else
        node.setAttribute(attribute, value);
}
function children(element) {
    return Array.from(element.childNodes);
}
function set_data(text, data) {
    data = '' + data;
    if (text.data !== data)
        text.data = data;
}
function set_style(node, key, value, important) {
    node.style.setProperty(key, value, important ? 'important' : '');
}
function toggle_class(element, name, toggle) {
    element.classList[toggle ? 'add' : 'remove'](name);
}
function custom_event(type, detail) {
    const e = document.createEvent('CustomEvent');
    e.initCustomEvent(type, false, false, detail);
    return e;
}

let stylesheet;
let active = 0;
let current_rules = {};
// https://github.com/darkskyapp/string-hash/blob/master/index.js
function hash(str) {
    let hash = 5381;
    let i = str.length;
    while (i--)
        hash = ((hash << 5) - hash) ^ str.charCodeAt(i);
    return hash >>> 0;
}
function create_rule(node, a, b, duration, delay, ease, fn, uid = 0) {
    const step = 16.666 / duration;
    let keyframes = '{\n';
    for (let p = 0; p <= 1; p += step) {
        const t = a + (b - a) * ease(p);
        keyframes += p * 100 + `%{${fn(t, 1 - t)}}\n`;
    }
    const rule = keyframes + `100% {${fn(b, 1 - b)}}\n}`;
    const name = `__svelte_${hash(rule)}_${uid}`;
    if (!current_rules[name]) {
        if (!stylesheet) {
            const style = element('style');
            document.head.appendChild(style);
            stylesheet = style.sheet;
        }
        current_rules[name] = true;
        stylesheet.insertRule(`@keyframes ${name} ${rule}`, stylesheet.cssRules.length);
    }
    const animation = node.style.animation || '';
    node.style.animation = `${animation ? `${animation}, ` : ``}${name} ${duration}ms linear ${delay}ms 1 both`;
    active += 1;
    return name;
}
function delete_rule(node, name) {
    node.style.animation = (node.style.animation || '')
        .split(', ')
        .filter(name
        ? anim => anim.indexOf(name) < 0 // remove specific animation
        : anim => anim.indexOf('__svelte') === -1 // remove all Svelte animations
    )
        .join(', ');
    if (name && !--active)
        clear_rules();
}
function clear_rules() {
    raf(() => {
        if (active)
            return;
        let i = stylesheet.cssRules.length;
        while (i--)
            stylesheet.deleteRule(i);
        current_rules = {};
    });
}

function create_animation(node, from, fn, params) {
    if (!from)
        return noop;
    const to = node.getBoundingClientRect();
    if (from.left === to.left && from.right === to.right && from.top === to.top && from.bottom === to.bottom)
        return noop;
    const { delay = 0, duration = 300, easing = identity, 
    // @ts-ignore todo: should this be separated from destructuring? Or start/end added to public api and documentation?
    start: start_time = now() + delay, 
    // @ts-ignore todo:
    end = start_time + duration, tick = noop, css } = fn(node, { from, to }, params);
    let running = true;
    let started = false;
    let name;
    function start() {
        if (css) {
            name = create_rule(node, 0, 1, duration, delay, easing, css);
        }
        if (!delay) {
            started = true;
        }
    }
    function stop() {
        if (css)
            delete_rule(node, name);
        running = false;
    }
    loop(now => {
        if (!started && now >= start_time) {
            started = true;
        }
        if (started && now >= end) {
            tick(1, 0);
            stop();
        }
        if (!running) {
            return false;
        }
        if (started) {
            const p = now - start_time;
            const t = 0 + 1 * easing(p / duration);
            tick(t, 1 - t);
        }
        return true;
    });
    start();
    tick(0, 1);
    return stop;
}
function fix_position(node) {
    const style = getComputedStyle(node);
    if (style.position !== 'absolute' && style.position !== 'fixed') {
        const { width, height } = style;
        const a = node.getBoundingClientRect();
        node.style.position = 'absolute';
        node.style.width = width;
        node.style.height = height;
        add_transform(node, a);
    }
}
function add_transform(node, a) {
    const b = node.getBoundingClientRect();
    if (a.left !== b.left || a.top !== b.top) {
        const style = getComputedStyle(node);
        const transform = style.transform === 'none' ? '' : style.transform;
        node.style.transform = `${transform} translate(${a.left - b.left}px, ${a.top - b.top}px)`;
    }
}

let current_component;
function set_current_component(component) {
    current_component = component;
}
function get_current_component() {
    if (!current_component)
        throw new Error(`Function called outside component initialization`);
    return current_component;
}
function onDestroy(fn) {
    get_current_component().$$.on_destroy.push(fn);
}

const dirty_components = [];
const binding_callbacks = [];
const render_callbacks = [];
const flush_callbacks = [];
const resolved_promise = Promise.resolve();
let update_scheduled = false;
function schedule_update() {
    if (!update_scheduled) {
        update_scheduled = true;
        resolved_promise.then(flush);
    }
}
function add_render_callback(fn) {
    render_callbacks.push(fn);
}
function flush() {
    const seen_callbacks = new Set();
    do {
        // first, call beforeUpdate functions
        // and update components
        while (dirty_components.length) {
            const component = dirty_components.shift();
            set_current_component(component);
            update(component.$$);
        }
        while (binding_callbacks.length)
            binding_callbacks.pop()();
        // then, once components are updated, call
        // afterUpdate functions. This may cause
        // subsequent updates...
        for (let i = 0; i < render_callbacks.length; i += 1) {
            const callback = render_callbacks[i];
            if (!seen_callbacks.has(callback)) {
                callback();
                // ...so guard against infinite loops
                seen_callbacks.add(callback);
            }
        }
        render_callbacks.length = 0;
    } while (dirty_components.length);
    while (flush_callbacks.length) {
        flush_callbacks.pop()();
    }
    update_scheduled = false;
}
function update($$) {
    if ($$.fragment) {
        $$.update($$.dirty);
        run_all($$.before_update);
        $$.fragment.p($$.dirty, $$.ctx);
        $$.dirty = null;
        $$.after_update.forEach(add_render_callback);
    }
}

let promise;
function wait() {
    if (!promise) {
        promise = Promise.resolve();
        promise.then(() => {
            promise = null;
        });
    }
    return promise;
}
function dispatch(node, direction, kind) {
    node.dispatchEvent(custom_event(`${direction ? 'intro' : 'outro'}${kind}`));
}
const outroing = new Set();
let outros;
function group_outros() {
    outros = {
        r: 0,
        c: [],
        p: outros // parent group
    };
}
function check_outros() {
    if (!outros.r) {
        run_all(outros.c);
    }
    outros = outros.p;
}
function transition_in(block, local) {
    if (block && block.i) {
        outroing.delete(block);
        block.i(local);
    }
}
function transition_out(block, local, detach, callback) {
    if (block && block.o) {
        if (outroing.has(block))
            return;
        outroing.add(block);
        outros.c.push(() => {
            outroing.delete(block);
            if (callback) {
                if (detach)
                    block.d(1);
                callback();
            }
        });
        block.o(local);
    }
}
const null_transition = { duration: 0 };
function create_in_transition(node, fn, params) {
    let config = fn(node, params);
    let running = false;
    let animation_name;
    let task;
    let uid = 0;
    function cleanup() {
        if (animation_name)
            delete_rule(node, animation_name);
    }
    function go() {
        const { delay = 0, duration = 300, easing = identity, tick = noop, css } = config || null_transition;
        if (css)
            animation_name = create_rule(node, 0, 1, duration, delay, easing, css, uid++);
        tick(0, 1);
        const start_time = now() + delay;
        const end_time = start_time + duration;
        if (task)
            task.abort();
        running = true;
        add_render_callback(() => dispatch(node, true, 'start'));
        task = loop(now => {
            if (running) {
                if (now >= end_time) {
                    tick(1, 0);
                    dispatch(node, true, 'end');
                    cleanup();
                    return running = false;
                }
                if (now >= start_time) {
                    const t = easing((now - start_time) / duration);
                    tick(t, 1 - t);
                }
            }
            return running;
        });
    }
    let started = false;
    return {
        start() {
            if (started)
                return;
            delete_rule(node);
            if (is_function(config)) {
                config = config();
                wait().then(go);
            }
            else {
                go();
            }
        },
        invalidate() {
            started = false;
        },
        end() {
            if (running) {
                cleanup();
                running = false;
            }
        }
    };
}
function create_out_transition(node, fn, params) {
    let config = fn(node, params);
    let running = true;
    let animation_name;
    const group = outros;
    group.r += 1;
    function go() {
        const { delay = 0, duration = 300, easing = identity, tick = noop, css } = config || null_transition;
        if (css)
            animation_name = create_rule(node, 1, 0, duration, delay, easing, css);
        const start_time = now() + delay;
        const end_time = start_time + duration;
        add_render_callback(() => dispatch(node, false, 'start'));
        loop(now => {
            if (running) {
                if (now >= end_time) {
                    tick(0, 1);
                    dispatch(node, false, 'end');
                    if (!--group.r) {
                        // this will result in `end()` being called,
                        // so we don't need to clean up here
                        run_all(group.c);
                    }
                    return false;
                }
                if (now >= start_time) {
                    const t = easing((now - start_time) / duration);
                    tick(1 - t, t);
                }
            }
            return running;
        });
    }
    if (is_function(config)) {
        wait().then(() => {
            // @ts-ignore
            config = config();
            go();
        });
    }
    else {
        go();
    }
    return {
        end(reset) {
            if (reset && config.tick) {
                config.tick(1, 0);
            }
            if (running) {
                if (animation_name)
                    delete_rule(node, animation_name);
                running = false;
            }
        }
    };
}
function outro_and_destroy_block(block, lookup) {
    transition_out(block, 1, 1, () => {
        lookup.delete(block.key);
    });
}
function fix_and_outro_and_destroy_block(block, lookup) {
    block.f();
    outro_and_destroy_block(block, lookup);
}
function update_keyed_each(old_blocks, changed, get_key, dynamic, ctx, list, lookup, node, destroy, create_each_block, next, get_context) {
    let o = old_blocks.length;
    let n = list.length;
    let i = o;
    const old_indexes = {};
    while (i--)
        old_indexes[old_blocks[i].key] = i;
    const new_blocks = [];
    const new_lookup = new Map();
    const deltas = new Map();
    i = n;
    while (i--) {
        const child_ctx = get_context(ctx, list, i);
        const key = get_key(child_ctx);
        let block = lookup.get(key);
        if (!block) {
            block = create_each_block(key, child_ctx);
            block.c();
        }
        else if (dynamic) {
            block.p(changed, child_ctx);
        }
        new_lookup.set(key, new_blocks[i] = block);
        if (key in old_indexes)
            deltas.set(key, Math.abs(i - old_indexes[key]));
    }
    const will_move = new Set();
    const did_move = new Set();
    function insert(block) {
        transition_in(block, 1);
        block.m(node, next);
        lookup.set(block.key, block);
        next = block.first;
        n--;
    }
    while (o && n) {
        const new_block = new_blocks[n - 1];
        const old_block = old_blocks[o - 1];
        const new_key = new_block.key;
        const old_key = old_block.key;
        if (new_block === old_block) {
            // do nothing
            next = new_block.first;
            o--;
            n--;
        }
        else if (!new_lookup.has(old_key)) {
            // remove old block
            destroy(old_block, lookup);
            o--;
        }
        else if (!lookup.has(new_key) || will_move.has(new_key)) {
            insert(new_block);
        }
        else if (did_move.has(old_key)) {
            o--;
        }
        else if (deltas.get(new_key) > deltas.get(old_key)) {
            did_move.add(new_key);
            insert(new_block);
        }
        else {
            will_move.add(old_key);
            o--;
        }
    }
    while (o--) {
        const old_block = old_blocks[o];
        if (!new_lookup.has(old_block.key))
            destroy(old_block, lookup);
    }
    while (n)
        insert(new_blocks[n - 1]);
    return new_blocks;
}
function mount_component(component, target, anchor) {
    const { fragment, on_mount, on_destroy, after_update } = component.$$;
    fragment.m(target, anchor);
    // onMount happens before the initial afterUpdate
    add_render_callback(() => {
        const new_on_destroy = on_mount.map(run).filter(is_function);
        if (on_destroy) {
            on_destroy.push(...new_on_destroy);
        }
        else {
            // Edge case - component was destroyed immediately,
            // most likely as a result of a binding initialising
            run_all(new_on_destroy);
        }
        component.$$.on_mount = [];
    });
    after_update.forEach(add_render_callback);
}
function destroy_component(component, detaching) {
    if (component.$$.fragment) {
        run_all(component.$$.on_destroy);
        component.$$.fragment.d(detaching);
        // TODO null out other refs, including component.$$ (but need to
        // preserve final state?)
        component.$$.on_destroy = component.$$.fragment = null;
        component.$$.ctx = {};
    }
}
function make_dirty(component, key) {
    if (!component.$$.dirty) {
        dirty_components.push(component);
        schedule_update();
        component.$$.dirty = blank_object();
    }
    component.$$.dirty[key] = true;
}
function init(component, options, instance, create_fragment, not_equal, prop_names) {
    const parent_component = current_component;
    set_current_component(component);
    const props = options.props || {};
    const $$ = component.$$ = {
        fragment: null,
        ctx: null,
        // state
        props: prop_names,
        update: noop,
        not_equal,
        bound: blank_object(),
        // lifecycle
        on_mount: [],
        on_destroy: [],
        before_update: [],
        after_update: [],
        context: new Map(parent_component ? parent_component.$$.context : []),
        // everything else
        callbacks: blank_object(),
        dirty: null
    };
    let ready = false;
    $$.ctx = instance
        ? instance(component, props, (key, ret, value = ret) => {
            if ($$.ctx && not_equal($$.ctx[key], $$.ctx[key] = value)) {
                if ($$.bound[key])
                    $$.bound[key](value);
                if (ready)
                    make_dirty(component, key);
            }
            return ret;
        })
        : props;
    $$.update();
    ready = true;
    run_all($$.before_update);
    $$.fragment = create_fragment($$.ctx);
    if (options.target) {
        if (options.hydrate) {
            // eslint-disable-next-line @typescript-eslint/no-non-null-assertion
            $$.fragment.l(children(options.target));
        }
        else {
            // eslint-disable-next-line @typescript-eslint/no-non-null-assertion
            $$.fragment.c();
        }
        if (options.intro)
            transition_in(component.$$.fragment);
        mount_component(component, options.target, options.anchor);
        flush();
    }
    set_current_component(parent_component);
}
class SvelteComponent {
    $destroy() {
        destroy_component(this, 1);
        this.$destroy = noop;
    }
    $on(type, callback) {
        const callbacks = (this.$$.callbacks[type] || (this.$$.callbacks[type] = []));
        callbacks.push(callback);
        return () => {
            const index = callbacks.indexOf(callback);
            if (index !== -1)
                callbacks.splice(index, 1);
        };
    }
    $set() {
        // overridden by instance, if it has props
    }
}

const subscriber_queue = [];
/**
 * Creates a `Readable` store that allows reading by subscription.
 * @param value initial value
 * @param {StartStopNotifier}start start and stop notifications for subscriptions
 */
function readable(value, start) {
    return {
        subscribe: writable(value, start).subscribe,
    };
}
/**
 * Create a `Writable` store that allows both updating and reading by subscription.
 * @param {*=}value initial value
 * @param {StartStopNotifier=}start start and stop notifications for subscriptions
 */
function writable(value, start = noop) {
    let stop;
    const subscribers = [];
    function set(new_value) {
        if (safe_not_equal(value, new_value)) {
            value = new_value;
            if (stop) { // store is ready
                const run_queue = !subscriber_queue.length;
                for (let i = 0; i < subscribers.length; i += 1) {
                    const s = subscribers[i];
                    s[1]();
                    subscriber_queue.push(s, value);
                }
                if (run_queue) {
                    for (let i = 0; i < subscriber_queue.length; i += 2) {
                        subscriber_queue[i][0](subscriber_queue[i + 1]);
                    }
                    subscriber_queue.length = 0;
                }
            }
        }
    }
    function update(fn) {
        set(fn(value));
    }
    function subscribe(run, invalidate = noop) {
        const subscriber = [run, invalidate];
        subscribers.push(subscriber);
        if (subscribers.length === 1) {
            stop = start(set) || noop;
        }
        run(value);
        return () => {
            const index = subscribers.indexOf(subscriber);
            if (index !== -1) {
                subscribers.splice(index, 1);
            }
            if (subscribers.length === 0) {
                stop();
                stop = null;
            }
        };
    }
    return { set, update, subscribe };
}
/**
 * Derived value store by synchronizing one or more readable stores and
 * applying an aggregation function over its input values.
 * @param {Stores} stores input stores
 * @param {function(Stores=, function(*)=):*}fn function callback that aggregates the values
 * @param {*=}initial_value when used asynchronously
 */
function derived(stores, fn, initial_value) {
    const single = !Array.isArray(stores);
    const stores_array = single
        ? [stores]
        : stores;
    const auto = fn.length < 2;
    return readable(initial_value, (set) => {
        let inited = false;
        const values = [];
        let pending = 0;
        let cleanup = noop;
        const sync = () => {
            if (pending) {
                return;
            }
            cleanup();
            const result = fn(single ? values[0] : values, set);
            if (auto) {
                set(result);
            }
            else {
                cleanup = is_function(result) ? result : noop;
            }
        };
        const unsubscribers = stores_array.map((store, i) => store.subscribe((value) => {
            values[i] = value;
            pending &= ~(1 << i);
            if (inited) {
                sync();
            }
        }, () => {
            pending |= (1 << i);
        }));
        inited = true;
        sync();
        return function stop() {
            run_all(unsubscribers);
            cleanup();
        };
    });
}

// gutted from https://github.com/Polymer/observe-js/blob/master/src/observe.js
function noop$1 () {}
function detectEval () {
  // Don't test for eval if we're running in a Chrome App environment.
  // We check for APIs set that only exist in a Chrome App context.
  if (typeof chrome !== 'undefined' && chrome.app && chrome.app.runtime) {
    return false
  }

  // Firefox OS Apps do not allow eval. This feature detection is very hacky
  // but even if some other platform adds support for this function this code
  // will continue to work.
  if (typeof navigator != 'undefined' && navigator.getDeviceStorage) {
    return false
  }

  try {
    var f = new Function('', 'return true;');
    return f()
  } catch (ex) {
    return false
  }
}

var hasEval = detectEval();

function isIndex (s) {
  return +s === s >>> 0 && s !== ''
}

function isObject (obj) {
  return obj === Object(obj)
}

var createObject = ('__proto__' in {}) ?
  function (obj) {
    return obj
  } :
  function (obj) {
    var proto = obj.__proto__;
    if (!proto)
      return obj
    var newObject = Object.create(proto);
    Object.getOwnPropertyNames(obj).forEach(function (name) {
      Object.defineProperty(newObject, name,
        Object.getOwnPropertyDescriptor(obj, name));
    });
    return newObject
  };

function parsePath (path) {
  var keys = [];
  var index = -1;
  var c, newChar, key, type, transition, action, typeMap, mode = 'beforePath';

  var actions = {
    push: function () {
      if (key === undefined)
        return

      keys.push(key);
      key = undefined;
    },

    append: function () {
      if (key === undefined)
        key = newChar;
      else
        key += newChar;
    }
  };

  function maybeUnescapeQuote () {
    if (index >= path.length)
      return

    var nextChar = path[index + 1];
    if ((mode == 'inSingleQuote' && nextChar == "'") ||
      (mode == 'inDoubleQuote' && nextChar == '"')) {
      index++;
      newChar = nextChar;
      actions.append();
      return true
    }
  }

  while (mode) {
    index++;
    c = path[index];

    if (c == '\\' && maybeUnescapeQuote())
      continue

    type = getPathCharType(c);
    typeMap = pathStateMachine[mode];
    transition = typeMap[type] || typeMap['else'] || 'error';

    if (transition == 'error')
      return // parse error

    mode = transition[0];
    action = actions[transition[1]] || noop$1;
    newChar = transition[2] === undefined ? c : transition[2];
    action();

    if (mode === 'afterPath') {
      return keys
    }
  }

  return // parse error
}

var identStart = '[\$_a-zA-Z]';
var identPart = '[\$_a-zA-Z0-9]';
var identRegExp = new RegExp('^' + identStart + '+' + identPart + '*' + '$');

function isIdent (s) {
  return identRegExp.test(s)
}

var constructorIsPrivate = {};

function Path (parts, privateToken) {
  if (privateToken !== constructorIsPrivate)
    throw Error('Use Path.get to retrieve path objects')

  for (var i = 0; i < parts.length; i++) {
    this.push(String(parts[i]));
  }

  if (hasEval && this.length) {
    this.getValueFrom = this.compiledGetValueFromFn();
  }
}

var pathCache = {};

function getPath (pathString) {
  if (pathString instanceof Path)
    return pathString

  if (pathString == null || pathString.length == 0)
    pathString = '';

  if (typeof pathString != 'string') {
    if (isIndex(pathString.length)) {
      // Constructed with array-like (pre-parsed) keys
      return new Path(pathString, constructorIsPrivate)
    }

    pathString = String(pathString);
  }

  var path = pathCache[pathString];
  if (path)
    return path

  var parts = parsePath(pathString);
  if (!parts)
    return invalidPath

  var path = new Path(parts, constructorIsPrivate);
  pathCache[pathString] = path;
  return path
}

Path.get = getPath;

function formatAccessor (key) {
  if (isIndex(key)) {
    return '[' + key + ']'
  } else {
    return '["' + key.replace(/"/g, '\\"') + '"]'
  }
}

Path.prototype = createObject({
  __proto__: [],
  valid: true,

  toString: function () {
    var pathString = '';
    for (var i = 0; i < this.length; i++) {
      var key = this[i];
      if (isIdent(key)) {
        pathString += i ? '.' + key : key;
      } else {
        pathString += formatAccessor(key);
      }
    }

    return pathString
  },

  getValueFrom: function (obj, directObserver) {
    for (var i = 0; i < this.length; i++) {
      if (obj == null)
        return
      obj = obj[this[i]];
    }
    return obj
  },

  iterateObjects: function (obj, observe) {
    for (var i = 0; i < this.length; i++) {
      if (i)
        obj = obj[this[i - 1]];
      if (!isObject(obj))
        return
      observe(obj, this[i]);
    }
  },

  compiledGetValueFromFn: function () {
    var str = '';
    var pathString = 'obj';
    str += 'if (obj != null';
    var i = 0;
    var key;
    for (; i < (this.length - 1); i++) {
      key = this[i];
      pathString += isIdent(key) ? '.' + key : formatAccessor(key);
      str += ' &&\n     ' + pathString + ' != null';
    }
    str += ')\n';

    var key = this[i];
    pathString += isIdent(key) ? '.' + key : formatAccessor(key);

    str += '  return ' + pathString + ';\nelse\n  return undefined;';
    return new Function('obj', str)
  },

  setValueFrom: function (obj, value) {
    if (!this.length)
      return false

    for (var i = 0; i < this.length - 1; i++) {
      if (!isObject(obj))
        return false
      obj = obj[this[i]];
    }

    if (!isObject(obj))
      return false

    obj[this[i]] = value;
    return true
  }
});

function getPathCharType (char) {
  if (char === undefined)
    return 'eof'

  var code = char.charCodeAt(0);

  switch (code) {
    case 0x5B: // [
    case 0x5D: // ]
    case 0x2E: // .
    case 0x22: // "
    case 0x27: // '
    case 0x30: // 0
      return char

    case 0x5F: // _
    case 0x24: // $
      return 'ident'

    case 0x20: // Space
    case 0x09: // Tab
    case 0x0A: // Newline
    case 0x0D: // Return
    case 0xA0: // No-break space
    case 0xFEFF: // Byte Order Mark
    case 0x2028: // Line Separator
    case 0x2029: // Paragraph Separator
      return 'ws'
  }

  // a-z, A-Z
  if ((0x61 <= code && code <= 0x7A) || (0x41 <= code && code <= 0x5A))
    return 'ident'

  // 1-9
  if (0x31 <= code && code <= 0x39)
    return 'number'

  return 'else'
}

var pathStateMachine = {
  'beforePath': {
    'ws': ['beforePath'],
    'ident': ['inIdent', 'append'],
    '[': ['beforeElement'],
    'eof': ['afterPath']
  },

  'inPath': {
    'ws': ['inPath'],
    '.': ['beforeIdent'],
    '[': ['beforeElement'],
    'eof': ['afterPath']
  },

  'beforeIdent': {
    'ws': ['beforeIdent'],
    'ident': ['inIdent', 'append']
  },

  'inIdent': {
    'ident': ['inIdent', 'append'],
    '0': ['inIdent', 'append'],
    'number': ['inIdent', 'append'],
    'ws': ['inPath', 'push'],
    '.': ['beforeIdent', 'push'],
    '[': ['beforeElement', 'push'],
    'eof': ['afterPath', 'push']
  },

  'beforeElement': {
    'ws': ['beforeElement'],
    '0': ['afterZero', 'append'],
    'number': ['inIndex', 'append'],
    "'": ['inSingleQuote', 'append', ''],
    '"': ['inDoubleQuote', 'append', '']
  },

  'afterZero': {
    'ws': ['afterElement', 'push'],
    ']': ['inPath', 'push']
  },

  'inIndex': {
    '0': ['inIndex', 'append'],
    'number': ['inIndex', 'append'],
    'ws': ['afterElement'],
    ']': ['inPath', 'push']
  },

  'inSingleQuote': {
    "'": ['afterElement'],
    'eof': ['error'],
    'else': ['inSingleQuote', 'append']
  },

  'inDoubleQuote': {
    '"': ['afterElement'],
    'eof': ['error'],
    'else': ['inDoubleQuote', 'append']
  },

  'afterElement': {
    'ws': ['afterElement'],
    ']': ['inPath', 'push']
  }
};

var invalidPath = new Path('', constructorIsPrivate);
invalidPath.valid = false;
invalidPath.getValueFrom = invalidPath.setValueFrom = function () {};

var path = Path;

/**
 *
 * @param {Object} o
 * @param {String} path
 * @returns {*}
 */
var objectResolvePath = function (o, path$1) {
  if (typeof path$1 !== 'string') {
    throw new TypeError('path must be a string')
  }
  if (typeof o !== 'object') {
    throw new TypeError('object must be passed')
  }
  var pathObj = path.get(path$1);
  if (!pathObj.valid) {
    throw new Error('path is not a valid object path')
  }
  return pathObj.getValueFrom(o)
};

var parser = /*
 * Generated by PEG.js 0.10.0.
 *
 * http://pegjs.org/
 */
(function() {

  function peg$subclass(child, parent) {
    function ctor() { this.constructor = child; }
    ctor.prototype = parent.prototype;
    child.prototype = new ctor();
  }

  function peg$SyntaxError(message, expected, found, location) {
    this.message  = message;
    this.expected = expected;
    this.found    = found;
    this.location = location;
    this.name     = "SyntaxError";

    if (typeof Error.captureStackTrace === "function") {
      Error.captureStackTrace(this, peg$SyntaxError);
    }
  }

  peg$subclass(peg$SyntaxError, Error);

  peg$SyntaxError.buildMessage = function(expected, found) {
    var DESCRIBE_EXPECTATION_FNS = {
          literal: function(expectation) {
            return "\"" + literalEscape(expectation.text) + "\"";
          },

          "class": function(expectation) {
            var escapedParts = "",
                i;

            for (i = 0; i < expectation.parts.length; i++) {
              escapedParts += expectation.parts[i] instanceof Array
                ? classEscape(expectation.parts[i][0]) + "-" + classEscape(expectation.parts[i][1])
                : classEscape(expectation.parts[i]);
            }

            return "[" + (expectation.inverted ? "^" : "") + escapedParts + "]";
          },

          any: function(expectation) {
            return "any character";
          },

          end: function(expectation) {
            return "end of input";
          },

          other: function(expectation) {
            return expectation.description;
          }
        };

    function hex(ch) {
      return ch.charCodeAt(0).toString(16).toUpperCase();
    }

    function literalEscape(s) {
      return s
        .replace(/\\/g, '\\\\')
        .replace(/"/g,  '\\"')
        .replace(/\0/g, '\\0')
        .replace(/\t/g, '\\t')
        .replace(/\n/g, '\\n')
        .replace(/\r/g, '\\r')
        .replace(/[\x00-\x0F]/g,          function(ch) { return '\\x0' + hex(ch); })
        .replace(/[\x10-\x1F\x7F-\x9F]/g, function(ch) { return '\\x'  + hex(ch); });
    }

    function classEscape(s) {
      return s
        .replace(/\\/g, '\\\\')
        .replace(/\]/g, '\\]')
        .replace(/\^/g, '\\^')
        .replace(/-/g,  '\\-')
        .replace(/\0/g, '\\0')
        .replace(/\t/g, '\\t')
        .replace(/\n/g, '\\n')
        .replace(/\r/g, '\\r')
        .replace(/[\x00-\x0F]/g,          function(ch) { return '\\x0' + hex(ch); })
        .replace(/[\x10-\x1F\x7F-\x9F]/g, function(ch) { return '\\x'  + hex(ch); });
    }

    function describeExpectation(expectation) {
      return DESCRIBE_EXPECTATION_FNS[expectation.type](expectation);
    }

    function describeExpected(expected) {
      var descriptions = new Array(expected.length),
          i, j;

      for (i = 0; i < expected.length; i++) {
        descriptions[i] = describeExpectation(expected[i]);
      }

      descriptions.sort();

      if (descriptions.length > 0) {
        for (i = 1, j = 1; i < descriptions.length; i++) {
          if (descriptions[i - 1] !== descriptions[i]) {
            descriptions[j] = descriptions[i];
            j++;
          }
        }
        descriptions.length = j;
      }

      switch (descriptions.length) {
        case 1:
          return descriptions[0];

        case 2:
          return descriptions[0] + " or " + descriptions[1];

        default:
          return descriptions.slice(0, -1).join(", ")
            + ", or "
            + descriptions[descriptions.length - 1];
      }
    }

    function describeFound(found) {
      return found ? "\"" + literalEscape(found) + "\"" : "end of input";
    }

    return "Expected " + describeExpected(expected) + " but " + describeFound(found) + " found.";
  };

  function peg$parse(input, options) {
    options = options !== void 0 ? options : {};

    var peg$FAILED = {},

        peg$startRuleFunctions = { start: peg$parsestart },
        peg$startRuleFunction  = peg$parsestart,

        peg$c0 = function(elements) {
                return {
                    type    : 'messageFormatPattern',
                    elements: elements,
                    location: location()
                };
            },
        peg$c1 = function(chunks) {
                return chunks.reduce(function (all, chunk) {
                    return all.concat(chunk)
                }, []).join('')
            },
        peg$c2 = function(messageText) {
                return {
                    type : 'messageTextElement',
                    value: messageText,
                    location: location()
                };
            },
        peg$c3 = function(chars) { return chars.join(''); },
        peg$c4 = "{",
        peg$c5 = peg$literalExpectation("{", false),
        peg$c6 = ",",
        peg$c7 = peg$literalExpectation(",", false),
        peg$c8 = "}",
        peg$c9 = peg$literalExpectation("}", false),
        peg$c10 = function(id, format) {
                return {
                    type  : 'argumentElement',
                    id    : id,
                    format: format && format[2],
                    location: location()
                };
            },
        peg$c11 = "number",
        peg$c12 = peg$literalExpectation("number", false),
        peg$c13 = "date",
        peg$c14 = peg$literalExpectation("date", false),
        peg$c15 = "time",
        peg$c16 = peg$literalExpectation("time", false),
        peg$c17 = function(type, style) {
                return {
                    type : type + 'Format',
                    style: style && style[2],
                    location: location()
                };
            },
        peg$c18 = "plural",
        peg$c19 = peg$literalExpectation("plural", false),
        peg$c20 = function(pluralStyle) {
                return {
                    type   : pluralStyle.type,
                    ordinal: false,
                    offset : pluralStyle.offset || 0,
                    options: pluralStyle.options,
                    location: location()
                };
            },
        peg$c21 = "selectordinal",
        peg$c22 = peg$literalExpectation("selectordinal", false),
        peg$c23 = function(pluralStyle) {
                return {
                    type   : pluralStyle.type,
                    ordinal: true,
                    offset : pluralStyle.offset || 0,
                    options: pluralStyle.options,
                    location: location()
                }
            },
        peg$c24 = "select",
        peg$c25 = peg$literalExpectation("select", false),
        peg$c26 = function(options) {
                return {
                    type   : 'selectFormat',
                    options: options,
                    location: location()
                };
            },
        peg$c27 = "=",
        peg$c28 = peg$literalExpectation("=", false),
        peg$c29 = function(selector, pattern) {
                return {
                    type    : 'optionalFormatPattern',
                    selector: selector,
                    value   : pattern,
                    location: location()
                };
            },
        peg$c30 = "offset:",
        peg$c31 = peg$literalExpectation("offset:", false),
        peg$c32 = function(number) {
                return number;
            },
        peg$c33 = function(offset, options) {
                return {
                    type   : 'pluralFormat',
                    offset : offset,
                    options: options,
                    location: location()
                };
            },
        peg$c34 = peg$otherExpectation("whitespace"),
        peg$c35 = /^[ \t\n\r]/,
        peg$c36 = peg$classExpectation([" ", "\t", "\n", "\r"], false, false),
        peg$c37 = peg$otherExpectation("optionalWhitespace"),
        peg$c38 = /^[0-9]/,
        peg$c39 = peg$classExpectation([["0", "9"]], false, false),
        peg$c40 = /^[0-9a-f]/i,
        peg$c41 = peg$classExpectation([["0", "9"], ["a", "f"]], false, true),
        peg$c42 = "0",
        peg$c43 = peg$literalExpectation("0", false),
        peg$c44 = /^[1-9]/,
        peg$c45 = peg$classExpectation([["1", "9"]], false, false),
        peg$c46 = function(digits) {
            return parseInt(digits, 10);
        },
        peg$c47 = "'",
        peg$c48 = peg$literalExpectation("'", false),
        peg$c49 = /^[ \t\n\r,.+={}#]/,
        peg$c50 = peg$classExpectation([" ", "\t", "\n", "\r", ",", ".", "+", "=", "{", "}", "#"], false, false),
        peg$c51 = peg$anyExpectation(),
        peg$c52 = function(char) { return char; },
        peg$c53 = function(sequence) { return sequence; },
        peg$c54 = /^[^{}\\\0-\x1F\x7F \t\n\r]/,
        peg$c55 = peg$classExpectation(["{", "}", "\\", ["\0", "\x1F"], "\x7F", " ", "\t", "\n", "\r"], true, false),
        peg$c56 = "\\\\",
        peg$c57 = peg$literalExpectation("\\\\", false),
        peg$c58 = function() { return '\\'; },
        peg$c59 = "\\#",
        peg$c60 = peg$literalExpectation("\\#", false),
        peg$c61 = function() { return '\\#'; },
        peg$c62 = "\\{",
        peg$c63 = peg$literalExpectation("\\{", false),
        peg$c64 = function() { return '\u007B'; },
        peg$c65 = "\\}",
        peg$c66 = peg$literalExpectation("\\}", false),
        peg$c67 = function() { return '\u007D'; },
        peg$c68 = "\\u",
        peg$c69 = peg$literalExpectation("\\u", false),
        peg$c70 = function(digits) {
                return String.fromCharCode(parseInt(digits, 16));
            },

        peg$currPos          = 0,
        peg$savedPos         = 0,
        peg$posDetailsCache  = [{ line: 1, column: 1 }],
        peg$maxFailPos       = 0,
        peg$maxFailExpected  = [],
        peg$silentFails      = 0,

        peg$result;

    if ("startRule" in options) {
      if (!(options.startRule in peg$startRuleFunctions)) {
        throw new Error("Can't start parsing from rule \"" + options.startRule + "\".");
      }

      peg$startRuleFunction = peg$startRuleFunctions[options.startRule];
    }

    function location() {
      return peg$computeLocation(peg$savedPos, peg$currPos);
    }

    function peg$literalExpectation(text, ignoreCase) {
      return { type: "literal", text: text, ignoreCase: ignoreCase };
    }

    function peg$classExpectation(parts, inverted, ignoreCase) {
      return { type: "class", parts: parts, inverted: inverted, ignoreCase: ignoreCase };
    }

    function peg$anyExpectation() {
      return { type: "any" };
    }

    function peg$endExpectation() {
      return { type: "end" };
    }

    function peg$otherExpectation(description) {
      return { type: "other", description: description };
    }

    function peg$computePosDetails(pos) {
      var details = peg$posDetailsCache[pos], p;

      if (details) {
        return details;
      } else {
        p = pos - 1;
        while (!peg$posDetailsCache[p]) {
          p--;
        }

        details = peg$posDetailsCache[p];
        details = {
          line:   details.line,
          column: details.column
        };

        while (p < pos) {
          if (input.charCodeAt(p) === 10) {
            details.line++;
            details.column = 1;
          } else {
            details.column++;
          }

          p++;
        }

        peg$posDetailsCache[pos] = details;
        return details;
      }
    }

    function peg$computeLocation(startPos, endPos) {
      var startPosDetails = peg$computePosDetails(startPos),
          endPosDetails   = peg$computePosDetails(endPos);

      return {
        start: {
          offset: startPos,
          line:   startPosDetails.line,
          column: startPosDetails.column
        },
        end: {
          offset: endPos,
          line:   endPosDetails.line,
          column: endPosDetails.column
        }
      };
    }

    function peg$fail(expected) {
      if (peg$currPos < peg$maxFailPos) { return; }

      if (peg$currPos > peg$maxFailPos) {
        peg$maxFailPos = peg$currPos;
        peg$maxFailExpected = [];
      }

      peg$maxFailExpected.push(expected);
    }

    function peg$buildStructuredError(expected, found, location) {
      return new peg$SyntaxError(
        peg$SyntaxError.buildMessage(expected, found),
        expected,
        found,
        location
      );
    }

    function peg$parsestart() {
      var s0;

      s0 = peg$parsemessageFormatPattern();

      return s0;
    }

    function peg$parsemessageFormatPattern() {
      var s0, s1, s2;

      s0 = peg$currPos;
      s1 = [];
      s2 = peg$parsemessageFormatElement();
      while (s2 !== peg$FAILED) {
        s1.push(s2);
        s2 = peg$parsemessageFormatElement();
      }
      if (s1 !== peg$FAILED) {
        peg$savedPos = s0;
        s1 = peg$c0(s1);
      }
      s0 = s1;

      return s0;
    }

    function peg$parsemessageFormatElement() {
      var s0;

      s0 = peg$parsemessageTextElement();
      if (s0 === peg$FAILED) {
        s0 = peg$parseargumentElement();
      }

      return s0;
    }

    function peg$parsemessageText() {
      var s0, s1, s2, s3, s4, s5;

      s0 = peg$currPos;
      s1 = [];
      s2 = peg$currPos;
      s3 = peg$parse_();
      if (s3 !== peg$FAILED) {
        s4 = peg$parsechars();
        if (s4 !== peg$FAILED) {
          s5 = peg$parse_();
          if (s5 !== peg$FAILED) {
            s3 = [s3, s4, s5];
            s2 = s3;
          } else {
            peg$currPos = s2;
            s2 = peg$FAILED;
          }
        } else {
          peg$currPos = s2;
          s2 = peg$FAILED;
        }
      } else {
        peg$currPos = s2;
        s2 = peg$FAILED;
      }
      if (s2 !== peg$FAILED) {
        while (s2 !== peg$FAILED) {
          s1.push(s2);
          s2 = peg$currPos;
          s3 = peg$parse_();
          if (s3 !== peg$FAILED) {
            s4 = peg$parsechars();
            if (s4 !== peg$FAILED) {
              s5 = peg$parse_();
              if (s5 !== peg$FAILED) {
                s3 = [s3, s4, s5];
                s2 = s3;
              } else {
                peg$currPos = s2;
                s2 = peg$FAILED;
              }
            } else {
              peg$currPos = s2;
              s2 = peg$FAILED;
            }
          } else {
            peg$currPos = s2;
            s2 = peg$FAILED;
          }
        }
      } else {
        s1 = peg$FAILED;
      }
      if (s1 !== peg$FAILED) {
        peg$savedPos = s0;
        s1 = peg$c1(s1);
      }
      s0 = s1;
      if (s0 === peg$FAILED) {
        s0 = peg$currPos;
        s1 = peg$parsews();
        if (s1 !== peg$FAILED) {
          s0 = input.substring(s0, peg$currPos);
        } else {
          s0 = s1;
        }
      }

      return s0;
    }

    function peg$parsemessageTextElement() {
      var s0, s1;

      s0 = peg$currPos;
      s1 = peg$parsemessageText();
      if (s1 !== peg$FAILED) {
        peg$savedPos = s0;
        s1 = peg$c2(s1);
      }
      s0 = s1;

      return s0;
    }

    function peg$parseargument() {
      var s0, s1, s2;

      s0 = peg$parsenumber();
      if (s0 === peg$FAILED) {
        s0 = peg$currPos;
        s1 = [];
        s2 = peg$parsequoteEscapedChar();
        while (s2 !== peg$FAILED) {
          s1.push(s2);
          s2 = peg$parsequoteEscapedChar();
        }
        if (s1 !== peg$FAILED) {
          peg$savedPos = s0;
          s1 = peg$c3(s1);
        }
        s0 = s1;
      }

      return s0;
    }

    function peg$parseargumentElement() {
      var s0, s1, s2, s3, s4, s5, s6, s7, s8;

      s0 = peg$currPos;
      if (input.charCodeAt(peg$currPos) === 123) {
        s1 = peg$c4;
        peg$currPos++;
      } else {
        s1 = peg$FAILED;
        if (peg$silentFails === 0) { peg$fail(peg$c5); }
      }
      if (s1 !== peg$FAILED) {
        s2 = peg$parse_();
        if (s2 !== peg$FAILED) {
          s3 = peg$parseargument();
          if (s3 !== peg$FAILED) {
            s4 = peg$parse_();
            if (s4 !== peg$FAILED) {
              s5 = peg$currPos;
              if (input.charCodeAt(peg$currPos) === 44) {
                s6 = peg$c6;
                peg$currPos++;
              } else {
                s6 = peg$FAILED;
                if (peg$silentFails === 0) { peg$fail(peg$c7); }
              }
              if (s6 !== peg$FAILED) {
                s7 = peg$parse_();
                if (s7 !== peg$FAILED) {
                  s8 = peg$parseelementFormat();
                  if (s8 !== peg$FAILED) {
                    s6 = [s6, s7, s8];
                    s5 = s6;
                  } else {
                    peg$currPos = s5;
                    s5 = peg$FAILED;
                  }
                } else {
                  peg$currPos = s5;
                  s5 = peg$FAILED;
                }
              } else {
                peg$currPos = s5;
                s5 = peg$FAILED;
              }
              if (s5 === peg$FAILED) {
                s5 = null;
              }
              if (s5 !== peg$FAILED) {
                s6 = peg$parse_();
                if (s6 !== peg$FAILED) {
                  if (input.charCodeAt(peg$currPos) === 125) {
                    s7 = peg$c8;
                    peg$currPos++;
                  } else {
                    s7 = peg$FAILED;
                    if (peg$silentFails === 0) { peg$fail(peg$c9); }
                  }
                  if (s7 !== peg$FAILED) {
                    peg$savedPos = s0;
                    s1 = peg$c10(s3, s5);
                    s0 = s1;
                  } else {
                    peg$currPos = s0;
                    s0 = peg$FAILED;
                  }
                } else {
                  peg$currPos = s0;
                  s0 = peg$FAILED;
                }
              } else {
                peg$currPos = s0;
                s0 = peg$FAILED;
              }
            } else {
              peg$currPos = s0;
              s0 = peg$FAILED;
            }
          } else {
            peg$currPos = s0;
            s0 = peg$FAILED;
          }
        } else {
          peg$currPos = s0;
          s0 = peg$FAILED;
        }
      } else {
        peg$currPos = s0;
        s0 = peg$FAILED;
      }

      return s0;
    }

    function peg$parseelementFormat() {
      var s0;

      s0 = peg$parsesimpleFormat();
      if (s0 === peg$FAILED) {
        s0 = peg$parsepluralFormat();
        if (s0 === peg$FAILED) {
          s0 = peg$parseselectOrdinalFormat();
          if (s0 === peg$FAILED) {
            s0 = peg$parseselectFormat();
          }
        }
      }

      return s0;
    }

    function peg$parsesimpleFormat() {
      var s0, s1, s2, s3, s4, s5, s6;

      s0 = peg$currPos;
      if (input.substr(peg$currPos, 6) === peg$c11) {
        s1 = peg$c11;
        peg$currPos += 6;
      } else {
        s1 = peg$FAILED;
        if (peg$silentFails === 0) { peg$fail(peg$c12); }
      }
      if (s1 === peg$FAILED) {
        if (input.substr(peg$currPos, 4) === peg$c13) {
          s1 = peg$c13;
          peg$currPos += 4;
        } else {
          s1 = peg$FAILED;
          if (peg$silentFails === 0) { peg$fail(peg$c14); }
        }
        if (s1 === peg$FAILED) {
          if (input.substr(peg$currPos, 4) === peg$c15) {
            s1 = peg$c15;
            peg$currPos += 4;
          } else {
            s1 = peg$FAILED;
            if (peg$silentFails === 0) { peg$fail(peg$c16); }
          }
        }
      }
      if (s1 !== peg$FAILED) {
        s2 = peg$parse_();
        if (s2 !== peg$FAILED) {
          s3 = peg$currPos;
          if (input.charCodeAt(peg$currPos) === 44) {
            s4 = peg$c6;
            peg$currPos++;
          } else {
            s4 = peg$FAILED;
            if (peg$silentFails === 0) { peg$fail(peg$c7); }
          }
          if (s4 !== peg$FAILED) {
            s5 = peg$parse_();
            if (s5 !== peg$FAILED) {
              s6 = peg$parsechars();
              if (s6 !== peg$FAILED) {
                s4 = [s4, s5, s6];
                s3 = s4;
              } else {
                peg$currPos = s3;
                s3 = peg$FAILED;
              }
            } else {
              peg$currPos = s3;
              s3 = peg$FAILED;
            }
          } else {
            peg$currPos = s3;
            s3 = peg$FAILED;
          }
          if (s3 === peg$FAILED) {
            s3 = null;
          }
          if (s3 !== peg$FAILED) {
            peg$savedPos = s0;
            s1 = peg$c17(s1, s3);
            s0 = s1;
          } else {
            peg$currPos = s0;
            s0 = peg$FAILED;
          }
        } else {
          peg$currPos = s0;
          s0 = peg$FAILED;
        }
      } else {
        peg$currPos = s0;
        s0 = peg$FAILED;
      }

      return s0;
    }

    function peg$parsepluralFormat() {
      var s0, s1, s2, s3, s4, s5;

      s0 = peg$currPos;
      if (input.substr(peg$currPos, 6) === peg$c18) {
        s1 = peg$c18;
        peg$currPos += 6;
      } else {
        s1 = peg$FAILED;
        if (peg$silentFails === 0) { peg$fail(peg$c19); }
      }
      if (s1 !== peg$FAILED) {
        s2 = peg$parse_();
        if (s2 !== peg$FAILED) {
          if (input.charCodeAt(peg$currPos) === 44) {
            s3 = peg$c6;
            peg$currPos++;
          } else {
            s3 = peg$FAILED;
            if (peg$silentFails === 0) { peg$fail(peg$c7); }
          }
          if (s3 !== peg$FAILED) {
            s4 = peg$parse_();
            if (s4 !== peg$FAILED) {
              s5 = peg$parsepluralStyle();
              if (s5 !== peg$FAILED) {
                peg$savedPos = s0;
                s1 = peg$c20(s5);
                s0 = s1;
              } else {
                peg$currPos = s0;
                s0 = peg$FAILED;
              }
            } else {
              peg$currPos = s0;
              s0 = peg$FAILED;
            }
          } else {
            peg$currPos = s0;
            s0 = peg$FAILED;
          }
        } else {
          peg$currPos = s0;
          s0 = peg$FAILED;
        }
      } else {
        peg$currPos = s0;
        s0 = peg$FAILED;
      }

      return s0;
    }

    function peg$parseselectOrdinalFormat() {
      var s0, s1, s2, s3, s4, s5;

      s0 = peg$currPos;
      if (input.substr(peg$currPos, 13) === peg$c21) {
        s1 = peg$c21;
        peg$currPos += 13;
      } else {
        s1 = peg$FAILED;
        if (peg$silentFails === 0) { peg$fail(peg$c22); }
      }
      if (s1 !== peg$FAILED) {
        s2 = peg$parse_();
        if (s2 !== peg$FAILED) {
          if (input.charCodeAt(peg$currPos) === 44) {
            s3 = peg$c6;
            peg$currPos++;
          } else {
            s3 = peg$FAILED;
            if (peg$silentFails === 0) { peg$fail(peg$c7); }
          }
          if (s3 !== peg$FAILED) {
            s4 = peg$parse_();
            if (s4 !== peg$FAILED) {
              s5 = peg$parsepluralStyle();
              if (s5 !== peg$FAILED) {
                peg$savedPos = s0;
                s1 = peg$c23(s5);
                s0 = s1;
              } else {
                peg$currPos = s0;
                s0 = peg$FAILED;
              }
            } else {
              peg$currPos = s0;
              s0 = peg$FAILED;
            }
          } else {
            peg$currPos = s0;
            s0 = peg$FAILED;
          }
        } else {
          peg$currPos = s0;
          s0 = peg$FAILED;
        }
      } else {
        peg$currPos = s0;
        s0 = peg$FAILED;
      }

      return s0;
    }

    function peg$parseselectFormat() {
      var s0, s1, s2, s3, s4, s5, s6;

      s0 = peg$currPos;
      if (input.substr(peg$currPos, 6) === peg$c24) {
        s1 = peg$c24;
        peg$currPos += 6;
      } else {
        s1 = peg$FAILED;
        if (peg$silentFails === 0) { peg$fail(peg$c25); }
      }
      if (s1 !== peg$FAILED) {
        s2 = peg$parse_();
        if (s2 !== peg$FAILED) {
          if (input.charCodeAt(peg$currPos) === 44) {
            s3 = peg$c6;
            peg$currPos++;
          } else {
            s3 = peg$FAILED;
            if (peg$silentFails === 0) { peg$fail(peg$c7); }
          }
          if (s3 !== peg$FAILED) {
            s4 = peg$parse_();
            if (s4 !== peg$FAILED) {
              s5 = [];
              s6 = peg$parseoptionalFormatPattern();
              if (s6 !== peg$FAILED) {
                while (s6 !== peg$FAILED) {
                  s5.push(s6);
                  s6 = peg$parseoptionalFormatPattern();
                }
              } else {
                s5 = peg$FAILED;
              }
              if (s5 !== peg$FAILED) {
                peg$savedPos = s0;
                s1 = peg$c26(s5);
                s0 = s1;
              } else {
                peg$currPos = s0;
                s0 = peg$FAILED;
              }
            } else {
              peg$currPos = s0;
              s0 = peg$FAILED;
            }
          } else {
            peg$currPos = s0;
            s0 = peg$FAILED;
          }
        } else {
          peg$currPos = s0;
          s0 = peg$FAILED;
        }
      } else {
        peg$currPos = s0;
        s0 = peg$FAILED;
      }

      return s0;
    }

    function peg$parseselector() {
      var s0, s1, s2, s3;

      s0 = peg$currPos;
      s1 = peg$currPos;
      if (input.charCodeAt(peg$currPos) === 61) {
        s2 = peg$c27;
        peg$currPos++;
      } else {
        s2 = peg$FAILED;
        if (peg$silentFails === 0) { peg$fail(peg$c28); }
      }
      if (s2 !== peg$FAILED) {
        s3 = peg$parsenumber();
        if (s3 !== peg$FAILED) {
          s2 = [s2, s3];
          s1 = s2;
        } else {
          peg$currPos = s1;
          s1 = peg$FAILED;
        }
      } else {
        peg$currPos = s1;
        s1 = peg$FAILED;
      }
      if (s1 !== peg$FAILED) {
        s0 = input.substring(s0, peg$currPos);
      } else {
        s0 = s1;
      }
      if (s0 === peg$FAILED) {
        s0 = peg$parsechars();
      }

      return s0;
    }

    function peg$parseoptionalFormatPattern() {
      var s0, s1, s2, s3, s4, s5, s6;

      s0 = peg$currPos;
      s1 = peg$parse_();
      if (s1 !== peg$FAILED) {
        s2 = peg$parseselector();
        if (s2 !== peg$FAILED) {
          s3 = peg$parse_();
          if (s3 !== peg$FAILED) {
            if (input.charCodeAt(peg$currPos) === 123) {
              s4 = peg$c4;
              peg$currPos++;
            } else {
              s4 = peg$FAILED;
              if (peg$silentFails === 0) { peg$fail(peg$c5); }
            }
            if (s4 !== peg$FAILED) {
              s5 = peg$parsemessageFormatPattern();
              if (s5 !== peg$FAILED) {
                if (input.charCodeAt(peg$currPos) === 125) {
                  s6 = peg$c8;
                  peg$currPos++;
                } else {
                  s6 = peg$FAILED;
                  if (peg$silentFails === 0) { peg$fail(peg$c9); }
                }
                if (s6 !== peg$FAILED) {
                  peg$savedPos = s0;
                  s1 = peg$c29(s2, s5);
                  s0 = s1;
                } else {
                  peg$currPos = s0;
                  s0 = peg$FAILED;
                }
              } else {
                peg$currPos = s0;
                s0 = peg$FAILED;
              }
            } else {
              peg$currPos = s0;
              s0 = peg$FAILED;
            }
          } else {
            peg$currPos = s0;
            s0 = peg$FAILED;
          }
        } else {
          peg$currPos = s0;
          s0 = peg$FAILED;
        }
      } else {
        peg$currPos = s0;
        s0 = peg$FAILED;
      }

      return s0;
    }

    function peg$parseoffset() {
      var s0, s1, s2, s3;

      s0 = peg$currPos;
      if (input.substr(peg$currPos, 7) === peg$c30) {
        s1 = peg$c30;
        peg$currPos += 7;
      } else {
        s1 = peg$FAILED;
        if (peg$silentFails === 0) { peg$fail(peg$c31); }
      }
      if (s1 !== peg$FAILED) {
        s2 = peg$parse_();
        if (s2 !== peg$FAILED) {
          s3 = peg$parsenumber();
          if (s3 !== peg$FAILED) {
            peg$savedPos = s0;
            s1 = peg$c32(s3);
            s0 = s1;
          } else {
            peg$currPos = s0;
            s0 = peg$FAILED;
          }
        } else {
          peg$currPos = s0;
          s0 = peg$FAILED;
        }
      } else {
        peg$currPos = s0;
        s0 = peg$FAILED;
      }

      return s0;
    }

    function peg$parsepluralStyle() {
      var s0, s1, s2, s3, s4;

      s0 = peg$currPos;
      s1 = peg$parseoffset();
      if (s1 === peg$FAILED) {
        s1 = null;
      }
      if (s1 !== peg$FAILED) {
        s2 = peg$parse_();
        if (s2 !== peg$FAILED) {
          s3 = [];
          s4 = peg$parseoptionalFormatPattern();
          if (s4 !== peg$FAILED) {
            while (s4 !== peg$FAILED) {
              s3.push(s4);
              s4 = peg$parseoptionalFormatPattern();
            }
          } else {
            s3 = peg$FAILED;
          }
          if (s3 !== peg$FAILED) {
            peg$savedPos = s0;
            s1 = peg$c33(s1, s3);
            s0 = s1;
          } else {
            peg$currPos = s0;
            s0 = peg$FAILED;
          }
        } else {
          peg$currPos = s0;
          s0 = peg$FAILED;
        }
      } else {
        peg$currPos = s0;
        s0 = peg$FAILED;
      }

      return s0;
    }

    function peg$parsews() {
      var s0, s1;

      peg$silentFails++;
      s0 = [];
      if (peg$c35.test(input.charAt(peg$currPos))) {
        s1 = input.charAt(peg$currPos);
        peg$currPos++;
      } else {
        s1 = peg$FAILED;
        if (peg$silentFails === 0) { peg$fail(peg$c36); }
      }
      if (s1 !== peg$FAILED) {
        while (s1 !== peg$FAILED) {
          s0.push(s1);
          if (peg$c35.test(input.charAt(peg$currPos))) {
            s1 = input.charAt(peg$currPos);
            peg$currPos++;
          } else {
            s1 = peg$FAILED;
            if (peg$silentFails === 0) { peg$fail(peg$c36); }
          }
        }
      } else {
        s0 = peg$FAILED;
      }
      peg$silentFails--;
      if (s0 === peg$FAILED) {
        s1 = peg$FAILED;
        if (peg$silentFails === 0) { peg$fail(peg$c34); }
      }

      return s0;
    }

    function peg$parse_() {
      var s0, s1, s2;

      peg$silentFails++;
      s0 = peg$currPos;
      s1 = [];
      s2 = peg$parsews();
      while (s2 !== peg$FAILED) {
        s1.push(s2);
        s2 = peg$parsews();
      }
      if (s1 !== peg$FAILED) {
        s0 = input.substring(s0, peg$currPos);
      } else {
        s0 = s1;
      }
      peg$silentFails--;
      if (s0 === peg$FAILED) {
        s1 = peg$FAILED;
        if (peg$silentFails === 0) { peg$fail(peg$c37); }
      }

      return s0;
    }

    function peg$parsedigit() {
      var s0;

      if (peg$c38.test(input.charAt(peg$currPos))) {
        s0 = input.charAt(peg$currPos);
        peg$currPos++;
      } else {
        s0 = peg$FAILED;
        if (peg$silentFails === 0) { peg$fail(peg$c39); }
      }

      return s0;
    }

    function peg$parsehexDigit() {
      var s0;

      if (peg$c40.test(input.charAt(peg$currPos))) {
        s0 = input.charAt(peg$currPos);
        peg$currPos++;
      } else {
        s0 = peg$FAILED;
        if (peg$silentFails === 0) { peg$fail(peg$c41); }
      }

      return s0;
    }

    function peg$parsenumber() {
      var s0, s1, s2, s3, s4, s5;

      s0 = peg$currPos;
      if (input.charCodeAt(peg$currPos) === 48) {
        s1 = peg$c42;
        peg$currPos++;
      } else {
        s1 = peg$FAILED;
        if (peg$silentFails === 0) { peg$fail(peg$c43); }
      }
      if (s1 === peg$FAILED) {
        s1 = peg$currPos;
        s2 = peg$currPos;
        if (peg$c44.test(input.charAt(peg$currPos))) {
          s3 = input.charAt(peg$currPos);
          peg$currPos++;
        } else {
          s3 = peg$FAILED;
          if (peg$silentFails === 0) { peg$fail(peg$c45); }
        }
        if (s3 !== peg$FAILED) {
          s4 = [];
          s5 = peg$parsedigit();
          while (s5 !== peg$FAILED) {
            s4.push(s5);
            s5 = peg$parsedigit();
          }
          if (s4 !== peg$FAILED) {
            s3 = [s3, s4];
            s2 = s3;
          } else {
            peg$currPos = s2;
            s2 = peg$FAILED;
          }
        } else {
          peg$currPos = s2;
          s2 = peg$FAILED;
        }
        if (s2 !== peg$FAILED) {
          s1 = input.substring(s1, peg$currPos);
        } else {
          s1 = s2;
        }
      }
      if (s1 !== peg$FAILED) {
        peg$savedPos = s0;
        s1 = peg$c46(s1);
      }
      s0 = s1;

      return s0;
    }

    function peg$parsequoteEscapedChar() {
      var s0, s1, s2;

      s0 = peg$currPos;
      s1 = peg$currPos;
      peg$silentFails++;
      if (input.charCodeAt(peg$currPos) === 39) {
        s2 = peg$c47;
        peg$currPos++;
      } else {
        s2 = peg$FAILED;
        if (peg$silentFails === 0) { peg$fail(peg$c48); }
      }
      if (s2 === peg$FAILED) {
        if (peg$c49.test(input.charAt(peg$currPos))) {
          s2 = input.charAt(peg$currPos);
          peg$currPos++;
        } else {
          s2 = peg$FAILED;
          if (peg$silentFails === 0) { peg$fail(peg$c50); }
        }
      }
      peg$silentFails--;
      if (s2 === peg$FAILED) {
        s1 = void 0;
      } else {
        peg$currPos = s1;
        s1 = peg$FAILED;
      }
      if (s1 !== peg$FAILED) {
        if (input.length > peg$currPos) {
          s2 = input.charAt(peg$currPos);
          peg$currPos++;
        } else {
          s2 = peg$FAILED;
          if (peg$silentFails === 0) { peg$fail(peg$c51); }
        }
        if (s2 !== peg$FAILED) {
          peg$savedPos = s0;
          s1 = peg$c52(s2);
          s0 = s1;
        } else {
          peg$currPos = s0;
          s0 = peg$FAILED;
        }
      } else {
        peg$currPos = s0;
        s0 = peg$FAILED;
      }
      if (s0 === peg$FAILED) {
        s0 = peg$currPos;
        if (input.charCodeAt(peg$currPos) === 39) {
          s1 = peg$c47;
          peg$currPos++;
        } else {
          s1 = peg$FAILED;
          if (peg$silentFails === 0) { peg$fail(peg$c48); }
        }
        if (s1 !== peg$FAILED) {
          s2 = peg$parseescape();
          if (s2 !== peg$FAILED) {
            peg$savedPos = s0;
            s1 = peg$c53(s2);
            s0 = s1;
          } else {
            peg$currPos = s0;
            s0 = peg$FAILED;
          }
        } else {
          peg$currPos = s0;
          s0 = peg$FAILED;
        }
      }

      return s0;
    }

    function peg$parseapostrophe() {
      var s0;

      if (input.charCodeAt(peg$currPos) === 39) {
        s0 = peg$c47;
        peg$currPos++;
      } else {
        s0 = peg$FAILED;
        if (peg$silentFails === 0) { peg$fail(peg$c48); }
      }

      return s0;
    }

    function peg$parseescape() {
      var s0;

      if (peg$c49.test(input.charAt(peg$currPos))) {
        s0 = input.charAt(peg$currPos);
        peg$currPos++;
      } else {
        s0 = peg$FAILED;
        if (peg$silentFails === 0) { peg$fail(peg$c50); }
      }
      if (s0 === peg$FAILED) {
        s0 = peg$parseapostrophe();
      }

      return s0;
    }

    function peg$parsechar() {
      var s0, s1, s2, s3, s4, s5, s6, s7;

      s0 = peg$currPos;
      if (input.charCodeAt(peg$currPos) === 39) {
        s1 = peg$c47;
        peg$currPos++;
      } else {
        s1 = peg$FAILED;
        if (peg$silentFails === 0) { peg$fail(peg$c48); }
      }
      if (s1 !== peg$FAILED) {
        s2 = peg$parseapostrophe();
        if (s2 !== peg$FAILED) {
          peg$savedPos = s0;
          s1 = peg$c53(s2);
          s0 = s1;
        } else {
          peg$currPos = s0;
          s0 = peg$FAILED;
        }
      } else {
        peg$currPos = s0;
        s0 = peg$FAILED;
      }
      if (s0 === peg$FAILED) {
        if (peg$c54.test(input.charAt(peg$currPos))) {
          s0 = input.charAt(peg$currPos);
          peg$currPos++;
        } else {
          s0 = peg$FAILED;
          if (peg$silentFails === 0) { peg$fail(peg$c55); }
        }
        if (s0 === peg$FAILED) {
          s0 = peg$currPos;
          if (input.substr(peg$currPos, 2) === peg$c56) {
            s1 = peg$c56;
            peg$currPos += 2;
          } else {
            s1 = peg$FAILED;
            if (peg$silentFails === 0) { peg$fail(peg$c57); }
          }
          if (s1 !== peg$FAILED) {
            peg$savedPos = s0;
            s1 = peg$c58();
          }
          s0 = s1;
          if (s0 === peg$FAILED) {
            s0 = peg$currPos;
            if (input.substr(peg$currPos, 2) === peg$c59) {
              s1 = peg$c59;
              peg$currPos += 2;
            } else {
              s1 = peg$FAILED;
              if (peg$silentFails === 0) { peg$fail(peg$c60); }
            }
            if (s1 !== peg$FAILED) {
              peg$savedPos = s0;
              s1 = peg$c61();
            }
            s0 = s1;
            if (s0 === peg$FAILED) {
              s0 = peg$currPos;
              if (input.substr(peg$currPos, 2) === peg$c62) {
                s1 = peg$c62;
                peg$currPos += 2;
              } else {
                s1 = peg$FAILED;
                if (peg$silentFails === 0) { peg$fail(peg$c63); }
              }
              if (s1 !== peg$FAILED) {
                peg$savedPos = s0;
                s1 = peg$c64();
              }
              s0 = s1;
              if (s0 === peg$FAILED) {
                s0 = peg$currPos;
                if (input.substr(peg$currPos, 2) === peg$c65) {
                  s1 = peg$c65;
                  peg$currPos += 2;
                } else {
                  s1 = peg$FAILED;
                  if (peg$silentFails === 0) { peg$fail(peg$c66); }
                }
                if (s1 !== peg$FAILED) {
                  peg$savedPos = s0;
                  s1 = peg$c67();
                }
                s0 = s1;
                if (s0 === peg$FAILED) {
                  s0 = peg$currPos;
                  if (input.substr(peg$currPos, 2) === peg$c68) {
                    s1 = peg$c68;
                    peg$currPos += 2;
                  } else {
                    s1 = peg$FAILED;
                    if (peg$silentFails === 0) { peg$fail(peg$c69); }
                  }
                  if (s1 !== peg$FAILED) {
                    s2 = peg$currPos;
                    s3 = peg$currPos;
                    s4 = peg$parsehexDigit();
                    if (s4 !== peg$FAILED) {
                      s5 = peg$parsehexDigit();
                      if (s5 !== peg$FAILED) {
                        s6 = peg$parsehexDigit();
                        if (s6 !== peg$FAILED) {
                          s7 = peg$parsehexDigit();
                          if (s7 !== peg$FAILED) {
                            s4 = [s4, s5, s6, s7];
                            s3 = s4;
                          } else {
                            peg$currPos = s3;
                            s3 = peg$FAILED;
                          }
                        } else {
                          peg$currPos = s3;
                          s3 = peg$FAILED;
                        }
                      } else {
                        peg$currPos = s3;
                        s3 = peg$FAILED;
                      }
                    } else {
                      peg$currPos = s3;
                      s3 = peg$FAILED;
                    }
                    if (s3 !== peg$FAILED) {
                      s2 = input.substring(s2, peg$currPos);
                    } else {
                      s2 = s3;
                    }
                    if (s2 !== peg$FAILED) {
                      peg$savedPos = s0;
                      s1 = peg$c70(s2);
                      s0 = s1;
                    } else {
                      peg$currPos = s0;
                      s0 = peg$FAILED;
                    }
                  } else {
                    peg$currPos = s0;
                    s0 = peg$FAILED;
                  }
                }
              }
            }
          }
        }
      }

      return s0;
    }

    function peg$parsechars() {
      var s0, s1, s2;

      s0 = peg$currPos;
      s1 = [];
      s2 = peg$parsechar();
      if (s2 !== peg$FAILED) {
        while (s2 !== peg$FAILED) {
          s1.push(s2);
          s2 = peg$parsechar();
        }
      } else {
        s1 = peg$FAILED;
      }
      if (s1 !== peg$FAILED) {
        peg$savedPos = s0;
        s1 = peg$c3(s1);
      }
      s0 = s1;

      return s0;
    }

    peg$result = peg$startRuleFunction();

    if (peg$result !== peg$FAILED && peg$currPos === input.length) {
      return peg$result;
    } else {
      if (peg$result !== peg$FAILED && peg$currPos < input.length) {
        peg$fail(peg$endExpectation());
      }

      throw peg$buildStructuredError(
        peg$maxFailExpected,
        peg$maxFailPos < input.length ? input.charAt(peg$maxFailPos) : null,
        peg$maxFailPos < input.length
          ? peg$computeLocation(peg$maxFailPos, peg$maxFailPos + 1)
          : peg$computeLocation(peg$maxFailPos, peg$maxFailPos)
      );
    }
  }

  return {
    SyntaxError: peg$SyntaxError,
    parse:       peg$parse
  };
})();

/*
Copyright (c) 2014, Yahoo! Inc. All rights reserved.
Copyrights licensed under the New BSD License.
See the accompanying LICENSE file for terms.
*/
var __extends = (window && window.__extends) || (function () {
    var extendStatics = function (d, b) {
        extendStatics = Object.setPrototypeOf ||
            ({ __proto__: [] } instanceof Array && function (d, b) { d.__proto__ = b; }) ||
            function (d, b) { for (var p in b) if (b.hasOwnProperty(p)) d[p] = b[p]; };
        return extendStatics(d, b);
    };
    return function (d, b) {
        extendStatics(d, b);
        function __() { this.constructor = d; }
        d.prototype = b === null ? Object.create(b) : (__.prototype = b.prototype, new __());
    };
})();
var Compiler = /** @class */ (function () {
    function Compiler(locales, formats, formatters) {
        this.locales = [];
        this.formats = {
            number: {},
            date: {},
            time: {}
        };
        this.pluralNumberFormat = null;
        this.currentPlural = null;
        this.pluralStack = [];
        this.locales = locales;
        this.formats = formats;
        this.formatters = formatters;
    }
    Compiler.prototype.compile = function (ast) {
        this.pluralStack = [];
        this.currentPlural = null;
        this.pluralNumberFormat = null;
        return this.compileMessage(ast);
    };
    Compiler.prototype.compileMessage = function (ast) {
        var _this = this;
        if (!(ast && ast.type === 'messageFormatPattern')) {
            throw new Error('Message AST is not of type: "messageFormatPattern"');
        }
        var elements = ast.elements;
        var pattern = elements
            .filter(function (el) {
            return el.type === 'messageTextElement' || el.type === 'argumentElement';
        })
            .map(function (el) {
            return el.type === 'messageTextElement'
                ? _this.compileMessageText(el)
                : _this.compileArgument(el);
        });
        if (pattern.length !== elements.length) {
            throw new Error('Message element does not have a valid type');
        }
        return pattern;
    };
    Compiler.prototype.compileMessageText = function (element) {
        // When this `element` is part of plural sub-pattern and its value contains
        // an unescaped '#', use a `PluralOffsetString` helper to properly output
        // the number with the correct offset in the string.
        if (this.currentPlural && /(^|[^\\])#/g.test(element.value)) {
            // Create a cache a NumberFormat instance that can be reused for any
            // PluralOffsetString instance in this message.
            if (!this.pluralNumberFormat) {
                this.pluralNumberFormat = new Intl.NumberFormat(this.locales);
            }
            return new PluralOffsetString(this.currentPlural.id, this.currentPlural.format.offset, this.pluralNumberFormat, element.value);
        }
        // Unescape the escaped '#'s in the message text.
        return element.value.replace(/\\#/g, '#');
    };
    Compiler.prototype.compileArgument = function (element) {
        var format = element.format, id = element.id;
        var formatters = this.formatters;
        if (!format) {
            return new StringFormat(id);
        }
        var _a = this, formats = _a.formats, locales = _a.locales;
        switch (format.type) {
            case 'numberFormat':
                return {
                    id: id,
                    format: formatters.getNumberFormat(locales, formats.number[format.style]).format
                };
            case 'dateFormat':
                return {
                    id: id,
                    format: formatters.getDateTimeFormat(locales, formats.date[format.style]).format
                };
            case 'timeFormat':
                return {
                    id: id,
                    format: formatters.getDateTimeFormat(locales, formats.time[format.style]).format
                };
            case 'pluralFormat':
                return new PluralFormat(id, format.offset, this.compileOptions(element), formatters.getPluralRules(locales, {
                    type: format.ordinal ? 'ordinal' : 'cardinal'
                }));
            case 'selectFormat':
                return new SelectFormat(id, this.compileOptions(element));
            default:
                throw new Error('Message element does not have a valid format type');
        }
    };
    Compiler.prototype.compileOptions = function (element) {
        var _this = this;
        var format = element.format;
        var options = format.options;
        // Save the current plural element, if any, then set it to a new value when
        // compiling the options sub-patterns. This conforms the spec's algorithm
        // for handling `"#"` syntax in message text.
        this.pluralStack.push(this.currentPlural);
        this.currentPlural = format.type === 'pluralFormat' ? element : null;
        var optionsHash = options.reduce(function (all, option) {
            // Compile the sub-pattern and save it under the options's selector.
            all[option.selector] = _this.compileMessage(option.value);
            return all;
        }, {});
        // Pop the plural stack to put back the original current plural value.
        this.currentPlural = this.pluralStack.pop();
        return optionsHash;
    };
    return Compiler;
}());
// -- Compiler Helper Classes --------------------------------------------------
var Formatter = /** @class */ (function () {
    function Formatter(id) {
        this.id = id;
    }
    return Formatter;
}());
var StringFormat = /** @class */ (function (_super) {
    __extends(StringFormat, _super);
    function StringFormat() {
        return _super !== null && _super.apply(this, arguments) || this;
    }
    StringFormat.prototype.format = function (value) {
        if (!value && typeof value !== 'number') {
            return '';
        }
        return typeof value === 'string' ? value : String(value);
    };
    return StringFormat;
}(Formatter));
var PluralFormat = /** @class */ (function () {
    function PluralFormat(id, offset, options, pluralRules) {
        this.id = id;
        this.offset = offset;
        this.options = options;
        this.pluralRules = pluralRules;
    }
    PluralFormat.prototype.getOption = function (value) {
        var options = this.options;
        var option = options['=' + value] ||
            options[this.pluralRules.select(value - this.offset)];
        return option || options.other;
    };
    return PluralFormat;
}());
var PluralOffsetString = /** @class */ (function (_super) {
    __extends(PluralOffsetString, _super);
    function PluralOffsetString(id, offset, numberFormat, string) {
        var _this = _super.call(this, id) || this;
        _this.offset = offset;
        _this.numberFormat = numberFormat;
        _this.string = string;
        return _this;
    }
    PluralOffsetString.prototype.format = function (value) {
        var number = this.numberFormat.format(value - this.offset);
        return this.string
            .replace(/(^|[^\\])#/g, '$1' + number)
            .replace(/\\#/g, '#');
    };
    return PluralOffsetString;
}(Formatter));
var SelectFormat = /** @class */ (function () {
    function SelectFormat(id, options) {
        this.id = id;
        this.options = options;
    }
    SelectFormat.prototype.getOption = function (value) {
        var options = this.options;
        return options[value] || options.other;
    };
    return SelectFormat;
}());
function isSelectOrPluralFormat(f) {
    return !!f.options;
}

/*
Copyright (c) 2014, Yahoo! Inc. All rights reserved.
Copyrights licensed under the New BSD License.
See the accompanying LICENSE file for terms.
*/
var __extends$1 = (window && window.__extends) || (function () {
    var extendStatics = function (d, b) {
        extendStatics = Object.setPrototypeOf ||
            ({ __proto__: [] } instanceof Array && function (d, b) { d.__proto__ = b; }) ||
            function (d, b) { for (var p in b) if (b.hasOwnProperty(p)) d[p] = b[p]; };
        return extendStatics(d, b);
    };
    return function (d, b) {
        extendStatics(d, b);
        function __() { this.constructor = d; }
        d.prototype = b === null ? Object.create(b) : (__.prototype = b.prototype, new __());
    };
})();
var __assign = (window && window.__assign) || function () {
    __assign = Object.assign || function(t) {
        for (var s, i = 1, n = arguments.length; i < n; i++) {
            s = arguments[i];
            for (var p in s) if (Object.prototype.hasOwnProperty.call(s, p))
                t[p] = s[p];
        }
        return t;
    };
    return __assign.apply(this, arguments);
};
// -- MessageFormat --------------------------------------------------------
function resolveLocale(locales) {
    if (typeof locales === 'string') {
        locales = [locales];
    }
    try {
        return Intl.NumberFormat.supportedLocalesOf(locales, {
            // IE11 localeMatcher `lookup` seems to convert `en` -> `en-US`
            // but not other browsers,
            localeMatcher: 'best fit'
        })[0];
    }
    catch (e) {
        return IntlMessageFormat.defaultLocale;
    }
}
function formatPatterns(pattern, values) {
    var result = '';
    for (var _i = 0, pattern_1 = pattern; _i < pattern_1.length; _i++) {
        var part = pattern_1[_i];
        // Exist early for string parts.
        if (typeof part === 'string') {
            result += part;
            continue;
        }
        var id = part.id;
        // Enforce that all required values are provided by the caller.
        if (!(values && id in values)) {
            throw new FormatError("A value must be provided for: " + id, id);
        }
        var value = values[id];
        // Recursively format plural and select parts' option — which can be a
        // nested pattern structure. The choosing of the option to use is
        // abstracted-by and delegated-to the part helper object.
        if (isSelectOrPluralFormat(part)) {
            result += formatPatterns(part.getOption(value), values);
        }
        else {
            result += part.format(value);
        }
    }
    return result;
}
function mergeConfig(c1, c2) {
    if (!c2) {
        return c1;
    }
    return __assign({}, (c1 || {}), (c2 || {}), Object.keys(c1).reduce(function (all, k) {
        all[k] = __assign({}, c1[k], (c2[k] || {}));
        return all;
    }, {}));
}
function mergeConfigs(defaultConfig, configs) {
    if (!configs) {
        return defaultConfig;
    }
    return Object.keys(defaultConfig).reduce(function (all, k) {
        all[k] = mergeConfig(defaultConfig[k], configs[k]);
        return all;
    }, __assign({}, defaultConfig));
}
var FormatError = /** @class */ (function (_super) {
    __extends$1(FormatError, _super);
    function FormatError(msg, variableId) {
        var _this = _super.call(this, msg) || this;
        _this.variableId = variableId;
        return _this;
    }
    return FormatError;
}(Error));
function createDefaultFormatters() {
    return {
        getNumberFormat: function () {
            var _a;
            var args = [];
            for (var _i = 0; _i < arguments.length; _i++) {
                args[_i] = arguments[_i];
            }
            return new ((_a = Intl.NumberFormat).bind.apply(_a, [void 0].concat(args)))();
        },
        getDateTimeFormat: function () {
            var _a;
            var args = [];
            for (var _i = 0; _i < arguments.length; _i++) {
                args[_i] = arguments[_i];
            }
            return new ((_a = Intl.DateTimeFormat).bind.apply(_a, [void 0].concat(args)))();
        },
        getPluralRules: function () {
            var _a;
            var args = [];
            for (var _i = 0; _i < arguments.length; _i++) {
                args[_i] = arguments[_i];
            }
            return new ((_a = Intl.PluralRules).bind.apply(_a, [void 0].concat(args)))();
        }
    };
}
var IntlMessageFormat = /** @class */ (function () {
    function IntlMessageFormat(message, locales, overrideFormats, opts) {
        var _this = this;
        if (locales === void 0) { locales = IntlMessageFormat.defaultLocale; }
        this.format = function (values) {
            try {
                return formatPatterns(_this.pattern, values);
            }
            catch (e) {
                if (e.variableId) {
                    throw new Error("The intl string context variable '" + e.variableId + "' was not provided to the string '" + _this.message + "'");
                }
                else {
                    throw e;
                }
            }
        };
        if (typeof message === 'string') {
            if (!IntlMessageFormat.__parse) {
                throw new TypeError('IntlMessageFormat.__parse must be set to process `message` of type `string`');
            }
            // Parse string messages into an AST.
            this.ast = IntlMessageFormat.__parse(message);
        }
        else {
            this.ast = message;
        }
        this.message = message;
        if (!(this.ast && this.ast.type === 'messageFormatPattern')) {
            throw new TypeError('A message must be provided as a String or AST.');
        }
        // Creates a new object with the specified `formats` merged with the default
        // formats.
        var formats = mergeConfigs(IntlMessageFormat.formats, overrideFormats);
        // Defined first because it's used to build the format pattern.
        this.locale = resolveLocale(locales || []);
        var formatters = (opts && opts.formatters) || createDefaultFormatters();
        // Compile the `ast` to a pattern that is highly optimized for repeated
        // `format()` invocations. **Note:** This passes the `locales` set provided
        // to the constructor instead of just the resolved locale.
        this.pattern = new Compiler(locales, formats, formatters).compile(this.ast);
        // "Bind" `format()` method to `this` so it can be passed by reference like
        // the other `Intl` APIs.
    }
    IntlMessageFormat.prototype.resolvedOptions = function () {
        return { locale: this.locale };
    };
    IntlMessageFormat.prototype.getAst = function () {
        return this.ast;
    };
    IntlMessageFormat.defaultLocale = 'en';
    IntlMessageFormat.__parse = undefined;
    // Default format options used as the prototype of the `formats` provided to the
    // constructor. These are used when constructing the internal Intl.NumberFormat
    // and Intl.DateTimeFormat instances.
    IntlMessageFormat.formats = {
        number: {
            currency: {
                style: 'currency'
            },
            percent: {
                style: 'percent'
            }
        },
        date: {
            short: {
                month: 'numeric',
                day: 'numeric',
                year: '2-digit'
            },
            medium: {
                month: 'short',
                day: 'numeric',
                year: 'numeric'
            },
            long: {
                month: 'long',
                day: 'numeric',
                year: 'numeric'
            },
            full: {
                weekday: 'long',
                month: 'long',
                day: 'numeric',
                year: 'numeric'
            }
        },
        time: {
            short: {
                hour: 'numeric',
                minute: 'numeric'
            },
            medium: {
                hour: 'numeric',
                minute: 'numeric',
                second: 'numeric'
            },
            long: {
                hour: 'numeric',
                minute: 'numeric',
                second: 'numeric',
                timeZoneName: 'short'
            },
            full: {
                hour: 'numeric',
                minute: 'numeric',
                second: 'numeric',
                timeZoneName: 'short'
            }
        }
    };
    return IntlMessageFormat;
}());

/*
Copyright (c) 2014, Yahoo! Inc. All rights reserved.
Copyrights licensed under the New BSD License.
See the accompanying LICENSE file for terms.
*/
IntlMessageFormat.__parse = parser.parse;

var commonjsGlobal = typeof globalThis !== 'undefined' ? globalThis : typeof window !== 'undefined' ? window : typeof global !== 'undefined' ? global : typeof self !== 'undefined' ? self : {};

function createCommonjsModule(fn, module) {
	return module = { exports: {} }, fn(module, module.exports), module.exports;
}

var microMemoize = createCommonjsModule(function (module, exports) {
(function (global, factory) {
   module.exports = factory() ;
}(commonjsGlobal, function () {
  /**
   * @constant DEFAULT_OPTIONS_KEYS the default options keys
   */
  var DEFAULT_OPTIONS_KEYS = {
      isEqual: true,
      isMatchingKey: true,
      isPromise: true,
      maxSize: true,
      onCacheAdd: true,
      onCacheChange: true,
      onCacheHit: true,
      transformKey: true,
  };
  /**
   * @function slice
   *
   * @description
   * slice.call() pre-bound
   */
  var slice = Array.prototype.slice;
  /**
   * @function cloneArray
   *
   * @description
   * clone the array-like object and return the new array
   *
   * @param arrayLike the array-like object to clone
   * @returns the clone as an array
   */
  function cloneArray(arrayLike) {
      var length = arrayLike.length;
      if (!length) {
          return [];
      }
      if (length === 1) {
          return [arrayLike[0]];
      }
      if (length === 2) {
          return [arrayLike[0], arrayLike[1]];
      }
      if (length === 3) {
          return [arrayLike[0], arrayLike[1], arrayLike[2]];
      }
      return slice.call(arrayLike, 0);
  }
  /**
   * @function getCustomOptions
   *
   * @description
   * get the custom options on the object passed
   *
   * @param options the memoization options passed
   * @returns the custom options passed
   */
  function getCustomOptions(options) {
      var customOptions = {};
      /* eslint-disable no-restricted-syntax */
      for (var key in options) {
          if (!DEFAULT_OPTIONS_KEYS[key]) {
              customOptions[key] = options[key];
          }
      }
      /* eslint-enable */
      return customOptions;
  }
  /**
   * @function isMemoized
   *
   * @description
   * is the function passed already memoized
   *
   * @param fn the function to test
   * @returns is the function already memoized
   */
  function isMemoized(fn) {
      return (typeof fn === 'function' &&
          fn.isMemoized);
  }
  /**
   * @function isSameValueZero
   *
   * @description
   * are the objects equal based on SameValueZero equality
   *
   * @param object1 the first object to compare
   * @param object2 the second object to compare
   * @returns are the two objects equal
   */
  function isSameValueZero(object1, object2) {
      // eslint-disable-next-line no-self-compare
      return object1 === object2 || (object1 !== object1 && object2 !== object2);
  }
  /**
   * @function mergeOptions
   *
   * @description
   * merge the options into the target
   *
   * @param existingOptions the options provided
   * @param newOptions the options to include
   * @returns the merged options
   */
  function mergeOptions(existingOptions, newOptions) {
      // @ts-ignore
      var target = {};
      /* eslint-disable no-restricted-syntax */
      for (var key in existingOptions) {
          target[key] = existingOptions[key];
      }
      for (var key in newOptions) {
          target[key] = newOptions[key];
      }
      /* eslint-enable */
      return target;
  }

  // utils
  var Cache = /** @class */ (function () {
      function Cache(options) {
          this.keys = [];
          this.values = [];
          this.options = options;
          var isMatchingKeyFunction = typeof options.isMatchingKey === 'function';
          if (isMatchingKeyFunction) {
              this.getKeyIndex = this._getKeyIndexFromMatchingKey;
          }
          else if (options.maxSize > 1) {
              this.getKeyIndex = this._getKeyIndexForMany;
          }
          else {
              this.getKeyIndex = this._getKeyIndexForSingle;
          }
          this.canTransformKey = typeof options.transformKey === 'function';
          this.shouldCloneArguments = this.canTransformKey || isMatchingKeyFunction;
          this.shouldUpdateOnAdd = typeof options.onCacheAdd === 'function';
          this.shouldUpdateOnChange = typeof options.onCacheChange === 'function';
          this.shouldUpdateOnHit = typeof options.onCacheHit === 'function';
      }
      Object.defineProperty(Cache.prototype, "size", {
          get: function () {
              return this.keys.length;
          },
          enumerable: true,
          configurable: true
      });
      Object.defineProperty(Cache.prototype, "snapshot", {
          get: function () {
              return {
                  keys: cloneArray(this.keys),
                  size: this.size,
                  values: cloneArray(this.values),
              };
          },
          enumerable: true,
          configurable: true
      });
      /**
       * @function _getKeyIndexFromMatchingKey
       *
       * @description
       * gets the matching key index when a custom key matcher is used
       *
       * @param keyToMatch the key to match
       * @returns the index of the matching key, or -1
       */
      Cache.prototype._getKeyIndexFromMatchingKey = function (keyToMatch) {
          var _a = this.options, isMatchingKey = _a.isMatchingKey, maxSize = _a.maxSize;
          var keys = this.keys;
          var keysLength = keys.length;
          if (!keysLength) {
              return -1;
          }
          if (isMatchingKey(keys[0], keyToMatch)) {
              return 0;
          }
          if (maxSize > 1) {
              for (var index = 1; index < keysLength; index++) {
                  if (isMatchingKey(keys[index], keyToMatch)) {
                      return index;
                  }
              }
          }
          return -1;
      };
      /**
       * @function _getKeyIndexForMany
       *
       * @description
       * gets the matching key index when multiple keys are used
       *
       * @param keyToMatch the key to match
       * @returns the index of the matching key, or -1
       */
      Cache.prototype._getKeyIndexForMany = function (keyToMatch) {
          var isEqual = this.options.isEqual;
          var keys = this.keys;
          var keysLength = keys.length;
          if (!keysLength) {
              return -1;
          }
          if (keysLength === 1) {
              return this._getKeyIndexForSingle(keyToMatch);
          }
          var keyLength = keyToMatch.length;
          var existingKey;
          var argIndex;
          if (keyLength > 1) {
              for (var index = 0; index < keysLength; index++) {
                  existingKey = keys[index];
                  if (existingKey.length === keyLength) {
                      argIndex = 0;
                      for (; argIndex < keyLength; argIndex++) {
                          if (!isEqual(existingKey[argIndex], keyToMatch[argIndex])) {
                              break;
                          }
                      }
                      if (argIndex === keyLength) {
                          return index;
                      }
                  }
              }
          }
          else {
              for (var index = 0; index < keysLength; index++) {
                  existingKey = keys[index];
                  if (existingKey.length === keyLength &&
                      isEqual(existingKey[0], keyToMatch[0])) {
                      return index;
                  }
              }
          }
          return -1;
      };
      /**
       * @function _getKeyIndexForSingle
       *
       * @description
       * gets the matching key index when a single key is used
       *
       * @param keyToMatch the key to match
       * @returns the index of the matching key, or -1
       */
      Cache.prototype._getKeyIndexForSingle = function (keyToMatch) {
          var keys = this.keys;
          if (!keys.length) {
              return -1;
          }
          var existingKey = keys[0];
          var length = existingKey.length;
          if (keyToMatch.length !== length) {
              return -1;
          }
          var isEqual = this.options.isEqual;
          if (length > 1) {
              for (var index = 0; index < length; index++) {
                  if (!isEqual(existingKey[index], keyToMatch[index])) {
                      return -1;
                  }
              }
              return 0;
          }
          return isEqual(existingKey[0], keyToMatch[0]) ? 0 : -1;
      };
      /**
       * @function orderByLru
       *
       * @description
       * order the array based on a Least-Recently-Used basis
       *
       * @param key the new key to move to the front
       * @param value the new value to move to the front
       * @param startingIndex the index of the item to move to the front
       */
      Cache.prototype.orderByLru = function (key, value, startingIndex) {
          var keys = this.keys;
          var values = this.values;
          var currentLength = keys.length;
          var index = startingIndex;
          while (index--) {
              keys[index + 1] = keys[index];
              values[index + 1] = values[index];
          }
          keys[0] = key;
          values[0] = value;
          var maxSize = this.options.maxSize;
          if (currentLength === maxSize && startingIndex === currentLength) {
              keys.pop();
              values.pop();
          }
          else if (startingIndex >= maxSize) {
              // eslint-disable-next-line no-multi-assign
              keys.length = values.length = maxSize;
          }
      };
      /**
       * @function updateAsyncCache
       *
       * @description
       * update the promise method to auto-remove from cache if rejected, and
       * if resolved then fire cache hit / changed
       *
       * @param memoized the memoized function
       */
      Cache.prototype.updateAsyncCache = function (memoized) {
          var _this = this;
          var _a = this.options, onCacheChange = _a.onCacheChange, onCacheHit = _a.onCacheHit;
          var firstKey = this.keys[0];
          var firstValue = this.values[0];
          this.values[0] = firstValue.then(function (value) {
              if (_this.shouldUpdateOnHit) {
                  onCacheHit(_this, _this.options, memoized);
              }
              if (_this.shouldUpdateOnChange) {
                  onCacheChange(_this, _this.options, memoized);
              }
              return value;
          }, function (error) {
              var keyIndex = _this.getKeyIndex(firstKey);
              if (keyIndex !== -1) {
                  _this.keys.splice(keyIndex, 1);
                  _this.values.splice(keyIndex, 1);
              }
              throw error;
          });
      };
      return Cache;
  }());

  // cache
  function createMemoizedFunction(fn, options) {
      if (options === void 0) { options = {}; }
      if (isMemoized(fn)) {
          return createMemoizedFunction(fn.fn, mergeOptions(fn.options, options));
      }
      if (typeof fn !== 'function') {
          throw new TypeError('You must pass a function to `memoize`.');
      }
      var _a = options.isEqual, isEqual = _a === void 0 ? isSameValueZero : _a, isMatchingKey = options.isMatchingKey, _b = options.isPromise, isPromise = _b === void 0 ? false : _b, _c = options.maxSize, maxSize = _c === void 0 ? 1 : _c, onCacheAdd = options.onCacheAdd, onCacheChange = options.onCacheChange, onCacheHit = options.onCacheHit, transformKey = options.transformKey;
      var normalizedOptions = mergeOptions({
          isEqual: isEqual,
          isMatchingKey: isMatchingKey,
          isPromise: isPromise,
          maxSize: maxSize,
          onCacheAdd: onCacheAdd,
          onCacheChange: onCacheChange,
          onCacheHit: onCacheHit,
          transformKey: transformKey,
      }, getCustomOptions(options));
      var cache = new Cache(normalizedOptions);
      var keys = cache.keys, values = cache.values, canTransformKey = cache.canTransformKey, shouldCloneArguments = cache.shouldCloneArguments, shouldUpdateOnAdd = cache.shouldUpdateOnAdd, shouldUpdateOnChange = cache.shouldUpdateOnChange, shouldUpdateOnHit = cache.shouldUpdateOnHit;
      // @ts-ignore
      var memoized = function memoized() {
          // @ts-ignore
          var key = shouldCloneArguments
              ? cloneArray(arguments)
              : arguments;
          if (canTransformKey) {
              key = transformKey(key);
          }
          var keyIndex = keys.length ? cache.getKeyIndex(key) : -1;
          if (keyIndex !== -1) {
              if (shouldUpdateOnHit) {
                  onCacheHit(cache, normalizedOptions, memoized);
              }
              if (keyIndex) {
                  cache.orderByLru(keys[keyIndex], values[keyIndex], keyIndex);
                  if (shouldUpdateOnChange) {
                      onCacheChange(cache, normalizedOptions, memoized);
                  }
              }
          }
          else {
              var newValue = fn.apply(this, arguments);
              var newKey = shouldCloneArguments
                  ? key
                  : cloneArray(arguments);
              cache.orderByLru(newKey, newValue, keys.length);
              if (isPromise) {
                  cache.updateAsyncCache(memoized);
              }
              if (shouldUpdateOnAdd) {
                  onCacheAdd(cache, normalizedOptions, memoized);
              }
              if (shouldUpdateOnChange) {
                  onCacheChange(cache, normalizedOptions, memoized);
              }
          }
          return values[0];
      };
      memoized.cache = cache;
      memoized.fn = fn;
      memoized.isMemoized = true;
      memoized.options = normalizedOptions;
      return memoized;
  }

  return createMemoizedFunction;

}));

});

const capital = str => str.replace(/(^|\s)\S/, l => l.toUpperCase());
const title = str => str.replace(/(^|\s)\S/g, l => l.toUpperCase());
const upper = str => str.toLocaleUpperCase();
const lower = str => str.toLocaleLowerCase();

const getClientLocale = ({ navigator, hash, search, fallback } = {}) => {
  let locale;

  const getFromURL = (urlPart, key) => {
    const keyVal = urlPart
      .substr(1)
      .split('&')
      .find(i => i.indexOf(key) === 0);

    if (keyVal) {
      return keyVal.split('=').pop()
    }
  };

  // istanbul ignore else
  if (typeof window !== 'undefined') {
    if (navigator) {
      // istanbul ignore next
      locale = window.navigator.language || window.navigator.languages[0];
    }

    if (search) {
      locale = getFromURL(window.location.search, search);
    }

    if (hash) {
      locale = getFromURL(window.location.hash, hash);
    }
  }

  return locale || fallback
};

let currentLocale;
let currentDictionary;

const getAvailableLocale = newLocale => {
  if (currentDictionary[newLocale]) return newLocale

  // istanbul ignore else
  if (typeof newLocale === 'string') {
    const fallbackLocale = newLocale.split('-').shift();

    if (currentDictionary[fallbackLocale]) {
      return fallbackLocale
    }
  }

  return null
};

const getMessageFormatter = microMemoize(
  (message, locale, formats) => new IntlMessageFormat(message, locale, formats),
);

const lookupMessage = microMemoize((path, locale) => {
  return (
    currentDictionary[locale][path] ||
    objectResolvePath(currentDictionary[locale], path)
  )
});

const formatMessage = (message, interpolations, locale = currentLocale) => {
  return getMessageFormatter(message, locale).format(interpolations)
};

const getLocalizedMessage = (path, interpolations, locale = currentLocale) => {
  if (typeof interpolations === 'string') {
    locale = interpolations;
    interpolations = undefined;
  }
  const message = lookupMessage(path, locale);

  if (!message) return path
  if (!interpolations) return message

  return getMessageFormatter(message, locale).format(interpolations)
};

getLocalizedMessage.time = (t, format = 'short', locale) =>
  formatMessage(`{t,time,${format}}`, { t }, locale);
getLocalizedMessage.date = (d, format = 'short', locale) =>
  formatMessage(`{d,date,${format}}`, { d }, locale);
getLocalizedMessage.number = (n, locale) =>
  formatMessage('{n,number}', { n }, locale);
getLocalizedMessage.capital = (path, interpolations, locale) =>
  capital(getLocalizedMessage(path, interpolations, locale));
getLocalizedMessage.title = (path, interpolations, locale) =>
  title(getLocalizedMessage(path, interpolations, locale));
getLocalizedMessage.upper = (path, interpolations, locale) =>
  upper(getLocalizedMessage(path, interpolations, locale));
getLocalizedMessage.lower = (path, interpolations, locale) =>
  lower(getLocalizedMessage(path, interpolations, locale));

const dictionary = writable({});
dictionary.subscribe(newDictionary => {
  currentDictionary = newDictionary;
});

const locale = writable({});
const localeSet = locale.set;
locale.set = newLocale => {
  const availableLocale = getAvailableLocale(newLocale);
  if (availableLocale) {
    return localeSet(availableLocale)
  }

  console.warn(`[svelte-i18n] Locale "${newLocale}" not found.`);
  return localeSet(newLocale)
};
locale.update = fn => localeSet(fn(currentLocale));
locale.subscribe(newLocale => {
  currentLocale = newLocale;
});

const format = derived([locale, dictionary], () => getLocalizedMessage);

const notifyMessages = {
    en: {
        transaction: {
            txRequest: "Your transaction is waiting for you to confirm",
            nsfFail: "You have insufficient funds to complete this transaction",
            txUnderpriced: "The gas price for your transaction is too low, try again with a higher gas price",
            txRepeat: "This could be a repeat transaction",
            txAwaitingApproval: "You have a previous transaction waiting for you to confirm",
            txConfirmReminder: "Please confirm your transaction to continue, the transaction window may be behind your browser",
            txSendFail: "You rejected the transaction",
            txSent: "Your transaction has been sent to the network",
            txStallPending: "Your transaction has stalled and has not entered the transaction pool",
            txPool: "Your transaction has started",
            txStallConfirmed: "Your transaction has stalled and hasn't been confirmed",
            txSpeedUp: "Your transaction has been sped up",
            txCancel: "Your transaction is being canceled",
            txFailed: "Your transaction has failed",
            txConfirmed: "Your transaction has succeeded",
            txError: "Oops something went wrong, please try again"
        },
        watched: {
            txPool: "Your account is {verb} {formattedValue} {asset} {preposition} {counterpartyShortened}",
            txSpeedUp: "Your account is {verb} {formattedValue} {asset} {preposition} {counterpartyShortened}",
            txCancel: "Your account is {verb} {formattedValue} {asset} {preposition} {counterpartyShortened}",
            txConfirmed: "Your account successfully {verb} {formattedValue} {asset} {preposition} {counterpartyShortened}",
            txFailed: "Your account failed to {verb} {formattedValue} {asset} {preposition} {counterpartyShortened}"
        }
    },
    es: {
        transaction: {
            txRequest: "Su transacción está esperando que confirme",
            nsfFail: "No tiene fondos suficientes para completar esta transacción.",
            txUnderpriced: "El precio del gas para su transacción es demasiado bajo, intente nuevamente con un precio del gas más alto",
            txRepeat: "Esto podría ser una transacción repetida",
            txAwaitingApproval: "Tienes una transacción anterior esperando que confirmes",
            txConfirmReminder: "Confirme su transacción para continuar, la ventana de transacción puede estar detrás de su navegador",
            txSendFail: "Rechazaste la transacción",
            txSent: "Su transacción ha sido enviada a la red.",
            txStallPending: "Su transacción se ha estancado y no ha ingresado al grupo de transacciones",
            txPool: "Su transacción ha comenzado",
            txStallConfirmed: "Su transacción se ha estancado y no ha sido confirmada.",
            txSpeedUp: "Su transacción ha sido acelerada",
            txCancel: "Tu transacción está siendo cancelada",
            txFailed: "Su transacción ha fallado",
            txConfirmed: "Su transacción ha tenido éxito.",
            txError: "Vaya, algo salió mal, por favor intente nuevamente"
        },
        watched: {
            txPool: "su cuenta está {verb, select, receiving {recibiendo} sending {enviando}} {formattedValue} {asset} {preposition, select, from {desde} to {a}} {counterpartyShortened}",
            txSpeedUp: "su cuenta está {verb, select, receiving {recibiendo} sending {enviando}} {formattedValue} {asset} {preposition, select, from {desde} to {a}} {counterpartyShortened}",
            txCancel: "su cuenta está {verb, select, receiving {recibiendo} sending {enviando}} {formattedValue} {asset} {preposition, select, from {desde} to {a}} {counterpartyShortened}",
            txConfirmed: "su cuenta {verb, select, received {recibió} sent {ha enviado}} con éxito {formattedValue} {asset} {preposition, select, from {de} to {a}} {counterpartyShortened}",
            txFailed: "su cuenta fallado {verb, select, received {recibió} sent {ha enviado}} con éxito {formattedValue} {asset} {preposition, select, from {de} to {a}} {counterpartyShortened}"
        }
    }
};

function cubicOut(t) {
    const f = t - 1.0;
    return f * f * f + 1.0;
}
function quintIn(t) {
    return t * t * t * t * t;
}

function fly(node, { delay = 0, duration = 400, easing = cubicOut, x = 0, y = 0, opacity = 0 }) {
    const style = getComputedStyle(node);
    const target_opacity = +style.opacity;
    const transform = style.transform === 'none' ? '' : style.transform;
    const od = target_opacity * (1 - opacity);
    return {
        delay,
        duration,
        easing,
        css: (t, u) => `
			transform: ${transform} translate(${(1 - t) * x}px, ${(1 - t) * y}px);
			opacity: ${target_opacity - (od * u)}`
    };
}

function flip(node, animation, params) {
    const style = getComputedStyle(node);
    const transform = style.transform === 'none' ? '' : style.transform;
    const dx = animation.from.left - animation.to.left;
    const dy = animation.from.top - animation.to.top;
    const d = Math.sqrt(dx * dx + dy * dy);
    const { delay = 0, duration = d => Math.sqrt(d) * 120, easing = cubicOut } = params;
    return {
        delay,
        duration: is_function(duration) ? duration(d) : duration,
        easing,
        css: (_t, u) => `transform: ${transform} translate(${u * dx}px, ${u * dy}px);`
    };
}

function argsEqual(args1, args2) {
    return JSON.stringify(args1) === JSON.stringify(args2);
}
function timeString(time) {
    const seconds = Math.floor(time / 1000);
    const formattedSeconds = seconds < 0 ? 0 : seconds;
    return formattedSeconds >= 60
        ? `${Math.floor(formattedSeconds / 60)} min`
        : `${formattedSeconds} sec`;
}
function formatTime(number) {
    const time = new Date(number);
    return time.toLocaleString("en-US", {
        hour: "numeric",
        minute: "numeric",
        hour12: true
    });
}
// will update object(merge new data) in list if it passes predicate, otherwise adds new object
function replaceOrAdd(list, predicate, data) {
    const clone = [...list];
    const index = clone.findIndex(predicate);
    if (index !== -1) {
        const { startTime } = clone[index];
        const { startTime: serverStartTime } = data;
        clone[index] = { ...data, startTime: startTime || serverStartTime };
        return clone;
    }
    return [...list, data];
}
function extractMessageFromError(error) {
    if (!error.stack || !error.message) {
        return {
            eventCode: "txError",
            errorMsg: "An unknown error occured"
        };
    }
    const message = error.stack || error.message;
    if (message.includes("User denied transaction signature")) {
        return {
            eventCode: "txSendFail",
            errorMsg: "User denied transaction signature"
        };
    }
    if (message.includes("transaction underpriced")) {
        return {
            eventCode: "txUnderpriced",
            errorMsg: "Transaction is under priced"
        };
    }
    return {
        eventCode: "txError",
        errorMsg: message
    };
}
function createEmitter() {
    return {
        listeners: {},
        on: function (eventCode, listener) {
            // check if valid eventCode
            switch (eventCode) {
                case "txSent":
                case "txPool":
                case "txConfirmed":
                case "txSpeedUp":
                case "txCancel":
                case "txFailed":
                case "txRequest":
                case "nsfFail":
                case "txRepeat":
                case "txAwaitingApproval":
                case "txConfirmReminder":
                case "txSendFail":
                case "txError":
                case "txUnderPriced":
                case "all":
                    break;
                default:
                    throw new Error(`${eventCode} is not a valid event code, for a list of valid event codes see: https://github.com/blocknative/notify`);
            }
            // check that listener is a function
            if (typeof listener !== "function") {
                throw new Error("Listener must be a function");
            }
            // add listener for the eventCode
            this.listeners[eventCode] = listener;
        },
        emit: function (state) {
            if (this.listeners[state.eventCode || ""]) {
                return this.listeners[state.eventCode || ""](state);
            }
            if (this.listeners.all) {
                return this.listeners.all(state);
            }
        }
    };
}

const app = writable({
    version: "",
    dappId: "",
    networkId: 1,
    nodeSynced: true,
    mobilePosition: "top",
    desktopPosition: "bottomRight",
    darkMode: false,
    txApproveReminderTimeout: 20000,
    txStallPendingTimeout: 20000,
    txStallConfirmedTimeout: 90000
});
const transactions = createTransactionStore([]);
const notifications = createNotificationStore([]);
function createTransactionStore(initialState) {
    const { subscribe, update } = writable(initialState);
    function updateQueue(transaction) {
        const predicate = (tx) => tx.id === transaction.id;
        update((store) => {
            return replaceOrAdd(store, predicate, transaction);
        });
    }
    function add(transaction) {
        update((store) => [...store, transaction]);
    }
    return {
        subscribe,
        updateQueue,
        add
    };
}
function createNotificationStore(initialState) {
    const { subscribe, update } = writable(initialState);
    function add(notification) {
        update((store) => {
            const existingNotification = store.find((n) => n.id === notification.id);
            // if notification is a hint type or there are no existing notifications with same id, then just add it.
            if (notification.type === "hint" || !existingNotification) {
                return [...store, notification];
            }
            // otherwise filter out all notifications with the same id and then add the new notification
            return [
                ...store.filter((n) => n.id !== notification.id),
                notification
            ];
        });
    }
    function remove(id) {
        update((store) => store.filter((n) => n.id !== id));
    }
    return {
        subscribe,
        add,
        remove,
        update
    };
}

/* src/components/CloseIcon.svelte generated by Svelte v3.12.1 */

function add_css() {
	var style = element("style");
	style.id = 'svelte-1ct981s-style';
	style.textContent = "div.svelte-1ct981s{display:flex;justify-content:center;align-items:center;padding:0.3rem;border-radius:40px;transition:background 150ms ease-in-out}div.svelte-1ct981s:hover{background:#eeeeee;cursor:pointer}.bn-notify-dark-mode-close-background.svelte-1ct981s:hover{background:#00222c}";
	append(document.head, style);
}

function create_fragment(ctx) {
	var div, svg, g, path0, path1, g_stroke_value, dispose;

	return {
		c() {
			div = element("div");
			svg = svg_element("svg");
			g = svg_element("g");
			path0 = svg_element("path");
			path1 = svg_element("path");
			attr(path0, "d", "m.1.1 7.82304289 7.82304289");
			attr(path1, "d", "m.1.1 7.82304289 7.82304289");
			attr(path1, "transform", "matrix(-1 0 0 1 8 0)");
			attr(g, "fill", "none");
			attr(g, "stroke", g_stroke_value = ctx.hovered ? (ctx.$app.darkMode ? '#ffffff' : '#4a4a4a') : '#9B9B9B');
			attr(g, "stroke-linecap", "square");
			attr(g, "stroke-width", "2");
			set_style(g, "transition", "stroke 150ms ease-in-out");
			attr(g, "transform", "translate(2 2)");
			attr(svg, "height", "8");
			attr(svg, "viewBox", "0 0 12 12");
			attr(svg, "width", "8");
			attr(svg, "xmlns", "http://www.w3.org/2000/svg");
			attr(div, "class", "bn-notify-custom bn-notify-notification-close-icon svelte-1ct981s");
			toggle_class(div, "bn-notify-dark-mode-close-background", ctx.$app.darkMode);

			dispose = [
				listen(div, "mouseenter", ctx.mouseenter_handler),
				listen(div, "mouseleave", ctx.mouseleave_handler)
			];
		},

		m(target, anchor) {
			insert(target, div, anchor);
			append(div, svg);
			append(svg, g);
			append(g, path0);
			append(g, path1);
		},

		p(changed, ctx) {
			if ((changed.hovered || changed.$app) && g_stroke_value !== (g_stroke_value = ctx.hovered ? (ctx.$app.darkMode ? '#ffffff' : '#4a4a4a') : '#9B9B9B')) {
				attr(g, "stroke", g_stroke_value);
			}

			if (changed.$app) {
				toggle_class(div, "bn-notify-dark-mode-close-background", ctx.$app.darkMode);
			}
		},

		i: noop,
		o: noop,

		d(detaching) {
			if (detaching) {
				detach(div);
			}

			run_all(dispose);
		}
	};
}

function instance($$self, $$props, $$invalidate) {
	let $app;

	component_subscribe($$self, app, $$value => { $app = $$value; $$invalidate('$app', $app); });

	let hovered;

	const mouseenter_handler = () => ($$invalidate('hovered', hovered = true));

	const mouseleave_handler = () => ($$invalidate('hovered', hovered = false));

	return {
		hovered,
		$app,
		mouseenter_handler,
		mouseleave_handler
	};
}

class CloseIcon extends SvelteComponent {
	constructor(options) {
		super();
		if (!document.getElementById("svelte-1ct981s-style")) add_css();
		init(this, options, instance, create_fragment, safe_not_equal, []);
	}
}

/* src/elements/NotificationMessage.svelte generated by Svelte v3.12.1 */

function add_css$1() {
	var style = element("style");
	style.id = 'svelte-1jfw9vh-style';
	style.textContent = "p.svelte-1jfw9vh{margin:0;font-family:\"Helvetica Neue\";font-size:0.889rem}";
	append(document.head, style);
}

function create_fragment$1(ctx) {
	var p, t;

	return {
		c() {
			p = element("p");
			t = text(ctx.message);
			attr(p, "class", "bn-notify-custom bn-notify-notification-info-message svelte-1jfw9vh");
		},

		m(target, anchor) {
			insert(target, p, anchor);
			append(p, t);
		},

		p(changed, ctx) {
			if (changed.message) {
				set_data(t, ctx.message);
			}
		},

		i: noop,
		o: noop,

		d(detaching) {
			if (detaching) {
				detach(p);
			}
		}
	};
}

function instance$1($$self, $$props, $$invalidate) {
	let { message } = $$props;

	$$self.$set = $$props => {
		if ('message' in $$props) $$invalidate('message', message = $$props.message);
	};

	return { message };
}

class NotificationMessage extends SvelteComponent {
	constructor(options) {
		super();
		if (!document.getElementById("svelte-1jfw9vh-style")) add_css$1();
		init(this, options, instance$1, create_fragment$1, safe_not_equal, ["message"]);
	}
}

/* src/elements/Clock.svelte generated by Svelte v3.12.1 */

function add_css$2() {
	var style = element("style");
	style.id = 'svelte-1sck9uz-style';
	style.textContent = "i.svelte-1sck9uz{width:15px;height:16px;display:inline-block;background-image:url(\"https://assist.blocknative.com/images/jJu8b0B.png\");background-position:-66px 0px;vertical-align:sub}";
	append(document.head, style);
}

function create_fragment$2(ctx) {
	var i;

	return {
		c() {
			i = element("i");
			attr(i, "class", "bn-notify-custom bn-notify-notification-info-meta-clock svelte-1sck9uz");
		},

		m(target, anchor) {
			insert(target, i, anchor);
		},

		p: noop,
		i: noop,
		o: noop,

		d(detaching) {
			if (detaching) {
				detach(i);
			}
		}
	};
}

class Clock extends SvelteComponent {
	constructor(options) {
		super();
		if (!document.getElementById("svelte-1sck9uz-style")) add_css$2();
		init(this, options, null, create_fragment$2, safe_not_equal, []);
	}
}

/* src/elements/Time.svelte generated by Svelte v3.12.1 */

function create_fragment$3(ctx) {
	var span, t;

	return {
		c() {
			span = element("span");
			t = text(ctx.time);
			attr(span, "class", "bn-notify-custom bn-notify-notification-info-meta-timestamp");
		},

		m(target, anchor) {
			insert(target, span, anchor);
			append(span, t);
		},

		p(changed, ctx) {
			if (changed.time) {
				set_data(t, ctx.time);
			}
		},

		i: noop,
		o: noop,

		d(detaching) {
			if (detaching) {
				detach(span);
			}
		}
	};
}

function instance$2($$self, $$props, $$invalidate) {
	let { time } = $$props;

	$$self.$set = $$props => {
		if ('time' in $$props) $$invalidate('time', time = $$props.time);
	};

	return { time };
}

class Time extends SvelteComponent {
	constructor(options) {
		super();
		init(this, options, instance$2, create_fragment$3, safe_not_equal, ["time"]);
	}
}

/* src/elements/Timer.svelte generated by Svelte v3.12.1 */

function create_fragment$4(ctx) {
	var span, t;

	return {
		c() {
			span = element("span");
			t = text(ctx.value);
			attr(span, "class", "bn-notify-custom bn-notify-notification-info-meta-duration-time");
		},

		m(target, anchor) {
			insert(target, span, anchor);
			append(span, t);
		},

		p(changed, ctx) {
			if (changed.value) {
				set_data(t, ctx.value);
			}
		},

		i: noop,
		o: noop,

		d(detaching) {
			if (detaching) {
				detach(span);
			}
		}
	};
}

function instance$3($$self, $$props, $$invalidate) {
	let { value } = $$props;

	$$self.$set = $$props => {
		if ('value' in $$props) $$invalidate('value', value = $$props.value);
	};

	return { value };
}

class Timer extends SvelteComponent {
	constructor(options) {
		super();
		init(this, options, instance$3, create_fragment$4, safe_not_equal, ["value"]);
	}
}

/* src/components/NotificationContent.svelte generated by Svelte v3.12.1 */

function add_css$3() {
	var style = element("style");
	style.id = 'svelte-57ky0u-style';
	style.textContent = "div.svelte-57ky0u{display:flex;flex-flow:column nowrap;justify-content:center;margin-left:0.75rem;max-width:78%}p.svelte-57ky0u{margin:0.5rem 0 0 0;opacity:0.7;font-size:0.79rem;line-height:1.15;font-family:\"Helvetica Neue\"}span.svelte-57ky0u{font-family:\"Helvetica Neue\"}";
	append(document.head, style);
}

// (40:4) {#if notification.type === 'pending' && notification.startTime}
function create_if_block(ctx) {
	var span, t0, t1, current;

	var clock = new Clock({});

	var timer = new Timer({ props: { value: timeString(ctx.currentTime - ctx.notification.startTime) } });

	return {
		c() {
			span = element("span");
			t0 = text("-\n        ");
			clock.$$.fragment.c();
			t1 = space();
			timer.$$.fragment.c();
			attr(span, "class", "bn-notify-custom bn-notify-notification-info-meta-duration svelte-57ky0u");
		},

		m(target, anchor) {
			insert(target, span, anchor);
			append(span, t0);
			mount_component(clock, span, null);
			append(span, t1);
			mount_component(timer, span, null);
			current = true;
		},

		p(changed, ctx) {
			var timer_changes = {};
			if (changed.currentTime || changed.notification) timer_changes.value = timeString(ctx.currentTime - ctx.notification.startTime);
			timer.$set(timer_changes);
		},

		i(local) {
			if (current) return;
			transition_in(clock.$$.fragment, local);

			transition_in(timer.$$.fragment, local);

			current = true;
		},

		o(local) {
			transition_out(clock.$$.fragment, local);
			transition_out(timer.$$.fragment, local);
			current = false;
		},

		d(detaching) {
			if (detaching) {
				detach(span);
			}

			destroy_component(clock);

			destroy_component(timer);
		}
	};
}

function create_fragment$5(ctx) {
	var div, t0, p, t1, current;

	var notificationmessage = new NotificationMessage({ props: { message: ctx.notification.message } });

	var time = new Time({ props: { time: ctx.formattedTime } });

	var if_block = (ctx.notification.type === 'pending' && ctx.notification.startTime) && create_if_block(ctx);

	return {
		c() {
			div = element("div");
			notificationmessage.$$.fragment.c();
			t0 = space();
			p = element("p");
			time.$$.fragment.c();
			t1 = space();
			if (if_block) if_block.c();
			attr(p, "class", "bn-notify-custom bn-notify-notification-info-meta svelte-57ky0u");
			attr(div, "class", "bn-notify-custom bn-notify-notification-info svelte-57ky0u");
		},

		m(target, anchor) {
			insert(target, div, anchor);
			mount_component(notificationmessage, div, null);
			append(div, t0);
			append(div, p);
			mount_component(time, p, null);
			append(p, t1);
			if (if_block) if_block.m(p, null);
			current = true;
		},

		p(changed, ctx) {
			var notificationmessage_changes = {};
			if (changed.notification) notificationmessage_changes.message = ctx.notification.message;
			notificationmessage.$set(notificationmessage_changes);

			var time_changes = {};
			if (changed.formattedTime) time_changes.time = ctx.formattedTime;
			time.$set(time_changes);

			if (ctx.notification.type === 'pending' && ctx.notification.startTime) {
				if (if_block) {
					if_block.p(changed, ctx);
					transition_in(if_block, 1);
				} else {
					if_block = create_if_block(ctx);
					if_block.c();
					transition_in(if_block, 1);
					if_block.m(p, null);
				}
			} else if (if_block) {
				group_outros();
				transition_out(if_block, 1, 1, () => {
					if_block = null;
				});
				check_outros();
			}
		},

		i(local) {
			if (current) return;
			transition_in(notificationmessage.$$.fragment, local);

			transition_in(time.$$.fragment, local);

			transition_in(if_block);
			current = true;
		},

		o(local) {
			transition_out(notificationmessage.$$.fragment, local);
			transition_out(time.$$.fragment, local);
			transition_out(if_block);
			current = false;
		},

		d(detaching) {
			if (detaching) {
				detach(div);
			}

			destroy_component(notificationmessage);

			destroy_component(time);

			if (if_block) if_block.d();
		}
	};
}

function instance$4($$self, $$props, $$invalidate) {
	
let { notification, formattedTime, currentTime } = $$props;

	$$self.$set = $$props => {
		if ('notification' in $$props) $$invalidate('notification', notification = $$props.notification);
		if ('formattedTime' in $$props) $$invalidate('formattedTime', formattedTime = $$props.formattedTime);
		if ('currentTime' in $$props) $$invalidate('currentTime', currentTime = $$props.currentTime);
	};

	return { notification, formattedTime, currentTime };
}

class NotificationContent extends SvelteComponent {
	constructor(options) {
		super();
		if (!document.getElementById("svelte-57ky0u-style")) add_css$3();
		init(this, options, instance$4, create_fragment$5, safe_not_equal, ["notification", "formattedTime", "currentTime"]);
	}
}

/* src/components/TypeIcon.svelte generated by Svelte v3.12.1 */

function add_css$4() {
	var style = element("style");
	style.id = 'svelte-16i17ha-style';
	style.textContent = "div.svelte-16i17ha{height:100%;width:1.5rem}";
	append(document.head, style);
}

// (13:2) {#if type === 'hint'}
function create_if_block_3(ctx) {
	var svg, style, t, g_2, g, circle, g_1, path, circle_1;

	return {
		c() {
			svg = svg_element("svg");
			style = svg_element("style");
			t = text("@-webkit-keyframes kf_el_51c2MS41pY_an_cXFUsKhg3V {\n          50% {\n            stroke-dasharray: 553;\n          }\n          0% {\n            stroke-dasharray: 553;\n          }\n          100% {\n            stroke-dasharray: 553;\n          }\n        }\n        @keyframes kf_el_51c2MS41pY_an_cXFUsKhg3V {\n          50% {\n            stroke-dasharray: 553;\n          }\n          0% {\n            stroke-dasharray: 553;\n          }\n          100% {\n            stroke-dasharray: 553;\n          }\n        }\n        @-webkit-keyframes kf_el_51c2MS41pY_an_M-ML-YLcm {\n          50% {\n            stroke-dashoffset: 553;\n          }\n          100% {\n            stroke-dashoffset: 0;\n          }\n          0% {\n            stroke-dashoffset: 553;\n          }\n        }\n        @keyframes kf_el_51c2MS41pY_an_M-ML-YLcm {\n          50% {\n            stroke-dashoffset: 553;\n          }\n          100% {\n            stroke-dashoffset: 0;\n          }\n          0% {\n            stroke-dashoffset: 553;\n          }\n        }\n        @-webkit-keyframes kf_el_j5HR_U6Nrp_an_KGzPpGvQb {\n          50% {\n            opacity: 0;\n          }\n          56.67% {\n            opacity: 1;\n          }\n          0% {\n            opacity: 0;\n          }\n          100% {\n            opacity: 1;\n          }\n        }\n        @keyframes kf_el_j5HR_U6Nrp_an_KGzPpGvQb {\n          50% {\n            opacity: 0;\n          }\n          56.67% {\n            opacity: 1;\n          }\n          0% {\n            opacity: 0;\n          }\n          100% {\n            opacity: 1;\n          }\n        }\n        @-webkit-keyframes kf_el_j5HR_U6Nrp_an_al_MjoEv-F {\n          50% {\n            stroke-dasharray: 39.41;\n          }\n          0% {\n            stroke-dasharray: 39.41;\n          }\n          100% {\n            stroke-dasharray: 39.41;\n          }\n        }\n        @keyframes kf_el_j5HR_U6Nrp_an_al_MjoEv-F {\n          50% {\n            stroke-dasharray: 39.41;\n          }\n          0% {\n            stroke-dasharray: 39.41;\n          }\n          100% {\n            stroke-dasharray: 39.41;\n          }\n        }\n        @-webkit-keyframes kf_el_j5HR_U6Nrp_an_VsVMmQ1MU {\n          50% {\n            stroke-dashoffset: 39.41;\n          }\n          100% {\n            stroke-dashoffset: 0;\n          }\n          0% {\n            stroke-dashoffset: 39.41;\n          }\n        }\n        @keyframes kf_el_j5HR_U6Nrp_an_VsVMmQ1MU {\n          50% {\n            stroke-dashoffset: 39.41;\n          }\n          100% {\n            stroke-dashoffset: 0;\n          }\n          0% {\n            stroke-dashoffset: 39.41;\n          }\n        }\n        @-webkit-keyframes kf_el_TZApOLwXZU_an_dL6-SZLSH {\n          50% {\n            -webkit-transform: translate(88.50000762939453px, 56.5px)\n              scale(0, 0) translate(-88.50000762939453px, -56.5px);\n            transform: translate(88.50000762939453px, 56.5px) scale(0, 0)\n              translate(-88.50000762939453px, -56.5px);\n          }\n          83.33% {\n            -webkit-transform: translate(88.50000762939453px, 56.5px)\n              scale(0, 0) translate(-88.50000762939453px, -56.5px);\n            transform: translate(88.50000762939453px, 56.5px) scale(0, 0)\n              translate(-88.50000762939453px, -56.5px);\n          }\n          100% {\n            -webkit-transform: translate(88.50000762939453px, 56.5px)\n              scale(1, 1) translate(-88.50000762939453px, -56.5px);\n            transform: translate(88.50000762939453px, 56.5px) scale(1, 1)\n              translate(-88.50000762939453px, -56.5px);\n          }\n          0% {\n            -webkit-transform: translate(88.50000762939453px, 56.5px)\n              scale(0, 0) translate(-88.50000762939453px, -56.5px);\n            transform: translate(88.50000762939453px, 56.5px) scale(0, 0)\n              translate(-88.50000762939453px, -56.5px);\n          }\n        }\n        @keyframes kf_el_TZApOLwXZU_an_dL6-SZLSH {\n          50% {\n            -webkit-transform: translate(88.50000762939453px, 56.5px)\n              scale(0, 0) translate(-88.50000762939453px, -56.5px);\n            transform: translate(88.50000762939453px, 56.5px) scale(0, 0)\n              translate(-88.50000762939453px, -56.5px);\n          }\n          83.33% {\n            -webkit-transform: translate(88.50000762939453px, 56.5px)\n              scale(0, 0) translate(-88.50000762939453px, -56.5px);\n            transform: translate(88.50000762939453px, 56.5px) scale(0, 0)\n              translate(-88.50000762939453px, -56.5px);\n          }\n          100% {\n            -webkit-transform: translate(88.50000762939453px, 56.5px)\n              scale(1, 1) translate(-88.50000762939453px, -56.5px);\n            transform: translate(88.50000762939453px, 56.5px) scale(1, 1)\n              translate(-88.50000762939453px, -56.5px);\n          }\n          0% {\n            -webkit-transform: translate(88.50000762939453px, 56.5px)\n              scale(0, 0) translate(-88.50000762939453px, -56.5px);\n            transform: translate(88.50000762939453px, 56.5px) scale(0, 0)\n              translate(-88.50000762939453px, -56.5px);\n          }\n        }\n        #el_DHAskxC2T * {\n          -webkit-animation-duration: 1s;\n          animation-duration: 1s;\n          -webkit-animation-iteration-count: 1;\n          animation-iteration-count: 1;\n          -webkit-animation-timing-function: cubic-bezier(0, 0, 1, 1);\n          animation-timing-function: cubic-bezier(0, 0, 1, 1);\n        }\n        #el__hILOKhuR3 {\n          fill: none;\n          -webkit-transform: translate(7px, 7px);\n          transform: translate(7px, 7px);\n        }\n        #el_TZApOLwXZU {\n          fill: #979797;\n          -webkit-transform: matrix(1, 0, 0, -1, 0, 113);\n          transform: matrix(1, 0, 0, -1, 0, 113);\n        }\n        #el_fIxIrV8WbF {\n          stroke: #979797;\n          stroke-width: 14;\n        }\n        #el_TZApOLwXZU_an_dL6-SZLSH {\n          -webkit-animation-fill-mode: forwards;\n          animation-fill-mode: forwards;\n          -webkit-animation-name: kf_el_TZApOLwXZU_an_dL6-SZLSH;\n          animation-name: kf_el_TZApOLwXZU_an_dL6-SZLSH;\n          -webkit-animation-timing-function: cubic-bezier(0, 0, 1, 1);\n          animation-timing-function: cubic-bezier(0, 0, 1, 1);\n        }\n        #el_j5HR_U6Nrp {\n          -webkit-animation-fill-mode: forwards, forwards, forwards;\n          animation-fill-mode: forwards, forwards, forwards;\n          -webkit-animation-name: kf_el_j5HR_U6Nrp_an_VsVMmQ1MU,\n            kf_el_j5HR_U6Nrp_an_al_MjoEv-F, kf_el_j5HR_U6Nrp_an_KGzPpGvQb;\n          animation-name: kf_el_j5HR_U6Nrp_an_VsVMmQ1MU,\n            kf_el_j5HR_U6Nrp_an_al_MjoEv-F, kf_el_j5HR_U6Nrp_an_KGzPpGvQb;\n          -webkit-animation-timing-function: cubic-bezier(0, 0, 1, 1),\n            cubic-bezier(0, 0, 1, 1), cubic-bezier(0, 0, 1, 1);\n          animation-timing-function: cubic-bezier(0, 0, 1, 1),\n            cubic-bezier(0, 0, 1, 1), cubic-bezier(0, 0, 1, 1);\n        }\n        #el_51c2MS41pY {\n          -webkit-animation-fill-mode: forwards, forwards;\n          animation-fill-mode: forwards, forwards;\n          -webkit-animation-name: kf_el_51c2MS41pY_an_M-ML-YLcm,\n            kf_el_51c2MS41pY_an_cXFUsKhg3V;\n          animation-name: kf_el_51c2MS41pY_an_M-ML-YLcm,\n            kf_el_51c2MS41pY_an_cXFUsKhg3V;\n          -webkit-animation-timing-function: cubic-bezier(0, 0, 1, 1),\n            cubic-bezier(0, 0, 1, 1);\n          animation-timing-function: cubic-bezier(0, 0, 1, 1),\n            cubic-bezier(0, 0, 1, 1);\n        }\n      ");
			g_2 = svg_element("g");
			g = svg_element("g");
			circle = svg_element("circle");
			g_1 = svg_element("g");
			path = svg_element("path");
			circle_1 = svg_element("circle");
			attr(circle, "cx", "88.5");
			attr(circle, "cy", "56.5");
			attr(circle, "r", "7.5");
			attr(circle, "id", "el_TZApOLwXZU");
			attr(g, "id", "el_TZApOLwXZU_an_dL6-SZLSH");
			attr(g, "data-animator-group", "true");
			attr(g, "data-animator-type", "2");
			attr(path, "d", "m88.5 128v-39.4130859");
			attr(path, "stroke-linecap", "round");
			attr(path, "stroke-linejoin", "round");
			attr(path, "id", "el_j5HR_U6Nrp");
			attr(circle_1, "cx", "88");
			attr(circle_1, "cy", "88");
			attr(circle_1, "r", "88");
			attr(circle_1, "id", "el_51c2MS41pY");
			attr(g_1, "id", "el_fIxIrV8WbF");
			attr(g_2, "fill-rule", "evenodd");
			attr(g_2, "id", "el__hILOKhuR3");
			attr(svg, "viewBox", "0 0 190 190");
			attr(svg, "xmlns", "http://www.w3.org/2000/svg");
			attr(svg, "id", "el_DHAskxC2T");
		},

		m(target, anchor) {
			insert(target, svg, anchor);
			append(svg, style);
			append(style, t);
			append(svg, g_2);
			append(g_2, g);
			append(g, circle);
			append(g_2, g_1);
			append(g_1, path);
			append(g_1, circle_1);
		},

		d(detaching) {
			if (detaching) {
				detach(svg);
			}
		}
	};
}

// (261:2) {#if type === 'pending'}
function create_if_block_2(ctx) {
	var svg, style, t, g_3, circle, g_2, g, path, g_1, path_1;

	return {
		c() {
			svg = svg_element("svg");
			style = svg_element("style");
			t = text("@-webkit-keyframes kf_el_fv0z90vBrL_an_PwUBZ96LS {\n          0% {\n            -webkit-transform: translate(88px, 87.587890625px) rotate(0deg)\n              translate(-88px, -87.587890625px);\n            transform: translate(88px, 87.587890625px) rotate(0deg)\n              translate(-88px, -87.587890625px);\n          }\n          100% {\n            -webkit-transform: translate(88px, 87.587890625px) rotate(360deg)\n              translate(-88px, -87.587890625px);\n            transform: translate(88px, 87.587890625px) rotate(360deg)\n              translate(-88px, -87.587890625px);\n          }\n        }\n        @keyframes kf_el_fv0z90vBrL_an_PwUBZ96LS {\n          0% {\n            -webkit-transform: translate(88px, 87.587890625px) rotate(0deg)\n              translate(-88px, -87.587890625px);\n            transform: translate(88px, 87.587890625px) rotate(0deg)\n              translate(-88px, -87.587890625px);\n          }\n          100% {\n            -webkit-transform: translate(88px, 87.587890625px) rotate(360deg)\n              translate(-88px, -87.587890625px);\n            transform: translate(88px, 87.587890625px) rotate(360deg)\n              translate(-88px, -87.587890625px);\n          }\n        }\n        @-webkit-keyframes kf_el_u3QHGLTow3_an_EQ8OetHGq {\n          0% {\n            -webkit-transform: translate(88px, 87.587890625px) rotate(0deg)\n              translate(-88px, -87.587890625px);\n            transform: translate(88px, 87.587890625px) rotate(0deg)\n              translate(-88px, -87.587890625px);\n          }\n          50% {\n            -webkit-transform: translate(88px, 87.587890625px) rotate(360deg)\n              translate(-88px, -87.587890625px);\n            transform: translate(88px, 87.587890625px) rotate(360deg)\n              translate(-88px, -87.587890625px);\n          }\n          100% {\n            -webkit-transform: translate(88px, 87.587890625px) rotate(720deg)\n              translate(-88px, -87.587890625px);\n            transform: translate(88px, 87.587890625px) rotate(720deg)\n              translate(-88px, -87.587890625px);\n          }\n        }\n        @keyframes kf_el_u3QHGLTow3_an_EQ8OetHGq {\n          0% {\n            -webkit-transform: translate(88px, 87.587890625px) rotate(0deg)\n              translate(-88px, -87.587890625px);\n            transform: translate(88px, 87.587890625px) rotate(0deg)\n              translate(-88px, -87.587890625px);\n          }\n          50% {\n            -webkit-transform: translate(88px, 87.587890625px) rotate(360deg)\n              translate(-88px, -87.587890625px);\n            transform: translate(88px, 87.587890625px) rotate(360deg)\n              translate(-88px, -87.587890625px);\n          }\n          100% {\n            -webkit-transform: translate(88px, 87.587890625px) rotate(720deg)\n              translate(-88px, -87.587890625px);\n            transform: translate(88px, 87.587890625px) rotate(720deg)\n              translate(-88px, -87.587890625px);\n          }\n        }\n        #el_XWLVvD_rP * {\n          -webkit-animation-duration: 2s;\n          animation-duration: 2s;\n          -webkit-animation-iteration-count: infinite;\n          animation-iteration-count: infinite;\n          -webkit-animation-timing-function: cubic-bezier(0, 0, 1, 1);\n          animation-timing-function: cubic-bezier(0, 0, 1, 1);\n        }\n        #el_Uh6HOhkAVi {\n          fill: none;\n          stroke-width: 14;\n          -webkit-transform: translate(7px, 7px);\n          transform: translate(7px, 7px);\n        }\n        #el_PHAWgO26lN {\n          stroke: #ffbd00;\n        }\n        #el_A4XF5QQwhp {\n          stroke: #ffbf00;\n        }\n        #el_u3QHGLTow3_an_EQ8OetHGq {\n          -webkit-animation-fill-mode: backwards;\n          animation-fill-mode: backwards;\n          -webkit-transform: translate(88px, 87.587890625px) rotate(0deg)\n            translate(-88px, -87.587890625px);\n          transform: translate(88px, 87.587890625px) rotate(0deg)\n            translate(-88px, -87.587890625px);\n          -webkit-animation-name: kf_el_u3QHGLTow3_an_EQ8OetHGq;\n          animation-name: kf_el_u3QHGLTow3_an_EQ8OetHGq;\n          -webkit-animation-timing-function: cubic-bezier(0, 0, 1, 1);\n          animation-timing-function: cubic-bezier(0, 0, 1, 1);\n        }\n        #el_fv0z90vBrL_an_PwUBZ96LS {\n          -webkit-animation-fill-mode: backwards;\n          animation-fill-mode: backwards;\n          -webkit-transform: translate(88px, 87.587890625px) rotate(0deg)\n            translate(-88px, -87.587890625px);\n          transform: translate(88px, 87.587890625px) rotate(0deg)\n            translate(-88px, -87.587890625px);\n          -webkit-animation-name: kf_el_fv0z90vBrL_an_PwUBZ96LS;\n          animation-name: kf_el_fv0z90vBrL_an_PwUBZ96LS;\n          -webkit-animation-timing-function: cubic-bezier(0, 0, 1, 1);\n          animation-timing-function: cubic-bezier(0, 0, 1, 1);\n        }\n      ");
			g_3 = svg_element("g");
			circle = svg_element("circle");
			g_2 = svg_element("g");
			g = svg_element("g");
			path = svg_element("path");
			g_1 = svg_element("g");
			path_1 = svg_element("path");
			attr(circle, "cx", "88");
			attr(circle, "cy", "88");
			attr(circle, "r", "88");
			attr(circle, "id", "el_PHAWgO26lN");
			attr(path, "d", "m88 25v62.5878906");
			attr(path, "id", "el_fv0z90vBrL");
			attr(g, "id", "el_fv0z90vBrL_an_PwUBZ96LS");
			attr(g, "data-animator-group", "true");
			attr(g, "data-animator-type", "1");
			attr(path_1, "d", "m88 45.9160156v41.671875");
			attr(path_1, "id", "el_u3QHGLTow3");
			attr(g_1, "id", "el_u3QHGLTow3_an_EQ8OetHGq");
			attr(g_1, "data-animator-group", "true");
			attr(g_1, "data-animator-type", "1");
			attr(g_2, "stroke-linecap", "round");
			attr(g_2, "stroke-linejoin", "round");
			attr(g_2, "id", "el_A4XF5QQwhp");
			attr(g_3, "fill-rule", "evenodd");
			attr(g_3, "id", "el_Uh6HOhkAVi");
			attr(svg, "viewBox", "0 0 190 190");
			attr(svg, "xmlns", "http://www.w3.org/2000/svg");
			attr(svg, "id", "el_XWLVvD_rP");
		},

		m(target, anchor) {
			insert(target, svg, anchor);
			append(svg, style);
			append(style, t);
			append(svg, g_3);
			append(g_3, circle);
			append(g_3, g_2);
			append(g_2, g);
			append(g, path);
			append(g_2, g_1);
			append(g_1, path_1);
		},

		d(detaching) {
			if (detaching) {
				detach(svg);
			}
		}
	};
}

// (400:2) {#if type === 'success'}
function create_if_block_1(ctx) {
	var svg, style, t, path;

	return {
		c() {
			svg = svg_element("svg");
			style = svg_element("style");
			t = text("@-webkit-keyframes kf_el_RzYtw9rUyN_an_gX4OsFPwzz {\n          0% {\n            stroke-dasharray: 473.87;\n          }\n          100% {\n            stroke-dasharray: 473.87;\n          }\n        }\n        @keyframes kf_el_RzYtw9rUyN_an_gX4OsFPwzz {\n          0% {\n            stroke-dasharray: 473.87;\n          }\n          100% {\n            stroke-dasharray: 473.87;\n          }\n        }\n        @-webkit-keyframes kf_el_RzYtw9rUyN_an_WfcYZ9pjL {\n          0% {\n            stroke-dashoffset: 473.87;\n          }\n          50% {\n            stroke-dashoffset: 473.87;\n          }\n          100% {\n            stroke-dashoffset: 0;\n          }\n        }\n        @keyframes kf_el_RzYtw9rUyN_an_WfcYZ9pjL {\n          0% {\n            stroke-dashoffset: 473.87;\n          }\n          50% {\n            stroke-dashoffset: 473.87;\n          }\n          100% {\n            stroke-dashoffset: 0;\n          }\n        }\n        #el_3OA8Szq_A * {\n          -webkit-animation-duration: 1s;\n          animation-duration: 1s;\n          -webkit-animation-iteration-count: 1;\n          animation-iteration-count: 1;\n          -webkit-animation-timing-function: cubic-bezier(0, 0, 1, 1);\n          animation-timing-function: cubic-bezier(0, 0, 1, 1);\n        }\n        #el_RzYtw9rUyN {\n          fill: none;\n          stroke: #7ed321;\n          stroke-width: 17;\n          -webkit-animation-fill-mode: forwards, forwards;\n          animation-fill-mode: forwards, forwards;\n          -webkit-animation-name: kf_el_RzYtw9rUyN_an_WfcYZ9pjL,\n            kf_el_RzYtw9rUyN_an_gX4OsFPwzz;\n          animation-name: kf_el_RzYtw9rUyN_an_WfcYZ9pjL,\n            kf_el_RzYtw9rUyN_an_gX4OsFPwzz;\n          -webkit-animation-timing-function: cubic-bezier(0, 0, 1, 1),\n            cubic-bezier(0, 0, 1, 1);\n          animation-timing-function: cubic-bezier(0, 0, 1, 1),\n            cubic-bezier(0, 0, 1, 1);\n        }\n      ");
			path = svg_element("path");
			attr(path, "d", "m176.126953 63.8789062-94.4130858 95.4130858-72.87402345-72.8740232\n        27.93945315-27.9394532 44.9345703 44.9345704 94.4130858-94.413086");
			attr(path, "stroke-linecap", "round");
			attr(path, "stroke-linejoin", "round");
			attr(path, "id", "el_RzYtw9rUyN");
			attr(svg, "viewBox", "0 0 185 168");
			attr(svg, "xmlns", "http://www.w3.org/2000/svg");
			attr(svg, "id", "el_3OA8Szq_A");
		},

		m(target, anchor) {
			insert(target, svg, anchor);
			append(svg, style);
			append(style, t);
			append(svg, path);
		},

		d(detaching) {
			if (detaching) {
				detach(svg);
			}
		}
	};
}

// (477:2) {#if type === 'error'}
function create_if_block$1(ctx) {
	var svg, style, t, g_1, path, g, circle, path_1;

	return {
		c() {
			svg = svg_element("svg");
			style = svg_element("style");
			t = text("@-webkit-keyframes kf_el_IAuv9ut-2-_an_xlDuvYsRc {\n          50% {\n            opacity: 0;\n          }\n          66.67% {\n            opacity: 1;\n          }\n          0% {\n            opacity: 0;\n          }\n          100% {\n            opacity: 1;\n          }\n        }\n        @keyframes kf_el_IAuv9ut-2-_an_xlDuvYsRc {\n          50% {\n            opacity: 0;\n          }\n          66.67% {\n            opacity: 1;\n          }\n          0% {\n            opacity: 0;\n          }\n          100% {\n            opacity: 1;\n          }\n        }\n        @-webkit-keyframes kf_el_IAuv9ut-2-_an_29XE36SGo1 {\n          50% {\n            stroke-dasharray: 39.41;\n          }\n          0% {\n            stroke-dasharray: 39.41;\n          }\n          100% {\n            stroke-dasharray: 39.41;\n          }\n        }\n        @keyframes kf_el_IAuv9ut-2-_an_29XE36SGo1 {\n          50% {\n            stroke-dasharray: 39.41;\n          }\n          0% {\n            stroke-dasharray: 39.41;\n          }\n          100% {\n            stroke-dasharray: 39.41;\n          }\n        }\n        @-webkit-keyframes kf_el_IAuv9ut-2-_an_xo_EIWruT {\n          50% {\n            stroke-dashoffset: 39.41;\n          }\n          100% {\n            stroke-dashoffset: 0;\n          }\n          0% {\n            stroke-dashoffset: 39.41;\n          }\n        }\n        @keyframes kf_el_IAuv9ut-2-_an_xo_EIWruT {\n          50% {\n            stroke-dashoffset: 39.41;\n          }\n          100% {\n            stroke-dashoffset: 0;\n          }\n          0% {\n            stroke-dashoffset: 39.41;\n          }\n        }\n        @-webkit-keyframes kf_el_q_eIK0z3HI_an_045tZJOHl {\n          50% {\n            -webkit-transform: translate(88.50000762939453px, 144.5px)\n              scale(0, 0) translate(-88.50000762939453px, -144.5px);\n            transform: translate(88.50000762939453px, 144.5px) scale(0, 0)\n              translate(-88.50000762939453px, -144.5px);\n          }\n          83.33% {\n            -webkit-transform: translate(88.50000762939453px, 144.5px)\n              scale(0, 0) translate(-88.50000762939453px, -144.5px);\n            transform: translate(88.50000762939453px, 144.5px) scale(0, 0)\n              translate(-88.50000762939453px, -144.5px);\n          }\n          100% {\n            -webkit-transform: translate(88.50000762939453px, 144.5px)\n              scale(1, 1) translate(-88.50000762939453px, -144.5px);\n            transform: translate(88.50000762939453px, 144.5px) scale(1, 1)\n              translate(-88.50000762939453px, -144.5px);\n          }\n          0% {\n            -webkit-transform: translate(88.50000762939453px, 144.5px)\n              scale(0, 0) translate(-88.50000762939453px, -144.5px);\n            transform: translate(88.50000762939453px, 144.5px) scale(0, 0)\n              translate(-88.50000762939453px, -144.5px);\n          }\n        }\n        @keyframes kf_el_q_eIK0z3HI_an_045tZJOHl {\n          50% {\n            -webkit-transform: translate(88.50000762939453px, 144.5px)\n              scale(0, 0) translate(-88.50000762939453px, -144.5px);\n            transform: translate(88.50000762939453px, 144.5px) scale(0, 0)\n              translate(-88.50000762939453px, -144.5px);\n          }\n          83.33% {\n            -webkit-transform: translate(88.50000762939453px, 144.5px)\n              scale(0, 0) translate(-88.50000762939453px, -144.5px);\n            transform: translate(88.50000762939453px, 144.5px) scale(0, 0)\n              translate(-88.50000762939453px, -144.5px);\n          }\n          100% {\n            -webkit-transform: translate(88.50000762939453px, 144.5px)\n              scale(1, 1) translate(-88.50000762939453px, -144.5px);\n            transform: translate(88.50000762939453px, 144.5px) scale(1, 1)\n              translate(-88.50000762939453px, -144.5px);\n          }\n          0% {\n            -webkit-transform: translate(88.50000762939453px, 144.5px)\n              scale(0, 0) translate(-88.50000762939453px, -144.5px);\n            transform: translate(88.50000762939453px, 144.5px) scale(0, 0)\n              translate(-88.50000762939453px, -144.5px);\n          }\n        }\n        @-webkit-keyframes kf_el_5BNAI_PBsn_an_aToWhdlG8F {\n          50% {\n            stroke-dasharray: 527.67;\n          }\n          0% {\n            stroke-dasharray: 527.67;\n          }\n          100% {\n            stroke-dasharray: 527.67;\n          }\n        }\n        @keyframes kf_el_5BNAI_PBsn_an_aToWhdlG8F {\n          50% {\n            stroke-dasharray: 527.67;\n          }\n          0% {\n            stroke-dasharray: 527.67;\n          }\n          100% {\n            stroke-dasharray: 527.67;\n          }\n        }\n        @-webkit-keyframes kf_el_5BNAI_PBsn_an_tQV_CQebU {\n          50% {\n            stroke-dashoffset: 527.67;\n          }\n          100% {\n            stroke-dashoffset: 0;\n          }\n          0% {\n            stroke-dashoffset: 527.67;\n          }\n        }\n        @keyframes kf_el_5BNAI_PBsn_an_tQV_CQebU {\n          50% {\n            stroke-dashoffset: 527.67;\n          }\n          100% {\n            stroke-dashoffset: 0;\n          }\n          0% {\n            stroke-dashoffset: 527.67;\n          }\n        }\n        #el_bYTVKD04y * {\n          -webkit-animation-duration: 1s;\n          animation-duration: 1s;\n          -webkit-animation-iteration-count: 1;\n          animation-iteration-count: 1;\n          -webkit-animation-timing-function: cubic-bezier(0, 0, 1, 1);\n          animation-timing-function: cubic-bezier(0, 0, 1, 1);\n        }\n        #el_doMgf96Cxx {\n          fill: none;\n          -webkit-transform: translate(1px, -5px);\n          transform: translate(1px, -5px);\n        }\n        #el_5BNAI_PBsn {\n          stroke: #ff0039;\n          stroke-width: 14;\n          -webkit-animation-fill-mode: forwards, forwards;\n          animation-fill-mode: forwards, forwards;\n          -webkit-animation-name: kf_el_5BNAI_PBsn_an_tQV_CQebU,\n            kf_el_5BNAI_PBsn_an_aToWhdlG8F;\n          animation-name: kf_el_5BNAI_PBsn_an_tQV_CQebU,\n            kf_el_5BNAI_PBsn_an_aToWhdlG8F;\n          -webkit-animation-timing-function: cubic-bezier(0, 0, 1, 1),\n            cubic-bezier(0, 0, 1, 1);\n          animation-timing-function: cubic-bezier(0, 0, 1, 1),\n            cubic-bezier(0, 0, 1, 1);\n        }\n        #el_q_eIK0z3HI {\n          fill: #ff0042;\n        }\n        #el_IAuv9ut-2- {\n          stroke: #ff0042;\n          stroke-width: 14;\n          -webkit-animation-fill-mode: forwards, forwards, forwards;\n          animation-fill-mode: forwards, forwards, forwards;\n          -webkit-animation-name: kf_el_IAuv9ut-2-_an_xo_EIWruT,\n            kf_el_IAuv9ut-2-_an_29XE36SGo1, kf_el_IAuv9ut-2-_an_xlDuvYsRc;\n          animation-name: kf_el_IAuv9ut-2-_an_xo_EIWruT,\n            kf_el_IAuv9ut-2-_an_29XE36SGo1, kf_el_IAuv9ut-2-_an_xlDuvYsRc;\n          -webkit-animation-timing-function: cubic-bezier(0, 0, 1, 1),\n            cubic-bezier(0, 0, 1, 1), cubic-bezier(0, 0, 1, 1);\n          animation-timing-function: cubic-bezier(0, 0, 1, 1),\n            cubic-bezier(0, 0, 1, 1), cubic-bezier(0, 0, 1, 1);\n        }\n        #el_q_eIK0z3HI_an_045tZJOHl {\n          -webkit-animation-fill-mode: forwards;\n          animation-fill-mode: forwards;\n          -webkit-animation-name: kf_el_q_eIK0z3HI_an_045tZJOHl;\n          animation-name: kf_el_q_eIK0z3HI_an_045tZJOHl;\n          -webkit-animation-timing-function: cubic-bezier(0, 0, 1, 1);\n          animation-timing-function: cubic-bezier(0, 0, 1, 1);\n        }\n      ");
			g_1 = svg_element("g");
			path = svg_element("path");
			g = svg_element("g");
			circle = svg_element("circle");
			path_1 = svg_element("path");
			attr(path, "d", "m96.9442719 17.8885438 71.8196601 143.6393202c2.469893\n          4.939785.467649 10.946515-4.472136 13.416408-1.388554.694277-2.919685\n          1.055728-4.472136 1.055728h-143.6393201c-5.5228475\n          0-10.00000001-4.477153-10.00000001-10 0-1.552451.36145092-3.083582\n          1.05572809-4.472136l71.81966012-143.6393202c2.4698925-4.939785\n          8.4766229-6.9420284 13.4164079-4.4721359 1.935274.967637 3.5044989\n          2.5368619 4.4721359 4.4721359z");
			attr(path, "stroke-linejoin", "round");
			attr(path, "id", "el_5BNAI_PBsn");
			attr(circle, "cx", "88.5");
			attr(circle, "cy", "144.5");
			attr(circle, "r", "7.5");
			attr(circle, "id", "el_q_eIK0z3HI");
			attr(g, "id", "el_q_eIK0z3HI_an_045tZJOHl");
			attr(g, "data-animator-group", "true");
			attr(g, "data-animator-type", "2");
			attr(path_1, "d", "m88.5 112.413086v-39.413086");
			attr(path_1, "stroke-linecap", "round");
			attr(path_1, "stroke-linejoin", "round");
			attr(path_1, "id", "el_IAuv9ut-2-");
			attr(g_1, "fill-rule", "evenodd");
			attr(g_1, "id", "el_doMgf96Cxx");
			attr(svg, "viewBox", "0 0 178 178");
			attr(svg, "xmlns", "http://www.w3.org/2000/svg");
			attr(svg, "id", "el_bYTVKD04y");
		},

		m(target, anchor) {
			insert(target, svg, anchor);
			append(svg, style);
			append(style, t);
			append(svg, g_1);
			append(g_1, path);
			append(g_1, g);
			append(g, circle);
			append(g_1, path_1);
		},

		d(detaching) {
			if (detaching) {
				detach(svg);
			}
		}
	};
}

function create_fragment$6(ctx) {
	var div, t0, t1, t2;

	var if_block0 = (ctx.type === 'hint') && create_if_block_3();

	var if_block1 = (ctx.type === 'pending') && create_if_block_2();

	var if_block2 = (ctx.type === 'success') && create_if_block_1();

	var if_block3 = (ctx.type === 'error') && create_if_block$1();

	return {
		c() {
			div = element("div");
			if (if_block0) if_block0.c();
			t0 = space();
			if (if_block1) if_block1.c();
			t1 = space();
			if (if_block2) if_block2.c();
			t2 = space();
			if (if_block3) if_block3.c();
			attr(div, "class", "bn-notify-custom bn-notify-notification-status-icon svelte-16i17ha");
		},

		m(target, anchor) {
			insert(target, div, anchor);
			if (if_block0) if_block0.m(div, null);
			append(div, t0);
			if (if_block1) if_block1.m(div, null);
			append(div, t1);
			if (if_block2) if_block2.m(div, null);
			append(div, t2);
			if (if_block3) if_block3.m(div, null);
		},

		p(changed, ctx) {
			if (ctx.type === 'hint') {
				if (!if_block0) {
					if_block0 = create_if_block_3();
					if_block0.c();
					if_block0.m(div, t0);
				}
			} else if (if_block0) {
				if_block0.d(1);
				if_block0 = null;
			}

			if (ctx.type === 'pending') {
				if (!if_block1) {
					if_block1 = create_if_block_2();
					if_block1.c();
					if_block1.m(div, t1);
				}
			} else if (if_block1) {
				if_block1.d(1);
				if_block1 = null;
			}

			if (ctx.type === 'success') {
				if (!if_block2) {
					if_block2 = create_if_block_1();
					if_block2.c();
					if_block2.m(div, t2);
				}
			} else if (if_block2) {
				if_block2.d(1);
				if_block2 = null;
			}

			if (ctx.type === 'error') {
				if (!if_block3) {
					if_block3 = create_if_block$1();
					if_block3.c();
					if_block3.m(div, null);
				}
			} else if (if_block3) {
				if_block3.d(1);
				if_block3 = null;
			}
		},

		i: noop,
		o: noop,

		d(detaching) {
			if (detaching) {
				detach(div);
			}

			if (if_block0) if_block0.d();
			if (if_block1) if_block1.d();
			if (if_block2) if_block2.d();
			if (if_block3) if_block3.d();
		}
	};
}

function instance$5($$self, $$props, $$invalidate) {
	let { type } = $$props;

	$$self.$set = $$props => {
		if ('type' in $$props) $$invalidate('type', type = $$props.type);
	};

	return { type };
}

class TypeIcon extends SvelteComponent {
	constructor(options) {
		super();
		if (!document.getElementById("svelte-16i17ha-style")) add_css$4();
		init(this, options, instance$5, create_fragment$6, safe_not_equal, ["type"]);
	}
}

/* src/components/AutoDismiss.svelte generated by Svelte v3.12.1 */

function create_fragment$7(ctx) {
	return {
		c: noop,
		m: noop,
		p: noop,
		i: noop,
		o: noop,
		d: noop
	};
}

function instance$6($$self, $$props, $$invalidate) {
	let { notification = { id: "", type: "", key: "", message: "" } } = $$props;
if (notification && notification.autoDismiss && notification.id) {
    setTimeout(() => {
        notifications.remove(notification.id);
    }, notification.autoDismiss);
}

	$$self.$set = $$props => {
		if ('notification' in $$props) $$invalidate('notification', notification = $$props.notification);
	};

	return { notification };
}

class AutoDismiss extends SvelteComponent {
	constructor(options) {
		super();
		init(this, options, instance$6, create_fragment$7, safe_not_equal, ["notification"]);
	}
}

/* src/views/Notify.svelte generated by Svelte v3.12.1 */

function add_css$5() {
	var style = element("style");
	style.id = 'svelte-uherie-style';
	style.textContent = "ul.svelte-uherie{display:flex;flex-flow:column nowrap;position:fixed;padding:0 0.75rem;margin:0;list-style-type:none;width:20rem;bottom:0;right:0;font-family:\"Helvetica Neue\";max-height:100vh;overflow-y:scroll;overflow-x:hidden;color:#4a4a4a;background:transparent;scrollbar-width:none;box-sizing:border-box;height:100vh;pointer-events:none;z-index:9}@media only screen and (max-width: 450px){ul.svelte-uherie{width:100%}}.bn-notify-custom.bn-notify-dark-mode{background:#283944;color:#ffffff;background:rgba(40, 57, 68, 0.9)}.bn-notify-clickable:hover{cursor:pointer}.svelte-uherie::-webkit-scrollbar{display:none}li.svelte-uherie{position:relative;display:flex;padding:0.75rem;font-size:0.889rem;border-radius:10px;background:#ffffff;box-shadow:0px 2px 10px rgba(0, 0, 0, 0.1);color:inherit;transition:background 300ms ease-in-out, color 300ms ease-in-out;pointer-events:all;background:#ffffff;backdrop-filter:blur(5px);background:rgba(255, 255, 255, 0.9)}div.svelte-uherie{position:absolute;top:0.75rem;right:0.75rem}";
	append(document.head, style);
}

function get_each_context(ctx, list, i) {
	const child_ctx = Object.create(ctx);
	child_ctx.notification = list[i];
	child_ctx.i = i;
	return child_ctx;
}

// (173:0) {#if $notifications.length > 0}
function create_if_block$2(ctx) {
	var ul, each_blocks = [], each_1_lookup = new Map(), ul_style_value, current;

	let each_value = ctx.$notifications;

	const get_key = ctx => ctx.notification.key;

	for (let i = 0; i < each_value.length; i += 1) {
		let child_ctx = get_each_context(ctx, each_value, i);
		let key = get_key(child_ctx);
		each_1_lookup.set(key, each_blocks[i] = create_each_block(key, child_ctx));
	}

	return {
		c() {
			ul = element("ul");

			for (let i = 0; i < each_blocks.length; i += 1) {
				each_blocks[i].c();
			}
			attr(ul, "class", "bn-notify-custom bn-notify-notifications svelte-uherie");
			attr(ul, "style", ul_style_value = `${ctx.positioning} ${ctx.justifyContent}`);
		},

		m(target, anchor) {
			insert(target, ul, anchor);

			for (let i = 0; i < each_blocks.length; i += 1) {
				each_blocks[i].m(ul, null);
			}

			current = true;
		},

		p(changed, ctx) {
			const each_value = ctx.$notifications;

			group_outros();
			for (let i = 0; i < each_blocks.length; i += 1) each_blocks[i].r();
			each_blocks = update_keyed_each(each_blocks, changed, get_key, 1, ctx, each_value, each_1_lookup, ul, fix_and_outro_and_destroy_block, create_each_block, null, get_each_context);
			for (let i = 0; i < each_blocks.length; i += 1) each_blocks[i].a();
			check_outros();

			if ((!current || changed.positioning || changed.justifyContent) && ul_style_value !== (ul_style_value = `${ctx.positioning} ${ctx.justifyContent}`)) {
				attr(ul, "style", ul_style_value);
			}
		},

		i(local) {
			if (current) return;
			for (let i = 0; i < each_value.length; i += 1) {
				transition_in(each_blocks[i]);
			}

			current = true;
		},

		o(local) {
			for (let i = 0; i < each_blocks.length; i += 1) {
				transition_out(each_blocks[i]);
			}

			current = false;
		},

		d(detaching) {
			if (detaching) {
				detach(ul);
			}

			for (let i = 0; i < each_blocks.length; i += 1) {
				each_blocks[i].d();
			}
		}
	};
}

// (177:4) {#each $notifications as notification, i (notification.key)}
function create_each_block(key_1, ctx) {
	var li, t0, t1, div, t2, t3, li_intro, li_outro, rect, stop_animation = noop, current, dispose;

	var typeicon = new TypeIcon({ props: { type: ctx.notification.type } });

	var notificationcontent = new NotificationContent({
		props: {
		notification: ctx.notification,
		formattedTime: ctx.formattedTime,
		currentTime: ctx.currentTime
	}
	});

	var closeicon = new CloseIcon({});

	function click_handler() {
		return ctx.click_handler(ctx);
	}

	var autodismiss = new AutoDismiss({ props: { notification: ctx.notification } });

	return {
		key: key_1,

		first: null,

		c() {
			li = element("li");
			typeicon.$$.fragment.c();
			t0 = space();
			notificationcontent.$$.fragment.c();
			t1 = space();
			div = element("div");
			closeicon.$$.fragment.c();
			t2 = space();
			autodismiss.$$.fragment.c();
			t3 = space();
			attr(div, "class", "bn-notify-custom bn-notify-notification-close svelte-uherie");
			attr(li, "style", ctx.notificationMargin);
			attr(li, "class", "bn-notify-custom bn-notify-notification svelte-uherie");
			toggle_class(li, "bn-notify-dark-mode", ctx.$app.darkMode);
			toggle_class(li, "bn-notify-clickable", ctx.notification.onclick);

			dispose = [
				listen(div, "click", click_handler),
				listen(li, "click", ctx.notification.onclick)
			];

			this.first = li;
		},

		m(target, anchor) {
			insert(target, li, anchor);
			mount_component(typeicon, li, null);
			append(li, t0);
			mount_component(notificationcontent, li, null);
			append(li, t1);
			append(li, div);
			mount_component(closeicon, div, null);
			append(li, t2);
			mount_component(autodismiss, li, null);
			append(li, t3);
			current = true;
		},

		p(changed, new_ctx) {
			ctx = new_ctx;
			var typeicon_changes = {};
			if (changed.$notifications) typeicon_changes.type = ctx.notification.type;
			typeicon.$set(typeicon_changes);

			var notificationcontent_changes = {};
			if (changed.$notifications) notificationcontent_changes.notification = ctx.notification;
			if (changed.currentTime) notificationcontent_changes.currentTime = ctx.currentTime;
			notificationcontent.$set(notificationcontent_changes);

			var autodismiss_changes = {};
			if (changed.$notifications) autodismiss_changes.notification = ctx.notification;
			autodismiss.$set(autodismiss_changes);

			if (!current || changed.notificationMargin) {
				attr(li, "style", ctx.notificationMargin);
			}

			if (changed.$app) {
				toggle_class(li, "bn-notify-dark-mode", ctx.$app.darkMode);
			}

			if (changed.$notifications) {
				toggle_class(li, "bn-notify-clickable", ctx.notification.onclick);
			}
		},

		r() {
			rect = li.getBoundingClientRect();
		},

		f() {
			fix_position(li);
			stop_animation();
			add_transform(li, rect);
		},

		a() {
			stop_animation();
			stop_animation = create_animation(li, rect, flip, { duration: 500 });
		},

		i(local) {
			if (current) return;
			transition_in(typeicon.$$.fragment, local);

			transition_in(notificationcontent.$$.fragment, local);

			transition_in(closeicon.$$.fragment, local);

			transition_in(autodismiss.$$.fragment, local);

			add_render_callback(() => {
				if (li_outro) li_outro.end(1);
				if (!li_intro) li_intro = create_in_transition(li, fly, { duration: 1200, delay: 300, x: ctx.x, y: ctx.y, easing: elasticOut });
				li_intro.start();
			});

			current = true;
		},

		o(local) {
			transition_out(typeicon.$$.fragment, local);
			transition_out(notificationcontent.$$.fragment, local);
			transition_out(closeicon.$$.fragment, local);
			transition_out(autodismiss.$$.fragment, local);
			if (li_intro) li_intro.invalidate();

			li_outro = create_out_transition(li, fly, { duration: 400, x: ctx.x, y: ctx.y, easing: quintIn });

			current = false;
		},

		d(detaching) {
			if (detaching) {
				detach(li);
			}

			destroy_component(typeicon);

			destroy_component(notificationcontent);

			destroy_component(closeicon);

			destroy_component(autodismiss);

			if (detaching) {
				if (li_outro) li_outro.end();
			}

			run_all(dispose);
		}
	};
}

function create_fragment$8(ctx) {
	var if_block_anchor, current;

	var if_block = (ctx.$notifications.length > 0) && create_if_block$2(ctx);

	return {
		c() {
			if (if_block) if_block.c();
			if_block_anchor = empty();
		},

		m(target, anchor) {
			if (if_block) if_block.m(target, anchor);
			insert(target, if_block_anchor, anchor);
			current = true;
		},

		p(changed, ctx) {
			if (ctx.$notifications.length > 0) {
				if (if_block) {
					if_block.p(changed, ctx);
					transition_in(if_block, 1);
				} else {
					if_block = create_if_block$2(ctx);
					if_block.c();
					transition_in(if_block, 1);
					if_block.m(if_block_anchor.parentNode, if_block_anchor);
				}
			} else if (if_block) {
				group_outros();
				transition_out(if_block, 1, 1, () => {
					if_block = null;
				});
				check_outros();
			}
		},

		i(local) {
			if (current) return;
			transition_in(if_block);
			current = true;
		},

		o(local) {
			transition_out(if_block);
			current = false;
		},

		d(detaching) {
			if (if_block) if_block.d(detaching);

			if (detaching) {
				detach(if_block_anchor);
			}
		}
	};
}

function elasticOut(t) {
  return (Math.sin((-13.0 * (t + 1.0) * Math.PI) / 2) * Math.pow(2.0, -35.0 * t) +
      1.0);
}

function instance$7($$self, $$props, $$invalidate) {
	let $notifications, $app;

	component_subscribe($$self, notifications, $$value => { $notifications = $$value; $$invalidate('$notifications', $notifications); });
	component_subscribe($$self, app, $$value => { $app = $$value; $$invalidate('$app', $app); });

	
let smallScreen = window.innerWidth < 420;
let positioning;
let x;
let y;
let notificationMargin;
let justifyContent;
let appState = {
    version: "",
    dappId: "",
    networkId: 1,
    nodeSynced: true,
    mobilePosition: "top",
    desktopPosition: "bottomRight",
    darkMode: false,
    txApproveReminderTimeout: 20000,
    txStallPendingTimeout: 20000,
    txStallConfirmedTimeout: 90000
};
const unsubscribe = app.subscribe((store) => ($$invalidate('appState', appState = store)));
// listen for screen resize events
window.addEventListener("resize", debounce(() => {
    if (window.innerWidth < 420) {
        if (!smallScreen) {
            $$invalidate('smallScreen', smallScreen = true);
        }
    }
    else {
        if (smallScreen) {
            $$invalidate('smallScreen', smallScreen = false);
        }
    }
}, 300));
let currentTime = Date.now();
const intervalId = setInterval(() => {
    $$invalidate('currentTime', currentTime = Date.now());
}, 1000);
onDestroy(() => {
    clearInterval(intervalId);
    unsubscribe();
});
const formattedTime = formatTime(currentTime);

	const click_handler = ({ notification }) => notifications.remove(notification.id);

	$$self.$$.update = ($$dirty = { appState: 1, smallScreen: 1, positioning: 1 }) => {
		if ($$dirty.appState || $$dirty.smallScreen || $$dirty.positioning) { if (appState.desktopPosition && !smallScreen) {
        $$invalidate('positioning', positioning =
            appState.desktopPosition === "bottomRight"
                ? "bottom: 0; right: 0;"
                : appState.desktopPosition === "bottomLeft"
                    ? "left: 0; right: unset;"
                    : appState.desktopPosition === "topRight"
                        ? "top: 0;"
                        : "top: 0; bottom: unset; left: 0; right: unset;");
        $$invalidate('x', x = positioning && positioning.includes("left") ? -321 : 321);
        $$invalidate('y', y = 0);
        if (appState.desktopPosition.includes("top")) {
            $$invalidate('justifyContent', justifyContent = "justify-content: unset;");
            $$invalidate('notificationMargin', notificationMargin = "margin: 0.75rem 0 0 0;");
        }
        else {
            $$invalidate('justifyContent', justifyContent = "justify-content: flex-end;");
            $$invalidate('notificationMargin', notificationMargin = "margin: 0 0 0.75rem 0;");
        }
    } }
		if ($$dirty.appState || $$dirty.smallScreen) { if (appState.mobilePosition && smallScreen) {
        $$invalidate('positioning', positioning =
            appState.mobilePosition === "top"
                ? "top: 0; bottom: unset;"
                : "bottom: 0; top: unset;");
        $$invalidate('x', x = 0);
        if (appState.mobilePosition === "top") {
            $$invalidate('y', y = -50);
            $$invalidate('justifyContent', justifyContent = "justify-content: unset;");
            $$invalidate('notificationMargin', notificationMargin = "margin: 0.75rem 0 0 0;");
        }
        else {
            $$invalidate('y', y = 50);
            $$invalidate('justifyContent', justifyContent = "justify-content: flex-end;");
            $$invalidate('notificationMargin', notificationMargin = "margin: 0 0 0.75rem 0;");
        }
    } }
		if ($$dirty.appState || $$dirty.smallScreen) { if (!appState.desktopPosition && !appState.mobilePosition) {
        $$invalidate('x', x = smallScreen ? 0 : 321);
        $$invalidate('y', y = smallScreen ? 50 : 0);
        $$invalidate('notificationMargin', notificationMargin = "margin: 0 0 0.75rem 0;");
        $$invalidate('justifyContent', justifyContent = "justify-content: flex-end;");
        $$invalidate('positioning', positioning = "bottom: 0; right: 0;");
    } }
	};

	return {
		positioning,
		x,
		y,
		notificationMargin,
		justifyContent,
		currentTime,
		formattedTime,
		$notifications,
		$app,
		click_handler
	};
}

class Notify extends SvelteComponent {
	constructor(options) {
		super();
		if (!document.getElementById("svelte-uherie-style")) add_css$5();
		init(this, options, instance$7, create_fragment$8, safe_not_equal, []);
	}
}

function eventToType(eventCode) {
    switch (eventCode) {
        case "txSent":
        case "txPool":
        case "txSpeedUp":
        case "txCancel":
            return "pending";
        case "txRequest":
        case "txRepeat":
        case "txAwaitingApproval":
        case "txConfirmReminder":
        case "txStallPending":
        case "txStallConfirmed":
            return "hint";
        case "txError":
        case "txSendFail":
        case "txFailed":
        case "txDropped":
        case "nsfFail":
        case "txUnderpriced":
            return "error";
        case "txConfirmed":
            return "success";
        default:
            return "hint";
    }
}
function typeToDismissTimeout(type) {
    switch (type) {
        case "success":
        case "hint":
            return 4000;
        default:
            return 0;
    }
}

// subscribe to the formatter store
let formatter;
format.subscribe((store) => (formatter = store));
function createNotification(details, customization = {}) {
    const { id, hash, startTime, eventCode, direction, counterparty, value, asset } = details;
    const type = eventToType(eventCode);
    const key = `${id}-${(typeof customization === "object" &&
        customization.eventCode) ||
        eventCode}`;
    const counterpartyShortened = counterparty &&
        counterparty.substring(0, 4) +
            "..." +
            counterparty.substring(counterparty.length - 4);
    const formatterOptions = counterparty && value
        ? [
            `watched.${eventCode}`,
            {
                verb: eventCode === "txConfirmed"
                    ? direction === "incoming"
                        ? "received"
                        : "sent"
                    : direction === "incoming"
                        ? "receiving"
                        : "sending",
                formattedValue: new BigNumber(value)
                    .div(new BigNumber("1000000000000000000"))
                    .toString(10),
                preposition: direction === "incoming" ? "from" : "to",
                counterpartyShortened,
                asset
            }
        ]
        : [`transaction.${eventCode}`];
    let notificationObject = {
        id: id || hash,
        type,
        key,
        startTime,
        eventCode,
        message: formatter(...formatterOptions),
        autoDismiss: typeToDismissTimeout((typeof customization === "object" && customization.type) || type)
    };
    if (typeof customization === "object") {
        notificationObject = { ...notificationObject, ...customization };
    }
    notifications.add(notificationObject);
}

function validateType({ name, value, type, optional, customValidation }) {
    if (!optional && typeof value === "undefined") {
        throw new Error(`"${name}" is required`);
    }
    if (typeof value !== "undefined" &&
        (type === "array" ? Array.isArray(type) : typeof value !== type)) {
        throw new Error(`"${name}" must be of type: ${type}, received type: ${typeof value} from value: ${value}`);
    }
    if (typeof value !== "undefined" &&
        customValidation &&
        !customValidation(value)) {
        throw new Error(`"${value}" is not a valid "${name}"`);
    }
}
function validateInit(init) {
    validateType({ name: "init", value: init, type: "object" });
    const { dappId, networkId, transactionHandler } = init;
    validateType({ name: "dappId", value: dappId, type: "string" });
    validateType({ name: "networkId", value: networkId, type: "number" });
    validateType({
        name: "transactionHandler",
        value: transactionHandler,
        type: "function",
        optional: true
    });
}
function stringOrNumber(val) {
    return typeof val === "string" || typeof val === "number";
}
function validateTransactionOptions(options) {
    validateType({ name: "transaction options", value: options, type: "object" });
    const { sendTransaction, estimateGas, gasPrice, balance, contractCall, txDetails } = options;
    validateType({
        name: "sendTransaction",
        value: sendTransaction,
        type: "function",
        optional: true
    });
    validateType({
        name: "estimateGas",
        value: estimateGas,
        type: "function",
        optional: true
    });
    validateType({
        name: "gasPrice",
        value: gasPrice,
        type: "function",
        optional: true
    });
    validateType({
        name: "balance",
        value: balance,
        type: "string",
        optional: true
    });
    validateType({
        name: "contractCall",
        value: contractCall,
        type: "object",
        optional: true
    });
    if (contractCall) {
        const { methodName, params } = contractCall;
        validateType({
            name: "methodName",
            value: methodName,
            type: "string",
            optional: true
        });
        validateType({
            name: "params",
            value: params,
            type: "array",
            optional: true
        });
    }
    validateType({
        name: "txDetails",
        value: txDetails,
        type: "object",
        optional: true
    });
    if (txDetails) {
        const { to, value, from } = txDetails;
        validateType({
            name: "to",
            value: to,
            type: "string",
            optional: true,
            customValidation: isAddress
        });
        if (typeof value !== "undefined" && !stringOrNumber(value)) {
            throw new Error(`"value" must be of type: string | number, received type: ${typeof value} from value: ${value}`);
        }
        validateType({
            name: "from",
            value: from,
            type: "string",
            optional: true,
            customValidation: isAddress
        });
    }
}
function validateNotificationObject(notification) {
    validateType({
        name: "notification",
        value: notification,
        type: "object"
    });
    if (typeof notification !== "object")
        return;
    const { eventCode, type, message, autoDismiss, onclick } = notification;
    validateType({
        name: "eventCode",
        value: eventCode,
        type: "string",
        optional: true
    });
    validateType({
        name: "type",
        value: type,
        type: "string",
        optional: true,
        customValidation: validNotificationType
    });
    validateType({
        name: "message",
        value: message,
        type: "string"
    });
    validateType({
        name: "autoDismiss",
        value: autoDismiss,
        type: "number",
        optional: true
    });
    validateType({
        name: "onclick",
        value: onclick,
        type: "function",
        optional: true
    });
}
function validateConfig(config) {
    validateType({ name: "config", value: config, type: "object" });
    const { mobilePosition, desktopPosition, darkMode, txApproveReminderTimeout, txStallPendingTimeout, txStallConfirmedTimeout } = config;
    validateType({
        name: "mobilePosition",
        value: mobilePosition,
        type: "string",
        optional: true,
        customValidation: validMobilePosition
    });
    validateType({
        name: "desktopPosition",
        value: desktopPosition,
        type: "string",
        optional: true,
        customValidation: validDesktopPosition
    });
    validateType({
        name: "darkMode",
        value: darkMode,
        type: "boolean",
        optional: true
    });
    validateType({
        name: "txApproveReminderTimeout",
        value: txApproveReminderTimeout,
        type: "number",
        optional: true
    });
    validateType({
        name: "txStallPendingTimeout",
        value: txStallPendingTimeout,
        type: "number",
        optional: true
    });
    validateType({
        name: "txStallConfirmedTimeout",
        value: txStallConfirmedTimeout,
        type: "number",
        optional: true
    });
}
function validNotificationType(type) {
    switch (type) {
        case "hint":
        case "pending":
        case "error":
        case "success":
            return true;
        default:
            return false;
    }
}
function validMobilePosition(position) {
    return position === "top" || position === "bottom";
}
function validDesktopPosition(position) {
    switch (position) {
        case "bottomLeft":
        case "bottomRight":
        case "topLeft":
        case "topRight":
            return true;
        default:
            return false;
    }
}
function isAddress(address) {
    return /^(0x)?[0-9a-fA-F]{40}$/.test(address);
}

let blocknative;
function getBlocknative(options) {
    if (!blocknative && options) {
        blocknative = blocknativeSdk(options);
    }
    return blocknative;
}

let transactionQueue;
transactions.subscribe((store) => (transactionQueue = store));
function handlePreFlightEvent(preflightEvent) {
    const { eventCode, contractCall, balance, txDetails, emitter, status } = preflightEvent;
    const blocknative = getBlocknative();
    blocknative.event({
        categoryCode: contractCall ? "activeContract" : "activeTransaction",
        eventCode,
        transaction: txDetails,
        wallet: { balance },
        contract: contractCall
    });
    const transaction = {
        ...txDetails,
        eventCode,
        status,
        contractCall
    };
    const emitterResult = emitter.emit(transaction);
    if (emitterResult) {
        validateNotificationObject(emitterResult);
    }
    handleTransactionEvent({
        transaction: transaction,
        emitterResult
    });
}
function handleTransactionEvent(event) {
    const { transaction, emitterResult } = event;
    transactions.updateQueue(transaction);
    // create notification if dev hasn't opted out
    if (emitterResult !== false) {
        const transactionObj = transactionQueue.find((tx) => tx.id === transaction.id);
        if (transactionObj) {
            createNotification(transactionObj, emitterResult);
        }
    }
}
function duplicateTransactionCandidate(transaction, contract) {
    let duplicate = transactionQueue.find((tx) => {
        if (contract && typeof tx.contractCall === "undefined")
            return false;
        const sameMethod = contract
            ? contract.methodName ===
                (tx.contractCall && tx.contractCall.methodName)
            : true;
        const sameParams = contract
            ? argsEqual(contract.params, tx.contractCall && tx.contractCall.params)
            : true;
        const sameVal = tx.value == transaction.value;
        const sameTo = contract
            ? sameMethod
            : tx.to &&
                tx.to.toLowerCase() === transaction.to &&
                transaction.to.toLowerCase();
        return sameMethod && sameParams && sameVal && sameTo;
    });
    if (duplicate &&
        (duplicate.status === "confirmed" || duplicate.status === "failed")) {
        duplicate = false;
    }
    return duplicate;
}
function preflightTransaction(options, emitter) {
    return new Promise((resolve, reject) => {
        // wrap in set timeout to put to the end of the event queue
        setTimeout(async () => {
            const { sendTransaction, estimateGas, gasPrice, balance, contractCall, txDetails } = options;
            const blocknative = getBlocknative();
            //=== if `balance` or `estimateGas` or `gasPrice` is not provided, then sufficient funds check is disabled === //
            //=== if `txDetails` is not provided, then duplicate transaction check is disabled === //
            //== if dev doesn't want notify to intiate the transaction and `sendTransaction` is not provided, then transaction rejected notification is disabled ==//
            //=== to disable hints for `txAwaitingApproval`, `txConfirmReminder` or any other notification, then return false from listener functions ==//
            const [gas, price] = await gasEstimates(estimateGas, gasPrice);
            const id = uuid();
            const value = new BigNumber(txDetails.value || 0);
            const txObject = {
                ...txDetails,
                value: value.toString(10),
                gas: gas && gas.toString(10),
                gasPrice: price && price.toString(10),
                id
            };
            // check sufficient balance if required parameters are available
            if (balance && gas && price) {
                const transactionCost = gas.times(price).plus(value);
                // if transaction cost is greater than the current balance
                if (transactionCost.gt(new BigNumber(balance))) {
                    const eventCode = "nsfFail";
                    handlePreFlightEvent({
                        eventCode,
                        contractCall,
                        balance,
                        txDetails: txObject,
                        emitter
                    });
                    return reject("User has insufficient funds");
                }
            }
            // check if it is a duplicate transaction
            if (txDetails &&
                duplicateTransactionCandidate({ to: txDetails.to, value: txDetails.value }, contractCall)) {
                const eventCode = "txRepeat";
                handlePreFlightEvent({
                    eventCode,
                    contractCall,
                    balance,
                    txDetails: txObject,
                    emitter
                });
            }
            const { txApproveReminderTimeout, txStallPendingTimeout, txStallConfirmedTimeout } = get_store_value(app);
            // check previous transactions awaiting approval
            if (transactionQueue.find(tx => tx.status === "awaitingApproval")) {
                const eventCode = "txAwaitingApproval";
                handlePreFlightEvent({
                    eventCode,
                    contractCall,
                    balance,
                    txDetails: txObject,
                    emitter
                });
            }
            // confirm reminder after timeout
            setTimeout(() => {
                const awaitingApproval = transactionQueue.find(tx => tx.id === id && tx.status === "awaitingApproval");
                if (awaitingApproval) {
                    const eventCode = "txConfirmReminder";
                    handlePreFlightEvent({
                        eventCode,
                        contractCall,
                        balance,
                        txDetails: txObject,
                        emitter
                    });
                }
            }, txApproveReminderTimeout);
            handlePreFlightEvent({
                eventCode: "txRequest",
                status: "awaitingApproval",
                contractCall,
                balance,
                txDetails: txObject,
                emitter
            });
            resolve(id);
            // if not provided with sendTransaction function, resolve with id so dev can initiate transaction
            // dev will need to call notify.hash(txHash, id) with this id to link up the preflight with the postflight notifications
            if (!sendTransaction) {
                return;
            }
            // initiate transaction
            const sendTransactionResult = sendTransaction();
            // get result and handle errors
            const hash = await sendTransactionResult.catch(error => {
                const { eventCode, errorMsg } = extractMessageFromError(error);
                handlePreFlightEvent({
                    eventCode,
                    status: "failed",
                    contractCall,
                    balance,
                    txDetails: txObject,
                    emitter
                });
                return reject(errorMsg);
            });
            if (hash && typeof hash === "string") {
                const serverEmitter = blocknative.transaction(blocknative.clientIndex, hash, id).emitter;
                serverEmitter.on("all", (transaction) => {
                    const result = emitter.emit(transaction);
                    return result;
                });
                // Check for pending stall status
                setTimeout(() => {
                    const transaction = transactionQueue.find((tx) => tx.id === id);
                    if (transaction &&
                        transaction.status === "sent" &&
                        blocknative.status.connected &&
                        blocknative.status.nodeSynced) {
                        const eventCode = "txStallPending";
                        handlePreFlightEvent({
                            eventCode,
                            contractCall,
                            balance,
                            txDetails: txObject,
                            emitter
                        });
                    }
                }, txStallPendingTimeout);
                // Check for confirmed stall status
                setTimeout(() => {
                    const transaction = transactionQueue.find(tx => tx.id === id);
                    if (transaction &&
                        transaction.status === "pending" &&
                        blocknative.status.connected &&
                        blocknative.status.nodeSynced) {
                        const eventCode = "txStallConfirmed";
                        handlePreFlightEvent({
                            eventCode,
                            contractCall,
                            balance,
                            txDetails: txObject,
                            emitter
                        });
                    }
                }, txStallConfirmedTimeout);
            }
            else {
                throw new Error("sendTransaction function must resolve to a transaction hash that is of type String.");
            }
        }, 10);
    });
}
function gasEstimates(gasFunc, gasPriceFunc) {
    if (!gasFunc || !gasPriceFunc) {
        return Promise.resolve([]);
    }
    const gasProm = gasFunc();
    if (!gasProm.then) {
        throw new Error("The `estimateGas` function must return a Promise");
    }
    const gasPriceProm = gasPriceFunc();
    if (!gasPriceProm.then) {
        throw new Error("The `gasPrice` function must return a Promise");
    }
    return Promise.all([gasProm, gasPriceProm])
        .then(([gasResult, gasPriceResult]) => {
        if (typeof gasResult !== "string") {
            throw new Error(`The Promise returned from calling 'estimateGas' must resolve with a value of type 'string'. Received a value of: ${gasResult} with a type: ${typeof gasResult}`);
        }
        if (typeof gasPriceResult !== "string") {
            throw new Error(`The Promise returned from calling 'gasPrice' must resolve with a value of type 'string'. Received a value of: ${gasPriceResult} with a type: ${typeof gasPriceResult}`);
        }
        return [new BigNumber(gasResult), new BigNumber(gasPriceResult)];
    })
        .catch(error => {
        throw new Error(`There was an error getting gas estimates: ${error}`);
    });
}

const version = "0.0.1";
function init$1(options) {
    validateInit(options);
    const { dappId, networkId, transactionHandler } = options;
    const transactionHandlers = [handleTransactionEvent];
    if (transactionHandler) {
        transactionHandlers.push(transactionHandler);
    }
    const blocknative = getBlocknative({ dappId, networkId, transactionHandlers });
    // save config to app store
    app.update((store) => ({ ...store, ...options, version }));
    // initialize App
    new Notify({
        target: document.body
    });
    // set the dictionary for i18n
    dictionary.set(notifyMessages);
    // set the locale for i18n
    const clientLocale = getClientLocale({
        fallback: "en",
        navigator: true
    });
    const availableLocale = notifyMessages[clientLocale] || notifyMessages[clientLocale.slice(0, 2)];
    locale.set(availableLocale ? clientLocale : "en");
    return {
        hash,
        transaction,
        account,
        notification,
        config
    };
    function account(address) {
        try {
            const result = blocknative.account(blocknative.clientIndex, address);
            return result;
        }
        catch (error) {
            throw new Error(error);
        }
    }
    function hash(hash, id) {
        try {
            const result = blocknative.transaction(blocknative.clientIndex, hash, id);
            return result;
        }
        catch (error) {
            throw new Error(error);
        }
    }
    function transaction(options) {
        validateTransactionOptions(options);
        const emitter = createEmitter();
        const result = preflightTransaction(options, emitter);
        return {
            emitter,
            result
        };
    }
    function notification(notificationObject) {
        validateNotificationObject(notificationObject);
        let key = 0;
        const id = uuid();
        const startTime = Date.now();
        const { eventCode = `customNotification${key++}` } = notificationObject;
        const dismiss = () => notifications.remove(id);
        function update(notificationUpdate) {
            validateNotificationObject(notificationUpdate);
            const { eventCode = `customNotification${key++}` } = notificationUpdate;
            createNotification({ id, startTime, eventCode }, notificationUpdate);
            return {
                dismiss,
                update
            };
        }
        createNotification({ id, startTime, eventCode }, notificationObject);
        return {
            dismiss,
            update
        };
    }
    function config(options) {
        validateConfig(options);
        app.update((store) => ({ ...store, ...options }));
    }
}

export default init$1;
//# sourceMappingURL=bnc-notify.es5.js.map
