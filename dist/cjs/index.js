'use strict';

function _interopDefault (ex) { return (ex && (typeof ex === 'object') && 'default' in ex) ? ex['default'] : ex; }

var bigInt = _interopDefault(require('big-integer'));
var uuid = _interopDefault(require('uuid/v4'));
var blocknativeSdk = _interopDefault(require('bn-sdk'));
var svelteI18n = require('svelte-i18n');
var store = require('svelte/store');
var internal = require('svelte/internal');
var svelte = require('svelte');
var transition = require('svelte/transition');
var easing = require('svelte/easing');
var animate = require('svelte/animate');
var debounce = _interopDefault(require('lodash.debounce'));
var ow = _interopDefault(require('ow'));

function asyncGeneratorStep(gen, resolve, reject, _next, _throw, key, arg) {
  try {
    var info = gen[key](arg);
    var value = info.value;
  } catch (error) {
    reject(error);
    return;
  }

  if (info.done) {
    resolve(value);
  } else {
    Promise.resolve(value).then(_next, _throw);
  }
}

function _asyncToGenerator(fn) {
  return function () {
    var self = this,
        args = arguments;
    return new Promise(function (resolve, reject) {
      var gen = fn.apply(self, args);

      function _next(value) {
        asyncGeneratorStep(gen, resolve, reject, _next, _throw, "next", value);
      }

      function _throw(err) {
        asyncGeneratorStep(gen, resolve, reject, _next, _throw, "throw", err);
      }

      _next(undefined);
    });
  };
}

function _defineProperty(obj, key, value) {
  if (key in obj) {
    Object.defineProperty(obj, key, {
      value: value,
      enumerable: true,
      configurable: true,
      writable: true
    });
  } else {
    obj[key] = value;
  }

  return obj;
}

function ownKeys(object, enumerableOnly) {
  var keys = Object.keys(object);

  if (Object.getOwnPropertySymbols) {
    var symbols = Object.getOwnPropertySymbols(object);
    if (enumerableOnly) symbols = symbols.filter(function (sym) {
      return Object.getOwnPropertyDescriptor(object, sym).enumerable;
    });
    keys.push.apply(keys, symbols);
  }

  return keys;
}

function _objectSpread2(target) {
  for (var i = 1; i < arguments.length; i++) {
    var source = arguments[i] != null ? arguments[i] : {};

    if (i % 2) {
      ownKeys(source, true).forEach(function (key) {
        _defineProperty(target, key, source[key]);
      });
    } else if (Object.getOwnPropertyDescriptors) {
      Object.defineProperties(target, Object.getOwnPropertyDescriptors(source));
    } else {
      ownKeys(source).forEach(function (key) {
        Object.defineProperty(target, key, Object.getOwnPropertyDescriptor(source, key));
      });
    }
  }

  return target;
}

function _toConsumableArray(arr) {
  return _arrayWithoutHoles(arr) || _iterableToArray(arr) || _nonIterableSpread();
}

function _arrayWithoutHoles(arr) {
  if (Array.isArray(arr)) {
    for (var i = 0, arr2 = new Array(arr.length); i < arr.length; i++) arr2[i] = arr[i];

    return arr2;
  }
}

function _iterableToArray(iter) {
  if (Symbol.iterator in Object(iter) || Object.prototype.toString.call(iter) === "[object Arguments]") return Array.from(iter);
}

function _nonIterableSpread() {
  throw new TypeError("Invalid attempt to spread non-iterable instance");
}

var _transaction, _transaction2;

var notifyMessages = {
  en: {
    transaction: (_transaction = {
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
      txConfirmed: "Your transaction has succeeded"
    }, _defineProperty(_transaction, "txUnderpriced", "The gas limit is set too low to complete this transaction"), _defineProperty(_transaction, "txError", "Oops something went wrong, please try again"), _transaction),
    watched: {
      txPool: "Your account is {verb} {formattedValue} ether {preposition} {counterpartyShortened}",
      txSpeedUp: "Your account is {verb} {formattedValue} ether {preposition} {counterpartyShortened}",
      txCancel: "Your account is {verb} {formattedValue} ether {preposition} {counterpartyShortened}",
      txConfirmed: "Your account successfully {verb} {formattedValue} ether {preposition} {counterpartyShortened}"
    }
  },
  es: {
    transaction: (_transaction2 = {
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
      txConfirmed: "Su transacción ha tenido éxito."
    }, _defineProperty(_transaction2, "txUnderpriced", "El límite de gas está establecido demasiado bajo para completar esta transacción"), _defineProperty(_transaction2, "txError", "Vaya, algo salió mal, por favor intente nuevamente"), _transaction2),
    watched: {
      txPool: "su cuenta está {verb, select, receiving {recibiendo} sending {enviando}} {formattedValue} ether {preposition, select, from {desde} to {a}} {counterpartyShortened}",
      txSpeedUp: "su cuenta está {verb, select, receiving {recibiendo} sending {enviando}} {formattedValue} ether {preposition, select, from {desde} to {a}} {counterpartyShortened}",
      txCancel: "su cuenta está {verb, select, receiving {recibiendo} sending {enviando}} {formattedValue} ether {preposition, select, from {desde} to {a}} {counterpartyShortened}",
      txConfirmed: "su cuenta {verb, select, received {recibió} sent {ha enviado}} con éxito {formattedValue} ether {preposition, select, from {de} to {a}} {counterpartyShortened}"
    }
  }
};

/* src/components/TypeIcon.svelte generated by Svelte v3.12.1 */

function add_css() {
	var style = internal.element("style");
	style.id = 'svelte-16i17ha-style';
	style.textContent = "div.svelte-16i17ha{height:100%;width:1.5rem}";
	internal.append(document.head, style);
}

