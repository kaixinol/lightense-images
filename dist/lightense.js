(function(global, factory) {
  typeof exports === "object" && typeof module !== "undefined" ? module.exports = factory() : typeof define === "function" && define.amd ? define(factory) : (global = typeof globalThis !== "undefined" ? globalThis : global || self, global.Lightense = factory());
})(this, (function() {
  "use strict";
  const Lightense = () => {
    const defaults = {
      time: 300,
      padding: 40,
      offset: 40,
      keyboard: true,
      cubicBezier: "cubic-bezier(.2, 0, .1, 1)",
      background: "var(--bg-color-80, rgba(255, 255, 255, .98))",
      backgroundFilter: "blur(30px)",
      zIndex: 1e6,
      /* eslint-disable no-undefined */
      beforeShow: void 0,
      afterShow: void 0,
      beforeHide: void 0,
      afterHide: void 0
      /* eslint-enable no-undefined  */
    };
    let config = {};
    function invokeCustomHook(methodName) {
      const method = config[methodName];
      if (!method) {
        return;
      }
      if (typeof method !== "function") {
        throw `config.${methodName} must be a function!`;
      }
      Reflect.apply(method, config, [config]);
    }
    let elements;
    function getElements(target) {
      switch (typeof target) {
        case "undefined":
          throw "You need to pass an element!";
        case "string":
          return document.querySelectorAll(target);
        case "object":
          return target;
      }
    }
    function startTracking(passedElements) {
      const len = passedElements.length;
      if (len) {
        for (let i = 0; i < len; i++) {
          track(passedElements[i]);
        }
      } else {
        track(passedElements);
      }
    }
    function track(element) {
      if (!element || !element.src || element.classList.contains("lightense-target")) {
        return;
      }
      element.classList.add("lightense-target");
      element.addEventListener(
        "click",
        function(event) {
          if (config.keyboard) {
            if (event.metaKey || event.ctrlKey) {
              return window.open(element.currentSrc, "_blank");
            }
          }
          init(event.currentTarget);
        },
        false
      );
    }
    function insertCss(styleId, styleContent) {
      const head = document.head || document.getElementsByTagName("head")[0];
      const existingStyle = document.getElementById(styleId);
      if (existingStyle) {
        existingStyle.remove();
      }
      const styleEl = document.createElement("style");
      styleEl.id = styleId;
      if (styleEl.styleSheet) {
        styleEl.styleSheet.cssText = styleContent;
      } else {
        styleEl.appendChild(document.createTextNode(styleContent));
      }
      head.appendChild(styleEl);
    }
    function createDefaultCss() {
      const css = `
:root {
  --lightense-z-index: ${config.zIndex - 1};
  --lightense-backdrop: ${config.background};
  --lightense-backdrop-filter: ${config.backgroundFilter};
  --lightense-duration: ${config.time}ms;
  --lightense-timing-func: ${config.cubicBezier};
}

.lightense-backdrop {
  box-sizing: border-box;
  width: 100%;
  height: 100%;
  position: fixed;
  top: 0;
  left: 0;
  overflow: hidden;
  z-index: calc(var(--lightense-z-index) - 1);
  padding: 0;
  margin: 0;
  transition: opacity var(--lightense-duration) ease;
  cursor: zoom-out;
  opacity: 0;
  background-color: var(--lightense-backdrop);
  visibility: hidden;
}

@supports (-webkit-backdrop-filter: blur(30px)) {
  .lightense-backdrop {
    background-color: var(--lightense-backdrop);
    -webkit-backdrop-filter: var(--lightense-backdrop-filter);
  }
}

@supports (backdrop-filter: blur(30px)) {
  .lightense-backdrop {
    background-color: var(--lightense-backdrop);
    backdrop-filter: var(--lightense-backdrop-filter);
  }
}

.lightense-wrap {
  position: relative;
  transition: transform var(--lightense-duration) var(--lightense-timing-func);
  z-index: var(--lightense-z-index);
  pointer-events: none;
}

.lightense-target {
  cursor: zoom-in;
  transition: transform var(--lightense-duration) var(--lightense-timing-func);
  pointer-events: auto;
}

.lightense-open {
  cursor: zoom-out;
}

.lightense-transitioning {
  pointer-events: none;
}`;
      insertCss("lightense-images-css", css);
    }
    function createBackdrop() {
      const existingBackdrop = document.querySelector(".lightense-backdrop");
      if (existingBackdrop === null) {
        config.container = document.createElement("div");
        config.container.className = "lightense-backdrop";
        document.body.appendChild(config.container);
      } else {
        config.container = existingBackdrop;
      }
    }
    function createTransform(img) {
      const naturalWidth = img.width;
      const naturalHeight = img.height;
      const scrollTop = window.pageYOffset || document.documentElement.scrollTop || 0;
      const scrollLeft = window.pageXOffset || document.documentElement.scrollLeft || 0;
      const targetImage = config.target.getBoundingClientRect();
      const maxScaleFactor = naturalWidth / targetImage.width;
      const viewportWidth = window.innerWidth || document.documentElement.clientWidth || 0;
      const viewportHeight = window.innerHeight || document.documentElement.clientHeight || 0;
      const viewportPadding = config.target.getAttribute("data-lightense-padding") || config.target.getAttribute("data-padding") || config.padding;
      const viewportWidthOffset = viewportWidth > viewportPadding ? viewportWidth - viewportPadding : viewportWidth - defaults.padding;
      const viewportHeightOffset = viewportHeight > viewportPadding ? viewportHeight - viewportPadding : viewportHeight - defaults.padding;
      const imageRatio = naturalWidth / naturalHeight;
      const viewportRatio = viewportWidthOffset / viewportHeightOffset;
      if (naturalWidth < viewportWidthOffset && naturalHeight < viewportHeightOffset) {
        config.scaleFactor = maxScaleFactor;
      } else if (imageRatio < viewportRatio) {
        config.scaleFactor = viewportHeightOffset / naturalHeight * maxScaleFactor;
      } else {
        config.scaleFactor = viewportWidthOffset / naturalWidth * maxScaleFactor;
      }
      const viewportX = viewportWidth / 2;
      const viewportY = scrollTop + viewportHeight / 2;
      const imageCenterX = targetImage.left + scrollLeft + targetImage.width / 2;
      const imageCenterY = targetImage.top + scrollTop + targetImage.height / 2;
      config.translateX = Math.round(viewportX - imageCenterX);
      config.translateY = Math.round(viewportY - imageCenterY);
    }
    function createViewer() {
      config.target.classList.add("lightense-open");
      config.wrap = document.createElement("div");
      config.wrap.className = "lightense-wrap";
      setTimeout(function() {
        config.target.style.transform = `scale(${config.scaleFactor})`;
      }, 20);
      config.target.parentNode.insertBefore(config.wrap, config.target);
      config.wrap.appendChild(config.target);
      setTimeout(function() {
        config.wrap.style.transform = `translate3d(${config.translateX}px, ${config.translateY}px, 0)`;
      }, 20);
      const itemOptions = {
        cubicBezier: config.target.getAttribute("data-lightense-cubic-bezier") || config.cubicBezier,
        background: config.target.getAttribute("data-lightense-background") || config.target.getAttribute("data-background") || config.background,
        zIndex: config.target.getAttribute("data-lightense-z-index") || config.zIndex
      };
      const configComputed = { ...config, ...itemOptions };
      const css = `
    :root {
      --lightense-z-index: ${configComputed.zIndex - 1};
      --lightense-backdrop: ${configComputed.background};
      --lightense-duration: ${configComputed.time}ms;
      --lightense-timing-func: ${configComputed.cubicBezier};
    }`;
      insertCss("lightense-images-css-computed", css);
      config.container.style.visibility = "visible";
      setTimeout(function() {
        config.container.style.opacity = "1";
      }, 20);
    }
    function removeViewer() {
      invokeCustomHook("beforeHide");
      unbindEvents();
      config.target.classList.remove("lightense-open");
      config.wrap.style.transform = "";
      config.target.style.transform = "";
      config.target.classList.add("lightense-transitioning");
      config.container.style.opacity = "";
      setTimeout(function() {
        invokeCustomHook("afterHide");
        config.container.style.visibility = "";
        config.container.style.backgroundColor = "";
        config.wrap.parentNode.replaceChild(config.target, config.wrap);
        config.target.classList.remove("lightense-transitioning");
      }, config.time);
    }
    function checkViewer() {
      const scrollOffset = Math.abs(config.scrollY - window.scrollY);
      if (scrollOffset >= config.offset) {
        removeViewer();
      }
    }
    function once(target, eventName, handler) {
      function onOnce(...args) {
        Reflect.apply(handler, this, args);
        target.removeEventListener(eventName, onOnce);
      }
      target.addEventListener(eventName, onOnce);
    }
    function init(element) {
      config.target = element;
      if (config.target.classList.contains("lightense-open")) {
        return removeViewer();
      }
      invokeCustomHook("beforeShow");
      config.scrollY = window.scrollY;
      once(config.target, "transitionend", function() {
        invokeCustomHook("afterShow");
      });
      const img = config.target.cloneNode();
      if (img.id) {
        img.removeAttribute("id");
      }
      img.width = config.target.naturalWidth;
      img.height = config.target.naturalHeight;
      createTransform(img);
      createViewer();
      bindEvents();
    }
    function bindEvents() {
      window.addEventListener("keyup", onKeyUp, false);
      window.addEventListener("scroll", checkViewer, false);
      config.container.addEventListener("click", removeViewer, false);
    }
    function unbindEvents() {
      window.removeEventListener("keyup", onKeyUp, false);
      window.removeEventListener("scroll", checkViewer, false);
      config.container.removeEventListener("click", removeViewer, false);
    }
    function onKeyUp(event) {
      event.preventDefault();
      if (event.key === "Escape" || event.keyCode === 27) {
        removeViewer();
      }
    }
    function main(target, options = {}) {
      elements = getElements(target);
      config = { ...defaults, ...options };
      createDefaultCss();
      createBackdrop();
      startTracking(elements);
    }
    return main;
  };
  const singleton = Lightense();
  return singleton;
}));
