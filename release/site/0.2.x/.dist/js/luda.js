/*! 
   * Luda 0.2.0 | https://oatw.github.io/luda
   * Copyright 2019 Oatw | https://oatw.blog
   * MIT license | http://opensource.org/licenses/MIT
   */
(function (global, factory) {
  typeof exports === 'object' && typeof module !== 'undefined' ? factory() :
  typeof define === 'function' && define.amd ? define(factory) :
  (factory());
}(this, (function () { 'use strict';

  var ENV;

  ENV = (function() {
    if (typeof document !== 'undefined') {
      if (typeof window !== 'undefined') {
        return window;
      }
      if (typeof global !== 'undefined') {
        return global;
      }
    }
    throw new Error('Unsupported runtime environment.');
  })();

  if (typeof ENV.luda !== 'function') {
    ENV.luda = function(installer) {
      var installed, name, property;
      if (!installer) {
        throw new Error('Installer cannot be detected.');
      }
      if (!['object', 'function'].includes(typeof installer)) {
        throw new Error('Installer must be object, array or function.');
      }
      if (installer.hasOwnProperty('_SCOPE')) {
        if (typeof installer._SCOPE !== 'string') {
          throw new Error('_SCOPE must be string');
        }
        return ENV.luda._install(installer._SCOPE, installer);
      }
      if (installer instanceof Array || typeof installer === 'function') {
        throw new Error('Unscoped installer must be object.');
      }
      installed = {};
      for (name in installer) {
        property = installer[name];
        installed[name] = ENV.luda._install(name, property);
      }
      return installed;
    };
    ENV.luda._install = function(namespace, installer) {
      var installedInstaller, installedName, ref;
      if (ENV.luda[namespace]) {
        console.warn(`Namespace ${namespace} is ocupied, sikp installation.`);
        return ENV.luda[namespace];
      }
      ref = ENV.luda;
      for (installedName in ref) {
        installedInstaller = ref[installedName];
        if (installer === installedInstaller) {
          console.warn(`Installer is installed with name ${installedName}, skip installation.`);
          return ENV.luda[installedName];
        }
      }
      if (installer._install) {
        if (typeof installer._install === 'function') {
          return ENV.luda[namespace] = installer._install();
        }
        return ENV.luda[namespace] = installer._install;
      }
      return ENV.luda[namespace] = installer;
    };
  }

  luda({
    KEY_LEFT: 37,
    KEY_UP: 38,
    KEY_RIGHT: 39,
    KEY_DOWN: 40,
    KEY_TAB: 9,
    KEY_ESC: 27,
    KEY_ENTER: 13
  });

  luda({
    $child: function(selector, $ancestor) {
      if (!$ancestor) {
        $ancestor = document;
      }
      return $ancestor.querySelector(selector);
    },
    $children: function(selector, $ancestor) {
      var $descendant, descendants;
      if (!$ancestor) {
        $ancestor = document;
      }
      $descendant = this.$child(selector, $ancestor);
      if ($descendant) {
        return descendants = Array.from($ancestor.querySelectorAll(selector));
      } else {
        return descendants = [];
      }
    },
    $unnested: function(selector, $ancestor, ancestorSelector) {
      var descendants;
      descendants = this.$children(selector, $ancestor);
      return descendants.filter(($descendant) => {
        if (this.$parent(ancestorSelector, $descendant) === $ancestor) {
          return $descendant;
        }
      });
    },
    $parent: function(selector, $descendant) {
      var $ancestor;
      $ancestor = $descendant.parentNode;
      if ($ancestor) {
        if ($ancestor.matches && $ancestor.matches(selector)) {
          return $ancestor;
        } else {
          return this.$parent(selector, $ancestor);
        }
      }
    },
    $parents: function(selector, $descendant, _ancestors) {
      var $ancestor;
      $ancestor = this.$parent(selector, $descendant);
      if (!_ancestors) {
        _ancestors = [];
      }
      if ($ancestor) {
        _ancestors.push($ancestor);
        return this.$parents(selector, $ancestor, _ancestors);
      } else {
        return _ancestors;
      }
    },
    $after: function($node, $target) {
      var $parent;
      $parent = $target.parentNode;
      if ($parent.lastChild === $target) {
        return $parent.appendChild($node);
      } else {
        return $parent.insertBefore($node, $target.nextSibling);
      }
    },
    $prepend: function($node, $target) {
      if ($target.firstChild) {
        return $target.insertBefore($node, $target.firstChild);
      } else {
        return $target.appendChild($node);
      }
    },
    reflow: function($element) {
      return $element.offsetHeight;
    },
    _getTransitionDurations: function(style, propertyLength) {
      var durationArray;
      durationArray = style.split(',');
      while (durationArray.length < propertyLength) {
        durationArray = durationArray.concat(durationArray);
      }
      if (durationArray.length > propertyLength) {
        durationArray = durationArray.slice(0, propertyLength);
      }
      return durationArray.map(function(durationStr) {
        var duration;
        duration = parseFloat(durationStr);
        if (!duration) {
          return 0;
        }
        if (durationStr.match('ms')) {
          return duration;
        } else {
          return duration * 1000;
        }
      });
    },
    getTransitionDuration: function($element) {
      var delays, durations, finalDurations, length, styles;
      styles = window.getComputedStyle($element);
      length = styles.transitionProperty.split(',').length;
      if (!length) {
        return 0;
      }
      delays = this._getTransitionDurations(styles.transitionDelay, length);
      durations = this._getTransitionDurations(styles.transitionDuration, length);
      finalDurations = durations.map(function(duration, index) {
        return duration + delays[index];
      });
      return Math.max.apply(null, finalDurations);
    },
    _observeDom: function(onNodeAdded, onNodeRemoved) {
      var observer, observerConfig;
      observerConfig = {
        childList: true,
        subtree: true
      };
      observer = new MutationObserver(function(mutations) {
        return mutations.forEach(function(mutation) {
          var $addedNodes, $removedNodes;
          $removedNodes = Array.from(mutation.removedNodes);
          $addedNodes = Array.from(mutation.addedNodes);
          $removedNodes.forEach(function($node) {
            if ($node instanceof Element && onNodeRemoved) {
              return onNodeRemoved($node);
            }
          });
          return $addedNodes.forEach(function($node) {
            if ($node instanceof Element && onNodeAdded) {
              return onNodeAdded($node);
            }
          });
        });
      });
      observer.observe(document.documentElement, observerConfig);
      return observer;
    }
  });

  var splice = [].splice;

  luda({
    _SWIPE_DISTANCE: 10,
    _EVENT_TYPE_PREFIX: 'luda',
    _SWIPE_LEFT: 'swipeleft',
    _SWIPE_RIGHT: 'swiperight',
    _SWIPE_UP: 'swipeup',
    _SWIPE_DOWN: 'swipedown',
    _SWIPE_LEFT_OR_UP: 'swipeleft or swipeup',
    _SWIPE_RIGHT_OR_DOWN: 'swiperight or swipedown',
    _DOC_READY: 'docready',
    _FORM_RESET: 'reset',
    eventPath: function(event) {
      var path;
      if (event.composedPath) {
        return path = event.composedPath();
      } else if (event.path) {
        return path = event.path;
      } else {
        return path = [event.target].concat(luda.$parents('*', event.target));
      }
    },
    on: function(event, ...selector) {
      var handler, ref;
      ref = selector, [...selector] = ref, [handler] = splice.call(selector, -1);
      switch (event) {
        case this._DOC_READY:
          return this._onDocReady(handler);
        case this._FORM_RESET:
          return this._onReset(selector[0], handler);
        case this._SWIPE_LEFT:
        case this._SWIPE_RIGHT:
        case this._SWIPE_UP:
        case this._SWIPE_DOWN:
        case this._SWIPE_LEFT_OR_UP:
        case this._SWIPE_RIGHT_OR_DOWN:
          return this._onSwipe(event, selector[0], handler);
        default:
          return this._on(event, selector[0], handler);
      }
    },
    onOpposite: function(event, selector, handler) {
      var _self;
      _self = this;
      return document.addEventListener(event, function(e) {
        var trigger;
        trigger = _self.eventPath(e).every(function($element) {
          return !$element.matches || !$element.matches(selector);
        });
        if (trigger) {
          return handler(e);
        }
      });
    },
    dispatch: function($target, type, detail, delayMilliseconds, options = {}) {
      var evt;
      if (typeof options.bubbles !== 'boolean') {
        options.bubbles = true;
      }
      if (typeof options.cancelable !== 'boolean') {
        options.cancelable = true;
      }
      if (typeof options.composed !== 'boolean') {
        options.composed = true;
      }
      evt = new Event(`${this._EVENT_TYPE_PREFIX}:${type}`, options);
      evt.detail = detail;
      if (typeof delayMilliseconds === 'number') {
        return setTimeout(function() {
          if ($target) {
            return $target.dispatchEvent(evt);
          }
        }, delayMilliseconds);
      } else {
        $target.dispatchEvent(evt);
        return evt;
      }
    },
    _onDocReady: function(handler) {
      if (document.readyState === 'loading') {
        return document.addEventListener('DOMContentLoaded', handler);
      } else {
        return handler();
      }
    },
    _onReset: function(selector, handler) {
      return document.addEventListener('reset', function(e) {
        if (selector != null) {
          return luda.$children(selector, e.target).forEach(function($element) {
            return handler.bind($element)(e);
          });
        } else {
          return handler(e);
        }
      });
    },
    _onSwipe: function(event, selector, handler) {
      var $touchStartElement, _self, touchStartE, touchStartX, touchStartY, watch;
      _self = this;
      watch = false;
      $touchStartElement = document;
      touchStartE = null;
      touchStartX = 0;
      touchStartY = 0;
      document.addEventListener('touchstart', function(e) {
        if (e.touches.length === 1) {
          touchStartX = e.touches[0].screenX;
          touchStartY = e.touches[0].screenY;
          if (selector != null) {
            return _self.eventPath(e).some(function($element) {
              if ($element.matches && $element.matches(selector)) {
                $touchStartElement = $element;
                touchStartE = e;
                watch = true;
                return true;
              }
            });
          } else {
            return watch = true;
          }
        }
      });
      return document.addEventListener('touchmove', function(e) {
        var eventX, eventXOrY, eventY, touchDistanceX, touchDistanceY;
        if (watch && e.touches.length === 1) {
          touchDistanceX = e.touches[0].screenX - touchStartX;
          touchDistanceY = e.touches[0].screenY - touchStartY;
          eventX = void 0;
          eventY = void 0;
          eventXOrY = void 0;
          if (Math.abs(touchDistanceX) >= _self._SWIPE_DISTANCE) {
            if (touchDistanceX > 0) {
              eventX = _self._SWIPE_RIGHT;
            } else {
              eventX = _self._SWIPE_LEFT;
            }
          }
          if (Math.abs(touchDistanceY) >= _self._SWIPE_DISTANCE) {
            if (touchDistanceY > 0) {
              eventY = _self._SWIPE_DOWN;
            } else {
              eventY = _self._SWIPE_UP;
            }
          }
          if (eventX === _self._SWIPE_LEFT || eventY === _self._SWIPE_UP) {
            eventXOrY = _self._SWIPE_LEFT_OR_UP;
          }
          if (eventX === _self._SWIPE_RIGHT || eventY === _self._SWIPE_DOWN) {
            eventXOrY = _self._SWIPE_RIGHT_OR_DOWN;
          }
          if (((eventX != null) && eventX === event) || ((eventY != null) && eventY === event) || eventXOrY === event) {
            if (selector != null) {
              return _self.eventPath(e).some(function($element) {
                if ($element === $touchStartElement) {
                  watch = false;
                  handler.bind($element)(touchStartE, e);
                  return true;
                }
              });
            } else {
              watch = false;
              return handler(touchStartE, e);
            }
          }
        }
      });
    },
    _on: function(event, selector, handler) {
      var _self;
      if (selector === window) {
        return window.addEventListener(event, function(e) {
          return handler(e);
        });
      } else {
        _self = this;
        return document.addEventListener(event, function(e) {
          if (selector != null) {
            return _self.eventPath(e).some(function($element) {
              if ($element.matches && $element.matches(selector)) {
                handler.bind($element)(e);
                return true;
              }
            });
          } else {
            return handler(e);
          }
        });
      }
    }
  });

  luda({
    except: function(element, arr) {
      if (arr.includes(element)) {
        return arr.splice(arr.indexOf(element), 1);
      }
    }
  });

  var Static;

  luda(Static = (function() {
    class Static {
      static _ACTIVATE_EVENT_TYPE() {
        return `${this._SCOPE}:activate`;
      }

      static _ACTIVATED_EVENT_TYPE() {
        return `${this._SCOPE}:activated`;
      }

      static _DEACTIVATE_EVENT_TYPE() {
        return `${this._SCOPE}:deactivate`;
      }

      static _DEACTIVATED_EVENT_TYPE() {
        return `${this._SCOPE}:deactivated`;
      }

      static _ACTIVATING_MARK_ATTRIBUTE() {
        return `data-${this._SCOPE}-activating`;
      }

      static _DEACTIVATING_MARK_ATTRIBUTE() {
        return `data-${this._SCOPE}-deactivating`;
      }

      static _add(selector) {
        if (typeof selector !== 'string') {
          throw new Error(this._SELECTOR_INVALID_ERROR);
        }
        if (!this._SELECTORS.includes(selector)) {
          this._SELECTORS.push(selector);
        }
        return this._mergeSelectors();
      }

      static _remove(selector) {
        if (typeof selector !== 'string') {
          throw new Error(this._SELECTOR_INVALID_ERROR);
        }
        luda.except(selector, this._SELECTORS);
        return this._mergeSelectors();
      }

      static _mergeSelectors() {
        return this._selector = this._SELECTORS.join(',');
      }

      static _activatePrevented($ele, detail) {
        var activateEvent;
        activateEvent = luda.dispatch($ele, this._ACTIVATE_EVENT_TYPE(), detail);
        return activateEvent.defaultPrevented;
      }

      static _deactivatePrevented($ele, detail) {
        var deactivateEvent;
        deactivateEvent = luda.dispatch($ele, this._DEACTIVATE_EVENT_TYPE(), detail);
        return deactivateEvent.defaultPrevented;
      }

      static _handleActivateEnd($ele, detail) {
        var activateDuration;
        this._setActivatingMark($ele, detail);
        activateDuration = luda.getTransitionDuration($ele);
        luda.dispatch($ele, this._ACTIVATED_EVENT_TYPE(), detail, activateDuration);
        setTimeout(() => {
          if ($ele) {
            return this._removeActivatingMark($ele);
          }
        }, activateDuration);
        return activateDuration;
      }

      static _handleDeactivateEnd($ele, detail) {
        var deactivateDuration;
        this._setDeactivatingMark($ele, detail);
        deactivateDuration = luda.getTransitionDuration($ele);
        luda.dispatch($ele, this._DEACTIVATED_EVENT_TYPE(), detail, deactivateDuration);
        setTimeout(() => {
          if ($ele) {
            return this._removeDeactivatingMark($ele);
          }
        }, deactivateDuration);
        return deactivateDuration;
      }

      static _handleActivateCancel($ele, detail) {
        if (this._isActivating($ele)) {
          luda.dispatch($ele, this._ACTIVATED_EVENT_TYPE(), detail);
          return this._removeActivatingMark($ele);
        }
      }

      static _handleDeactivateCancel($ele, detail) {
        if (this._isDeactivating($ele)) {
          luda.dispatch($ele, this._DEACTIVATED_EVENT_TYPE(), detail);
          return this._removeDeactivatingMark($ele);
        }
      }

      static _isActivating($ele) {
        return $ele.hasAttribute(this._ACTIVATING_MARK_ATTRIBUTE());
      }

      static _isDeactivating($ele) {
        return $ele.hasAttribute(this._DEACTIVATING_MARK_ATTRIBUTE());
      }

      static _isTransitioning($ele) {
        return this._isActivating($ele) || this._isDeactivating($ele);
      }

      static _getActivatingMark($ele) {
        return $ele.getAttribute(this._ACTIVATING_MARK_ATTRIBUTE());
      }

      static _getDeactivatingMark($ele) {
        return $ele.getAttribute(this._DEACTIVATING_MARK_ATTRIBUTE());
      }

      static _removeActivatingMark($ele) {
        return $ele.removeAttribute(this._ACTIVATING_MARK_ATTRIBUTE());
      }

      static _removeDeactivatingMark($ele) {
        return $ele.removeAttribute(this._DEACTIVATING_MARK_ATTRIBUTE());
      }

      static _setActivatingMark($ele, value) {
        return $ele.setAttribute(this._ACTIVATING_MARK_ATTRIBUTE(), value);
      }

      static _setDeactivatingMark($ele, value) {
        return $ele.setAttribute(this._DEACTIVATING_MARK_ATTRIBUTE(), value);
      }

      static _onEleAdded($ele) {
        return Static._onEleAddedOrRemoved($ele, '_onElementAdded');
      }

      static _onEleRemoved($ele) {
        return Static._onEleAddedOrRemoved($ele, '_onElementRemoved');
      }

      static _onEleAddedOrRemoved($ele, action) {
        return Static._Observed.forEach(function(Observed) {
          var $matched;
          if (!Observed[action]) {
            return;
          }
          $matched = luda.$children(Observed._selector, $ele);
          if ($ele.matches(Observed._selector)) {
            $matched.unshift($ele);
          }
          return $matched.forEach(function($target) {
            return Observed[action]($target);
          });
        });
      }

      static _observe(classObj) {
        if (!Static._observer) {
          Static._observer = luda._observeDom(Static._onEleAdded, Static._onEleRemoved);
        }
        if (classObj._onElementAdded || classObj._onElementRemoved && classObj._selector) {
          if (!Static._Observed.includes(classObj)) {
            return Static._Observed.push(classObj);
          }
        }
      }

      static _install() {
        var exposed, self;
        self = this;
        if (this === Static) {
          return this;
        }
        if (!this.hasOwnProperty('_SELECTORS')) {
          this._SELECTORS = [];
        }
        this._mergeSelectors();
        if (typeof this._init === 'function') {
          exposed = this._init();
        }
        luda.on(luda._DOC_READY, function() {
          return Static._observe(self);
        });
        if (exposed) {
          return exposed;
        } else {
          return this;
        }
      }

    }
    Static._SCOPE = 'Static';

    Static._SELECTOR_INVALID_ERROR = '@param selector must be a css selector string';

    Static._SELECTORS = [];

    Static._Observed = [];

    Static._observer = null;

    Static._selector = '';

    return Static;

  }).call(this));

  luda((function() {
    var _Class;

    _Class = class extends luda.Static {
      static _init() {
        var self;
        self = this;
        return luda.on('keydown', function(e) {
          if (!document.documentElement.hasAttribute(self._DISABLED_ATTRIBUTE) && e.keyCode === luda.KEY_ENTER && e.target.matches(self._selector)) {
            e.preventDefault();
            return setTimeout(function() {
              return e.target.click();
            });
          }
        });
      }

    };

    _Class._SCOPE = 'enter';

    _Class._SELECTORS = ['input[type=checkbox]', 'input[type=radio]', '[tabindex]'];

    _Class._DISABLED_ATTRIBUTE = 'data-enter-disabled';

    return _Class;

  }).call(this));

  luda((function() {
    var _Class;

    _Class = class extends luda.Static {
      static _isActive() {
        return !document.documentElement.hasAttribute(this._DISABLED_ATTRIBUTE);
      }

      static _removeFocusClassExcept($exception) {
        return Array.from(this._$focus).forEach(($focus) => {
          if ($focus !== $exception) {
            return $focus.classList.remove(this._CSS_CLASS);
          }
        });
      }

      static _addFocusClassExceptHtmlAndBody($target) {
        if ($target !== document.body && $target !== document.documentElement) {
          return $target.classList.add(this._CSS_CLASS);
        }
      }

      static _changeFocusStateOnKeyEvent(e) {
        if (this._isActive()) {
          this._removeFocusClassExcept(e.target);
          return this._addFocusClassExceptHtmlAndBody(e.target);
        }
      }

      static _changeFocusStateOnMouseDownEvent(e) {
        var target;
        if (this._isActive()) {
          if (e.target.matches(this._PARENT_FOCUS_CHILDREN_SELECTOR)) {
            target = luda.$parent(this._PARENT_FOCUS_SELECTOR, e.target);
          } else {
            target = e.target;
          }
          if (target.matches(this._selector)) {
            this._removeFocusClassExcept(target);
            return this._addFocusClassExceptHtmlAndBody(target);
          } else {
            return this._removeFocusClassExcept();
          }
        }
      }

      static _setElementPrototype() {
        var blur, focus, self;
        focus = HTMLElement.prototype.focus;
        blur = HTMLElement.prototype.blur;
        self = this;
        HTMLElement.prototype.focus = function() {
          focus.apply(this, arguments);
          if (self._isActive() && document.activeElement === this) {
            self._removeFocusClassExcept(this);
            return self._addFocusClassExceptHtmlAndBody(this);
          }
        };
        return HTMLElement.prototype.blur = function() {
          blur.apply(this, arguments);
          if (self._isActive()) {
            return this.classList.remove(self._CSS_CLASS);
          }
        };
      }

      static _init() {
        this._setElementPrototype();
        luda.on('keydown', this._changeFocusStateOnKeyEvent.bind(this));
        luda.on('keyup', this._changeFocusStateOnKeyEvent.bind(this));
        luda.on('mousedown', this._changeFocusStateOnMouseDownEvent.bind(this));
        luda.on('touchstart', this._TOUCHSTART_FOCUS_SELECTOR, this._changeFocusStateOnMouseDownEvent.bind(this));
        return luda.on('focusin', this._changeFocusStateOnMouseDownEvent.bind(this));
      }

    };

    _Class._SCOPE = 'focus';

    _Class._CSS_CLASS = 'focus';

    // mouse focusable selectors
    _Class._SELECTORS = ['select', 'textarea', ':not(.btn-check):not(.btn-radio):not(.btn-file) > input:not([type=button]):not([type=submit]):not([type=reset])'];

    _Class._TOUCHSTART_FOCUS_SELECTOR = 'input[type=range]';

    _Class._PARENT_FOCUS_SELECTOR = 'select[multiple]';

    _Class._PARENT_FOCUS_CHILDREN_SELECTOR = `${_Class._PARENT_FOCUS_SELECTOR} *`;

    _Class._DISABLED_ATTRIBUTE = 'data-focus-disabled';

    _Class._$focus = document.getElementsByClassName(_Class._CSS_CLASS);

    return _Class;

  }).call(this));

  var Factory;

  luda(Factory = (function() {
    class Factory {
      static _ACTIVATE_EVENT_TYPE() {
        return `${this._SCOPE}:activate`;
      }

      static _ACTIVATED_EVENT_TYPE() {
        return `${this._SCOPE}:activated`;
      }

      static _DEACTIVATE_EVENT_TYPE() {
        return `${this._SCOPE}:deactivate`;
      }

      static _DEACTIVATED_EVENT_TYPE() {
        return `${this._SCOPE}:deactivated`;
      }

      static _ACTIVATING_MARK_ATTRIBUTE() {
        return `data-${this._SCOPE}-activating`;
      }

      static _DEACTIVATING_MARK_ATTRIBUTE() {
        return `data-${this._SCOPE}-deactivating`;
      }

      _hasDescendant(descendant) {
        if (this._children.length && descendant) {
          if (this._children.includes(descendant)) {
            return true;
          }
          return this._children.some(function(child) {
            return child._hasDescendant(descendant);
          });
        } else {
          return false;
        }
      }

      _observe() {
        this._observer = new MutationObserver(this._onMutations.bind(this));
        return this._observer.observe(this._$component, this.constructor._observerConfig);
      }

      _disconnect() {
        this._observer.disconnect();
        return this._observer = null;
      }

      _activatePrevented($ele, detail) {
        var activateEvent;
        activateEvent = luda.dispatch($ele, this.constructor._ACTIVATE_EVENT_TYPE(), detail);
        return activateEvent.defaultPrevented;
      }

      _deactivatePrevented($ele, detail) {
        var deactivateEvent;
        deactivateEvent = luda.dispatch($ele, this.constructor._DEACTIVATE_EVENT_TYPE(), detail);
        return deactivateEvent.defaultPrevented;
      }

      _handleActivateEnd($ele, detail) {
        var activateDuration;
        this._setActivatingMark(detail);
        activateDuration = luda.getTransitionDuration($ele);
        luda.dispatch($ele, this.constructor._ACTIVATED_EVENT_TYPE(), detail, activateDuration);
        setTimeout(() => {
          if (this._$component) {
            return this._removeActivatingMark();
          }
        }, activateDuration);
        return activateDuration;
      }

      _handleDeactivateEnd($ele, detail) {
        var deactivateDuration;
        this._setDeactivatingMark(detail);
        deactivateDuration = luda.getTransitionDuration($ele);
        luda.dispatch($ele, this.constructor._DEACTIVATED_EVENT_TYPE(), detail, deactivateDuration);
        setTimeout(() => {
          if (this._$component) {
            return this._removeDeactivatingMark();
          }
        }, deactivateDuration);
        return deactivateDuration;
      }

      _handleActivateCancel($ele, detail) {
        if (this._isActivating()) {
          luda.dispatch($ele, this.constructor._ACTIVATED_EVENT_TYPE(), detail);
          return this._removeActivatingMark();
        }
      }

      _handleDeactivateCancel($ele, detail) {
        if (this._isDeactivating()) {
          luda.dispatch($ele, this.constructor._DEACTIVATED_EVENT_TYPE(), detail);
          return this._removeDeactivatingMark();
        }
      }

      _isActivating() {
        return this._$component.hasAttribute(this.constructor._ACTIVATING_MARK_ATTRIBUTE());
      }

      _isDeactivating() {
        return this._$component.hasAttribute(this.constructor._DEACTIVATING_MARK_ATTRIBUTE());
      }

      _isTransitioning() {
        return this._isActivating() || this._isDeactivating();
      }

      _getActivatingMark() {
        return this._$component.getAttribute(this.constructor._ACTIVATING_MARK_ATTRIBUTE());
      }

      _getDeactivatingMark() {
        return this._$component.getAttribute(this.constructor._DEACTIVATING_MARK_ATTRIBUTE());
      }

      _removeActivatingMark() {
        return this._$component.removeAttribute(this.constructor._ACTIVATING_MARK_ATTRIBUTE());
      }

      _removeDeactivatingMark() {
        return this._$component.removeAttribute(this.constructor._DEACTIVATING_MARK_ATTRIBUTE());
      }

      _setActivatingMark(value) {
        return this._$component.setAttribute(this.constructor._ACTIVATING_MARK_ATTRIBUTE(), value);
      }

      _setDeactivatingMark(value) {
        return this._$component.setAttribute(this.constructor._DEACTIVATING_MARK_ATTRIBUTE(), value);
      }

      static create($component) {
        var $family, componentIsElementInstance, instance, parent;
        componentIsElementInstance = $component instanceof Element;
        if (!componentIsElementInstance) {
          throw new Error(this._$COMPONENT_INVALID_ERROR);
        }
        $family = this._query$family($component);
        instance = this.query($component);
        if ($family._$parent) {
          if (parent = this.query($family._$parent)) {
            if (!instance) {
              this._instances.push(instance = this._createInstance($component));
            }
            if (instance._parent !== parent) {
              parent._children.push(instance) && (instance._parent = parent);
            }
            $family._$children.forEach(($child) => {
              return this.create($child);
            });
            return instance;
          } else {
            this.create($family._$parent);
            return this.query($component);
          }
        } else {
          if (!instance) {
            this._instances.push(instance = this._createInstance($component));
          }
          $family._$children.forEach(($child) => {
            return this.create($child);
          });
          return instance;
        }
      }

      static destroy(instance$component) {
        var attribute, instance, results, value;
        instance = this.query(instance$component);
        if (instance) {
          if (instance._observer) {
            instance._disconnect();
          }
          if (instance._destroy) {
            instance._destroy();
          }
          while (instance._children.length) {
            this.destroy(instance._children[0]);
          }
          if (instance._parent) {
            luda.except(instance, instance._parent._children);
          }
          luda.except(instance, this._instances);
          results = [];
          for (attribute in instance) {
            value = instance[attribute];
            results.push(instance[attribute] = null);
          }
          return results;
        }
      }

      static query(instance$component) {
        var instance;
        instance = null;
        if (instance$component instanceof this && this._instances.includes(instance$component)) {
          instance = instance$component;
        } else if (instance$component instanceof Element) {
          this._instances.some(function(inited) {
            if (inited._$component === instance$component) {
              instance = inited;
              return true;
            }
          });
        }
        return instance;
      }

      static _query$family($component) {
        var _$children, _$parent;
        _$parent = null;
        _$children = [];
        if (this._SELECTOR) {
          _$parent = luda.$parent(this._SELECTOR, $component);
          _$children = luda.$unnested(this._SELECTOR, $component, this._SELECTOR);
        }
        return {_$parent, _$children};
      }

      static _createInstance($component) {
        var instance;
        instance = new this();
        instance._$component = $component;
        instance._parent = null;
        instance._children = [];
        instance._observer = null;
        if (instance._constructor) {
          instance._constructor();
        }
        if (!(instance._observer && instance._onMutations && this._observerConfig)) {
          instance._observe();
        }
        return instance;
      }

      static _onEleAdded($ele) {
        return Factory._onEleAddedOrRemoved($ele, 'create');
      }

      static _onEleRemoved($ele) {
        return Factory._onEleAddedOrRemoved($ele, 'destroy');
      }

      static _onEleAddedOrRemoved($ele, action) {
        return Factory._Observed.forEach(function(Observed) {
          if ($ele.matches(Observed._SELECTOR)) {
            return Observed[action]($ele);
          }
          return luda.$children(Observed._SELECTOR, $ele).forEach(function($child) {
            return Observed[action]($child);
          });
        });
      }

      static _observe(classObj) {
        if (!Factory._observer) {
          Factory._observer = luda._observeDom(Factory._onEleAdded, Factory._onEleRemoved);
        }
        if (!Factory._Observed.includes(classObj)) {
          return Factory._Observed.push(classObj);
        }
      }

      static _install() {
        var exposed, self;
        self = this;
        if (this === Factory) {
          return this;
        }
        if (!(this._SELECTOR || typeof this._SELECTOR !== 'string')) {
          throw new Error(this._COMPONENT_NO_SELECTOR_ERROR);
        }
        if (!this.hasOwnProperty('_instances')) {
          this._instances = [];
        }
        if (typeof this._init === 'function') {
          exposed = this._init();
        }
        luda.on(luda._DOC_READY, function() {
          luda.$children(self._SELECTOR).forEach(function($component) {
            return self.create($component);
          });
          return Factory._observe(self);
        });
        if (exposed) {
          return exposed;
        } else {
          return this;
        }
      }

    }
    Factory._SCOPE = 'Factory';

    Factory._COMPONENT_NO_SELECTOR_ERROR = 'Extended component must has a css selector';

    Factory._$COMPONENT_INVALID_ERROR = '@param $component must be an instance of Element';

    Factory._SELECTOR = '';

    Factory._instances = [];

    Factory._Observed = [];

    Factory._observer = null;

    Factory._observerConfig = {
      childList: true,
      subtree: true
    };

    return Factory;

  }).call(this));

  luda((function() {
    var _Class;

    _Class = class extends luda.Factory {
      _getConfig() {
        var _isReadonly, readonly;
        readonly = this._$component.getAttribute(this.constructor._READONLY_ATTRIBUTE);
        _isReadonly = readonly !== this.constructor._READONLY_FALSE_VALUE;
        return {_isReadonly};
      }

      _constructor() {
        ({_isReadonly: this._isReadonly} = this._getConfig());
        this._setOriginalTabIndex();
        return this._setTabIndex();
      }

      _onMutations() {
        return this._constructor();
      }

      _setOriginalTabIndex() {
        if (!this._$component.hasAttribute(this.constructor._ORIGINAL_TABINDEX_ATTRIBUTE)) {
          return this._$component.setAttribute(this.constructor._ORIGINAL_TABINDEX_ATTRIBUTE, this._$component.tabIndex);
        }
      }

      _setTabIndex() {
        if (this._isReadonly) {
          return this._$component.tabIndex = -1;
        } else {
          return this._$component.tabIndex = this._$component.getAttribute(this.constructor._ORIGINAL_TABINDEX_ATTRIBUTE);
        }
      }

    };

    _Class._SCOPE = 'readonly';

    _Class._READONLY_ATTRIBUTE = 'data-readonly';

    _Class._ORIGINAL_TABINDEX_ATTRIBUTE = 'data-readonly-tabindex';

    _Class._READONLY_FALSE_VALUE = 'false';

    _Class._SELECTOR = `[${_Class._READONLY_ATTRIBUTE}]`;

    _Class._observerConfig = {
      attributes: true,
      attributeFilter: [_Class._READONLY_ATTRIBUTE]
    };

    return _Class;

  }).call(this));

  luda((function() {
    var _Class;

    _Class = class extends luda.Static {
      static _querySameName$radios($radio) {
        var $inputs, selector;
        if ($radio.name) {
          selector = `${this._selector}[name=${$radio.name}]`;
        } else {
          selector = this._selector;
        }
        $inputs = luda.$children(selector);
        return $inputs.filter(function($input) {
          return $input.tabIndex >= 0;
        });
      }

      static _query$prev$next($radio) {
        var $next, $prev, $sameNameRadios, radioIndex;
        $sameNameRadios = this._querySameName$radios($radio);
        radioIndex = $sameNameRadios.indexOf($radio);
        $prev = $sameNameRadios[radioIndex - 1];
        $next = $sameNameRadios[radioIndex + 1];
        return {$prev, $next};
      }

      static _init() {
        var self;
        self = this;
        return luda.on('keydown', function(e) {
          var $next, $prev;
          if (!document.documentElement.hasAttribute(self._DISABLED_ATTRIBUTE) && e.keyCode === luda.KEY_TAB && e.target.nodeName.toUpperCase() === 'INPUT' && e.target.type === 'radio') {
            if (e.shiftKey) {
              if ($prev = self._query$prev$next(e.target).$prev) {
                e.preventDefault();
                return $prev.focus();
              }
            } else {
              if ($next = self._query$prev$next(e.target).$next) {
                e.preventDefault();
                return $next.focus();
              }
            }
          }
        });
      }

    };

    _Class._SCOPE = 'tabulate';

    _Class._SELECTORS = ['input[type=radio]:not([disabled])'];

    _Class._DISABLED_ATTRIBUTE = 'data-tabulate-disabled';

    return _Class;

  }).call(this));

  luda((function() {
    var _Class;

    _Class = class extends luda.Static {
      static activate(name$target) {
        return this._query$targets(name$target).forEach(($target) => {
          if ($target.classList.contains(this._ACTIVE_CSS_CLASS)) {
            return;
          }
          if (this._isTransitioning($target)) {
            return;
          }
          if (this._activatePrevented($target)) {
            return;
          }
          $target.classList.add(this._ACTIVE_CSS_CLASS);
          this._handleActivateEnd($target);
          if (this._shouldAutoDeactivate($target)) {
            return this._delayDeactivate($target);
          }
        });
      }

      static deactivate(name$target) {
        return this._query$targets(name$target).forEach(($target) => {
          if (!$target.classList.contains(this._ACTIVE_CSS_CLASS)) {
            return;
          }
          if (this._isTransitioning($target)) {
            return;
          }
          if (this._deactivatePrevented($target)) {
            return;
          }
          $target.classList.remove(this._ACTIVE_CSS_CLASS);
          return this._handleDeactivateEnd($target);
        });
      }

      static toggle(name$target) {
        return this._query$targets(name$target).forEach(($target) => {
          if ($target.classList.contains(this._ACTIVE_CSS_CLASS)) {
            return this.deactivate($target);
          } else {
            return this.activate($target);
          }
        });
      }

      static _onElementAdded($ele) {
        this._handleActivateCancel($ele);
        this._handleDeactivateCancel($ele);
        if (this._shouldAutoDeactivate($ele)) {
          return this._delayDeactivate($ele);
        }
      }

      static _shouldAutoDeactivate($target) {
        return $target.hasAttribute(this._AUTO_DEACTIVATE_ATTRIBUTE);
      }

      static _delayDeactivate($target) {
        var delay;
        delay = parseInt($target.getAttribute(this._AUTO_DEACTIVATE_ATTRIBUTE), 10);
        if (!delay) {
          delay = this._AUTO_DEACTIVATE_DURATION;
        }
        return setTimeout(() => {
          if ($target) {
            return this.deactivate($target);
          }
        }, delay);
      }

      static _query$targets(name$target) {
        if (name$target instanceof Element) {
          return [name$target];
        } else {
          return luda.$children(`[${this._TOGGLE_TARGET_ATTRIBUTE}=${name$target}]`);
        }
      }

      static _init() {
        var clickEventSelector, self;
        self = this;
        clickEventSelector = `[${this._TOGGLE_FOR_ATTRIBUTE}],[${this._TOGGLE_ATTRIBUTE}]`;
        luda.on(luda._DOC_READY, function() {
          return luda.$children(self._selector).forEach(function($target) {
            if (self._shouldAutoDeactivate($target)) {
              return self._delayDeactivate($target);
            }
          });
        });
        return luda.on('click', clickEventSelector, function(e) {
          var toggleChecked;
          toggleChecked = false;
          return luda.eventPath(e).some(function($path) {
            var $toggle, toggleName;
            if ($path instanceof Element) {
              if ($path.hasAttribute(self._TOGGLE_ATTRIBUTE) || $path.hasAttribute(self._TOGGLE_FOR_ATTRIBUTE)) {
                if (toggleName = $path.getAttribute(self._TOGGLE_FOR_ATTRIBUTE)) {
                  self.toggle(toggleName);
                  toggleChecked = true;
                }
                if ($path.hasAttribute(self._TOGGLE_ATTRIBUTE)) {
                  if ($path.hasAttribute(self._TOGGLE_TARGET_ATTRIBUTE)) {
                    $toggle = $path;
                  } else {
                    $toggle = luda.$parent(`[${self._TOGGLE_TARGET_ATTRIBUTE}]`, $path);
                  }
                  if ($toggle) {
                    self.toggle($toggle);
                    return toggleChecked = true;
                  }
                }
              } else if ($path.hasAttribute(self._TOGGLE_DISABLED_ATTRIBUTE)) {
                return toggleChecked = true;
              }
            }
          });
        });
      }

    };

    _Class._SCOPE = 'toggle';

    _Class._TOGGLE_TARGET_ATTRIBUTE = 'data-toggle-target';

    _Class._TOGGLE_ATTRIBUTE = 'data-toggle';

    _Class._TOGGLE_FOR_ATTRIBUTE = 'data-toggle-for';

    _Class._TOGGLE_DISABLED_ATTRIBUTE = 'data-toggle-disabled';

    _Class._AUTO_DEACTIVATE_ATTRIBUTE = 'data-toggle-auto-deactivate';

    _Class._AUTO_DEACTIVATE_DURATION = 3000;

    _Class._ACTIVE_CSS_CLASS = 'toggle-active';

    _Class._SELECTORS = [`[${_Class._TOGGLE_TARGET_ATTRIBUTE}]`];

    return _Class;

  }).call(this));

  luda((function() {
    var _Class;

    _Class = class extends luda.Factory {
      reset() {
        this._$file.value = '';
        return this._setSimulatorInitialValue();
      }

      _getConfig() {
        var _$file, _$simulator;
        _$file = luda.$child(this.constructor._FILE_SELECTOR, this._$component);
        _$simulator = luda.$child(this.constructor._SIMULATOR_SELECTOR, this._$component);
        return {_$file, _$simulator};
      }

      _constructor() {
        ({_$file: this._$file, _$simulator: this._$simulator} = this._getConfig());
        return this._init();
      }

      _onMutations() {
        return this._constructor();
      }

      _insertSimulator() {
        this._$simulator = document.createElement('input');
        this._$simulator.tabIndex = -1;
        return luda.$after(this._$simulator, this._$file);
      }

      _setPlaceholderValue() {
        if (this._$file.hasAttribute(this.constructor._PLACEHOLDER_ATTRIBUTE)) {
          return this._$simulator.placeholder = this._$file.getAttribute(this.constructor._PLACEHOLDER_ATTRIBUTE);
        }
      }

      _setSimulatorValue() {
        var values;
        values = [];
        Array.from(this._$file.files).map(function(file) {
          return values.push(file.name);
        });
        if (values.length) {
          return this._$simulator.value = values.join(this.constructor._VALUE_SPLITOR);
        }
        return this._setSimulatorInitialValue();
      }

      _setSimulatorInitialValue() {
        if (this._$file.hasAttribute(this.constructor._VALUE_ATTRIBUTE)) {
          return this._$simulator.value = this._$file.getAttribute(this.constructor._VALUE_ATTRIBUTE);
        }
      }

      _init() {
        if (this._$file) {
          if (!this._$simulator) {
            this._insertSimulator();
          }
          this._setPlaceholderValue();
          return this._setSimulatorValue();
        }
      }

      static reset($file) {
        return this.query($file).reset();
      }

      static _init() {
        var self;
        self = this;
        luda.on('change', `${this._SELECTOR} ${this._FILE_SELECTOR}`, function(e) {
          return self.query(luda.$parent(self._SELECTOR, this))._setSimulatorValue();
        });
        return luda.on(luda._FORM_RESET, this._SELECTOR, function(e) {
          return setTimeout(() => {
            return self.query(this)._setSimulatorValue();
          });
        });
      }

    };

    _Class._SCOPE = 'fmFile';

    _Class._VALUE_SPLITOR = '   ';

    _Class._SELECTOR = '.fm-file';

    _Class._FILE_SELECTOR = 'input[type=file]';

    _Class._SIMULATOR_SELECTOR = 'input:not([type=file])';

    _Class._PLACEHOLDER_ATTRIBUTE = 'placeholder';

    _Class._VALUE_ATTRIBUTE = 'value';

    _Class._observerConfig = {
      childList: true,
      subtree: true
    };

    return _Class;

  }).call(this));

  luda((function() {
    var _Class;

    _Class = class extends luda.Factory {
      select(indexOrIndexArray) {
        var selectedIndexes;
        if (this._$select.multiple) {
          if (this._$multipleSelectPlaceholder) {
            selectedIndexes = indexOrIndexArray;
          } else {
            selectedIndexes = indexOrIndexArray.map(function(index) {
              return index + 1;
            });
          }
          Array.from(this._$select.options).forEach(function($option, index) {
            return $option.selected = selectedIndexes.includes(index);
          });
          return this._markSelectedOption();
        } else {
          this._$select.selectedIndex = indexOrIndexArray;
          this._setSingleSelectSimulatorValue();
          return this._markSelectedOption();
        }
      }

      _getConfig() {
        var _$defaultSelectedOptions, _$multipleSelectPlaceholder, _$select, _$singleSelectSimulator, _defaultSelectedOptionMarked;
        _$select = luda.$child(this.constructor._SELECT_SELECTOR, this._$component);
        _$singleSelectSimulator = luda.$child(this.constructor._SINGLE_SELECT_SIMULATOR_SELECTOR, this._$component);
        _$multipleSelectPlaceholder = luda.$child(`.${this.constructor._MULTIPLE_SELECT_PLACEHOLDER_CSS_CLASS}`, this._$component);
        _$defaultSelectedOptions = luda.$children(`[${this.constructor._DEFAULT_SELECTED_OPTION_ATTRIBUTE}]`, this._$component);
        _defaultSelectedOptionMarked = this._$component.hasAttribute(this.constructor._INITED_ATTRIBUTE);
        return {_$select, _$singleSelectSimulator, _$multipleSelectPlaceholder, _$defaultSelectedOptions, _defaultSelectedOptionMarked};
      }

      _constructor() {
        ({_$select: this._$select, _$singleSelectSimulator: this._$singleSelectSimulator, _$multipleSelectPlaceholder: this._$multipleSelectPlaceholder, _$defaultSelectedOptions: this._$defaultSelectedOptions, _defaultSelectedOptionMarked: this._defaultSelectedOptionMarked} = this._getConfig());
        if (this._$select) {
          if (this._$select.multiple) {
            return this._initMultipleSelect();
          } else {
            return this._initSingleSelect();
          }
        }
      }

      _onMutations() {
        return this._constructor();
      }

      _markSelectedOption() {
        if (this._observer) {
          this._disconnect();
        }
        Array.from(this._$select.options).forEach(function($option) {
          if ($option.selected) {
            return $option.setAttribute('selected', 'selected');
          } else {
            return $option.removeAttribute('selected');
          }
        });
        if (!this._observer) {
          return this._observe();
        }
      }

      _markDefaultSelectedOption() {
        this._$component.setAttribute(this.constructor._INITED_ATTRIBUTE, '');
        return Array.from(this._$select.options).forEach(($option) => {
          if ($option.selected) {
            return $option.setAttribute(this.constructor._DEFAULT_SELECTED_OPTION_ATTRIBUTE, '');
          }
        });
      }

      _setSingleSelectedDefaultSelectedOption() {
        var hasSelected;
        hasSelected = Array.from(this._$select.options).some(function($option) {
          return $option.getAttribute('selected') === 'selected';
        });
        if (!hasSelected) {
          return this._$select.selectedIndex = -1;
        }
      }

      _insertSingleSelectSimulator() {
        this._$singleSelectSimulator = document.createElement('input');
        this._$singleSelectSimulator.tabIndex = -1;
        return luda.$after(this._$singleSelectSimulator, this._$select);
      }

      _setSingleSelectPlaceholderValue() {
        return this._$singleSelectSimulator.placeholder = this._$select.getAttribute(this.constructor._PLACEHOLDER_ATTRIBUTE);
      }

      _setSingleSelectSimulatorValue() {
        var $selectedOption;
        if ($selectedOption = this._$select.options[this._$select.selectedIndex]) {
          return this._$singleSelectSimulator.value = $selectedOption.innerText;
        } else {
          return this._$singleSelectSimulator.value = '';
        }
      }

      _initSingleSelect() {
        if (!this._$singleSelectSimulator) {
          this._insertSingleSelectSimulator();
        }
        if (this._$select.hasAttribute(this.constructor._PLACEHOLDER_ATTRIBUTE)) {
          this._setSingleSelectedDefaultSelectedOption();
          this._setSingleSelectPlaceholderValue();
        }
        if (!this._defaultSelectedOptionMarked) {
          this._markDefaultSelectedOption();
        }
        this._setSingleSelectSimulatorValue();
        return this._markSelectedOption();
      }

      _insertMultipleSelectBlankOption() {
        this._$multipleSelectPlaceholder = document.createElement('option');
        this._$multipleSelectPlaceholder.className = this.constructor._MULTIPLE_SELECT_PLACEHOLDER_CSS_CLASS;
        this._$multipleSelectPlaceholder.disabled = true;
        return luda.$prepend(this._$multipleSelectPlaceholder, this._$select);
      }

      _setMultipleSelectPlaceholderValue() {
        return this._$multipleSelectPlaceholder.innerText = this._$select.getAttribute(this.constructor._PLACEHOLDER_ATTRIBUTE);
      }

      _initMultipleSelect() {
        if (!this._$multipleSelectPlaceholder) {
          if (this._$select.hasAttribute(this.constructor._PLACEHOLDER_ATTRIBUTE)) {
            this._insertMultipleSelectBlankOption();
            this._setMultipleSelectPlaceholderValue();
          }
        }
        if (!this._defaultSelectedOptionMarked) {
          return this._markDefaultSelectedOption();
        }
      }

      _reset() {
        if (this._$select) {
          Array.from(this._$select.options).forEach(($option) => {
            return $option.selected = this._$defaultSelectedOptions.includes($option);
          });
          if (!this._$select.multiple) {
            this._setSingleSelectSimulatorValue();
          }
          return this._markSelectedOption();
        }
      }

      static select($select, indexOrIndexArray) {
        return this.query($select).select(indexOrIndexArray);
      }

      static _init() {
        var self;
        self = this;
        luda.on('change', `${this._SELECTOR} ${this._SELECT_SELECTOR}`, function(e) {
          var instance;
          instance = self.query(luda.$parent(self._SELECTOR, this));
          if (!this.multiple) {
            instance._setSingleSelectSimulatorValue();
          }
          return instance._markSelectedOption();
        });
        return luda.on(luda._FORM_RESET, this._SELECTOR, function(e) {
          return setTimeout(() => {
            return self.query(this)._reset();
          });
        });
      }

    };

    _Class._SCOPE = 'fmSelect';

    _Class._SELECTOR = '.fm-select';

    _Class._SELECT_SELECTOR = 'select';

    _Class._SINGLE_SELECT_SIMULATOR_SELECTOR = 'input';

    _Class._PLACEHOLDER_ATTRIBUTE = 'placeholder';

    _Class._MULTIPLE_SELECT_PLACEHOLDER_CSS_CLASS = 'fm-select-multiple-placeholder';

    _Class._DEFAULT_SELECTED_OPTION_ATTRIBUTE = 'data-fm-select-default-selected';

    _Class._INITED_ATTRIBUTE = 'data-fm-select-inited';

    _Class._observerConfig = {
      childList: true,
      attributes: true,
      subtree: true,
      attributeFilter: ['selected']
    };

    return _Class;

  }).call(this));

  luda((function() {
    var _Class;

    _Class = class extends luda.Factory {
      
      // public
      activate(index) {
        var action, activatedIndex;
        if (this._$items.length && !this._isTransitioning()) {
          activatedIndex = this._activeIndex;
          if ((index != null) && index !== this._activeIndex && (0 <= index && index <= this._$items.length - 1) && this._canTransition(index, activatedIndex)) {
            this._activeIndex = index;
            action = index < activatedIndex ? '_slidePrev' : '_slideNext';
            return this[action](activatedIndex);
          }
        }
      }

      next() {
        var activatedIndex, index;
        if (this._$items.length && !this._isTransitioning()) {
          activatedIndex = this._activeIndex;
          index = activatedIndex + 1;
          if (index > this._$items.length - 1) {
            if (!this._wrap) {
              return;
            }
            index = 0;
          }
          if (!this._canTransition(index, activatedIndex)) {
            return;
          }
          this._activeIndex = index;
          this._slideNext(activatedIndex);
          this._playTimeStamp = Date.now();
          return this._pausedRemainTime = this._interval;
        }
      }

      prev() {
        var activatedIndex, index;
        if (this._$items.length && !this._isTransitioning()) {
          activatedIndex = this._activeIndex;
          index = activatedIndex - 1;
          if (index < 0) {
            if (!this._wrap) {
              return;
            }
            index = this._$items.length - 1;
          }
          if (!this._canTransition(index, activatedIndex)) {
            return;
          }
          this._activeIndex = index;
          this._slidePrev(activatedIndex);
          this._playTimeStamp = Date.now();
          return this._pausedRemainTime = this._interval;
        }
      }

      pause() {
        if (this._intervaling != null) {
          clearInterval(this._intervaling);
          this._intervaling = null;
          return this._pausedRemainTime = this._pausedRemainTime - (Date.now() - this._playTimeStamp);
        }
      }

      play() {
        var execute;
        if (this._interval && this._$items.length > 1) {
          this._playTimeStamp = Date.now();
          this.pause();
          execute = () => {
            this.next();
            return this._intervaling = setInterval(this.next.bind(this), this._interval);
          };
          return this._intervaling = setTimeout(execute, this._pausedRemainTime);
        }
      }

      // private
      _getConfig() {
        var _$indicators, _$items, _$nextControl, _$prevControl, _activeIndex, _interval, _wrap;
        _$items = luda.$unnested(this.constructor._ITEMS_SELECTOR, this._$component, this.constructor._SELECTOR);
        _$indicators = luda.$unnested(this.constructor._INDICATORS_SELECTOR, this._$component, this.constructor._SELECTOR);
        _$prevControl = luda.$child(this.constructor._PREV_CONTROL_SELECTOR, this._$component);
        _$nextControl = luda.$child(this.constructor._NEXT_CONTROL_SELECTOR, this._$component);
        _activeIndex = _$items.indexOf(luda.$child(`.${this.constructor._ITEM_ACTIVE_CSS_CLASS}`, this._$component));
        if (_activeIndex === -1) {
          _activeIndex = this.constructor._ACTIVE_INDEX;
        }
        _interval = this._$component.getAttribute(this.constructor._INTERVAL_ATTRIBUTE);
        if (_interval === this.constructor._FALSE) {
          _interval = false;
        } else {
          _interval = Math.abs(parseInt(_interval, 10)) || this.constructor._INTERVAL;
        }
        _wrap = this._$component.getAttribute(this.constructor._WRAP_ATTRIBUTE);
        _wrap = _wrap === this.constructor._FALSE ? false : this.constructor._WRAP;
        return {_$items, _$indicators, _$prevControl, _$nextControl, _activeIndex, _interval, _wrap};
      }

      _constructor() {
        ({_$items: this._$items, _$indicators: this._$indicators, _$prevControl: this._$prevControl, _$nextControl: this._$nextControl, _activeIndex: this._activeIndex, _interval: this._interval, _wrap: this._wrap} = this._getConfig());
        this._intervaling = null;
        this._playTimeStamp = 0;
        this._pausedRemainTime = this._interval;
        this._layout();
        this._handleTransitionCancel();
        return this.play();
      }

      _onMutations(mutations) {
        ({_$items: this._$items, _$indicators: this._$indicators, _$prevControl: this._$prevControl, _$nextControl: this._$nextControl, _activeIndex: this._activeIndex, _interval: this._interval, _wrap: this._wrap} = this._getConfig());
        this._setIndicatorsState();
        this._setDirectionControlState();
        return this.play();
      }

      _destroy() {
        return this.pause();
      }

      _layout() {
        this._$items.forEach(($item, index) => {
          $item.style.transition = 'none';
          if (index > this._activeIndex) {
            $item.classList.add(this.constructor._ITEM_NEXT_CSS_CLASS);
            $item.classList.remove(this.constructor._ITEM_PREV_CSS_CLASS);
            $item.classList.remove(this.constructor._ITEM_ACTIVE_CSS_CLASS);
          } else if (index < this._activeIndex) {
            $item.classList.add(this.constructor._ITEM_PREV_CSS_CLASS);
            $item.classList.remove(this.constructor._ITEM_NEXT_CSS_CLASS);
            $item.classList.remove(this.constructor._ITEM_ACTIVE_CSS_CLASS);
          } else {
            $item.classList.add(this.constructor._ITEM_ACTIVE_CSS_CLASS);
            $item.classList.remove(this.constructor._ITEM_NEXT_CSS_CLASS);
            $item.classList.remove(this.constructor._ITEM_PREV_CSS_CLASS);
          }
          luda.reflow($item);
          return $item.style.transition = '';
        });
        this._setIndicatorsState();
        return this._setDirectionControlState();
      }

      _slideNext(activatedIndex) {
        var $activatedItem, $item;
        if (this._$items.length > 1) {
          $item = this._$items[this._activeIndex];
          $activatedItem = this._$items[activatedIndex];
          $item.style.transition = 'none';
          $item.classList.remove(this.constructor._ITEM_PREV_CSS_CLASS);
          $item.classList.add(this.constructor._ITEM_NEXT_CSS_CLASS);
          luda.reflow($item);
          $item.style.transition = '';
          $item.classList.remove(this.constructor._ITEM_NEXT_CSS_CLASS);
          $item.classList.add(this.constructor._ITEM_ACTIVE_CSS_CLASS);
          $activatedItem.classList.remove(this.constructor._ITEM_ACTIVE_CSS_CLASS);
          $activatedItem.classList.add(this.constructor._ITEM_PREV_CSS_CLASS);
          this._handleTransitionEnd(this._activeIndex, activatedIndex);
          this._setIndicatorsState();
          return this._setDirectionControlState();
        }
      }

      _slidePrev(activatedIndex) {
        var $activatedItem, $item;
        if (this._$items.length > 1) {
          $item = this._$items[this._activeIndex];
          $activatedItem = this._$items[activatedIndex];
          $item.style.transition = 'none';
          $item.classList.remove(this.constructor._ITEM_NEXT_CSS_CLASS);
          $item.classList.add(this.constructor._ITEM_PREV_CSS_CLASS);
          luda.reflow($item);
          $item.style.transition = '';
          $item.classList.remove(this.constructor._ITEM_PREV_CSS_CLASS);
          $item.classList.add(this.constructor._ITEM_ACTIVE_CSS_CLASS);
          $activatedItem.classList.remove(this.constructor._ITEM_ACTIVE_CSS_CLASS);
          $activatedItem.classList.add(this.constructor._ITEM_NEXT_CSS_CLASS);
          this._handleTransitionEnd(this._activeIndex, activatedIndex);
          this._setIndicatorsState();
          return this._setDirectionControlState();
        }
      }

      _canTransition(activeIndex, activatedIndex) {
        return !this._activatePrevented(this._$items[activeIndex], activeIndex) && !this._deactivatePrevented(this._$items[activatedIndex], activatedIndex);
      }

      _handleTransitionEnd(activeIndex, activatedIndex) {
        var activateDuration, deactivateDuration;
        activateDuration = this._handleActivateEnd(this._$items[activeIndex], activeIndex);
        return deactivateDuration = this._handleDeactivateEnd(this._$items[activatedIndex], activatedIndex);
      }

      _handleTransitionCancel() {
        var activatedIndex, index;
        if (this._isActivating()) {
          index = parseInt(this._getActivatingMark(), 10);
          this._handleActivateCancel(this._$items[index], index);
        }
        if (this._isDeactivating()) {
          activatedIndex = parseInt(this._getDeactivatingMark(), 10);
          return this._handleDeactivateCancel(this._$items[activatedIndex], activatedIndex);
        }
      }

      _setIndicatorsState() {
        return this._$indicators.forEach(($indicator, index) => {
          return $indicator.disabled = index === this._activeIndex;
        });
      }

      _setDirectionControlState() {
        var ref, ref1, ref2, ref3;
        if (this._$items.length <= 1) {
          return (ref = this._$prevControl) != null ? ref.disabled = (ref1 = this._$nextControl) != null ? ref1.disabled = true : void 0 : void 0;
        } else {
          if ((ref2 = this._$prevControl) != null) {
            ref2.disabled = this._activeIndex === 0 && !this._wrap;
          }
          return (ref3 = this._$nextControl) != null ? ref3.disabled = this._activeIndex === this._$items.length - 1 && !this._wrap : void 0;
        }
      }

      static activate($carousel, index) {
        return this.query($carousel).activate(index);
      }

      static next($carousel) {
        return this.query($carousel).next();
      }

      static prev($carousel) {
        return this.query($carousel).prev();
      }

      static pause($carousel) {
        return this.query($carousel).pause();
      }

      static play($carousel) {
        return this.query($carousel).play();
      }

      // static private
      static _init() {
        var self;
        self = this;
        luda.on('click', this._INDICATORS_SELECTOR, function(e) {
          var instance;
          instance = self.query(luda.$parent(self._SELECTOR, this));
          return instance.activate(instance._$indicators.indexOf(this));
        });
        luda.on('touchstart', this._SELECTOR, function(e) {
          return self.query(this).pause();
        });
        luda.on('touchend', this._SELECTOR, function(e) {
          return setTimeout(() => {
            return self.query(this).play();
          });
        });
        luda.on('mouseover', this._SELECTOR, function(e) {
          return self.query(this).pause();
        });
        luda.on('mouseout', this._SELECTOR, function(e) {
          return self.query(this).play();
        });
        luda.on(luda._SWIPE_LEFT_OR_UP, this._SELECTOR, function(startE, e) {
          return self.query(this).next();
        });
        luda.on(luda._SWIPE_RIGHT_OR_DOWN, this._SELECTOR, function(startE, e) {
          return self.query(this).prev();
        });
        luda.on('click', this._PREV_CONTROL_SELECTOR, function(e) {
          return self.query(luda.$parent(self._SELECTOR, this)).prev();
        });
        return luda.on('click', this._NEXT_CONTROL_SELECTOR, function(e) {
          return self.query(luda.$parent(self._SELECTOR, this)).next();
        });
      }

    };

    _Class._SCOPE = 'carousel';

    _Class._SELECTOR = '.carousel';

    _Class._ITEMS_SELECTOR = '.carousel-item';

    _Class._PREV_CONTROL_SELECTOR = '.carousel-prev';

    _Class._NEXT_CONTROL_SELECTOR = '.carousel-next';

    _Class._INDICATORS_SELECTOR = '.carousel-indicators .btn';

    _Class._INTERVAL_ATTRIBUTE = 'data-carousel-interval';

    _Class._WRAP_ATTRIBUTE = 'data-carousel-wrap';

    _Class._ACTIVATED_INDEX_ATTRIBUTE = 'data-carousel-activated-index';

    _Class._ITEM_ACTIVE_CSS_CLASS = 'carousel-item-active';

    _Class._ITEM_NEXT_CSS_CLASS = 'carousel-item-next';

    _Class._ITEM_PREV_CSS_CLASS = 'carousel-item-prev';

    _Class._ACTIVE_INDEX = 0;

    _Class._INTERVAL = 5000;

    _Class._WRAP = true;

    _Class._FALSE = 'false';

    _Class._observerConfig = {
      childList: true,
      attributes: true,
      subtree: true,
      attributeFilter: [_Class._INTERVAL_ATTRIBUTE, _Class._WRAP_ATTRIBUTE]
    };

    return _Class;

  }).call(this));

  luda((function() {
    var _Class;

    _Class = class extends luda.Factory {
      activate() {
        var ref;
        if (this._isActive() || this._isTransitioning()) {
          return;
        }
        if (this._activatePrevented(this._$menu)) {
          return;
        }
        this._$component.classList.add(this.constructor._ACTIVE_CSS_CLASS);
        this.constructor._$focused.push(document.activeElement);
        if ((ref = this._parent) != null) {
          ref.activate();
        }
        return this._handleActivateEnd(this._$menu);
      }

      deactivate(focus) {
        var ref;
        if (!(this._isActive() && !this._isTransitioning())) {
          return;
        }
        if (this._deactivatePrevented(this._$menu)) {
          return;
        }
        this._$component.classList.remove(this.constructor._ACTIVE_CSS_CLASS);
        this._children.forEach(function(child) {
          return child.deactivate();
        });
        if (focus) {
          if ((ref = this.constructor._$focused[this.constructor._$focused.length - 1]) != null) {
            ref.focus();
          }
        }
        this.constructor._$focused.splice(this.constructor._$focused.length - 1, 1);
        return this._handleDeactivateEnd(this._$menu);
      }

      toggle(focus) {
        if (this._isActive()) {
          return this.deactivate(focus);
        } else {
          return this.activate();
        }
      }

      _prev() {
        var focusIndex;
        if (this._$items.length && this._isActive()) {
          focusIndex = this._$items.indexOf(document.activeElement) - 1;
          if (focusIndex < 0) {
            focusIndex = 0;
          }
          return this._$items[focusIndex].focus();
        }
      }

      _next() {
        var focusIndex;
        if (this._$items.length && this._isActive()) {
          focusIndex = this._$items.indexOf(document.activeElement) + 1;
          if (focusIndex > this._$items.length - 1) {
            focusIndex = this._$items.length - 1;
          }
          return this._$items[focusIndex].focus();
        }
      }

      _getConfig() {
        var _$items, _$menu, _$noneSwitches, _$switches, _isStandalone;
        _$menu = luda.$child(this.constructor._MENU_SELECTOR, this._$component);
        _$switches = luda.$unnested(this.constructor._SWITCHES_SELECTOR, this._$component, this.constructor._SELECTOR).concat(luda.$unnested(this.constructor._SWITCHES_SELECTOR, _$menu, this.constructor._MENU_SELECTOR));
        _$noneSwitches = luda.$unnested(this.constructor._NONE_SWITCHES_SELECTOR, this._$component, this.constructor._SELECTOR).concat(luda.$unnested(this.constructor._NONE_SWITCHES_SELECTOR, _$menu, this.constructor._MENU_SELECTOR));
        _$items = luda.$unnested(this.constructor._ITEMS_SELECTOR, _$menu, this.constructor._MENU_SELECTOR);
        _isStandalone = this._$component.hasAttribute(this.constructor._STANDALONE_ATTRIBUTE);
        return {_$menu, _$items, _$switches, _$noneSwitches, _isStandalone};
      }

      _constructor() {
        this._onMutations();
        this._handleActivateCancel(this._$menu);
        return this._handleDeactivateCancel(this._$menu);
      }

      _onMutations(mutations) {
        return ({_$menu: this._$menu, _$items: this._$items, _$switches: this._$switches, _$noneSwitches: this._$noneSwitches, _isStandalone: this._isStandalone} = this._getConfig());
      }

      _isActive() {
        return this._$component.classList.contains(this.constructor._ACTIVE_CSS_CLASS);
      }

      _deactivateChildrenExcept(exceptions) {
        if (exceptions && !(exceptions instanceof Array)) {
          exceptions = [exceptions];
        }
        if (exceptions) {
          return this._children.forEach(function(child) {
            if (child._isActive() && !exceptions.includes(child)) {
              return child.deactivate();
            }
          });
        } else {
          return this._children.forEach(function(child) {
            if (child._isActive()) {
              return child.deactivate();
            }
          });
        }
      }

      static activate($dropdown) {
        return this.query($dropdown).activate();
      }

      static deactivate($dropdown, focus) {
        return this.query($dropdown).deactivate(focus);
      }

      static toggle($dropdown, focus) {
        return this.query($dropdown).toggle(focus);
      }

      static deactivateExcept(instances$dropdowns) {
        var exceptions;
        exceptions = [];
        if (instances$dropdowns && !(instances$dropdowns instanceof Array)) {
          instances$dropdowns = [instances$dropdowns];
        }
        if (instances$dropdowns) {
          instances$dropdowns.forEach((instance$dropdown) => {
            var exception;
            if (exception = this.query(instance$dropdown)) {
              return exceptions.push(exception);
            }
          });
        }
        if (exceptions.length) {
          return this._instances.forEach(function(instance) {
            var instanceHasntExceptionChild, instanceIsntInExceptions;
            instanceIsntInExceptions = !exceptions.includes(instance);
            instanceHasntExceptionChild = exceptions.every(function(exception) {
              return !instance._hasDescendant(exception);
            });
            if (instance._isActive() && instanceIsntInExceptions && instanceHasntExceptionChild) {
              return instance.deactivate();
            }
          });
        } else {
          return this._instances.forEach(function(instance) {
            if (instance._isActive()) {
              return instance.deactivate();
            }
          });
        }
      }

      static _standaloneInstances() {
        return this._instances.filter(function(instance) {
          if (instance._isStandalone) {
            return instance;
          }
        });
      }

      static _init() {
        var self;
        self = this;
        luda.onOpposite('click', this._SELECTOR, function(e) {
          return self.deactivateExcept(self._standaloneInstances());
        });
        luda.on('click', this._SELECTOR, function(e) {
          var focus, instance, toggleChecked;
          if (instance = self.query(this)) {
            toggleChecked = false;
            focus = !e.detail;
            self.deactivateExcept(self._standaloneInstances().concat(instance));
            instance._deactivateChildrenExcept();
            if (instance._parent) {
              instance._parent._deactivateChildrenExcept(instance);
            }
            if (instance._$switches.length || instance._$noneSwitches.length) {
              luda.eventPath(e).some(function($path) {
                if (instance._$switches.includes($path)) {
                  instance.toggle(focus);
                  return toggleChecked = true;
                } else if (instance._$noneSwitches.includes($path)) {
                  return toggleChecked = true;
                }
              });
            }
            if (!toggleChecked) {
              return instance.toggle(focus);
            }
          }
        });
        luda.onOpposite('keyup', this._SELECTOR, function(e) {
          return self.deactivateExcept();
        });
        luda.on('keyup', this._SELECTOR, function(e) {
          var instance;
          if (e.keyCode === luda.KEY_TAB && (instance = self.query(this))) {
            self.deactivateExcept(instance);
            return instance.activate();
          }
        });
        luda.on('keydown', this._SELECTOR, function(e) {
          var instance, ref;
          if (e.keyCode === luda.KEY_ESC && (instance = self.query(this))) {
            e.preventDefault();
            if (instance._isActive()) {
              return instance.deactivate(true);
            } else {
              return (ref = instance._parent) != null ? ref.deactivate(true) : void 0;
            }
          }
        });
        return luda.on('keydown', this._SELECTOR, function(e) {
          var instance, ref, ref1;
          if ([luda.KEY_LEFT, luda.KEY_UP].includes(e.keyCode) && (instance = self.query(this))) {
            e.preventDefault();
            if (instance._isActive()) {
              return instance._prev();
            } else {
              return (ref = instance._parent) != null ? ref._prev() : void 0;
            }
          } else if ([luda.KEY_RIGHT, luda.KEY_DOWN].includes(e.keyCode) && (instance = self.query(this))) {
            e.preventDefault();
            if (instance._isActive()) {
              return instance._next();
            } else {
              return (ref1 = instance._parent) != null ? ref1._next() : void 0;
            }
          }
        });
      }

    };

    _Class._SCOPE = 'dropdown';

    _Class._SELECTOR = '.dropdown-fixed,.dropdown-absolute, .dropdown-static,.dropdown-absolute-m';

    _Class._MENU_SELECTOR = '.dropdown-menu';

    _Class._ITEMS_SELECTOR = 'a[href]:not([disabled]),button:not([disabled]), input:not([disabled]),[tabindex]:not([disabled])';

    _Class._TOGGLE_ATTRIBUTE = 'data-dropdown-toggle';

    _Class._TOGGLE_DISABLED_ATTRIBUTE = 'data-dropdown-toggle-disabled';

    _Class._STANDALONE_ATTRIBUTE = 'data-dropdown-standalone';

    _Class._SWITCHES_SELECTOR = `[${_Class._TOGGLE_ATTRIBUTE}]`;

    _Class._NONE_SWITCHES_SELECTOR = `[${_Class._TOGGLE_DISABLED_ATTRIBUTE}]`;

    _Class._ACTIVE_CSS_CLASS = 'dropdown-active';

    _Class._observerConfig = {
      childList: true,
      attributes: true,
      subtree: true,
      attributeFilter: [_Class._TOGGLE_ATTRIBUTE, _Class._TOGGLE_DISABLED_ATTRIBUTE, _Class._STANDALONE_ATTRIBUTE]
    };

    _Class._$focused = [];

    return _Class;

  }).call(this));

  luda((function() {
    var _Class;

    _Class = class extends luda.Factory {
      _getConfig() {
        var _$defaultValues, _$valueHolder, _$values;
        _$values = luda.$children(this.constructor._VALUE_SELECTOR, this._$component);
        _$defaultValues = luda.$children(this.constructor._DEFAULT_VALUE_SELECTOR, this._$component);
        _$valueHolder = luda.$child(this.constructor._VALUE_HOLDER_SELECTOR, this._$component);
        return {_$values, _$valueHolder, _$defaultValues};
      }

      _constructor() {
        ({_$values: this._$values, _$valueHolder: this._$valueHolder, _$defaultValues: this._$defaultValues} = this._getConfig());
        this._setValueHolderAttribute();
        return this._setValueHolderValue();
      }

      _onMutations() {
        return this._constructor();
      }

      _setValueHolderValue() {
        var values;
        values = [];
        this._$values.forEach(($value, index) => {
          var value;
          if ($value.checked) {
            if ($value.hasAttribute(this.constructor._LABEL_ATTRIBUTE)) {
              value = $value.getAttribute(this.constructor._LABEL_ATTRIBUTE);
            } else {
              value = this._$defaultValues[index].innerText;
            }
          }
          if (value && !values.includes(value)) {
            return values.push(value);
          }
        });
        if (this._$valueHolder) {
          return this._$valueHolder.value = values.join(this.constructor._VALUE_SPLITOR);
        }
      }

      _setValueHolderAttribute() {
        if (this._$valueHolder) {
          return this._$valueHolder.setAttribute('readonly', '');
        }
      }

      static _init() {
        var self;
        self = this;
        luda.enter._add(this._ENTER_BEHAVIOR_SELECTOR);
        luda.on('change', `${this._SELECTOR} ${this._VALUE_SELECTOR}`, function(e) {
          return self.query(luda.$parent(self._SELECTOR, this))._setValueHolderValue();
        });
        luda.on(luda._FORM_RESET, this._SELECTOR, function(e) {
          return setTimeout(() => {
            return self.query(this)._setValueHolderValue();
          });
        });
        // prevent ios device pop out wired navigation pannel
        if (/iphone/i.test(navigator.userAgent) || /ipad/i.test(navigator.userAgent)) {
          return luda.on('focusin', this._ENTER_BEHAVIOR_SELECTOR, function(e) {
            this.blur();
            return this.classList.add(luda.focus._CSS_CLASS);
          });
        }
      }

    };

    _Class._SCOPE = 'fmDropdown';

    _Class._SELECTOR = '.fm-dropdown';

    _Class._VALUE_SPLITOR = '   ';

    _Class._LABEL_ATTRIBUTE = 'data-fm-dropdown-label';

    _Class._VALUE_SELECTOR = '.dropdown-items .btn-radio input, .dropdown-items .btn-check input';

    _Class._DEFAULT_VALUE_SELECTOR = '.dropdown-items .btn-radio label, .dropdown-items .btn-check label';

    _Class._VALUE_HOLDER_SELECTOR = '.fm input';

    _Class._ENTER_BEHAVIOR_SELECTOR = '.fm-dropdown .fm input';

    _Class._observerConfig = {
      childList: true,
      attributes: true,
      subtree: true,
      attributeFilter: ['checked', _Class._LABEL_ATTRIBUTE]
    };

    return _Class;

  }).call(this));

  luda((function() {
    var _Class;

    _Class = class extends luda.Factory {
      
      // public
      activate(index) {
        var activatedIndex;
        if (this._$panes.length && !this._isTransitioning()) {
          activatedIndex = this._activeIndex;
          if ((index != null) && index !== this._activeIndex && (0 <= index && index <= this._$panes.length - 1)) {
            if (!this._canTransition(index, activatedIndex)) {
              return;
            }
            this._activeIndex = index;
            return this._activate(activatedIndex);
          }
        }
      }

      // private
      _getConfig() {
        var _$indicators, _$panes, _activeIndex;
        _$panes = luda.$unnested(this.constructor._PANE_SELECTOR, this._$component, this.constructor._SELECTOR);
        _$indicators = luda.$unnested(this.constructor._INDICATOR_SELECTOR, this._$component, this.constructor._SELECTOR);
        _activeIndex = this.constructor._ACTIVE_INDEX;
        _$indicators.some(function($indicator, index) {
          if ($indicator.checked) {
            _activeIndex = index;
            return true;
          }
        });
        return {_$panes, _$indicators, _activeIndex};
      }

      _constructor() {
        ({_$panes: this._$panes, _$indicators: this._$indicators, _activeIndex: this._activeIndex} = this._getConfig());
        this._layout();
        return this._handleTransitionCancel();
      }

      _onMutations(mutations) {
        ({_$panes: this._$panes, _$indicators: this._$indicators, _activeIndex: this._activeIndex} = this._getConfig());
        return this._setIndicatorsState();
      }

      _layout() {
        this._$panes.forEach(($pane, index) => {
          $pane.style.transition = 'none';
          if (index === this._activeIndex) {
            $pane.classList.add(this.constructor._PANE_ACTIVE_CSS_CLASS);
          } else {
            $pane.classList.remove(this.constructor._PANE_ACTIVE_CSS_CLASS);
          }
          luda.reflow($pane);
          return $pane.style.transition = '';
        });
        return this._setIndicatorsState();
      }

      _activate(activatedIndex) {
        var $activatedPane, $pane;
        $pane = this._$panes[this._activeIndex];
        $activatedPane = this._$panes[activatedIndex];
        $pane.classList.add(this.constructor._PANE_ACTIVE_CSS_CLASS);
        $activatedPane.classList.remove(this.constructor._PANE_ACTIVE_CSS_CLASS);
        this._handleTransitionEnd(this._activeIndex, activatedIndex);
        return this._setIndicatorsState();
      }

      _canTransition(activeIndex, activatedIndex) {
        return !this._activatePrevented(this._$panes[activeIndex], activeIndex) && !this._deactivatePrevented(this._$panes[activatedIndex], activatedIndex);
      }

      _handleTransitionEnd(activeIndex, activatedIndex) {
        var activateDuration, deactivateDuration;
        activateDuration = this._handleActivateEnd(this._$panes[activeIndex], activeIndex);
        return deactivateDuration = this._handleDeactivateEnd(this._$panes[activatedIndex], activatedIndex);
      }

      _handleTransitionCancel() {
        var activatedIndex, index;
        if (this._isActivating()) {
          index = parseInt(this._getActivatingMark(), 10);
          this._handleActivateCancel(this._$panes[index], index);
        }
        if (this._isDeactivating()) {
          activatedIndex = parseInt(this._getDeactivatingMark(), 10);
          return this._handleDeactivateCancel(this._$panes[activatedIndex], activatedIndex);
        }
      }

      _setIndicatorsState() {
        return this._$indicators.forEach(($indicator, index) => {
          if (index === this._activeIndex) {
            $indicator.setAttribute('checked', '');
            return $indicator.checked = true;
          } else {
            $indicator.removeAttribute('checked');
            return $indicator.checked = false;
          }
        });
      }

      static activate($tab, index) {
        return this.query($tab).activate(index);
      }

      // static private
      static _init() {
        var self;
        self = this;
        return luda.on('change', this._INDICATOR_SELECTOR, function(e) {
          var instance;
          if (this.checked) {
            instance = self.query(luda.$parent(self._SELECTOR, this));
            instance._setIndicatorsState();
            return instance.activate(instance._$indicators.indexOf(this));
          }
        });
      }

    };

    _Class._SCOPE = 'tab';

    _Class._SELECTOR = '.tab';

    _Class._PANE_SELECTOR = '.tab-pane';

    _Class._INDICATOR_SELECTOR = '.tab-indicators .btn-radio input[type=radio]';

    _Class._PANE_ACTIVE_CSS_CLASS = 'tab-pane-active';

    _Class._ACTIVE_INDEX = 0;

    _Class._observerConfig = {
      childList: true,
      subtree: true
    };

    return _Class;

  }).call(this));

})));
//# sourceMappingURL=luda.js.map