// (14:2) {#if type === 'hint'}
function create_if_block_3(ctx) {
	var svg, style, t, g_2, g, circle, g_1, path, circle_1;

	return {
		c() {
			svg = internal.svg_element("svg");
			style = internal.svg_element("style");
			t = internal.text("@-webkit-keyframes kf_el_51c2MS41pY_an_cXFUsKhg3V {\n          50% {\n            stroke-dasharray: 553;\n          }\n          0% {\n            stroke-dasharray: 553;\n          }\n          100% {\n            stroke-dasharray: 553;\n          }\n        }\n        @keyframes kf_el_51c2MS41pY_an_cXFUsKhg3V {\n          50% {\n            stroke-dasharray: 553;\n          }\n          0% {\n            stroke-dasharray: 553;\n          }\n          100% {\n            stroke-dasharray: 553;\n          }\n        }\n        @-webkit-keyframes kf_el_51c2MS41pY_an_M-ML-YLcm {\n          50% {\n            stroke-dashoffset: 553;\n          }\n          100% {\n            stroke-dashoffset: 0;\n          }\n          0% {\n            stroke-dashoffset: 553;\n          }\n        }\n        @keyframes kf_el_51c2MS41pY_an_M-ML-YLcm {\n          50% {\n            stroke-dashoffset: 553;\n          }\n          100% {\n            stroke-dashoffset: 0;\n          }\n          0% {\n            stroke-dashoffset: 553;\n          }\n        }\n        @-webkit-keyframes kf_el_j5HR_U6Nrp_an_KGzPpGvQb {\n          50% {\n            opacity: 0;\n          }\n          56.67% {\n            opacity: 1;\n          }\n          0% {\n            opacity: 0;\n          }\n          100% {\n            opacity: 1;\n          }\n        }\n        @keyframes kf_el_j5HR_U6Nrp_an_KGzPpGvQb {\n          50% {\n            opacity: 0;\n          }\n          56.67% {\n            opacity: 1;\n          }\n          0% {\n            opacity: 0;\n          }\n          100% {\n            opacity: 1;\n          }\n        }\n        @-webkit-keyframes kf_el_j5HR_U6Nrp_an_al_MjoEv-F {\n          50% {\n            stroke-dasharray: 39.41;\n          }\n          0% {\n            stroke-dasharray: 39.41;\n          }\n          100% {\n            stroke-dasharray: 39.41;\n          }\n        }\n        @keyframes kf_el_j5HR_U6Nrp_an_al_MjoEv-F {\n          50% {\n            stroke-dasharray: 39.41;\n          }\n          0% {\n            stroke-dasharray: 39.41;\n          }\n          100% {\n            stroke-dasharray: 39.41;\n          }\n        }\n        @-webkit-keyframes kf_el_j5HR_U6Nrp_an_VsVMmQ1MU {\n          50% {\n            stroke-dashoffset: 39.41;\n          }\n          100% {\n            stroke-dashoffset: 0;\n          }\n          0% {\n            stroke-dashoffset: 39.41;\n          }\n        }\n        @keyframes kf_el_j5HR_U6Nrp_an_VsVMmQ1MU {\n          50% {\n            stroke-dashoffset: 39.41;\n          }\n          100% {\n            stroke-dashoffset: 0;\n          }\n          0% {\n            stroke-dashoffset: 39.41;\n          }\n        }\n        @-webkit-keyframes kf_el_TZApOLwXZU_an_dL6-SZLSH {\n          50% {\n            -webkit-transform: translate(88.50000762939453px, 56.5px)\n              scale(0, 0) translate(-88.50000762939453px, -56.5px);\n            transform: translate(88.50000762939453px, 56.5px) scale(0, 0)\n              translate(-88.50000762939453px, -56.5px);\n          }\n          83.33% {\n            -webkit-transform: translate(88.50000762939453px, 56.5px)\n              scale(0, 0) translate(-88.50000762939453px, -56.5px);\n            transform: translate(88.50000762939453px, 56.5px) scale(0, 0)\n              translate(-88.50000762939453px, -56.5px);\n          }\n          100% {\n            -webkit-transform: translate(88.50000762939453px, 56.5px)\n              scale(1, 1) translate(-88.50000762939453px, -56.5px);\n            transform: translate(88.50000762939453px, 56.5px) scale(1, 1)\n              translate(-88.50000762939453px, -56.5px);\n          }\n          0% {\n            -webkit-transform: translate(88.50000762939453px, 56.5px)\n              scale(0, 0) translate(-88.50000762939453px, -56.5px);\n            transform: translate(88.50000762939453px, 56.5px) scale(0, 0)\n              translate(-88.50000762939453px, -56.5px);\n          }\n        }\n        @keyframes kf_el_TZApOLwXZU_an_dL6-SZLSH {\n          50% {\n            -webkit-transform: translate(88.50000762939453px, 56.5px)\n              scale(0, 0) translate(-88.50000762939453px, -56.5px);\n            transform: translate(88.50000762939453px, 56.5px) scale(0, 0)\n              translate(-88.50000762939453px, -56.5px);\n          }\n          83.33% {\n            -webkit-transform: translate(88.50000762939453px, 56.5px)\n              scale(0, 0) translate(-88.50000762939453px, -56.5px);\n            transform: translate(88.50000762939453px, 56.5px) scale(0, 0)\n              translate(-88.50000762939453px, -56.5px);\n          }\n          100% {\n            -webkit-transform: translate(88.50000762939453px, 56.5px)\n              scale(1, 1) translate(-88.50000762939453px, -56.5px);\n            transform: translate(88.50000762939453px, 56.5px) scale(1, 1)\n              translate(-88.50000762939453px, -56.5px);\n          }\n          0% {\n            -webkit-transform: translate(88.50000762939453px, 56.5px)\n              scale(0, 0) translate(-88.50000762939453px, -56.5px);\n            transform: translate(88.50000762939453px, 56.5px) scale(0, 0)\n              translate(-88.50000762939453px, -56.5px);\n          }\n        }\n        #el_DHAskxC2T * {\n          -webkit-animation-duration: 1s;\n          animation-duration: 1s;\n          -webkit-animation-iteration-count: 1;\n          animation-iteration-count: 1;\n          -webkit-animation-timing-function: cubic-bezier(0, 0, 1, 1);\n          animation-timing-function: cubic-bezier(0, 0, 1, 1);\n        }\n        #el__hILOKhuR3 {\n          fill: none;\n          -webkit-transform: translate(7px, 7px);\n          transform: translate(7px, 7px);\n        }\n        #el_TZApOLwXZU {\n          fill: #979797;\n          -webkit-transform: matrix(1, 0, 0, -1, 0, 113);\n          transform: matrix(1, 0, 0, -1, 0, 113);\n        }\n        #el_fIxIrV8WbF {\n          stroke: #979797;\n          stroke-width: 14;\n        }\n        #el_TZApOLwXZU_an_dL6-SZLSH {\n          -webkit-animation-fill-mode: forwards;\n          animation-fill-mode: forwards;\n          -webkit-animation-name: kf_el_TZApOLwXZU_an_dL6-SZLSH;\n          animation-name: kf_el_TZApOLwXZU_an_dL6-SZLSH;\n          -webkit-animation-timing-function: cubic-bezier(0, 0, 1, 1);\n          animation-timing-function: cubic-bezier(0, 0, 1, 1);\n        }\n        #el_j5HR_U6Nrp {\n          -webkit-animation-fill-mode: forwards, forwards, forwards;\n          animation-fill-mode: forwards, forwards, forwards;\n          -webkit-animation-name: kf_el_j5HR_U6Nrp_an_VsVMmQ1MU,\n            kf_el_j5HR_U6Nrp_an_al_MjoEv-F, kf_el_j5HR_U6Nrp_an_KGzPpGvQb;\n          animation-name: kf_el_j5HR_U6Nrp_an_VsVMmQ1MU,\n            kf_el_j5HR_U6Nrp_an_al_MjoEv-F, kf_el_j5HR_U6Nrp_an_KGzPpGvQb;\n          -webkit-animation-timing-function: cubic-bezier(0, 0, 1, 1),\n            cubic-bezier(0, 0, 1, 1), cubic-bezier(0, 0, 1, 1);\n          animation-timing-function: cubic-bezier(0, 0, 1, 1),\n            cubic-bezier(0, 0, 1, 1), cubic-bezier(0, 0, 1, 1);\n        }\n        #el_51c2MS41pY {\n          -webkit-animation-fill-mode: forwards, forwards;\n          animation-fill-mode: forwards, forwards;\n          -webkit-animation-name: kf_el_51c2MS41pY_an_M-ML-YLcm,\n            kf_el_51c2MS41pY_an_cXFUsKhg3V;\n          animation-name: kf_el_51c2MS41pY_an_M-ML-YLcm,\n            kf_el_51c2MS41pY_an_cXFUsKhg3V;\n          -webkit-animation-timing-function: cubic-bezier(0, 0, 1, 1),\n            cubic-bezier(0, 0, 1, 1);\n          animation-timing-function: cubic-bezier(0, 0, 1, 1),\n            cubic-bezier(0, 0, 1, 1);\n        }\n      ");
			g_2 = internal.svg_element("g");
			g = internal.svg_element("g");
			circle = internal.svg_element("circle");
			g_1 = internal.svg_element("g");
			path = internal.svg_element("path");
			circle_1 = internal.svg_element("circle");
			internal.attr(circle, "cx", "88.5");
			internal.attr(circle, "cy", "56.5");
			internal.attr(circle, "r", "7.5");
			internal.attr(circle, "id", "el_TZApOLwXZU");
			internal.attr(g, "id", "el_TZApOLwXZU_an_dL6-SZLSH");
			internal.attr(g, "data-animator-group", "true");
			internal.attr(g, "data-animator-type", "2");
			internal.attr(path, "d", "m88.5 128v-39.4130859");
			internal.attr(path, "stroke-linecap", "round");
			internal.attr(path, "stroke-linejoin", "round");
			internal.attr(path, "id", "el_j5HR_U6Nrp");
			internal.attr(circle_1, "cx", "88");
			internal.attr(circle_1, "cy", "88");
			internal.attr(circle_1, "r", "88");
			internal.attr(circle_1, "id", "el_51c2MS41pY");
			internal.attr(g_1, "id", "el_fIxIrV8WbF");
			internal.attr(g_2, "fill-rule", "evenodd");
			internal.attr(g_2, "id", "el__hILOKhuR3");
			internal.attr(svg, "viewBox", "0 0 190 190");
			internal.attr(svg, "xmlns", "http://www.w3.org/2000/svg");
			internal.attr(svg, "id", "el_DHAskxC2T");
		},

		m(target, anchor) {
			internal.insert(target, svg, anchor);
			internal.append(svg, style);
			internal.append(style, t);
			internal.append(svg, g_2);
			internal.append(g_2, g);
			internal.append(g, circle);
			internal.append(g_2, g_1);
			internal.append(g_1, path);
			internal.append(g_1, circle_1);
		},

		d(detaching) {
			if (detaching) {
				internal.detach(svg);
			}
		}
	};
}

