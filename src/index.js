const Lightense = () => {
  // default options
  const defaults = {
    time: 300,
    padding: 40,
    offset: 40,
    keyboard: true,
    cubicBezier: 'cubic-bezier(.2, 0, .1, 1)',
    background: 'var(--bg-color-80, rgba(255, 255, 255, .98))',
    backgroundFilter: 'blur(30px)',
    zIndex: 1000000,
    /* eslint-disable no-undefined */
    beforeShow: undefined,
    afterShow: undefined,
    beforeHide: undefined,
    afterHide: undefined
    /* eslint-enable no-undefined  */
  };

  // Init user options
  let config = {};

  function invokeCustomHook(methodName) {
    const method = config[methodName];

    if (!method) {
      return;
    }

    if (typeof method !== 'function') {
      throw `config.${methodName} must be a function!`;
    }

    Reflect.apply(method, config, [config]);
  }

  // Init target elements
  let elements;

  function getElements(target) {
    switch (typeof target) {
      case 'undefined':
        throw 'You need to pass an element!';

      case 'string':
        return document.querySelectorAll(target);

      case 'object':
        return target;
    }
  }

  function startTracking(passedElements) {
    // If passed an array of elements, assign tracking to all
    const len = passedElements.length;
    if (len) {
      // Loop and assign
      for (let i = 0; i < len; i++) {
        track(passedElements[i]);
      }
    } else {
      track(passedElements);
    }
  }

  function track(element) {
    if (!element || !element.src || element.classList.contains('lightense-target')) {
      return;
    }

    element.classList.add('lightense-target');
    element.addEventListener(
      'click',
      function(event) {
        if (config.keyboard) {
          // If Command (macOS) or Ctrl (Windows) key pressed, stop processing
          // and open the image in a new tab
          if (event.metaKey || event.ctrlKey) {
            return window.open(element.currentSrc, '_blank');
          }
        }

        // Init instance
        init(event.currentTarget);
      },
      false
    );
  }

  function insertCss(styleId, styleContent) {
    const head = document.head || document.getElementsByTagName('head')[0];
    const existingStyle = document.getElementById(styleId);

    // Remove existing instance
    if (existingStyle) {
      existingStyle.remove();
    }

    // Create new instance
    const styleEl = document.createElement('style');
    styleEl.id = styleId;

    // Check if content exists
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
    insertCss('lightense-images-css', css);
  }

  function createBackdrop() {
    const existingBackdrop = document.querySelector('.lightense-backdrop');
    if (existingBackdrop === null) {
      config.container = document.createElement('div');
      config.container.className = 'lightense-backdrop';
      document.body.appendChild(config.container);
    } else {
      config.container = existingBackdrop;
    }
  }

  function createTransform(img) {
    // Get original image size
    const naturalWidth = img.width;
    const naturalHeight = img.height;

    // Calc zoom ratio
    const scrollTop = window.pageYOffset || document.documentElement.scrollTop || 0;
    const scrollLeft = window.pageXOffset || document.documentElement.scrollLeft || 0;
    const targetImage = config.target.getBoundingClientRect();
    const maxScaleFactor = naturalWidth / targetImage.width;
    const viewportWidth = window.innerWidth || document.documentElement.clientWidth || 0;
    const viewportHeight = window.innerHeight || document.documentElement.clientHeight || 0;
    const viewportPadding =
      config.target.getAttribute('data-lightense-padding') ||
      config.target.getAttribute('data-padding') ||
      config.padding;
    const viewportWidthOffset =
      viewportWidth > viewportPadding
        ? viewportWidth - viewportPadding
        : viewportWidth - defaults.padding;
    const viewportHeightOffset =
      viewportHeight > viewportPadding
        ? viewportHeight - viewportPadding
        : viewportHeight - defaults.padding;
    const imageRatio = naturalWidth / naturalHeight;
    const viewportRatio = viewportWidthOffset / viewportHeightOffset;

    if (
      naturalWidth < viewportWidthOffset &&
      naturalHeight < viewportHeightOffset
    ) {
      config.scaleFactor = maxScaleFactor;
    } else if (imageRatio < viewportRatio) {
      config.scaleFactor =
        (viewportHeightOffset / naturalHeight) * maxScaleFactor;
    } else {
      config.scaleFactor =
        (viewportWidthOffset / naturalWidth) * maxScaleFactor;
    }

    // Calc animation
    const viewportX = viewportWidth / 2;
    const viewportY = scrollTop + viewportHeight / 2;
    const imageCenterX = targetImage.left + scrollLeft + targetImage.width / 2;
    const imageCenterY = targetImage.top + scrollTop + targetImage.height / 2;

    config.translateX = Math.round(viewportX - imageCenterX);
    config.translateY = Math.round(viewportY - imageCenterY);
  }

  function createViewer() {
    config.target.classList.add('lightense-open');

    // Create wrapper element
    config.wrap = document.createElement('div');
    config.wrap.className = 'lightense-wrap';

    // Apply zoom ratio to target image
    setTimeout(function() {
      config.target.style.transform = `scale(${config.scaleFactor})`;
    }, 20);

    // Apply animation to outer wrapper
    config.target.parentNode.insertBefore(config.wrap, config.target);
    config.wrap.appendChild(config.target);
    setTimeout(function() {
      config.wrap.style.transform = `translate3d(${config.translateX}px, ${config.translateY}px, 0)`;
    }, 20);

    // Show backdrop
    const itemOptions = {
      cubicBezier:
        config.target.getAttribute('data-lightense-cubic-bezier') ||
        config.cubicBezier,
      background:
        config.target.getAttribute('data-lightense-background') ||
        config.target.getAttribute('data-background') ||
        config.background,
      zIndex:
        config.target.getAttribute('data-lightense-z-index') || config.zIndex
    };

    // Create new config for item-specified styles
    const configComputed = {...config, ...itemOptions};

    const css = `
    :root {
      --lightense-z-index: ${configComputed.zIndex - 1};
      --lightense-backdrop: ${configComputed.background};
      --lightense-duration: ${configComputed.time}ms;
      --lightense-timing-func: ${configComputed.cubicBezier};
    }`;
    insertCss('lightense-images-css-computed', css);

    config.container.style.visibility = 'visible';
    setTimeout(function() {
      config.container.style.opacity = '1';
    }, 20);
  }

  function removeViewer() {
    invokeCustomHook('beforeHide');
    unbindEvents();

    config.target.classList.remove('lightense-open');

    // Remove transform styles
    config.wrap.style.transform = '';
    config.target.style.transform = '';
    config.target.classList.add('lightense-transitioning');

    // Fadeout backdrop
    config.container.style.opacity = '';

    // Hide backdrop and remove target element wrapper
    setTimeout(function() {
      invokeCustomHook('afterHide');
      config.container.style.visibility = '';
      config.container.style.backgroundColor = '';
      config.wrap.parentNode.replaceChild(config.target, config.wrap);
      config.target.classList.remove('lightense-transitioning');
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

    // TODO: need refine
    // If element already openned, close it
    if (config.target.classList.contains('lightense-open')) {
      return removeViewer();
    }

    invokeCustomHook('beforeShow');

    // Save current window scroll position for later use
    config.scrollY = window.scrollY;

    once(config.target, 'transitionend', function() {
      invokeCustomHook('afterShow');
    });

    // clone the original img element to prevent a network call.
    const img = config.target.cloneNode();
    if (img.id) {
      // when config.target had an id, make sure to delete the id of the cloned node
      // otherwise this may cause weirdness in the client application
      // when two html elements with the same id exist.
      img.removeAttribute('id');
    }
    // set the width and height of img, which is equivalent to initialising a new Image element
    // and setting its 'src' property.
    img.width = config.target.naturalWidth;
    img.height = config.target.naturalHeight;

    createTransform(img);
    createViewer();
    bindEvents();
  }

  function bindEvents() {
    window.addEventListener('keyup', onKeyUp, false);
    window.addEventListener('scroll', checkViewer, false);
    config.container.addEventListener('click', removeViewer, false);
  }

  function unbindEvents() {
    window.removeEventListener('keyup', onKeyUp, false);
    window.removeEventListener('scroll', checkViewer, false);
    config.container.removeEventListener('click', removeViewer, false);
  }

  // Exit on excape (esc) key pressed
  function onKeyUp(event) {
    event.preventDefault();
    if (event.key === 'Escape' || event.keyCode === 27) {
      removeViewer();
    }
  }

  function main(target, options = {}) {
    // Parse elements
    elements = getElements(target);

    // Parse user options
    config = {...defaults, ...options};

    // Prepare stylesheets
    createDefaultCss();

    // Prepare backdrop element
    createBackdrop();

    // Pass and prepare elements
    startTracking(elements);
  }

  return main;
};

const singleton = Lightense();

export default singleton;
