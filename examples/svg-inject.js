/**
 * SVGInject
 * A tiny, intuitive, robust, caching solution for injecting SVG files inline into the DOM.
 *
 * https://github.com/iconfu/svg-inject
 *
 * Copyright (c) 2018 Iconfu <info@iconfu.com>
 * @license MIT License - https://github.com/iconfu/svg-inject/blob/master/LICENSE
 */

(function(window, document) {
  // constants for better minification
  var NULL = null;
  var TRUE = true;
  var LENGTH = 'length';
  var SVG_NOT_SUPPORTED = 'SVG_NOT_SUPPORTED';
  var LOAD_FAIL = 'LOAD_FAIL';
  var SVG_INVALID = 'SVG_INAVLID';
  var CREATE_ELEMENT = 'createElement';
  var __SVGINJECT = '__svgInject';

  // constants
  var ATTRIBUTE_EXCLUSION_NAMES = ['src', 'alt', 'onload'];
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
  var i, j, k;
  
  var xmlSerializer = new XMLSerializer();

  function NOOP() {}

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
        if (req.readyState == 4 && req.status == 200) {
          // readyState is done, request status ok
          callback(req.responseXML, req.responseText);
        }
      };
      req.onerror = errorCallback;
      req.open('GET', path, true);
      req.send();
    }
  }

  // copy attributes from img element to svg element
  function copyAttributes(img, svg, options) {
    if (options.copyAttributes) {
      var attributes = img.attributes;

      for (i = 0; i < attributes[LENGTH]; ++i) {
        var attribute = attributes[i];
        var attributeName = attribute.name;

        if (ATTRIBUTE_EXCLUSION_NAMES.indexOf(attributeName) == -1) {
          var attributeValue = attribute.value;

          if (attributeName == 'title') {
            // if a title attribute exists insert it as the title tag in SVG
            var title = document.createElementNS('http://www.w3.org/2000/svg', 'title');
            title.textContent = attributeValue;
            svg.insertBefore(title, svg.firstChild);
          } else {
            svg.setAttribute(attributeName, attributeValue);
          }
        }
      }
    }
  }

  function makeIdsUnique(svg) {
    // Collect ids from all elements directly below the <defs> element(s).
    var defElements = svg.querySelectorAll('defs>[id]');
    var defElement, tag, id, newId;
    var propertyIdMap = {};
    var mappedProperties, mappedProperty;
    for (i = 0; i < defElements[LENGTH]; i++) {
      defElement = defElements[i];
      tag = defElement.tagName;
      // Get array with possible property names for the element's tag name. If
      // the array is empty, the only property name is the same as the tag name.
      if (tag in TAG_NAME_PROPERTIES_MAP) {
        id = defElement.id;
        // Create a random new id for the element
        newId = 'ID' + Math.random().toString(36).substr(2, 10);
        defElement.id = newId;
        // Add mapping from id to new id for each mapped property
        mappedProperties = TAG_NAME_PROPERTIES_MAP[tag] || [tag];
        for (j = 0; j < mappedProperties[LENGTH]; j++) {
          mappedProperty = mappedProperties[j];
          (propertyIdMap[mappedProperty] || (propertyIdMap[mappedProperty] = [])).push([id, newId]);
        }
      }
    }
    // Run through all elements and replace ids in references
    var properties = Object.keys(propertyIdMap);
    if (properties[LENGTH]) {
      var allElements = svg.querySelectorAll('*');
      var element, property, propertyVal, idTuples;
      for (i = 0; i < allElements[LENGTH]; i++) {
        element = allElements[i];
        // Run through all property names for which ids were found
        for (j = 0; j < properties[LENGTH]; j++) {
          property = properties[j];
          propertyVal = element.getAttribute(property);
          if (propertyVal) {
            idTuples = propertyIdMap[property];
            for (k = 0; k < idTuples[LENGTH]; k++) {
              // Replace id if peroperty value has the form url(#anyId) or
              // url("#anyId") (for Internet Explorer).
              if (propertyVal.replace(/"/g, '') == 'url(#' + idTuples[k][0] + ')') {
                element.setAttribute(property, 'url(#' + idTuples[k][1] + ')');
                break;
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

      if (parentNode) {
        copyAttributes(img, svg, options);
        if (options.makeIdsUnique) {
          makeIdsUnique(svg);
        }
        var injectElem = (options.beforeInject && options.beforeInject(img, svg)) || svg;
        parentNode.replaceChild(injectElem, img);
        img[__SVGINJECT] = INJECTED;
        removeOnLoadAttribute(img);
        options.afterInject && options.afterInject(img, injectElem);
      }
    } else {
      svgInvalid(img, options);
    }
  }

  function extendOptions() {
    var newOptions = {};
    var args = arguments;

    for (i = 0; i < args[LENGTH]; ++i) {
      var argument = args[i];
      if (argument) {
        for (var key in argument) {
          newOptions[key] = argument[key];
        }
      }
    }
    return newOptions;
  }

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

  function buildSvg(svgStr, absUrl) {
    try {
      DIV_ELEMENT.innerHTML = svgStr;
    } catch (e) {
      return NULL;
    }
    var svg = DIV_ELEMENT.removeChild(DIV_ELEMENT.firstChild);

    if (!isSVGElem(svg)) {
      return NULL;
    }

    svg.insertBefore(document.createComment('SVG injected from "' + absUrl + '"'), svg.firstChild);
    return svg;
  }

  function removeOnLoadAttribute(img) {
    img.removeAttribute('onload');
  }

  function fail(img, status, options) {
    img[__SVGINJECT] = FAIL;
    options.onFail && options.onFail(img, status);
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

  function loadFailOrSvgNotSupported(img, options) {
    if (IS_SVG_NOT_SUPPORTED) {
      svgNotSupported(img, options);
    } else {
      removeOnLoadAttribute(img);
      loadFail(img, options);
    }
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

    addStyleToHead('img[onload*="' + globalName + '"]{visibility:hidden;}');

    /**
     * SVGInject
     *
     * Injects the SVG specified in he `src` attribute of the specified `img` element or array of `img` elements.
     *
     * Options:
     * cache: If set to `true` the SVG will be cached using the absolute URL. Default value is `true`.
     * copyAttributes: If set to `true` the attributes will be copied from `img` to `svg`. Dfault value is `true.
     * beforeInject: Hook before SVG is injected. The `img` and `svg` elements are passed as parameters. If any html element is returned it gets injected instead of applying the default SVG injection.
     * afterInject: Hook after SVG is injected. The `img` and `svg` elements are passed as parameters.
     * onFail: Hook after injection fails. The `img` element and a `status` string are passed as an parameter. The `status` can be either `'SVG_NOT_SUPPORTED'` (the browser does not support SVG), `'SVG_INVALID'` (the SVG is not in a valid format) or `'LOAD_FAILED'` (loading of the SVG failed).
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

          var onError = function() {
            removeEventListeners(img);
            loadFailOrSvgNotSupported(img, options);
          };

          var setSvgLoadCacheValue = function(val) {
            if (cache) {
              var svgLoad = svgLoadCache[absUrl];
              for (i = 0; i < svgLoad[LENGTH]; ++i) {
                svgLoad[i](val);
              }
              svgLoadCache[absUrl] = val;
            }
          };

          var afterImageComplete = function() {
            removeEventListeners(img);

            load(absUrl, function(svgXml, svgString) {
              if (img[__SVGINJECT] == INJECT) {
                // for IE9 do not use the nativ svgXml
                var svg = svgXml instanceof Document ? svgXml.documentElement : buildSvg(svgString, absUrl);

                if (svg) {
                  var afterLoad = options.afterLoad;
                  if (afterLoad) {
                    afterLoad(img, svg);
                    svgString = xmlSerializer.serializeToString(svg);
                  }
                  
                  inject(img, svg, svgString, absUrl, options);

                  setSvgLoadCacheValue(svgString);
                } else {
                  svgInvalid(img, options);
                }
              }
            }, function() {
              loadFail(img, options);
              setSvgLoadCacheValue(NULL);
            });
          };

          if (cache) {
            var svgLoad = svgLoadCache[absUrl];

            if (svgLoad !== undefined) {
              if (Array.isArray(svgLoad)) {
                svgLoad.push(function(svgString) {
                  if (svgString === NULL) {
                    loadFail(img, options);
                  } else {
                    inject(img, NULL, svgString, absUrl, options);
                  }
                });
              } else if (svgLoad === NULL) {
                loadFail(img, options);
              } else {
                inject(img, NULL, svgLoad, absUrl, options);
              }
              return;
            } else {
              svgLoadCache[absUrl] = [];
            }
          }

          if (img.complete) {
            afterImageComplete();
          } else {
            img.onload = afterImageComplete;
            img.onerror = onError;
          }
        } else if (length) {
          for (i = 0; i < length; ++i) {
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
     * Used in `onerror Event of an `<img>` element to handle cases when the loading the original src fails (for example if file is not found or if the browser does not support SVG). This triggers a call to the options onFail hook if available. The optional second parameter will be set as the new src attribute for the img element.
     *
     * @param {HTMLImageElement} img - an img element
     * @param {String} [fallbackSrc] - optional parameter fallback src
     */
    SVGInject.err = function(img, fallbackSrc) {
      if (img) {
        if (img[__SVGINJECT] != FAIL) {
          removeEventListeners(img);
          loadFailOrSvgNotSupported(img, defaultOptions);
          if (fallbackSrc) {
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