// (262:2) {#if type === 'pending'}
function create_if_block_2(ctx) {
	var svg, style, t, g_3, circle, g_2, g, path, g_1, path_1;

	return {
		c() {
			svg = internal.svg_element("svg");
			style = internal.svg_element("style");
			t = internal.text("@-webkit-keyframes kf_el_fv0z90vBrL_an_PwUBZ96LS {\n          0% {\n            -webkit-transform: translate(88px, 87.587890625px) rotate(0deg)\n              translate(-88px, -87.587890625px);\n            transform: translate(88px, 87.587890625px) rotate(0deg)\n              translate(-88px, -87.587890625px);\n          }\n          100% {\n            -webkit-transform: translate(88px, 87.587890625px) rotate(360deg)\n              translate(-88px, -87.587890625px);\n            transform: translate(88px, 87.587890625px) rotate(360deg)\n              translate(-88px, -87.587890625px);\n          }\n        }\n        @keyframes kf_el_fv0z90vBrL_an_PwUBZ96LS {\n          0% {\n            -webkit-transform: translate(88px, 87.587890625px) rotate(0deg)\n              translate(-88px, -87.587890625px);\n            transform: translate(88px, 87.587890625px) rotate(0deg)\n              translate(-88px, -87.587890625px);\n          }\n          100% {\n            -webkit-transform: translate(88px, 87.587890625px) rotate(360deg)\n              translate(-88px, -87.587890625px);\n            transform: translate(88px, 87.587890625px) rotate(360deg)\n              translate(-88px, -87.587890625px);\n          }\n        }\n        @-webkit-keyframes kf_el_u3QHGLTow3_an_EQ8OetHGq {\n          0% {\n            -webkit-transform: translate(88px, 87.587890625px) rotate(0deg)\n              translate(-88px, -87.587890625px);\n            transform: translate(88px, 87.587890625px) rotate(0deg)\n              translate(-88px, -87.587890625px);\n          }\n          50% {\n            -webkit-transform: translate(88px, 87.587890625px) rotate(360deg)\n              translate(-88px, -87.587890625px);\n            transform: translate(88px, 87.587890625px) rotate(360deg)\n              translate(-88px, -87.587890625px);\n          }\n          100% {\n            -webkit-transform: translate(88px, 87.587890625px) rotate(720deg)\n              translate(-88px, -87.587890625px);\n            transform: translate(88px, 87.587890625px) rotate(720deg)\n              translate(-88px, -87.587890625px);\n          }\n        }\n        @keyframes kf_el_u3QHGLTow3_an_EQ8OetHGq {\n          0% {\n            -webkit-transform: translate(88px, 87.587890625px) rotate(0deg)\n              translate(-88px, -87.587890625px);\n            transform: translate(88px, 87.587890625px) rotate(0deg)\n              translate(-88px, -87.587890625px);\n          }\n          50% {\n            -webkit-transform: translate(88px, 87.587890625px) rotate(360deg)\n              translate(-88px, -87.587890625px);\n            transform: translate(88px, 87.587890625px) rotate(360deg)\n              translate(-88px, -87.587890625px);\n          }\n          100% {\n            -webkit-transform: translate(88px, 87.587890625px) rotate(720deg)\n              translate(-88px, -87.587890625px);\n            transform: translate(88px, 87.587890625px) rotate(720deg)\n              translate(-88px, -87.587890625px);\n          }\n        }\n        #el_XWLVvD_rP * {\n          -webkit-animation-duration: 2s;\n          animation-duration: 2s;\n          -webkit-animation-iteration-count: infinite;\n          animation-iteration-count: infinite;\n          -webkit-animation-timing-function: cubic-bezier(0, 0, 1, 1);\n          animation-timing-function: cubic-bezier(0, 0, 1, 1);\n        }\n        #el_Uh6HOhkAVi {\n          fill: none;\n          stroke-width: 14;\n          -webkit-transform: translate(7px, 7px);\n          transform: translate(7px, 7px);\n        }\n        #el_PHAWgO26lN {\n          stroke: #ffbd00;\n        }\n        #el_A4XF5QQwhp {\n          stroke: #ffbf00;\n        }\n        #el_u3QHGLTow3_an_EQ8OetHGq {\n          -webkit-animation-fill-mode: backwards;\n          animation-fill-mode: backwards;\n          -webkit-transform: translate(88px, 87.587890625px) rotate(0deg)\n            translate(-88px, -87.587890625px);\n          transform: translate(88px, 87.587890625px) rotate(0deg)\n            translate(-88px, -87.587890625px);\n          -webkit-animation-name: kf_el_u3QHGLTow3_an_EQ8OetHGq;\n          animation-name: kf_el_u3QHGLTow3_an_EQ8OetHGq;\n          -webkit-animation-timing-function: cubic-bezier(0, 0, 1, 1);\n          animation-timing-function: cubic-bezier(0, 0, 1, 1);\n        }\n        #el_fv0z90vBrL_an_PwUBZ96LS {\n          -webkit-animation-fill-mode: backwards;\n          animation-fill-mode: backwards;\n          -webkit-transform: translate(88px, 87.587890625px) rotate(0deg)\n            translate(-88px, -87.587890625px);\n          transform: translate(88px, 87.587890625px) rotate(0deg)\n            translate(-88px, -87.587890625px);\n          -webkit-animation-name: kf_el_fv0z90vBrL_an_PwUBZ96LS;\n          animation-name: kf_el_fv0z90vBrL_an_PwUBZ96LS;\n          -webkit-animation-timing-function: cubic-bezier(0, 0, 1, 1);\n          animation-timing-function: cubic-bezier(0, 0, 1, 1);\n        }\n      ");
			g_3 = internal.svg_element("g");
			circle = internal.svg_element("circle");
			g_2 = internal.svg_element("g");
			g = internal.svg_element("g");
			path = internal.svg_element("path");
			g_1 = internal.svg_element("g");
			path_1 = internal.svg_element("path");
			internal.attr(circle, "cx", "88");
			internal.attr(circle, "cy", "88");
			internal.attr(circle, "r", "88");
			internal.attr(circle, "id", "el_PHAWgO26lN");
			internal.attr(path, "d", "m88 25v62.5878906");
			internal.attr(path, "id", "el_fv0z90vBrL");
			internal.attr(g, "id", "el_fv0z90vBrL_an_PwUBZ96LS");
			internal.attr(g, "data-animator-group", "true");
			internal.attr(g, "data-animator-type", "1");
			internal.attr(path_1, "d", "m88 45.9160156v41.671875");
			internal.attr(path_1, "id", "el_u3QHGLTow3");
			internal.attr(g_1, "id", "el_u3QHGLTow3_an_EQ8OetHGq");
			internal.attr(g_1, "data-animator-group", "true");
			internal.attr(g_1, "data-animator-type", "1");
			internal.attr(g_2, "stroke-linecap", "round");
			internal.attr(g_2, "stroke-linejoin", "round");
			internal.attr(g_2, "id", "el_A4XF5QQwhp");
			internal.attr(g_3, "fill-rule", "evenodd");
			internal.attr(g_3, "id", "el_Uh6HOhkAVi");
			internal.attr(svg, "viewBox", "0 0 190 190");
			internal.attr(svg, "xmlns", "http://www.w3.org/2000/svg");
			internal.attr(svg, "id", "el_XWLVvD_rP");
		},

		m(target, anchor) {
			internal.insert(target, svg, anchor);
			internal.append(svg, style);
			internal.append(style, t);
			internal.append(svg, g_3);
			internal.append(g_3, circle);
			internal.append(g_3, g_2);
			internal.append(g_2, g);
			internal.append(g, path);
			internal.append(g_2, g_1);
			internal.append(g_1, path_1);
		},

		d(detaching) {
			if (detaching) {
				internal.detach(svg);
			}
		}
	};
}

// (401:2) {#if type === 'success'}
function create_if_block_1(ctx) {
	var svg, style, t, path;

	return {
		c() {
			svg = internal.svg_element("svg");
			style = internal.svg_element("style");
			t = internal.text("@-webkit-keyframes kf_el_RzYtw9rUyN_an_gX4OsFPwzz {\n          0% {\n            stroke-dasharray: 473.87;\n          }\n          100% {\n            stroke-dasharray: 473.87;\n          }\n        }\n        @keyframes kf_el_RzYtw9rUyN_an_gX4OsFPwzz {\n          0% {\n            stroke-dasharray: 473.87;\n          }\n          100% {\n            stroke-dasharray: 473.87;\n          }\n        }\n        @-webkit-keyframes kf_el_RzYtw9rUyN_an_WfcYZ9pjL {\n          0% {\n            stroke-dashoffset: 473.87;\n          }\n          50% {\n            stroke-dashoffset: 473.87;\n          }\n          100% {\n            stroke-dashoffset: 0;\n          }\n        }\n        @keyframes kf_el_RzYtw9rUyN_an_WfcYZ9pjL {\n          0% {\n            stroke-dashoffset: 473.87;\n          }\n          50% {\n            stroke-dashoffset: 473.87;\n          }\n          100% {\n            stroke-dashoffset: 0;\n          }\n        }\n        #el_3OA8Szq_A * {\n          -webkit-animation-duration: 1s;\n          animation-duration: 1s;\n          -webkit-animation-iteration-count: 1;\n          animation-iteration-count: 1;\n          -webkit-animation-timing-function: cubic-bezier(0, 0, 1, 1);\n          animation-timing-function: cubic-bezier(0, 0, 1, 1);\n        }\n        #el_RzYtw9rUyN {\n          fill: none;\n          stroke: #7ed321;\n          stroke-width: 17;\n          -webkit-animation-fill-mode: forwards, forwards;\n          animation-fill-mode: forwards, forwards;\n          -webkit-animation-name: kf_el_RzYtw9rUyN_an_WfcYZ9pjL,\n            kf_el_RzYtw9rUyN_an_gX4OsFPwzz;\n          animation-name: kf_el_RzYtw9rUyN_an_WfcYZ9pjL,\n            kf_el_RzYtw9rUyN_an_gX4OsFPwzz;\n          -webkit-animation-timing-function: cubic-bezier(0, 0, 1, 1),\n            cubic-bezier(0, 0, 1, 1);\n          animation-timing-function: cubic-bezier(0, 0, 1, 1),\n            cubic-bezier(0, 0, 1, 1);\n        }\n      ");
			path = internal.svg_element("path");
			internal.attr(path, "d", "m176.126953 63.8789062-94.4130858 95.4130858-72.87402345-72.8740232\n        27.93945315-27.9394532 44.9345703 44.9345704 94.4130858-94.413086");
			internal.attr(path, "stroke-linecap", "round");
			internal.attr(path, "stroke-linejoin", "round");
			internal.attr(path, "id", "el_RzYtw9rUyN");
			internal.attr(svg, "viewBox", "0 0 185 168");
			internal.attr(svg, "xmlns", "http://www.w3.org/2000/svg");
			internal.attr(svg, "id", "el_3OA8Szq_A");
		},

		m(target, anchor) {
			internal.insert(target, svg, anchor);
			internal.append(svg, style);
			internal.append(style, t);
			internal.append(svg, path);
		},

		d(detaching) {
			if (detaching) {
				internal.detach(svg);
			}
		}
	};
}

