/**
 * SVGInject - Version 1.1.0
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
  var CREATE_ELEMENT = 'createElement';
  var TITLE = 'title';
  var __SVGINJECT = '__svgInject';

  // constants
  var LOAD_FAIL = 'LOAD_FAIL';
  var SVG_NOT_SUPPORTED = 'SVG_NOT_SUPPORTED';
  var SVG_INVALID = 'SVG_INVALID';
  var ATTRIBUTE_EXCLUSION_NAMES = ['src', 'alt', 'onload', 'onerror'];
  var A_ELEMENT = document[CREATE_ELEMENT]('a');
  //var DIV_ELEMENT = document[CREATE_ELEMENT]('div');
  var IS_SVG_SUPPORTED = typeof SVGRect != 'undefined';
  var DEFAULT_OPTIONS = {
    useCache: TRUE,
    copyAttributes: TRUE,
    makeIdsUnique: TRUE
  };
  // Map of IRI referenceable tag names to properties that can reference them. This is defined in
  // https://www.w3.org/TR/SVG11/linking.html#processingIRI
  var IRI_TAG_PROPERTIES_MAP = {
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

  var uniqueIdCounter = 1;
  var xmlSerializer;

  // Returns the xmlSerializer instance. Creates it first if it does not exist yet.
  function getXMLSerializer() {
    xmlSerializer = xmlSerializer || new XMLSerializer();
    return xmlSerializer;
  }

  // Returns the absolute url for the specified url
  function getAbsoluteUrl(url) {
    A_ELEMENT.href = url;
    return A_ELEMENT.href;
  }

  // Load svg with an XHR request
  function loadSvg(url, callback, errorCallback) {
    if (url) {
      var req = new XMLHttpRequest();
      req.onreadystatechange = function() {
        if (req.readyState == 4) {
          // readyState is DONE
          var status = req.status;
          if (status == 200) {
            // request status is OK
            callback(req.responseXML, req.responseText.trim());
          } else if (status >= 400) {
            // request status is error (4xx or 5xx)
            errorCallback();
          } else if (status == 0) {
            // request status 0 can indicate a failed cross-domain call
            errorCallback();
          }
        }
      };
      req.open('GET', url, TRUE);
      req.send();
    }
  }

  // Copy attributes from img element to svg element
  function copyAttributes(imgElem, svgElem) {
    var attributes = imgElem.attributes;
    for (var i = 0; i < attributes[LENGTH]; ++i) {
      var attribute = attributes[i];
      var attributeName = attribute.name;
      // Only copy attributes not explicitly excluded from copying
      if (ATTRIBUTE_EXCLUSION_NAMES.indexOf(attributeName) == -1) {
        var attributeValue = attribute.value;
        // If img attribute is "title", insert a title element into SVG element
        if (attributeName == TITLE) {
          // Create title element
          var titleElem = document.createElementNS('http://www.w3.org/2000/svg', TITLE);
          titleElem.textContent = attributeValue;
          // If the SVG element's first child is a title element, replace it with the new title
          // element, otherwise insert the new title element as first child
          var firstElementChild = svgElem.firstElementChild;
          if (firstElementChild && firstElementChild.tagName.toLowerCase() == TITLE) {
            svgElem.replaceChild(titleElem, firstElementChild);
          } else {
            svgElem.insertBefore(titleElem, firstElementChild);
          }
        } else {
          // Set img attribute to svg element
          svgElem.setAttribute(attributeName, attributeValue);
        }
      }
    }
  }

  // This function appends a suffix to IDs of referenced elements in the <defs> in order to  to avoid ID collision
  // between multiple injected SVGs. The suffix has the form "--inject-X", where X is a running number which is
  // incremented with each injection.  References to the ids are adjusted accordingly.
  // We assume tha all ids within the injected SVG are unique, therefore the same suffix can be used for all ids of one
  // injected SVG.
  function makeIdsUnique(svgElem) {
    var i, j;
    var idSuffix = '--inject-' + uniqueIdCounter++;
    // Get all elements with an id. It is recommended to put referenced elements inside <defs> elements, but this
    // is not required, therefore we have to search the whole SVG.
    var idElements = svgElem.querySelectorAll('[id]');
    var idElem, tagName, id;
    var iriPropertiesObj = {};
    var mappedProperties;
    for (i = 0; i < idElements[LENGTH]; i++) {
      idElem = idElements[i];
      tagName = idElem.tagName;
      // Make ID unique if tag name is IRI referenceable
      if (tagName in IRI_TAG_PROPERTIES_MAP) {
        id = idElem.id;
        // Add mapped properties to found properties
        mappedProperties = IRI_TAG_PROPERTIES_MAP[tagName] || [tagName];
        for (j = 0; j < mappedProperties[LENGTH]; j++) {
          iriPropertiesObj[mappedProperties[j]] = true;
        }
        // Add suffix to element's id
        idElem.id += idSuffix;
      }
    }
    // Replace IDs with new IDs in all references
    // Get an array of all iri referenceable property names that were found
    var iriPropertiesArr = Object.keys(iriPropertiesObj);
    if (iriPropertiesArr[LENGTH]) {
      // Add "style" to properties, because it can contain references in the form 'style="fill:url(#myFill)"'
      iriPropertiesArr.push('style');
      // Regular expression for functional notations of an IRI references. This will find occurences in the form
      // url(#anyId) or url("#anyId") (for Internet Explorer)
      var funcIriRegExp = new RegExp('url\\("?#([a-zA-Z][\\w:.-]*)"?\\)', 'g');
      // Run through all elements of the SVG and replace ids in references
      var allElements = svgElem.querySelectorAll('*');
      var element, propertyName, propertyVal;
      for (i = 0; i < allElements[LENGTH]; i++) {
        element = allElements[i];
        if (element.hasAttributes()) {
          // Run through all property names for which ids were found
          for (j = 0; j < iriPropertiesArr[LENGTH]; j++) {
            propertyName = iriPropertiesArr[j];
            propertyVal = element.getAttribute(propertyName);
            var newVal = propertyVal && propertyVal.replace(funcIriRegExp, 'url(#$1' + idSuffix + ')');
            if (newVal !== propertyVal) {
              element.setAttribute(propertyName, newVal);
            }
          }
        }
      }
    }
  }

  // inject svg by replacing the img element with the svg element in the DOM
  function inject(imgElem, svgElem, absUrl, options) {
    if (svgElem) {
      svgElem.setAttribute('data-inject-url', absUrl);
      var parentNode = imgElem.parentNode;
      if (parentNode) {
        if (options.copyAttributes) {
          copyAttributes(imgElem, svgElem);
        }
        if (options.makeIdsUnique) {
          makeIdsUnique(svgElem, options);
        }
        // Invoke beforeInject hook if set
        var beforeInject = options.beforeInject;
        var injectElem = (beforeInject && beforeInject(imgElem, svgElem)) || svgElem;
        // Replace img element with new element. This is the actual injection.
        parentNode.replaceChild(injectElem, imgElem);
        // Mark img element as injected
        imgElem[__SVGINJECT] = INJECTED;
        removeOnLoadAttribute(imgElem);
        // Invoke afterInject hook if set
        if (options.afterInject) {
          options.afterInject(imgElem, injectElem);
        }
      }
    } else {
      svgInvalid(imgElem, options);
    }
  }

  // Merges any number of options objects into a new object
  function mergeOptions() {
    var mergedOptions = {};
    var args = arguments;
    // Iterate over all specified options objects and add all properties to the new options object
    for (var i = 0; i < args[LENGTH]; ++i) {
      var argument = args[i];
      if (argument) {
        for (var key in argument) {
          if (argument.hasOwnProperty(key)) {
            mergedOptions[key] = argument[key];
          }
        }
      }
    }
    return mergedOptions;
  }

  // Adds the specified CSS to the document's <head> element
  function addStyleToHead(css) {
    var head = document.getElementsByTagName('head')[0];
    if (head) {
      var style = document[CREATE_ELEMENT]('style');
      style.type = 'text/css';
      style.appendChild(document.createTextNode(css));
      head.appendChild(style);
    }
  }

  // Builds an SVG element from the specified SVG string
  function buildSvgElement(svgStr, verify) {
    // Parse the SVG string with SVGParser
    var svgDoc = new DOMParser().parseFromString(svgStr, 'text/xml');
    
    if (verify && svgDoc.getElementsByTagName('parsererror').length) {
      // DOMParser does not throw an exception, but instead returns an parsererror document
      return NULL;
    }

    return svgDoc.documentElement;
  }

  function removeOnLoadAttribute(imgElem) {
    // Remove the onload attribute. Should only be used to remove the unstyled image flash protection and
    // make the element visible, not for removing the event listener.
    imgElem.removeAttribute('onload');
  }

  function fail(imgElem, status, options) {
    imgElem[__SVGINJECT] = FAIL;
    if (options.onFail) {
      options.onFail(imgElem, status);
    }
  }

  function svgInvalid(imgElem, options) {
    removeOnLoadAttribute(imgElem);
    fail(imgElem, SVG_INVALID, options);
  }

  function svgNotSupported(imgElem, options) {
    removeOnLoadAttribute(imgElem);
    fail(imgElem, SVG_NOT_SUPPORTED, options);
  }

  function loadFail(imgElem, options) {
    fail(imgElem, LOAD_FAIL, options);
  }

  function removeEventListeners(imgElem) {
    imgElem.onload = NULL;
    imgElem.onerror = NULL;
  }

  function throwImgNotSet() {
    throw new Error('img not set');
  }

  function createSVGInject(globalName, options) {
    var defaultOptions = mergeOptions(DEFAULT_OPTIONS, options);
    var svgLoadCache = {};

    if (IS_SVG_SUPPORTED) {
      // If the browser supports SVG, add a small stylesheet that hides the <img> elements until
      // injection is finished. This avoids showing the unstyled SVGs before style is applied.
      addStyleToHead('img[onload^="' + globalName + '("]{visibility:hidden;}');
    }

    /**
     * SVGInject
     *
     * Injects the SVG specified in the `src` attribute of the specified `img` element or array of `img`
     * elements.
     *
     * Options:
     * useCache: If set to `true` the SVG will be cached using the absolute URL. Default value is `true`.
     * copyAttributes: If set to `true` the attributes will be copied from `img` to `svg`. Dfault value
     *     is `true.
     * makeIdsUnique: If set to `true` the id of elements in the `<defs>` element that can be references by
     *     property values (for example 'clipPath') are made unique by appending "--inject-X", where X is a
     *     running number which increases with each injection. This is done to avoid duplicate ids in the DOM.
     * beforeLoad: Hook before SVG is loaded. The `img` element is passed as a parameter. If the hook returns
     *     a string it is used as the URL instead of the `img` element's `src` attribute.
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
      options = mergeOptions(defaultOptions, options);

      if (img && typeof img[LENGTH] != 'undefined') {
        for (var i = 0; i < img[LENGTH]; ++i) {
          SVGInjectElement(img[i], options);
        }
      } else {
        SVGInjectElement(img, options);
      }
    }

    // Injects a single svg element. Options must be already merged with the default options.
    function SVGInjectElement(imgElem, options) {
      if (imgElem) {
        if (!imgElem[__SVGINJECT]) {
          removeEventListeners(imgElem);

          if (!IS_SVG_SUPPORTED) {
            svgNotSupported(imgElem, options);
            return;
          }

          // Invoke beforeLoad hook if set. If the beforeLoad returns a value use it as the src for the load
          // URL path. Else use the imgElem src attribute value.
          var src = (options.beforeLoad && options.beforeLoad(imgElem)) || imgElem.getAttribute('src');

          if (src === null) {
            // If no image src attribute is set do no injection. This can only be reached by using javascript
            // because if no src attribute is set the onload and onerror events do not get called
            return;
          }

          imgElem[__SVGINJECT] = INJECT;
          
          var absUrl = getAbsoluteUrl(src);
          var useCache = options.useCache;

          var setSvgLoadCacheValue = function(val) {
            if (useCache) {
              var svgLoad = svgLoadCache[absUrl];
              for (var i = 0; i < svgLoad[LENGTH]; ++i) {
                svgLoad[i](val);
              }
              svgLoadCache[absUrl] = val;
            }
          };

          if (useCache) {
            var svgLoad = svgLoadCache[absUrl];

            var handleLoadValue = function(loadValue) {
              if (loadValue === LOAD_FAIL) {
                loadFail(imgElem, options);
              } else if (loadValue === SVG_INVALID) {
                svgInvalid(imgElem, options);
              } else {
                inject(imgElem, buildSvgElement(loadValue, false), absUrl, options);
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
          loadSvg(absUrl, function(svgXml, svgString) {
            if (imgElem[__SVGINJECT] == INJECT) {
              // Use the XML from the XHR request if it is an instance of Document. Otherwise
              // (for example of IE9), create the svg document from the svg string.
              var svgElem = svgXml instanceof Document ? svgXml.documentElement : buildSvgElement(svgString, true);

              if (svgElem instanceof SVGElement) {
                var afterLoad = options.afterLoad;
                if (afterLoad) {
                  // Invoke afterLoad hook which may modify the SVG element.
                  afterLoad(svgElem);

                  if (useCache) {
                    // Update svgString because the SVG element can be modified in the afterLoad hook, so
                    // the modified SVG element is also used for all later cached injections
                    svgString = getXMLSerializer().serializeToString(svgElem);
                  }
                }

                inject(imgElem, svgElem, absUrl, options);
                setSvgLoadCacheValue(svgString);
              } else {
                svgInvalid(imgElem, options);
                setSvgLoadCacheValue(SVG_INVALID);
              }
            }
          }, function() {
            loadFail(imgElem, options);
            setSvgLoadCacheValue(LOAD_FAIL);
          });
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
      defaultOptions = mergeOptions(defaultOptions, options);
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

          if (!IS_SVG_SUPPORTED) {
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
