(function(global, factory) {
  typeof exports === "object" && typeof module !== "undefined" ? module.exports = factory() : typeof define === "function" && define.amd ? define(factory) : (global = typeof globalThis !== "undefined" ? globalThis : global || self, global.Lightense = factory());
})(this, (function() {
  "use strict";
  const lightenseCss = ":root {\n  --lightense-z-index: 999999;\n  --lightense-backdrop: rgba(255, 255, 255, 0.98);\n  --lightense-backdrop-filter: blur(30px);\n  --lightense-duration: 300ms;\n  --lightense-timing-func: cubic-bezier(0.2, 0, 0.1, 1);\n}\n\n.lightense-backdrop {\n  box-sizing: border-box;\n  width: 100%;\n  height: 100%;\n  position: fixed;\n  top: 0;\n  left: 0;\n  overflow: hidden;\n  z-index: calc(var(--lightense-z-index) - 1);\n  padding: 0;\n  margin: 0;\n  transition: opacity var(--lightense-duration) ease;\n  cursor: zoom-out;\n  opacity: 0;\n  background-color: var(--lightense-backdrop);\n  visibility: hidden;\n}\n\n@supports (-webkit-backdrop-filter: blur(30px)) {\n  .lightense-backdrop {\n    background-color: var(--lightense-backdrop);\n    -webkit-backdrop-filter: var(--lightense-backdrop-filter);\n  }\n}\n\n@supports (backdrop-filter: blur(30px)) {\n  .lightense-backdrop {\n    background-color: var(--lightense-backdrop);\n    backdrop-filter: var(--lightense-backdrop-filter);\n  }\n}\n\n.lightense-wrap {\n  position: relative;\n  transition:\n    transform var(--lightense-duration) var(--lightense-timing-func),\n    opacity var(--lightense-duration) ease;\n  z-index: var(--lightense-z-index);\n  pointer-events: none;\n}\n\n.lightense-target {\n  cursor: zoom-in;\n  transition: transform var(--lightense-duration) var(--lightense-timing-func);\n  pointer-events: auto;\n}\n\n.lightense-open {\n  cursor: zoom-out;\n}\n\n.lightense-transitioning {\n  pointer-events: none;\n}\n\n.lightense-nav {\n  position: absolute;\n  top: 50%;\n  transform: translateY(-50%);\n  width: 44px;\n  height: 44px;\n  border: 0;\n  border-radius: 999px;\n  padding: 0;\n  margin: 0;\n  font-size: 24px;\n  line-height: 44px;\n  text-align: center;\n  color: #fff;\n  background: rgba(0, 0, 0, 0.24);\n  cursor: pointer;\n  user-select: none;\n  opacity: 0;\n  pointer-events: none;\n  transition:\n    opacity var(--lightense-duration) ease,\n    background var(--lightense-duration) ease;\n}\n\n.lightense-nav:hover {\n  background: rgba(0, 0, 0, 0.4);\n}\n\n.lightense-nav-prev {\n  left: 20px;\n}\n\n.lightense-nav-next {\n  right: 20px;\n}\n\n.lightense-nav-visible {\n  opacity: 1;\n  pointer-events: auto;\n}\n";
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
      const css = `:root{--lightense-z-index:${config.zIndex - 1};--lightense-backdrop:${config.background};--lightense-backdrop-filter:${config.backgroundFilter};--lightense-duration:${config.time}ms;--lightense-timing-func:${config.cubicBezier}}`;
      insertCss("lightense-images-css-variables", css);
      insertCss("lightense-images-css-static", lightenseCss);
    }
    function createNavigationControl(controlClassName, ariaLabel, direction) {
      let control = config.container.querySelector(`.${controlClassName}`);
      if (!control) {
        control = document.createElement("button");
        control.className = `lightense-nav ${controlClassName}`;
        control.type = "button";
        control.setAttribute("aria-label", ariaLabel);
        control.innerText = direction < 0 ? "<" : ">";
        config.container.appendChild(control);
      }
      if (!control.dataset.lightenseNavBound) {
        control.addEventListener(
          "click",
          function(event) {
            event.preventDefault();
            event.stopPropagation();
            showAdjacent(direction);
          },
          false
        );
        control.dataset.lightenseNavBound = "true";
      }
      return control;
    }
    function createNavigationControls() {
      config.prevControl = createNavigationControl(
        "lightense-nav-prev",
        "Previous image",
        -1
      );
      config.nextControl = createNavigationControl(
        "lightense-nav-next",
        "Next image",
        1
      );
      hideNavigationControls();
    }
    function setNavigationControlVisible(control, isVisible) {
      if (!control) {
        return;
      }
      control.classList.toggle("lightense-nav-visible", isVisible);
      control.setAttribute("aria-hidden", `${!isVisible}`);
    }
    function hideNavigationControls() {
      config.prevTarget = null;
      config.nextTarget = null;
      setNavigationControlVisible(config.prevControl, false);
      setNavigationControlVisible(config.nextControl, false);
    }
    function isLoadedTarget(target) {
      return Boolean(target && target.src && target.complete && target.naturalWidth && target.naturalHeight);
    }
    function isAdjacentTargetAvailable(target) {
      if (target === config.target) {
        return isLoadedTarget(target);
      }
      return isNavigableTarget(target);
    }
    function getGroupingContainer() {
      const explicitGallery = config.target.closest(".gallery");
      if (explicitGallery) {
        return explicitGallery;
      }
      let current = config.target.parentElement;
      while (current && current !== document.body) {
        const targets = current.querySelectorAll(".lightense-target");
        if (targets.length > 1 && Array.from(targets).includes(config.target)) {
          return current;
        }
        current = current.parentElement;
      }
      return null;
    }
    function getAdjacentGroupedTarget(direction) {
      const group = getGroupingContainer();
      if (!group) {
        return null;
      }
      const groupTargets = Array.from(group.querySelectorAll(".lightense-target"));
      const currentIndex = groupTargets.indexOf(config.target);
      if (currentIndex < 0) {
        return null;
      }
      const adjacent = groupTargets[currentIndex + direction];
      if (!adjacent) {
        return null;
      }
      return isAdjacentTargetAvailable(adjacent) ? adjacent : null;
    }
    function getAdjacentSiblingTarget(direction) {
      const adjacent = direction < 0 ? config.target.previousElementSibling : config.target.nextElementSibling;
      if (!adjacent || !adjacent.classList || !adjacent.classList.contains("lightense-target")) {
        return null;
      }
      return isAdjacentTargetAvailable(adjacent) ? adjacent : null;
    }
    function getAdjacentTarget(direction) {
      if (!config.target) {
        return null;
      }
      return getAdjacentGroupedTarget(direction) || getAdjacentSiblingTarget(direction);
    }
    function updateNavigationControls() {
      config.prevTarget = getAdjacentTarget(-1);
      config.nextTarget = getAdjacentTarget(1);
      setNavigationControlVisible(config.prevControl, Boolean(config.prevTarget));
      setNavigationControlVisible(config.nextControl, Boolean(config.nextTarget));
    }
    function showAdjacent(direction) {
      if (config.isTransitioning) {
        return;
      }
      const adjacentTarget = direction < 0 ? config.prevTarget : config.nextTarget;
      if (!adjacentTarget) {
        return;
      }
      switchViewer(adjacentTarget, direction);
    }
    function restoreInlineTransitionStyle(element, transitionValue) {
      if (transitionValue) {
        element.style.transition = transitionValue;
        return;
      }
      element.style.removeProperty("transition");
    }
    function forceLayout(element) {
      return element.offsetWidth;
    }
    function getViewportWidth() {
      return window.innerWidth || document.documentElement.clientWidth || 0;
    }
    function getTranslate3d(x, y) {
      return `translate3d(${x}px, ${y}px, 0)`;
    }
    function getSwitchTravelX() {
      return Math.max(Math.round(getViewportWidth() * 0.75), 280);
    }
    function isNavigableTarget(target) {
      if (!target || !target.src || !target.complete) {
        return false;
      }
      if (!target.naturalWidth || !target.naturalHeight) {
        return false;
      }
      const rect = target.getBoundingClientRect();
      if (!rect.width || !rect.height) {
        return false;
      }
      let current = target;
      while (current && current.nodeType === 1) {
        const style = window.getComputedStyle(current);
        if (style.display === "none" || style.visibility === "hidden" || Number(style.opacity) === 0) {
          return false;
        }
        current = current.parentElement;
      }
      return true;
    }
    function getImageClone(target) {
      const img = target.cloneNode();
      if (img.id) {
        img.removeAttribute("id");
      }
      img.width = target.naturalWidth || target.width || target.clientWidth;
      img.height = target.naturalHeight || target.height || target.clientHeight;
      return img;
    }
    function animateCurrentViewerOut(direction) {
      if (!config.target || !config.wrap) {
        return;
      }
      const closingTarget = config.target;
      const closingWrap = config.wrap;
      const closingTranslateX = config.translateX;
      const closingTranslateY = config.translateY;
      const travelX = getSwitchTravelX();
      const destinationX = closingTranslateX + (direction > 0 ? -travelX : travelX);
      closingTarget.classList.remove("lightense-open");
      closingWrap.style.opacity = "0";
      closingWrap.style.transform = getTranslate3d(
        destinationX,
        closingTranslateY
      );
      setTimeout(function() {
        const previousTargetTransition = closingTarget.style.transition;
        closingTarget.style.transition = "none";
        closingTarget.style.transform = "";
        if (closingWrap.parentNode) {
          closingWrap.parentNode.replaceChild(closingTarget, closingWrap);
        }
        forceLayout(closingTarget);
        restoreInlineTransitionStyle(closingTarget, previousTargetTransition);
      }, config.time);
    }
    function switchViewer(target, direction) {
      if (!target || !config.target || !config.wrap || config.isTransitioning) {
        return;
      }
      if (!isNavigableTarget(target)) {
        updateNavigationControls();
        return;
      }
      config.isTransitioning = true;
      invokeCustomHook("beforeHide");
      hideNavigationControls();
      animateCurrentViewerOut(direction);
      invokeCustomHook("afterHide");
      config.target = target;
      config.wrap = null;
      config.scrollY = window.scrollY;
      invokeCustomHook("beforeShow");
      const img = getImageClone(config.target);
      if (!img.width || !img.height) {
        config.isTransitioning = false;
        return;
      }
      createTransform(img);
      createViewer({ switchDirection: direction });
      once(config.wrap, "transitionend", function() {
        invokeCustomHook("afterShow");
      });
      setTimeout(function() {
        config.isTransitioning = false;
      }, config.time);
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
      createNavigationControls();
    }
    function createTransform(img) {
      const naturalWidth = img.width;
      const naturalHeight = img.height;
      const scrollTop = window.pageYOffset || document.documentElement.scrollTop || 0;
      const scrollLeft = window.pageXOffset || document.documentElement.scrollLeft || 0;
      const targetImage = config.target.getBoundingClientRect();
      if (!naturalWidth || !naturalHeight || !targetImage.width || !targetImage.height) {
        config.scaleFactor = 1;
        config.translateX = 0;
        config.translateY = 0;
        return;
      }
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
    function createViewer({ switchDirection = 0 } = {}) {
      config.target.classList.add("lightense-open");
      config.wrap = document.createElement("div");
      config.wrap.className = "lightense-wrap";
      config.target.parentNode.insertBefore(config.wrap, config.target);
      config.wrap.appendChild(config.target);
      if (switchDirection) {
        const previousTargetTransition = config.target.style.transition;
        const previousWrapTransition = config.wrap.style.transition;
        const travelX = getSwitchTravelX();
        const startX = config.translateX + (switchDirection > 0 ? travelX : -travelX);
        config.target.style.transition = "none";
        config.wrap.style.transition = "none";
        config.target.style.transform = `scale(${config.scaleFactor})`;
        config.wrap.style.opacity = "0";
        config.wrap.style.transform = getTranslate3d(startX, config.translateY);
        forceLayout(config.wrap);
        restoreInlineTransitionStyle(config.target, previousTargetTransition);
        restoreInlineTransitionStyle(config.wrap, previousWrapTransition);
        setTimeout(function() {
          config.wrap.style.opacity = "1";
          config.wrap.style.transform = getTranslate3d(
            config.translateX,
            config.translateY
          );
        }, 20);
      } else {
        setTimeout(function() {
          config.target.style.transform = `scale(${config.scaleFactor})`;
        }, 20);
        setTimeout(function() {
          config.wrap.style.transform = getTranslate3d(
            config.translateX,
            config.translateY
          );
        }, 20);
      }
      const itemOptions = {
        cubicBezier: config.target.getAttribute("data-lightense-cubic-bezier") || config.cubicBezier,
        background: config.target.getAttribute("data-lightense-background") || config.target.getAttribute("data-background") || config.background,
        zIndex: config.target.getAttribute("data-lightense-z-index") || config.zIndex
      };
      const configComputed = { ...config, ...itemOptions };
      const css = `:root{--lightense-z-index:${configComputed.zIndex - 1};--lightense-backdrop:${configComputed.background};--lightense-duration:${configComputed.time}ms;--lightense-timing-func:${configComputed.cubicBezier}}`;
      insertCss("lightense-images-css-computed", css);
      config.container.style.visibility = "visible";
      setTimeout(function() {
        config.container.style.opacity = "1";
      }, 20);
      updateNavigationControls();
    }
    function removeViewer() {
      if (!config.target || !config.wrap || config.isTransitioning) {
        return;
      }
      config.isTransitioning = true;
      invokeCustomHook("beforeHide");
      unbindEvents();
      hideNavigationControls();
      const closingTarget = config.target;
      const closingWrap = config.wrap;
      closingTarget.classList.remove("lightense-open");
      closingWrap.style.transform = "";
      closingTarget.style.transform = "";
      closingTarget.classList.add("lightense-transitioning");
      config.container.style.opacity = "";
      setTimeout(function() {
        invokeCustomHook("afterHide");
        config.container.style.visibility = "";
        config.container.style.backgroundColor = "";
        if (closingWrap.parentNode) {
          closingWrap.parentNode.replaceChild(closingTarget, closingWrap);
        }
        closingTarget.classList.remove("lightense-transitioning");
        config.wrap = null;
        config.isTransitioning = false;
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
      if (!isNavigableTarget(config.target)) {
        return;
      }
      invokeCustomHook("beforeShow");
      config.scrollY = window.scrollY;
      once(config.target, "transitionend", function() {
        invokeCustomHook("afterShow");
      });
      const img = getImageClone(config.target);
      if (!img.width || !img.height) {
        return;
      }
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
        return;
      }
      if (config.keyboard && (event.key === "ArrowLeft" || event.keyCode === 37)) {
        showAdjacent(-1);
        return;
      }
      if (config.keyboard && (event.key === "ArrowRight" || event.keyCode === 39)) {
        showAdjacent(1);
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