// (478:2) {#if type === 'error'}
function create_if_block(ctx) {
	var svg, style, t, g_1, path, g, circle, path_1;

	return {
		c() {
			svg = internal.svg_element("svg");
			style = internal.svg_element("style");
			t = internal.text("@-webkit-keyframes kf_el_IAuv9ut-2-_an_xlDuvYsRc {\n          50% {\n            opacity: 0;\n          }\n          66.67% {\n            opacity: 1;\n          }\n          0% {\n            opacity: 0;\n          }\n          100% {\n            opacity: 1;\n          }\n        }\n        @keyframes kf_el_IAuv9ut-2-_an_xlDuvYsRc {\n          50% {\n            opacity: 0;\n          }\n          66.67% {\n            opacity: 1;\n          }\n          0% {\n            opacity: 0;\n          }\n          100% {\n            opacity: 1;\n          }\n        }\n        @-webkit-keyframes kf_el_IAuv9ut-2-_an_29XE36SGo1 {\n          50% {\n            stroke-dasharray: 39.41;\n          }\n          0% {\n            stroke-dasharray: 39.41;\n          }\n          100% {\n            stroke-dasharray: 39.41;\n          }\n        }\n        @keyframes kf_el_IAuv9ut-2-_an_29XE36SGo1 {\n          50% {\n            stroke-dasharray: 39.41;\n          }\n          0% {\n            stroke-dasharray: 39.41;\n          }\n          100% {\n            stroke-dasharray: 39.41;\n          }\n        }\n        @-webkit-keyframes kf_el_IAuv9ut-2-_an_xo_EIWruT {\n          50% {\n            stroke-dashoffset: 39.41;\n          }\n          100% {\n            stroke-dashoffset: 0;\n          }\n          0% {\n            stroke-dashoffset: 39.41;\n          }\n        }\n        @keyframes kf_el_IAuv9ut-2-_an_xo_EIWruT {\n          50% {\n            stroke-dashoffset: 39.41;\n          }\n          100% {\n            stroke-dashoffset: 0;\n          }\n          0% {\n            stroke-dashoffset: 39.41;\n          }\n        }\n        @-webkit-keyframes kf_el_q_eIK0z3HI_an_045tZJOHl {\n          50% {\n            -webkit-transform: translate(88.50000762939453px, 144.5px)\n              scale(0, 0) translate(-88.50000762939453px, -144.5px);\n            transform: translate(88.50000762939453px, 144.5px) scale(0, 0)\n              translate(-88.50000762939453px, -144.5px);\n          }\n          83.33% {\n            -webkit-transform: translate(88.50000762939453px, 144.5px)\n              scale(0, 0) translate(-88.50000762939453px, -144.5px);\n            transform: translate(88.50000762939453px, 144.5px) scale(0, 0)\n              translate(-88.50000762939453px, -144.5px);\n          }\n          100% {\n            -webkit-transform: translate(88.50000762939453px, 144.5px)\n              scale(1, 1) translate(-88.50000762939453px, -144.5px);\n            transform: translate(88.50000762939453px, 144.5px) scale(1, 1)\n              translate(-88.50000762939453px, -144.5px);\n          }\n          0% {\n            -webkit-transform: translate(88.50000762939453px, 144.5px)\n              scale(0, 0) translate(-88.50000762939453px, -144.5px);\n            transform: translate(88.50000762939453px, 144.5px) scale(0, 0)\n              translate(-88.50000762939453px, -144.5px);\n          }\n        }\n        @keyframes kf_el_q_eIK0z3HI_an_045tZJOHl {\n          50% {\n            -webkit-transform: translate(88.50000762939453px, 144.5px)\n              scale(0, 0) translate(-88.50000762939453px, -144.5px);\n            transform: translate(88.50000762939453px, 144.5px) scale(0, 0)\n              translate(-88.50000762939453px, -144.5px);\n          }\n          83.33% {\n            -webkit-transform: translate(88.50000762939453px, 144.5px)\n              scale(0, 0) translate(-88.50000762939453px, -144.5px);\n            transform: translate(88.50000762939453px, 144.5px) scale(0, 0)\n              translate(-88.50000762939453px, -144.5px);\n          }\n          100% {\n            -webkit-transform: translate(88.50000762939453px, 144.5px)\n              scale(1, 1) translate(-88.50000762939453px, -144.5px);\n            transform: translate(88.50000762939453px, 144.5px) scale(1, 1)\n              translate(-88.50000762939453px, -144.5px);\n          }\n          0% {\n            -webkit-transform: translate(88.50000762939453px, 144.5px)\n              scale(0, 0) translate(-88.50000762939453px, -144.5px);\n            transform: translate(88.50000762939453px, 144.5px) scale(0, 0)\n              translate(-88.50000762939453px, -144.5px);\n          }\n        }\n        @-webkit-keyframes kf_el_5BNAI_PBsn_an_aToWhdlG8F {\n          50% {\n            stroke-dasharray: 527.67;\n          }\n          0% {\n            stroke-dasharray: 527.67;\n          }\n          100% {\n            stroke-dasharray: 527.67;\n          }\n        }\n        @keyframes kf_el_5BNAI_PBsn_an_aToWhdlG8F {\n          50% {\n            stroke-dasharray: 527.67;\n          }\n          0% {\n            stroke-dasharray: 527.67;\n          }\n          100% {\n            stroke-dasharray: 527.67;\n          }\n        }\n        @-webkit-keyframes kf_el_5BNAI_PBsn_an_tQV_CQebU {\n          50% {\n            stroke-dashoffset: 527.67;\n          }\n          100% {\n            stroke-dashoffset: 0;\n          }\n          0% {\n            stroke-dashoffset: 527.67;\n          }\n        }\n        @keyframes kf_el_5BNAI_PBsn_an_tQV_CQebU {\n          50% {\n            stroke-dashoffset: 527.67;\n          }\n          100% {\n            stroke-dashoffset: 0;\n          }\n          0% {\n            stroke-dashoffset: 527.67;\n          }\n        }\n        #el_bYTVKD04y * {\n          -webkit-animation-duration: 1s;\n          animation-duration: 1s;\n          -webkit-animation-iteration-count: 1;\n          animation-iteration-count: 1;\n          -webkit-animation-timing-function: cubic-bezier(0, 0, 1, 1);\n          animation-timing-function: cubic-bezier(0, 0, 1, 1);\n        }\n        #el_doMgf96Cxx {\n          fill: none;\n          -webkit-transform: translate(1px, -5px);\n          transform: translate(1px, -5px);\n        }\n        #el_5BNAI_PBsn {\n          stroke: #ff0039;\n          stroke-width: 14;\n          -webkit-animation-fill-mode: forwards, forwards;\n          animation-fill-mode: forwards, forwards;\n          -webkit-animation-name: kf_el_5BNAI_PBsn_an_tQV_CQebU,\n            kf_el_5BNAI_PBsn_an_aToWhdlG8F;\n          animation-name: kf_el_5BNAI_PBsn_an_tQV_CQebU,\n            kf_el_5BNAI_PBsn_an_aToWhdlG8F;\n          -webkit-animation-timing-function: cubic-bezier(0, 0, 1, 1),\n            cubic-bezier(0, 0, 1, 1);\n          animation-timing-function: cubic-bezier(0, 0, 1, 1),\n            cubic-bezier(0, 0, 1, 1);\n        }\n        #el_q_eIK0z3HI {\n          fill: #ff0042;\n        }\n        #el_IAuv9ut-2- {\n          stroke: #ff0042;\n          stroke-width: 14;\n          -webkit-animation-fill-mode: forwards, forwards, forwards;\n          animation-fill-mode: forwards, forwards, forwards;\n          -webkit-animation-name: kf_el_IAuv9ut-2-_an_xo_EIWruT,\n            kf_el_IAuv9ut-2-_an_29XE36SGo1, kf_el_IAuv9ut-2-_an_xlDuvYsRc;\n          animation-name: kf_el_IAuv9ut-2-_an_xo_EIWruT,\n            kf_el_IAuv9ut-2-_an_29XE36SGo1, kf_el_IAuv9ut-2-_an_xlDuvYsRc;\n          -webkit-animation-timing-function: cubic-bezier(0, 0, 1, 1),\n            cubic-bezier(0, 0, 1, 1), cubic-bezier(0, 0, 1, 1);\n          animation-timing-function: cubic-bezier(0, 0, 1, 1),\n            cubic-bezier(0, 0, 1, 1), cubic-bezier(0, 0, 1, 1);\n        }\n        #el_q_eIK0z3HI_an_045tZJOHl {\n          -webkit-animation-fill-mode: forwards;\n          animation-fill-mode: forwards;\n          -webkit-animation-name: kf_el_q_eIK0z3HI_an_045tZJOHl;\n          animation-name: kf_el_q_eIK0z3HI_an_045tZJOHl;\n          -webkit-animation-timing-function: cubic-bezier(0, 0, 1, 1);\n          animation-timing-function: cubic-bezier(0, 0, 1, 1);\n        }\n      ");
			g_1 = internal.svg_element("g");
			path = internal.svg_element("path");
			g = internal.svg_element("g");
			circle = internal.svg_element("circle");
			path_1 = internal.svg_element("path");
			internal.attr(path, "d", "m96.9442719 17.8885438 71.8196601 143.6393202c2.469893\n          4.939785.467649 10.946515-4.472136 13.416408-1.388554.694277-2.919685\n          1.055728-4.472136 1.055728h-143.6393201c-5.5228475\n          0-10.00000001-4.477153-10.00000001-10 0-1.552451.36145092-3.083582\n          1.05572809-4.472136l71.81966012-143.6393202c2.4698925-4.939785\n          8.4766229-6.9420284 13.4164079-4.4721359 1.935274.967637 3.5044989\n          2.5368619 4.4721359 4.4721359z");
			internal.attr(path, "stroke-linejoin", "round");
			internal.attr(path, "id", "el_5BNAI_PBsn");
			internal.attr(circle, "cx", "88.5");
			internal.attr(circle, "cy", "144.5");
			internal.attr(circle, "r", "7.5");
			internal.attr(circle, "id", "el_q_eIK0z3HI");
			internal.attr(g, "id", "el_q_eIK0z3HI_an_045tZJOHl");
			internal.attr(g, "data-animator-group", "true");
			internal.attr(g, "data-animator-type", "2");
			internal.attr(path_1, "d", "m88.5 112.413086v-39.413086");
			internal.attr(path_1, "stroke-linecap", "round");
			internal.attr(path_1, "stroke-linejoin", "round");
			internal.attr(path_1, "id", "el_IAuv9ut-2-");
			internal.attr(g_1, "fill-rule", "evenodd");
			internal.attr(g_1, "id", "el_doMgf96Cxx");
			internal.attr(svg, "viewBox", "0 0 178 178");
			internal.attr(svg, "xmlns", "http://www.w3.org/2000/svg");
			internal.attr(svg, "id", "el_bYTVKD04y");
		},

		m(target, anchor) {
			internal.insert(target, svg, anchor);
			internal.append(svg, style);
			internal.append(style, t);
			internal.append(svg, g_1);
			internal.append(g_1, path);
			internal.append(g_1, g);
			internal.append(g, circle);
			internal.append(g_1, path_1);
		},

		d(detaching) {
			if (detaching) {
				internal.detach(svg);
			}
		}
	};
}

function create_fragment(ctx) {
	var div, t0, t1, t2;

	var if_block0 = (ctx.type === 'hint') && create_if_block_3();

	var if_block1 = (ctx.type === 'pending') && create_if_block_2();

	var if_block2 = (ctx.type === 'success') && create_if_block_1();

	var if_block3 = (ctx.type === 'error') && create_if_block();

	return {
		c() {
			div = internal.element("div");
			if (if_block0) if_block0.c();
			t0 = internal.space();
			if (if_block1) if_block1.c();
			t1 = internal.space();
			if (if_block2) if_block2.c();
			t2 = internal.space();
			if (if_block3) if_block3.c();
			internal.attr(div, "class", "bn-notify-custom bn-notify-notification-status-icon svelte-16i17ha");
		},

		m(target, anchor) {
			internal.insert(target, div, anchor);
			if (if_block0) if_block0.m(div, null);
			internal.append(div, t0);
			if (if_block1) if_block1.m(div, null);
			internal.append(div, t1);
			if (if_block2) if_block2.m(div, null);
			internal.append(div, t2);
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
					if_block3 = create_if_block();
					if_block3.c();
					if_block3.m(div, null);
				}
			} else if (if_block3) {
				if_block3.d(1);
				if_block3 = null;
			}
		},

		i: internal.noop,
		o: internal.noop,

		d(detaching) {
			if (detaching) {
				internal.detach(div);
			}

			if (if_block0) if_block0.d();
			if (if_block1) if_block1.d();
			if (if_block2) if_block2.d();
			if (if_block3) if_block3.d();
		}
	};
}

function instance($$self, $$props, $$invalidate) {
	let { type } = $$props;

	$$self.$set = $$props => {
		if ('type' in $$props) $$invalidate('type', type = $$props.type);
	};

	return { type };
}

class TypeIcon extends internal.SvelteComponent {
	constructor(options) {
		super();
		if (!document.getElementById("svelte-16i17ha-style")) add_css();
		internal.init(this, options, instance, create_fragment, internal.safe_not_equal, ["type"]);
	}
}

