/**
 * SVGInject - Version 1.0.3
 * A tiny, intuitive, robust, caching solution for injecting SVG files inline into the DOM.
 *
 * https://github.com/iconfu/svg-inject
 *
 * Copyright (c) 2018 INCORS, the creators of iconfu.com
 * @license MIT License - https://github.com/iconfu/svg-inject/blob/master/LICENSE
 */

(function(window, document) {
  // constants for better minification
  var NULL = null;
  var TRUE = true;
  var LENGTH = 'length';
  var SVG_NOT_SUPPORTED = 'SVG_NOT_SUPPORTED';
  var LOAD_FAIL = 'LOAD_FAIL';
  var SVG_INVALID = 'SVG_INVALID';
  var CREATE_ELEMENT = 'createElement';
  var __SVGINJECT = '__svgInject';

  // constants
  var ATTRIBUTE_EXCLUSION_NAMES = ['src', 'alt', 'onload', 'onerror'];
  var A_ELEMENT = document[CREATE_ELEMENT]('a');
  var DIV_ELEMENT = document[CREATE_ELEMENT]('div');
  var IS_SVG_NOT_SUPPORTED = typeof SVGRect == "undefined";
  var DEFAULT_OPTIONS = {
    cache: TRUE,
    copyAttributes: TRUE,
    makeIdsUnique: TRUE
  };
  var TAG_NAME_PROPERTIES_MAP = {
    clipPath: ['clip-path'],
    'color-profile': NULL,
    cursor: NULL,
    filter: NULL,
    linearGradient: ['fill', 'stroke'],
    marker: ['marker', 'marker-end', 'marker-mid', 'marker-start'],
    mask: NULL,
    pattern: ['fill', 'stroke'],
    radialGradient: ['fill', 'stroke']
  };
  var INJECT = 1;
  var INJECTED = 2;
  var FAIL = 3;

  var xmlSerializer;

  function getXMLSerializer() {
    xmlSerializer = xmlSerializer || new XMLSerializer();
    return xmlSerializer;
  }

  function getAbsoluteUrl(url) {
    A_ELEMENT.href = url;
    return A_ELEMENT.href;
  }

  function isSVGElem(svgElem) {
    return svgElem instanceof SVGElement;
  }

  // load svg with an XHR requuest
  function load(path, callback, errorCallback) {
    if (path) {
      var req = new XMLHttpRequest();
      req.onreadystatechange = function() {
        if (req.readyState == 4) {
          var status = req.status;
          if (status == 200) {
            // readyState is done, request status ok
            callback(req.responseXML, req.responseText.trim());
          } else if (status >= 400) {
            errorCallback();
          } else if (status == 0) {
            errorCallback();
          }
        }
      };
      req.open('GET', path, true);
      req.send();
    }
  }

  // copy attributes from img element to svg element
  function copyAttributes(img, svg) {
    var attributes = img.attributes;

    for (var i = 0; i < attributes[LENGTH]; ++i) {
      var attribute = attributes[i];
      var attributeName = attribute.name;

      if (ATTRIBUTE_EXCLUSION_NAMES.indexOf(attributeName) == -1) {
        var attributeValue = attribute.value;

        if (attributeName == 'title') {
          // if a title attribute exists insert it as the title tag in SVG
          var title = document.createElementNS('http://www.w3.org/2000/svg', 'title');
          title.textContent = attributeValue;

          var firstElementChild = svg.firstElementChild;

          if (firstElementChild && firstElementChild.tagName.toLowerCase() == 'title') {
            // if the SVGs first child is a title element, replace it with the new title element
            svg.replaceChild(title, firstElementChild);
          } else {
            // insert as first child
            svg.insertBefore(title, firstElementChild);
          }
        } else {
          svg.setAttribute(attributeName, attributeValue);
        }
      }
    }
  }

  // This function appends a unique suffix to IDs of elements in the <defs> element that can be
  // referenced by properties from within the SVG (for example "filter", "mask", etc.). References
  // to the IDs are adjusted accordingly. The suffix has the form "--inject-XXXXXXXX", where
  // XXXXXXXX is a random alphanumeric string of length 8.
  // The suffix is appended to avoid ID collision between two injected SVGs. Since all IDs within
  // one SVG must be unique anyway, we can use the same suffix for all IDs of one injected SVG.
  function makeIdsUnique(svg) {
    var i, j;
    var idSuffix = '--inject-';
    // Append a random alphanumeric string to the suffix. For an 8 character long string there are
    // 62^8 = 218340105584896 possible mutations.
    var rdm62;
    for (i = 0; i < 8; i++) {
      // Generate random integer between 0 and 61, 0|x works as Math.floor(x) in this case
      rdm62 = 0 | Math.random() * 62;
      // Map to ascii codes: 0-9 to 48-57 (0-9), 10-35 to 65-90 (A-Z), 36-61 to 97-122 (a-z)
      idSuffix += String.fromCharCode(rdm62 + (rdm62 < 10 ? 48 : rdm62 < 36 ? 55 : 61))
    }
    // Collect ids from all elements below the <defs> element(s).
    var defElements = svg.querySelectorAll('defs [id]');
    var defElement, tag, id;
    var propertyIdsMap = {};
    var mappedProperties, mappedProperty;
    for (i = 0; i < defElements[LENGTH]; i++) {
      defElement = defElements[i];
      tag = defElement.tagName;
      // Get array with possible property names for the element's tag name. If the array is empty,
      // the only property name is the same as the tag name.
      if (tag in TAG_NAME_PROPERTIES_MAP) {
        id = defElement.id;
        // Add suffix to id and set it as new id for the element
        defElement.id = id + idSuffix;
        // Add id for each mapped property
        mappedProperties = TAG_NAME_PROPERTIES_MAP[tag] || [tag];
        for (j = 0; j < mappedProperties[LENGTH]; j++) {
          mappedProperty = mappedProperties[j];
          (propertyIdsMap[mappedProperty] || (propertyIdsMap[mappedProperty] = [])).push(id);
        }
      }
    }
    // Get all property names for which ids were found
    var properties = Object.keys(propertyIdsMap);
    if (properties[LENGTH]) {
      // Run through all elements and replace ids in references
      var allElements = svg.querySelectorAll('*');
      var element, property, propertyVal;
      for (i = 0; i < allElements[LENGTH]; i++) {
        element = allElements[i];
        if (element.hasAttributes()) {
          // Run through all property names for which ids were found
          for (j = 0; j < properties[LENGTH]; j++) {
            property = properties[j];
            propertyVal = element.getAttribute(property);
            if (propertyVal) {
              // Extract id from property value if it has the form url(#anyId) or
              // url("#anyId") (for Internet Explorer)
              var idMatch = propertyVal.match(/url\("?#([a-zA-Z][\w:.-]*)"?\)/);
              if (idMatch && propertyIdsMap[property].indexOf(idMatch[1]) >= 0) {
                // Replace reference with new id if id was found for the property
                element.setAttribute(property, 'url(#' + idMatch[1] + idSuffix + ')');
              }
            }
          }
        }
      }
    }
  }

  // inject svg by replacing the img element with the svg element in the DOM
  function inject(img, svg, svgString, absUrl, options) {
    svg = svg || buildSvg(svgString, absUrl);

    if (svg) {
      var parentNode = img.parentNode;

      svg.setAttribute('data-inject-url', absUrl);

      if (parentNode) {
        if (options.copyAttributes) {
          copyAttributes(img, svg);
        }

        if (options.makeIdsUnique) {
          makeIdsUnique(svg, options);
        }

        var injectElem = (options.beforeInject && options.beforeInject(img, svg)) || svg;
        parentNode.replaceChild(injectElem, img);
        img[__SVGINJECT] = INJECTED;
        removeOnLoadAttribute(img);

        if (options.afterInject) {
          options.afterInject(img, injectElem);
        }
      }
    } else {
      svgInvalid(img, options);
    }
  }

  function extendOptions() {
    var newOptions = {};
    var args = arguments;

    for (var i = 0; i < args[LENGTH]; ++i) {
      var argument = args[i];
      if (argument) {
        for (var key in argument) {
          if (argument.hasOwnProperty(key)) {
            newOptions[key] = argument[key];
          }
        }
      }
    }
    return newOptions;
  }

  // Adds the specified CSS to the document's <head> element
  function addStyleToHead(css) {
    var head = document.getElementsByTagName('head')[0];

    if (head) {
      var style = document[CREATE_ELEMENT]('style');
      style.type = 'text/css';
      if (style.styleSheet){
        // This is required for IE8 and below.
        style.styleSheet.cssText = css;
      } else {
        style.appendChild(document.createTextNode(css));
      }
      head.appendChild(style);
    }
  }

  // Builds an SVG element from the specified SVG string
  function buildSvg(svgStr, absUrl) {
    try {
      DIV_ELEMENT.innerHTML = svgStr;
    } catch (e) {
      return NULL;
    }
    var svg = DIV_ELEMENT.firstElementChild;

    while (DIV_ELEMENT.firstChild) {
      DIV_ELEMENT.removeChild(DIV_ELEMENT.firstChild);
    }

    if (isSVGElem(svg)) {
      return svg;
    }
  }

  function removeOnLoadAttribute(img) {
    img.removeAttribute('onload');
  }

  function fail(img, status, options) {
    img[__SVGINJECT] = FAIL;

    if (options.onFail) {
      options.onFail(img, status);
    }
  }

  function svgInvalid(img, options) {
    removeOnLoadAttribute(img);
    fail(img, SVG_INVALID, options);
  }

  function svgNotSupported(img, options) {
    removeOnLoadAttribute(img);
    fail(img, SVG_NOT_SUPPORTED, options);
  }

  function loadFail(img, options) {
    fail(img, LOAD_FAIL, options);
  }

  function removeEventListeners(img) {
    img.onload = NULL;
    img.onerror = NULL;
  }

  function throwImgNotSet() {
    throw new Error('img not set');
  }

  function createSVGInject(globalName, options) {
    var defaultOptions = extendOptions(DEFAULT_OPTIONS, options);
    var svgLoadCache = {};

    addStyleToHead('img[onload^="' + globalName + '("]{visibility:hidden;}');

    /**
     * SVGInject
     *
     * Injects the SVG specified in he `src` attribute of the specified `img` element or array of `img`
     * elements.
     *
     * Options:
     * cache: If set to `true` the SVG will be cached using the absolute URL. Default value is `true`.
     * copyAttributes: If set to `true` the attributes will be copied from `img` to `svg`. Dfault value
     *     is `true.
     * makeIdsUnique: If set to `true` the id of elements in the `<defs>` element that can be references by
     *     property values (for example 'clipPath') are made unique by appending "--inject-XXXXXXXX", where
     *     XXXXXXXX is a random alphanumeric string of length 8. This is done to avoid duplicate ids in the
     *     DOM.
     * afterLoad: Hook after SVG is loaded. The loaded svg element is passed as a parameter. If caching is
     *     active this hook will only get called once for injected SVGs with the same absolute path. Changes
     *     to the svg element in this hook will be applied to all injected SVGs with the same absolute path.
     * beforeInject: Hook before SVG is injected. The `img` and `svg` elements are passed as parameters. If
     *     any html element is returned it gets injected instead of applying the default SVG injection.
     * afterInject: Hook after SVG is injected. The `img` and `svg` elements are passed as parameters.
     * onFail: Hook after injection fails. The `img` element and a `status` string are passed as an parameter.
     *     The `status` can be either `'SVG_NOT_SUPPORTED'` (the browser does not support SVG),
     *     `'SVG_INVALID'` (the SVG is not in a valid format) or `'LOAD_FAILED'` (loading of the SVG failed).
     *
     * @param {HTMLImageElement} img - an img element or an array of img elements
     * @param {Object} [options] - optional parameter with [options](#options) for this injection.
     */
    function SVGInject(img, options) {
      if (img) {
        var length = img[LENGTH];
        var src = img.src;

        if (src && !img[__SVGINJECT]) {
          img[__SVGINJECT] = INJECT;

          options = extendOptions(defaultOptions, options);

          if (IS_SVG_NOT_SUPPORTED) {
            svgNotSupported(img, options);
            return;
          }

          var absUrl = getAbsoluteUrl(src);
          var cache = options.cache;

          var setSvgLoadCacheValue = function(val) {
            if (cache) {
              var svgLoad = svgLoadCache[absUrl];
              for (var i = 0; i < svgLoad[LENGTH]; ++i) {
                svgLoad[i](val);
              }
              svgLoadCache[absUrl] = val;
            }
          };

          removeEventListeners(img);

          if (cache) {
            var svgLoad = svgLoadCache[absUrl];

            var handleLoadValue = function(loadValue) {
              if (loadValue === LOAD_FAIL) {
                loadFail(img, options);
              } else if (loadValue === SVG_INVALID) {
                svgInvalid(img, options);
              } else {
                inject(img, NULL, loadValue, absUrl, options);
              }
            };

            if (svgLoad !== undefined) {
              if (Array.isArray(svgLoad)) {
                svgLoad.push(handleLoadValue);
              } else {
                handleLoadValue(svgLoad);
              }
              return;
            } else {
              svgLoadCache[absUrl] = [];
            }
          }

          // Load the SVG because it is not cached or caching is disabled
          load(absUrl, function(svgXml, svgString) {
            if (img[__SVGINJECT] == INJECT) {
              // for IE9 do not use the nativ svgXml
              var svg = svgXml instanceof Document ? svgXml.documentElement : buildSvg(svgString, absUrl);

              if (svg) {
                var afterLoad = options.afterLoad;
                if (afterLoad) {
                  afterLoad(svg);
                  svgString = getXMLSerializer().serializeToString(svg);
                }

                inject(img, svg, svgString, absUrl, options);
                setSvgLoadCacheValue(svgString);
              } else {
                svgInvalid(img, options);
                setSvgLoadCacheValue(SVG_INVALID);
              }
            }
          }, function() {
            loadFail(img, options);
            setSvgLoadCacheValue(LOAD_FAIL);
          });
        } else if (length) {
          for (var i = 0; i < length; ++i) {
            SVGInject(img[i], options);
          }
        }
      } else {
        throwImgNotSet();
      }
    }

    /**
     * Sets the default [options](#options) for SVGInject.
     *
     * @param {Object} [options] - default [options](#options) for an injection.
     */
    SVGInject.setOptions = function(options) {
      defaultOptions = extendOptions(defaultOptions, options);
    };

    // Create a new instance of SVGInject
    SVGInject.create = createSVGInject;

    /**
     * Used in onerror Event of an `<img>` element to handle cases when the loading the original src fails
     * (for example if file is not found or if the browser does not support SVG). This triggers a call to the
     * options onFail hook if available. The optional second parameter will be set as the new src attribute
     * for the img element.
     *
     * @param {HTMLImageElement} img - an img element
     * @param {String} [fallbackSrc] - optional parameter fallback src
     */
    SVGInject.err = function(img, fallbackSrc) {
      if (img) {
        if (img[__SVGINJECT] != FAIL) {
          removeEventListeners(img);

          if (IS_SVG_NOT_SUPPORTED) {
            svgNotSupported(img, defaultOptions);
          } else {
            removeOnLoadAttribute(img);
            loadFail(img, defaultOptions);
          }
          if (fallbackSrc) {
            removeOnLoadAttribute(img);
            img.src = fallbackSrc;
          }
        }
      } else {
        throwImgNotSet();
      }
    };

    window[globalName] = SVGInject;

    return SVGInject;
  }

  var SVGInjectInstance = createSVGInject('SVGInject');

  if (typeof module == 'object' && typeof module.exports == 'object') {
    module.exports = SVGInjectInstance;
  }
})(window, document);