function argsEqual(args1, args2) {
  return JSON.stringify(args1) === JSON.stringify(args2);
}
function timeString(time) {
  var seconds = Math.floor(time / 1000);
  return seconds >= 60 ? "".concat(Math.floor(seconds / 60), " min") : "".concat(seconds, " sec");
}
function formatTime(number) {
  var time = new Date(number);
  return time.toLocaleString("en-US", {
    hour: "numeric",
    minute: "numeric",
    hour12: true
  });
}
function removeUndefined(obj) {
  return Object.keys(obj).reduce(function (newObj, key) {
    if (obj[key] !== undefined) {
      newObj[key] = obj[key];
    }

    return newObj;
  }, {});
} // will update object(merge new data) in list if it passes predicate, otherwise adds new object

function updateOrAdd(list, predicate, data) {
  var clone = _toConsumableArray(list);

  var index = clone.findIndex(predicate);

  if (index !== -1) {
    clone[index] = _objectSpread2({}, clone[index], {}, removeUndefined(data));
    return clone;
  }

  return [].concat(_toConsumableArray(list), [removeUndefined(data)]);
}
function extractMessageFromError(error) {
  if (!error.stack || !error.message) {
    return {
      eventCode: "txError",
      errorMsg: "An unknown error occured"
    };
  }

  var message = error.stack || error.message;

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

var app = store.writable({
  version: null,
  dappId: null,
  networkId: null,
  nodeSynced: true
});
var accounts = store.writable([]);
var contracts = store.writable([]);
var transactions = createTransactionStore([]);
var notifications = createNotificationStore([]);
var configuration = store.writable({
  mobilePosition: null,
  desktopPosition: null,
  darkMode: null,
  txApproveReminderTimeout: null,
  txStallPendingTimeout: null,
  txStallConfirmedTimeout: null
});

function createTransactionStore(initialState) {
  var _writable = store.writable(initialState),
      subscribe = _writable.subscribe,
      update = _writable.update;

  function updateQueue(transaction) {
    var predicate = function predicate(tx) {
      return tx.id === transaction.id;
    };

    update(function (store) {
      return updateOrAdd(store, predicate, transaction);
    });
  }

  function add(transaction) {
    update(function (store) {
      return [].concat(_toConsumableArray(store), [transaction]);
    });
  }

  return {
    subscribe: subscribe,
    updateQueue: updateQueue,
    add: add
  };
}

function createNotificationStore(initialState) {
  var _writable2 = store.writable(initialState),
      subscribe = _writable2.subscribe,
      update = _writable2.update;

  function add(notification) {
    update(function (store) {
      var existingNotification = store.find(function (n) {
        return n.id === notification.id;
      }); // if notification is a hint type or there are no existing notifications with same id, then just add it.

      if (notification.type === "hint" || !existingNotification) {
        return [].concat(_toConsumableArray(store), [notification]);
      } // otherwise filter out all notifications with the same id and then add the new notification


      return [].concat(_toConsumableArray(store.filter(function (n) {
        return n.id !== notification.id;
      })), [notification]);
    });
  }

  function remove(_ref) {
    var id = _ref.id,
        eventCode = _ref.eventCode;
    update(function (store) {
      return store.filter(function (n) {
        return n.id !== id || n.eventCode !== eventCode;
      });
    });
  }

  return {
    subscribe: subscribe,
    add: add,
    remove: remove,
    update: update
  };
}

/* src/components/CloseIcon.svelte generated by Svelte v3.12.1 */

function add_css$1() {
	var style = internal.element("style");
	style.id = 'svelte-1ct981s-style';
	style.textContent = "div.svelte-1ct981s{display:flex;justify-content:center;align-items:center;padding:0.3rem;border-radius:40px;transition:background 150ms ease-in-out}div.svelte-1ct981s:hover{background:#eeeeee;cursor:pointer}.bn-notify-dark-mode-close-background.svelte-1ct981s:hover{background:#00222c}";
	internal.append(document.head, style);
}

function create_fragment$1(ctx) {
	var div, svg, g, path0, path1, g_stroke_value, dispose;

	return {
		c() {
			div = internal.element("div");
			svg = internal.svg_element("svg");
			g = internal.svg_element("g");
			path0 = internal.svg_element("path");
			path1 = internal.svg_element("path");
			internal.attr(path0, "d", "m.1.1 7.82304289 7.82304289");
			internal.attr(path1, "d", "m.1.1 7.82304289 7.82304289");
			internal.attr(path1, "transform", "matrix(-1 0 0 1 8 0)");
			internal.attr(g, "fill", "none");
			internal.attr(g, "stroke", g_stroke_value = ctx.hovered ? (ctx.$configuration.darkMode ? '#ffffff' : '#4a4a4a') : '#9B9B9B');
			internal.attr(g, "stroke-linecap", "square");
			internal.attr(g, "stroke-width", "2");
			internal.set_style(g, "transition", "stroke 150ms ease-in-out");
			internal.attr(g, "transform", "translate(2 2)");
			internal.attr(svg, "height", "8");
			internal.attr(svg, "viewBox", "0 0 12 12");
			internal.attr(svg, "width", "8");
			internal.attr(svg, "xmlns", "http://www.w3.org/2000/svg");
			internal.attr(div, "class", "bn-notify-custom bn-notify-notification-close-icon svelte-1ct981s");
			internal.toggle_class(div, "bn-notify-dark-mode-close-background", ctx.$configuration.darkMode);

			dispose = [
				internal.listen(div, "mouseenter", ctx.mouseenter_handler),
				internal.listen(div, "mouseleave", ctx.mouseleave_handler)
			];
		},

		m(target, anchor) {
			internal.insert(target, div, anchor);
			internal.append(div, svg);
			internal.append(svg, g);
			internal.append(g, path0);
			internal.append(g, path1);
		},

		p(changed, ctx) {
			if ((changed.hovered || changed.$configuration) && g_stroke_value !== (g_stroke_value = ctx.hovered ? (ctx.$configuration.darkMode ? '#ffffff' : '#4a4a4a') : '#9B9B9B')) {
				internal.attr(g, "stroke", g_stroke_value);
			}

			if (changed.$configuration) {
				internal.toggle_class(div, "bn-notify-dark-mode-close-background", ctx.$configuration.darkMode);
			}
		},

		i: internal.noop,
		o: internal.noop,

		d(detaching) {
			if (detaching) {
				internal.detach(div);
			}

			internal.run_all(dispose);
		}
	};
}

function instance$1($$self, $$props, $$invalidate) {
	let $configuration;

	internal.component_subscribe($$self, configuration, $$value => { $configuration = $$value; $$invalidate('$configuration', $configuration); });

	let hovered;

	const mouseenter_handler = () => ($$invalidate('hovered', hovered = true));

	const mouseleave_handler = () => ($$invalidate('hovered', hovered = false));

	return {
		hovered,
		$configuration,
		mouseenter_handler,
		mouseleave_handler
	};
}

class CloseIcon extends internal.SvelteComponent {
	constructor(options) {
		super();
		if (!document.getElementById("svelte-1ct981s-style")) add_css$1();
		internal.init(this, options, instance$1, create_fragment$1, internal.safe_not_equal, []);
	}
}

/* src/components/AutoDismiss.svelte generated by Svelte v3.12.1 */

function create_fragment$2(ctx) {
	return {
		c: internal.noop,
		m: internal.noop,
		p: internal.noop,
		i: internal.noop,
		o: internal.noop,
		d: internal.noop
	};
}

function instance$2($$self, $$props, $$invalidate) {
	let { notification } = $$props;

  if (notification.autoDismiss) {
    setTimeout(() => {
      notifications.remove(notification);
    }, notification.autoDismiss);
  }

	$$self.$set = $$props => {
		if ('notification' in $$props) $$invalidate('notification', notification = $$props.notification);
	};

	return { notification };
}

class AutoDismiss extends internal.SvelteComponent {
	constructor(options) {
		super();
		internal.init(this, options, instance$2, create_fragment$2, internal.safe_not_equal, ["notification"]);
	}
}

/* src/views/Notify.svelte generated by Svelte v3.12.1 */

function add_css$2() {
	var style = internal.element("style");
	style.id = 'svelte-1m0g3hh-style';
	style.textContent = "ul.svelte-1m0g3hh{display:flex;flex-flow:column nowrap;position:fixed;padding:0 0.75rem;margin:0;list-style-type:none;width:20rem;bottom:0;right:0;font-family:\"Helvetica Neue\";max-height:100vh;overflow-y:scroll;overflow-x:hidden;color:#4a4a4a;background:transparent;scrollbar-width:none;box-sizing:border-box;height:100vh;pointer-events:none;z-index:9}@media only screen and (max-width: 450px){ul.svelte-1m0g3hh{width:100%}}.bn-notify-custom.bn-notify-dark-mode{background:#283944;color:#ffffff;background:rgba(40, 57, 68, 0.9)}.bn-notify-clickable:hover{cursor:pointer}.svelte-1m0g3hh::-webkit-scrollbar{display:none}li.svelte-1m0g3hh{position:relative;display:flex;padding:0.75rem;font-size:0.889rem;border-radius:10px;background:#ffffff;box-shadow:0px 2px 10px rgba(0, 0, 0, 0.1);color:inherit;transition:background 300ms ease-in-out, color 300ms ease-in-out;pointer-events:all;background:#ffffff;backdrop-filter:blur(5px);background:rgba(255, 255, 255, 0.8)}div.svelte-1m0g3hh:nth-child(2){display:flex;flex-flow:column nowrap;justify-content:center;margin-left:0.75rem;max-width:78%}div.svelte-1m0g3hh:nth-child(2) p.svelte-1m0g3hh:nth-child(1){margin:0}div.svelte-1m0g3hh:nth-child(2) p.svelte-1m0g3hh:nth-child(2){margin:0.5rem 0 0 0;opacity:0.7;font-size:0.79rem}div.svelte-1m0g3hh:nth-child(2) p:nth-child(2) i.svelte-1m0g3hh{width:15px;height:16px;display:inline-block;background-image:url(\"https://assist.blocknative.com/images/jJu8b0B.png\");background-position:-66px 0px;vertical-align:sub}div.svelte-1m0g3hh:nth-child(3){position:absolute;top:0.75rem;right:0.75rem}";
	internal.append(document.head, style);
}

function get_each_context(ctx, list, i) {
	const child_ctx = Object.create(ctx);
	child_ctx.notification = list[i];
	child_ctx.i = i;
	return child_ctx;
}

// (206:0) {#if $notifications.length > 0}
function create_if_block$1(ctx) {
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
			ul = internal.element("ul");

			for (let i = 0; i < each_blocks.length; i += 1) {
				each_blocks[i].c();
			}
			internal.attr(ul, "class", "bn-notify-custom bn-notify-notifications svelte-1m0g3hh");
			internal.attr(ul, "style", ul_style_value = `${ctx.positioning} ${ctx.justifyContent}`);
		},

		m(target, anchor) {
			internal.insert(target, ul, anchor);

			for (let i = 0; i < each_blocks.length; i += 1) {
				each_blocks[i].m(ul, null);
			}

			current = true;
		},

		p(changed, ctx) {
			const each_value = ctx.$notifications;

			internal.group_outros();
			for (let i = 0; i < each_blocks.length; i += 1) each_blocks[i].r();
			each_blocks = internal.update_keyed_each(each_blocks, changed, get_key, 1, ctx, each_value, each_1_lookup, ul, internal.fix_and_outro_and_destroy_block, create_each_block, null, get_each_context);
			for (let i = 0; i < each_blocks.length; i += 1) each_blocks[i].a();
			internal.check_outros();

			if ((!current || changed.positioning || changed.justifyContent) && ul_style_value !== (ul_style_value = `${ctx.positioning} ${ctx.justifyContent}`)) {
				internal.attr(ul, "style", ul_style_value);
			}
		},

		i(local) {
			if (current) return;
			for (let i = 0; i < each_value.length; i += 1) {
				internal.transition_in(each_blocks[i]);
			}

			current = true;
		},

		o(local) {
			for (let i = 0; i < each_blocks.length; i += 1) {
				internal.transition_out(each_blocks[i]);
			}

			current = false;
		},

		d(detaching) {
			if (detaching) {
				internal.detach(ul);
			}

			for (let i = 0; i < each_blocks.length; i += 1) {
				each_blocks[i].d();
			}
		}
	};
}

// (228:12) {#if notification.type === 'pending' && notification.startTime}
function create_if_block_1$1(ctx) {
	var span1, t0, i, t1, span0, t2_value = timeString(ctx.currentTime - ctx.notification.startTime) + "", t2;

	return {
		c() {
			span1 = internal.element("span");
			t0 = internal.text("-\n                ");
			i = internal.element("i");
			t1 = internal.space();
			span0 = internal.element("span");
			t2 = internal.text(t2_value);
			internal.attr(i, "class", "bn-notify-custom bn-notify-notification-info-meta-clock svelte-1m0g3hh");
			internal.attr(span0, "class", "bn-notify-custom\n                  bn-notify-notification-info-meta-duration-time svelte-1m0g3hh");
			internal.attr(span1, "class", "bn-notify-custom\n                bn-notify-notification-info-meta-duration svelte-1m0g3hh");
		},

		m(target, anchor) {
			internal.insert(target, span1, anchor);
			internal.append(span1, t0);
			internal.append(span1, i);
			internal.append(span1, t1);
			internal.append(span1, span0);
			internal.append(span0, t2);
		},

		p(changed, ctx) {
			if ((changed.currentTime || changed.$notifications) && t2_value !== (t2_value = timeString(ctx.currentTime - ctx.notification.startTime) + "")) {
				internal.set_data(t2, t2_value);
			}
		},

		d(detaching) {
			if (detaching) {
				internal.detach(span1);
			}
		}
	};
}

// (210:4) {#each $notifications as notification, i (notification.key)}
function create_each_block(key_1, ctx) {
	var li, t0, div0, p0, t1_value = ctx.notification.message + "", t1, t2, p1, span, t3, t4, t5, div1, t6, t7, li_intro, li_outro, rect, stop_animation = internal.noop, current, dispose;

	var typeicon = new TypeIcon({ props: { type: ctx.notification.type } });

	var if_block = (ctx.notification.type === 'pending' && ctx.notification.startTime) && create_if_block_1$1(ctx);

	var closeicon = new CloseIcon({});

	function click_handler() {
		return ctx.click_handler(ctx);
	}

	var autodismiss = new AutoDismiss({ props: { notification: ctx.notification } });

	return {
		key: key_1,

		first: null,

		c() {
			li = internal.element("li");
			typeicon.$$.fragment.c();
			t0 = internal.space();
			div0 = internal.element("div");
			p0 = internal.element("p");
			t1 = internal.text(t1_value);
			t2 = internal.space();
			p1 = internal.element("p");
			span = internal.element("span");
			t3 = internal.text(ctx.formattedTime);
			t4 = internal.space();
			if (if_block) if_block.c();
			t5 = internal.space();
			div1 = internal.element("div");
			closeicon.$$.fragment.c();
			t6 = internal.space();
			autodismiss.$$.fragment.c();
			t7 = internal.space();
			internal.attr(p0, "class", "svelte-1m0g3hh");
			internal.attr(span, "class", "bn-notify-custom bn-notify-notification-info-meta-timestamp svelte-1m0g3hh");
			internal.attr(p1, "class", "bn-notify-custom bn-notify-notification-info-meta svelte-1m0g3hh");
			internal.attr(div0, "class", "bn-notify-custom bn-notify-notification-info svelte-1m0g3hh");
			internal.attr(div1, "class", "bn-notify-custom bn-notify-notification-close svelte-1m0g3hh");
			internal.attr(li, "style", ctx.notificationMargin);
			internal.attr(li, "class", "bn-notify-custom bn-notify-notification svelte-1m0g3hh");
			internal.toggle_class(li, "bn-notify-dark-mode", ctx.$configuration.darkMode);
			internal.toggle_class(li, "bn-notify-clickable", ctx.notification.onclick);

			dispose = [
				internal.listen(div1, "click", click_handler),
				internal.listen(li, "click", ctx.notification.onclick)
			];

			this.first = li;
		},

		m(target, anchor) {
			internal.insert(target, li, anchor);
			internal.mount_component(typeicon, li, null);
			internal.append(li, t0);
			internal.append(li, div0);
			internal.append(div0, p0);
			internal.append(p0, t1);
			internal.append(div0, t2);
			internal.append(div0, p1);
			internal.append(p1, span);
			internal.append(span, t3);
			internal.append(p1, t4);
			if (if_block) if_block.m(p1, null);
			internal.append(li, t5);
			internal.append(li, div1);
			internal.mount_component(closeicon, div1, null);
			internal.append(li, t6);
			internal.mount_component(autodismiss, li, null);
			internal.append(li, t7);
			current = true;
		},

		p(changed, new_ctx) {
			ctx = new_ctx;
			var typeicon_changes = {};
			if (changed.$notifications) typeicon_changes.type = ctx.notification.type;
			typeicon.$set(typeicon_changes);

			if ((!current || changed.$notifications) && t1_value !== (t1_value = ctx.notification.message + "")) {
				internal.set_data(t1, t1_value);
			}

			if (ctx.notification.type === 'pending' && ctx.notification.startTime) {
				if (if_block) {
					if_block.p(changed, ctx);
				} else {
					if_block = create_if_block_1$1(ctx);
					if_block.c();
					if_block.m(p1, null);
				}
			} else if (if_block) {
				if_block.d(1);
				if_block = null;
			}

			var autodismiss_changes = {};
			if (changed.$notifications) autodismiss_changes.notification = ctx.notification;
			autodismiss.$set(autodismiss_changes);

			if (!current || changed.notificationMargin) {
				internal.attr(li, "style", ctx.notificationMargin);
			}

			if (changed.$configuration) {
				internal.toggle_class(li, "bn-notify-dark-mode", ctx.$configuration.darkMode);
			}

			if (changed.$notifications) {
				internal.toggle_class(li, "bn-notify-clickable", ctx.notification.onclick);
			}
		},

		r() {
			rect = li.getBoundingClientRect();
		},

		f() {
			internal.fix_position(li);
			stop_animation();
			internal.add_transform(li, rect);
		},

		a() {
			stop_animation();
			stop_animation = internal.create_animation(li, rect, animate.flip, { duration: 500 });
		},

		i(local) {
			if (current) return;
			internal.transition_in(typeicon.$$.fragment, local);

			internal.transition_in(closeicon.$$.fragment, local);

			internal.transition_in(autodismiss.$$.fragment, local);

			internal.add_render_callback(() => {
				if (li_outro) li_outro.end(1);
				if (!li_intro) li_intro = internal.create_in_transition(li, transition.fly, { duration: 1200, delay: 300, x: ctx.x, y: ctx.y, easing: elasticOut });
				li_intro.start();
			});

			current = true;
		},

		o(local) {
			internal.transition_out(typeicon.$$.fragment, local);
			internal.transition_out(closeicon.$$.fragment, local);
			internal.transition_out(autodismiss.$$.fragment, local);
			if (li_intro) li_intro.invalidate();

			li_outro = internal.create_out_transition(li, transition.fly, { duration: 400, x: ctx.x, y: ctx.y, easing: easing.quintIn });

			current = false;
		},

		d(detaching) {
			if (detaching) {
				internal.detach(li);
			}

			internal.destroy_component(typeicon);

			if (if_block) if_block.d();

			internal.destroy_component(closeicon);

			internal.destroy_component(autodismiss);

			if (detaching) {
				if (li_outro) li_outro.end();
			}

			internal.run_all(dispose);
		}
	};
}

function create_fragment$3(ctx) {
	var if_block_anchor, current;

	var if_block = (ctx.$notifications.length > 0) && create_if_block$1(ctx);

	return {
		c() {
			if (if_block) if_block.c();
			if_block_anchor = internal.empty();
		},

		m(target, anchor) {
			if (if_block) if_block.m(target, anchor);
			internal.insert(target, if_block_anchor, anchor);
			current = true;
		},

		p(changed, ctx) {
			if (ctx.$notifications.length > 0) {
				if (if_block) {
					if_block.p(changed, ctx);
					internal.transition_in(if_block, 1);
				} else {
					if_block = create_if_block$1(ctx);
					if_block.c();
					internal.transition_in(if_block, 1);
					if_block.m(if_block_anchor.parentNode, if_block_anchor);
				}
			} else if (if_block) {
				internal.group_outros();
				internal.transition_out(if_block, 1, 1, () => {
					if_block = null;
				});
				internal.check_outros();
			}
		},

		i(local) {
			if (current) return;
			internal.transition_in(if_block);
			current = true;
		},

		o(local) {
			internal.transition_out(if_block);
			current = false;
		},

		d(detaching) {
			if (if_block) if_block.d(detaching);

			if (detaching) {
				internal.detach(if_block_anchor);
			}
		}
	};
}

function elasticOut(t) {
  return (
    Math.sin((-13.0 * (t + 1.0) * Math.PI) / 2) * Math.pow(2.0, -35.0 * t) +
    1.0
  );
}

function instance$3($$self, $$props, $$invalidate) {
	let $configuration, $notifications;

	internal.component_subscribe($$self, configuration, $$value => { $configuration = $$value; $$invalidate('$configuration', $configuration); });
	internal.component_subscribe($$self, notifications, $$value => { $notifications = $$value; $$invalidate('$notifications', $notifications); });

	

  let smallScreen = window.innerWidth < 420;

  let positioning;
  let x;
  let y;
  let notificationMargin;
  let justifyContent;

  // listen for screen resize events
  window.addEventListener(
    "resize",
    debounce(() => {
      if (window.innerWidth < 420) {
        if (!smallScreen) {
          $$invalidate('smallScreen', smallScreen = true);
        }
      } else {
        if (smallScreen) {
          $$invalidate('smallScreen', smallScreen = false);
        }
      }
    }, 300)
  );

  let currentTime = Date.now();

  const intervalId = setInterval(() => {
    $$invalidate('currentTime', currentTime = Date.now());
  }, 1000);

  svelte.onDestroy(() => clearInterval(intervalId));

  const formattedTime = formatTime(currentTime);

	const click_handler = ({ notification }) => notifications.remove(notification);

	$$self.$$.update = ($$dirty = { $configuration: 1, smallScreen: 1, positioning: 1 }) => {
		if ($$dirty.$configuration || $$dirty.smallScreen || $$dirty.positioning) { if ($configuration.desktopPosition && !smallScreen) {
        $$invalidate('positioning', positioning =
          $configuration.desktopPosition === "bottomRight"
            ? "bottom: 0; right: 0;"
            : $configuration.desktopPosition === "bottomLeft"
            ? "left: 0; right: unset;"
            : $configuration.desktopPosition === "topRight"
            ? "top: 0;"
            : "top: 0; bottom: unset; left: 0; right: unset;");
    
        $$invalidate('x', x = positioning && positioning.includes("left") ? -321 : 321);
        $$invalidate('y', y = 0);
    
        if ($configuration.desktopPosition.includes("top")) {
          $$invalidate('justifyContent', justifyContent = "justify-content: unset;");
          $$invalidate('notificationMargin', notificationMargin = "margin: 0.75rem 0 0 0;");
        } else {
          $$invalidate('justifyContent', justifyContent = "justify-content: flex-end;");
          $$invalidate('notificationMargin', notificationMargin = "margin: 0 0 0.75rem 0;");
        }
      } }
		if ($$dirty.$configuration || $$dirty.smallScreen) { if ($configuration.mobilePosition && smallScreen) {
        $$invalidate('positioning', positioning =
          $configuration.mobilePosition === "top"
            ? "top: 0; bottom: unset;"
            : "bottom: 0; top: unset;");
    
        $$invalidate('x', x = 0);
    
        if ($configuration.mobilePosition === "top") {
          $$invalidate('y', y = -50);
          $$invalidate('justifyContent', justifyContent = "justify-content: unset;");
          $$invalidate('notificationMargin', notificationMargin = "margin: 0.75rem 0 0 0;");
        } else {
          $$invalidate('y', y = 50);
          $$invalidate('justifyContent', justifyContent = "justify-content: flex-end;");
          $$invalidate('notificationMargin', notificationMargin = "margin: 0 0 0.75rem 0;");
        }
      } }
		if ($$dirty.$configuration || $$dirty.smallScreen) { if (!$configuration.desktopPosition && !$configuration.mobilePosition) {
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
		$configuration,
		$notifications,
		click_handler
	};
}

class Notify extends internal.SvelteComponent {
	constructor(options) {
		super();
		if (!document.getElementById("svelte-1m0g3hh-style")) add_css$2();
		internal.init(this, options, instance$3, create_fragment$3, internal.safe_not_equal, []);
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
      return false;
  }
}
var txTimeouts = {
  txApproveReminderTimeout: 20000,
  txStallPendingTimeout: 20000,
  txStallConfirmedTimeout: 90000
};

var formatter;

svelteI18n._.subscribe(function (store) {
  return formatter = store;
});

function createNotification(details) {
  var customization = arguments.length > 1 && arguments[1] !== undefined ? arguments[1] : {};
  var id = details.id,
      hash = details.hash,
      startTime = details.startTime,
      eventCode = details.eventCode,
      direction = details.direction,
      counterparty = details.counterparty,
      value = details.value;
  var type = eventToType(eventCode);
  var key = "".concat(id, "-").concat(customization.eventCode || eventCode);
  var counterpartyShortened = counterparty && counterparty.substring(0, 4) + "..." + counterparty.substring(counterparty.length - 4);
  var formatterOptions = counterparty ? ["watched.".concat(eventCode), {
    verb: eventCode === "txConfirmed" ? direction === "incoming" ? "received" : "sent" : direction === "incoming" ? "receiving" : "sending",
    formattedValue: value / 1000000000000000000,
    preposition: direction === "incoming" ? "from" : "to",
    counterpartyShortened: counterpartyShortened
  }] : ["transaction.".concat(eventCode)];

  var notificationObject = _objectSpread2({
    id: id || hash,
    type: type,
    key: key,
    startTime: startTime,
    eventCode: eventCode,
    message: formatter.apply(void 0, formatterOptions),
    autoDismiss: typeToDismissTimeout(type)
  }, customization);

  notifications.add(notificationObject);
}

function validateInit(init) {
  ow(init, "Initialization Options", ow.object.exactShape({
    dappId: ow.string,
    networkId: ow.number
  }));
}
function validateTransactionOptions(options) {
  ow(options, "Transaction Options", ow.object.exactShape({
    sendTransaction: ow.optional["function"],
    estimateGas: ow.optional["function"],
    gasPrice: ow.optional["function"],
    balance: ow.optional.string,
    contract: ow.optional.object.exactShape({
      methodName: ow.string,
      params: ow.optional.array.nonEmpty
    }),
    txDetails: ow.optional.object.exactShape({
      to: ow.string,
      value: function stringOrNumber(val) {
        return typeof val === "string" || typeof val === "number" || "".concat(val, " is not a valid string or number");
      }
    }),
    listeners: ow.optional.object.exactShape({
      txRequest: ow.optional["function"],
      nsfFail: ow.optional["function"],
      txRepeat: ow.optional["function"],
      txAwaitingApproval: ow.optional["function"],
      txConfirmReminder: ow.optional["function"],
      txSendFail: ow.optional["function"],
      txError: ow.optional["function"],
      txUnderPriced: ow.optional["function"]
    })
  }));
}
function validateNotificationObject(notification) {
  ow(notification, "notification", ow.object.exactShape({
    type: ow.optional.string.is(validNotificationType),
    message: ow.string,
    autoDismiss: ow.optional.number,
    onclick: ow.optional["function"]
  }));
}
function validateConfig(config) {
  ow(config, "config", ow.object.exactShape({
    mobilePosition: ow.optional.string.is(validMobilePosition),
    desktopPosition: ow.optional.string.is(validDesktopPosition),
    darkMode: ow.optional["boolean"],
    txApproveReminderTimeout: ow.optional.number,
    txStallPendingTimeout: ow.optional.number,
    txStallConfirmedTimeout: ow.optional.number
  }));
}

function validNotificationType(type) {
  switch (type) {
    case "hint":
    case "pending":
    case "error":
    case "success":
      return true;

    default:
      return "".concat(type, " is not a valid notification type");
  }
}

function validMobilePosition(position) {
  return position === "top" || position === "bottom" || "".concat(position, " is not a valid mobile notification position");
}

function validDesktopPosition(position) {
  switch (position) {
    case "bottomLeft":
    case "bottomRight":
    case "topLeft":
    case "topRight":
      return true;

    default:
      return "".concat(position, " is not a valid desktop notification position");
  }
}

var transactionQueue;
transactions.subscribe(function (store) {
  return transactionQueue = store;
});
function handlePreFlightEvent(_ref) {
  var eventCode = _ref.eventCode,
      contract = _ref.contract,
      balance = _ref.balance,
      txObject = _ref.txObject,
      listeners = _ref.listeners,
      blocknative = _ref.blocknative,
      status = _ref.status;
  blocknative.event({
    categoryCode: contract ? "activeContract" : "activeTransaction",
    eventCode: eventCode,
    transaction: txObject,
    wallet: {
      balance: balance
    },
    contract: contract
  });

  var transaction = _objectSpread2({}, txObject, {
    eventCode: eventCode,
    status: status,
    contractCall: contract
  });

  var emitterResult = listeners[eventCode] && listeners[eventCode](transaction);

  if (emitterResult) {
    validateNotificationObject(emitterResult);
  }

  handleTransactionEvent({
    transaction: transaction,
    emitterResult: emitterResult
  });
}
function handleTransactionEvent(_ref2) {
  var transaction = _ref2.transaction,
      emitterResult = _ref2.emitterResult;

  // transaction queue alread has tx with same id and same eventCode then don't update
  // this is to allow for the fact that the server mirrors events sent to it
  if (transactionQueue.find(function (tx) {
    return tx.id === transaction.id && tx.eventCode === transaction.eventCode;
  })) {
    return;
  }

  transactions.updateQueue(transaction); // create notification if dev hasn't opted out

  if (emitterResult !== false) {
    var transactionObj = transactionQueue.find(function (tx) {
      return tx.id === transaction.id;
    });
    createNotification(transactionObj, emitterResult);
  }
}
function duplicateTransactionCandidate(transaction, contract) {
  var duplicate = transactionQueue.find(function (tx) {
    if (contract && typeof tx.contract === "undefined") return false;
    var sameMethod = contract ? contract.methodName === tx.contract.methodName : true;
    var sameParams = contract ? argsEqual(contract.parameters, tx.contract.parameters) : true;
    return sameMethod && sameParams && tx.value == transaction.value && tx.to.toLowerCase() === transaction.to.toLowerCase();
  });

  if (duplicate && (duplicate.status === "confirmed" || duplicate.status === "failed")) {
    duplicate = false;
  }

  return duplicate;
}

var version = "0.0.1";
var transactionQueue$1;
transactions.subscribe(function (store) {
  return transactionQueue$1 = store;
});

function init(initialize) {
  validateInit(initialize);
  var dappId = initialize.dappId,
      networkId = initialize.networkId;
  var blocknative = blocknativeSdk({
    dappId: dappId,
    networkId: networkId,
    transactionCallback: handleTransactionEvent
  }); // save config to app store

  app.update(function (store) {
    return _objectSpread2({}, store, {}, initialize, {
      version: version
    });
  }); // initialize App

  new Notify({
    target: document.body
  }); // set the dictionary for i18n

  svelteI18n.dictionary.set(notifyMessages); // set the locale for i18n

  svelteI18n.locale.set(svelteI18n.getClientLocale({
    fallback: "en-US",
    navigator: true
  }));
  return {
    account: account,
    hash: hash,
    transaction: transaction,
    notification: notification,
    config: config
  };

  function account(address) {
    try {
      var _blocknative$account = blocknative.account(address),
          emitter = _blocknative$account.emitter;

      return emitter;
    } catch (error) {
      throw new Error(error);
    }
  }

  function hash(hash, id) {
    try {
      var _blocknative$transact = blocknative.transaction(hash, id),
          emitter = _blocknative$transact.emitter;

      return emitter;
    } catch (error) {
      throw new Error(error);
    }
  }

  function transaction(options) {
    return new Promise(
    /*#__PURE__*/
    function () {
      var _ref = _asyncToGenerator(
      /*#__PURE__*/
      regeneratorRuntime.mark(function _callee(resolve, reject) {
        var sendTransaction, estimateGas, gasPrice, balance, contract, txDetails, listeners, gasLimit, price, id, txObject, transactionCost, eventCode, _eventCode, _get, txApproveReminderTimeout, txStallPendingTimeout, txStallConfirmedTimeout, _eventCode2, sendTransactionResult, result, emitter;

        return regeneratorRuntime.wrap(function _callee$(_context) {
          while (1) {
            switch (_context.prev = _context.next) {
              case 0:
                validateTransactionOptions(options);
                sendTransaction = options.sendTransaction, estimateGas = options.estimateGas, gasPrice = options.gasPrice, balance = options.balance, contract = options.contract, txDetails = options.txDetails, listeners = options.listeners; //=== if `balance` is not provided, then sufficient funds check is disabled === //
                //=== if `txDetails` is not provided, then duplicate transaction check is disabled === //
                //== if dev doesn't want notifiy to intiate the transaction and `sendTransaction` is not provided, then transaction rejected notification is disabled ==//
                //=== to disable hints for `txAwaitingApproval`, `txConfirmReminder` or any other notification, then return false from listener functions ==//

                _context.t0 = estimateGas;

                if (!_context.t0) {
                  _context.next = 9;
                  break;
                }

                _context.t1 = bigInt;
                _context.next = 7;
                return estimateGas()["catch"](function (err) {
                  return console.error("There was a problem estimating gas:", err);
                });

              case 7:
                _context.t2 = _context.sent;
                _context.t0 = (0, _context.t1)(_context.t2);

              case 9:
                gasLimit = _context.t0;
                _context.t3 = gasPrice;

                if (!_context.t3) {
                  _context.next = 17;
                  break;
                }

                _context.t4 = bigInt;
                _context.next = 15;
                return gasPrice()["catch"](function (err) {
                  return console.error("There was a problem getting current gas price:", err);
                });

              case 15:
                _context.t5 = _context.sent;
                _context.t3 = (0, _context.t4)(_context.t5);

              case 17:
                price = _context.t3;
                id = uuid();
                txObject = _objectSpread2({}, txDetails, {
                  value: String(txDetails.value),
                  gas: gasLimit && gasLimit.toString(),
                  gasPrice: price && price.toString(),
                  id: id
                }); // check sufficient balance if required parameters are available

                if (!(balance && gasLimit && gasPrice)) {
                  _context.next = 26;
                  break;
                }

                transactionCost = gasLimit.times(price).plus(bigInt(txDetails.value)); // if transaction cost is greater than the current balance

                if (!(transactionCost.compare(bigInt(balance)) === 1)) {
                  _context.next = 26;
                  break;
                }

                eventCode = "nsfFail";
                handlePreFlightEvent({
                  blocknative: blocknative,
                  eventCode: eventCode,
                  contract: contract,
                  balance: balance,
                  txObject: txObject,
                  listeners: listeners
                });
                return _context.abrupt("return", reject("User has insufficient funds"));

              case 26:
                // check if it is a duplicate transaction
                if (txDetails && duplicateTransactionCandidate({
                  to: txDetails.to,
                  value: txDetails.value
                }, contract)) {
                  _eventCode = "txRepeat";
                  handlePreFlightEvent({
                    blocknative: blocknative,
                    eventCode: _eventCode,
                    contract: contract,
                    balance: balance,
                    txObject: txObject,
                    listeners: listeners
                  });
                } // get any timeout configurations


                _get = store.get(configuration), txApproveReminderTimeout = _get.txApproveReminderTimeout, txStallPendingTimeout = _get.txStallPendingTimeout, txStallConfirmedTimeout = _get.txStallConfirmedTimeout; // check previous transactions awaiting approval

                if (transactionQueue$1.find(function (tx) {
                  return tx.status === "awaitingApproval";
                })) {
                  _eventCode2 = "txAwaitingApproval";
                  handlePreFlightEvent({
                    blocknative: blocknative,
                    eventCode: _eventCode2,
                    contract: contract,
                    balance: balance,
                    txObject: txObject,
                    listeners: listeners
                  });
                } // confirm reminder after timeout


                setTimeout(function () {
                  var awaitingApproval = transactionQueue$1.find(function (tx) {
                    return tx.id === id && tx.status === "awaitingApproval";
                  });

                  if (awaitingApproval) {
                    var _eventCode3 = "txConfirmReminder";
                    handlePreFlightEvent({
                      blocknative: blocknative,
                      eventCode: _eventCode3,
                      contract: contract,
                      balance: balance,
                      txObject: txObject,
                      listeners: listeners
                    });
                  }
                }, txApproveReminderTimeout || txTimeouts.txApproveReminderTimeout);
                handlePreFlightEvent({
                  blocknative: blocknative,
                  eventCode: "txRequest",
                  status: "awaitingApproval",
                  contract: contract,
                  balance: balance,
                  txObject: txObject,
                  listeners: listeners
                }); // if not provided with sendTransaction function, resolve with id so dev can initiate transaction
                // dev will need to call notify.hash(txHash, id) with this id to link up the preflight with the postflight notifications

                if (sendTransaction) {
                  _context.next = 33;
                  break;
                }

                return _context.abrupt("return", resolve({
                  id: id
                }));

              case 33:
                // initiate transaction
                sendTransactionResult = sendTransaction(); // get result and handle errors

                _context.next = 36;
                return sendTransactionResult["catch"](function (error) {
                  var _extractMessageFromEr = extractMessageFromError(error),
                      eventCode = _extractMessageFromEr.eventCode,
                      errorMsg = _extractMessageFromEr.errorMsg;

                  handlePreFlightEvent({
                    blocknative: blocknative,
                    eventCode: eventCode,
                    status: "failed",
                    contract: contract,
                    balance: balance,
                    txObject: txObject,
                    listeners: listeners
                  });
                  return reject(errorMsg);
                });

              case 36:
                result = _context.sent;

                if (result && result.hash) {
                  emitter = hash(result.hash, id); // Check for pending stall status

                  setTimeout(function () {
                    var transaction = transactionQueue$1.find(function (tx) {
                      return tx.id === id;
                    });

                    if (transaction && transaction.status === "sent" && blocknative.status.connected && blocknative.status.nodeSynced) {
                      var _eventCode4 = "txStallPending";
                      handlePreFlightEvent({
                        blocknative: blocknative,
                        eventCode: _eventCode4,
                        contract: contract,
                        balance: balance,
                        txObject: txObject,
                        listeners: listeners
                      });
                    }
                  }, txStallPendingTimeout || txTimeouts.txStallPendingTimeout); // Check for confirmed stall status

                  setTimeout(function () {
                    var transaction = transactionQueue$1.find(function (tx) {
                      return tx.id === id;
                    });

                    if (transaction && transaction.status === "pending" && blocknative.status.connected && blocknative.status.nodeSynced) {
                      var _eventCode5 = "txStallConfirmed";
                      handlePreFlightEvent({
                        blocknative: blocknative,
                        eventCode: _eventCode5,
                        contract: contract,
                        balance: balance,
                        txObject: txObject,
                        listeners: listeners
                      });
                    }
                  }, txStallConfirmedTimeout || txTimeouts.txStallConfirmedTimeout);
                  resolve({
                    emitter: emitter,
                    sendTransactionResult: sendTransactionResult
                  });
                }

              case 38:
              case "end":
                return _context.stop();
            }
          }
        }, _callee);
      }));

      return function (_x, _x2) {
        return _ref.apply(this, arguments);
      };
    }());
  }

  function notification(eventCode, notificationObject) {
    validateNotificationObject(notificationObject);
    var id = uuid();
    var startTime = Date.now();

    var dismiss = function dismiss() {
      return notifications.remove({
        id: id,
        eventCode: eventCode
      });
    };

    function update(eventCode, notificationUpdate) {
      validateNotificationObject(notificationUpdate);
      createNotification({
        id: id,
        startTime: startTime,
        eventCode: eventCode
      }, notificationUpdate);
      return {
        dismiss: dismiss,
        update: update
      };
    } // create notification


    createNotification({
      id: id,
      startTime: startTime,
      eventCode: eventCode
    }, notificationObject);
    return {
      dismiss: dismiss,
      update: update
    };
  }

  function config(options) {
    validateConfig(options);
    configuration.update(function (store) {
      return _objectSpread2({}, store, {}, options);
    });
  }
}

module.exports = init;
