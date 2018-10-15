runTests([
  // Test 1
  function() {
    var lastSVG = null;
    var sequenceNum = 0;
    var sequence = ['afterLoad', 'beforeInject', 'afterInject', 'beforeInject', 'afterInject', 'beforeInject', 'afterInject'];

    var testSequence = function(eventName) {
      if (sequenceNum === sequence.length || sequence[sequenceNum++] !== eventName) {
        fail();
      } else if (sequenceNum === sequence.length) {
        success();
      }
    };
    
    SVGInject.create('SVGInject1', {
      beforeInject: function(img, svg) {
        testSequence('beforeInject');

        if (lastSVG === svg) {
          fail();
        } else if (svg.parentNode && svg.parentNode.tagName == 'div') {
          fail();
        } else if (!img.parentNode) {
          fail();
        }

        lastSVG = svg;
      },
      afterInject: function(img, svg) {
        testSequence('afterInject');

        if (lastSVG !== svg) {
          fail();
        } else if (!svg.parentNode) {
          fail();
        } else if (img.parentNode) {
          fail();
        }
      },
      afterLoad: function(svg) {
        testSequence('afterLoad');
      } 
    });  
  },

  // Test 2
  function() {
    var sequenceNum = 0;
    var sequence = [];
    for (var i = 0; i < 9; ++i) {
      sequence.push('beforeInject');
      sequence.push('afterInject');
    }

    var testSequence = function(eventName) {
      if (sequenceNum === sequence.length || sequence[sequenceNum++] !== eventName) {
        fail();
      } else if (sequenceNum === sequence.length) {
        success();
      }
    };
    
    SVGInject.create('SVGInject2', {
      beforeInject: function(img, svg) {
        testSequence('beforeInject');
      },
      afterInject: function(img, svg) {
        testSequence('afterInject');
      }
    });  
  },

  // Test 3
  function() {
    var includeAttributes = {
      'id': 'test_3_id',
      'class': 'inject-success',
      'data-test': 'test'
    };
    var notIncludeAttributes = ['src', 'onload', 'onerror', 'alt', 'title'];

    SVGInject.create('SVGInject3', {
      afterInject: function(img, svg) {
        for (var key in includeAttributes) {
          var val = includeAttributes[key];
          
          if (!svg.hasAttribute(key) || svg.getAttribute(key) !== val) {
            fail();
            return;
          }
        }

        for (var i = 0; i < notIncludeAttributes.length; ++i) {
          var notIncludeAttribute = notIncludeAttributes[i];

          if (svg.hasAttribute(notIncludeAttribute)) {
            fail();
            return;
          }
        }

        if (svg.firstElementChild.textContent !== 'businesspeople') {
          fail();
          return;
        }

        success();
      }
    });  
  },

  // Test 4
  function() {
    var notIncludeAttributes = ['id', 'data-test', 'onload', 'onerror', 'alt', 'title'];

    SVGInject.create('SVGInject4', {
      copyAttributes: false,
      beforeInject: function(img, svg) {
        svg.setAttribute('class', img.getAttribute('class'));
      },
      afterInject: function(img, svg) {
        for (var i = 0; i < notIncludeAttributes.length; ++i) {
          var notIncludeAttribute = notIncludeAttributes[i];

          if (svg.hasAttribute(notIncludeAttribute)) {
            fail();
            return;
          }

          if (svg.firstChild.tagName == 'title') {
          fail();
          return;
        }
        }
        success();
      }
    }); 
  },

  // Test 5
  function() {
    SVGInject.create('SVGInject5');

    var sequenceNum = 0;
    var sequence = [];
    for (var i = 0; i < 9; ++i) {
      if (i % 3 == 0) {
        sequence.push('afterLoad');
      }
      sequence.push('beforeInject');
      sequence.push('afterInject');
    }

    var testSequence = function(eventName) {
      if (sequenceNum === sequence.length || sequence[sequenceNum++] !== eventName) {
        fail();
      } else if (sequenceNum === sequence.length) {
        success();
      }
    };

    SVGInject5.setOptions({
      afterLoad: function(svg) {
        testSequence('afterLoad')
      },
      beforeInject: function(img, svg) {
        testSequence('beforeInject');
      },
      afterInject: function(img, svg) {
        testSequence('afterInject');
      }
    });

    domReady(function(event) {
      SVGInject5(document.getElementsByClassName('test-5'));
    }); 
  },

  // Test 6
  function() {
    var count = 0;
    SVGInject.create('SVGInject6', {
      afterLoad: fail,
      beforeInject: fail,
      afterInject: fail,
      onFail: function(img) {
        img.src = 'imgs/test1.png';
        if (++count == 7) {
          success();
        } else if (count > 7) {
          fail();
        }
      }
    });
  },

  // Test 7
  function() {
    var count = 0;
    SVGInject.create('SVGInject7', {
      afterLoad: fail,
      beforeInject: fail,
      afterInject: fail,
      onFail: function(img) {
        img.src = 'imgs/test1.png';
        if (++count == 7) {
          success();
        } else if (count > 7) {
          fail();
        }
      }
    });

    domReady(function(event) {
      SVGInject7(document.getElementsByClassName('test-7'));
    }); 
  },

  // Test 8
  function() {
    var count = 0;
    SVGInject.create('SVGInject8', {
      afterLoad: fail,
      beforeInject: fail,
      afterInject: fail,
      onFail: function(img) {
        if (img.hasAttribute('onload')) {
          fail();
        }
        if (++count == 12) {
          success();
        } else if (count > 12) {
          fail();
        }
      }
    });

    domReady(function(event) {
      SVGInject8(document.getElementsByClassName('test-8'));
    }); 
  },

  // Test 9
  function() {
    var count = 0;

    SVGInject.create('SVGInject9');

    SVGInject9.setOptions({
      afterInject: function(img, svg) {
        // do not use className for SVGs!
        svg.setAttribute('class', 'inject-success');

        if (++count == 2) {
          success();
        } else if (count > 2) {
          fail();
        }
      }
    });

    domReady(function() {
      SVGInject9(document.getElementById('test-9').querySelectorAll('img[src$=".svg"]'));
    });
  },

  // Test 10
  function() {
    var sequenceNum = 0;
    var sequence = [];
    var svgs = [];

    for (var i = 0; i < 8; ++i) {
      sequence.push('afterLoad');
      sequence.push('beforeInject');
      sequence.push('afterInject');
    }

    var testSequence = function(eventName) {
      if (sequenceNum === sequence.length || sequence[sequenceNum++] !== eventName) {
        fail();
      } else if (sequenceNum === sequence.length) {
        success();
      }
    };

    SVGInject.create('SVGInject10', {
      useCache: false,
      beforeInject: function(img, svg) {
        testSequence('beforeInject');
      },
      afterInject: function(img, svg) {
        testSequence('afterInject');
      },
      afterLoad: function(svg) {
        if (svgs.indexOf(svg) !== -1) {
          fail();
        } else {
          svgs.push(svg);
        }
        testSequence('afterLoad');
      } 
    });

    domReady(function() {
      SVGInject10(document.getElementsByClassName('test-10'));
    });
  },

  // Test 11
  function() {
    SVGInject.create('SVGInject11', {
      afterInject: function(img, svg) {
        var titleElems = svg.getElementsByTagName('title');

        if (titleElems.length != 1 || titleElems[0].textContent != 'New Test Title') {
          fail();
        } else {
          success();
        }
      }
    });
  },

  // Test 12
  function() {
    var count = 0;

    SVGInject.create('SVGInject12', {
      afterLoad: function(svg) {
        svg.setAttribute('data-test-afterload', 'success');
      },

      afterInject: function(img, svg) {
        if (svg.getAttribute('data-test-afterload') != 'success') {
          fail();
        } else {
          if (++count == 6) {
            success();
          } else if (count > 6) {
            fail();
          }
        }
      }
    });
  },

  // Test 13
  function() {
    var count = 0;

    SVGInject.create('SVGInject13', {
      afterInject: function() {
        if (++count == 4) {
          success();
        }
      }
    });
  },

  // Test 14
  function() {
    var count = 0;

    SVGInject.create('SVGInject14', {
      beforeLoad: function(img) {
        return img.getAttribute('data-src');
      },
      afterInject: function() {
        if (++count == 6) {
          success();
        }
      }
    });

    domReady(function() {
      SVGInject14(document.querySelectorAll('#test-14 img'));
    });
  },

  // Test 15
  function() {
    var count = 0;

    SVGInject.create('SVGInject15', {
      beforeLoad: function(img) {
        return img.getAttribute('srcset');
      },
      afterInject: function() {
        if (++count == 6) {
          success();
        }
      }
    });
  },

  // Test 16
  function() {
    var count = 0;

    SVGInject.create('SVGInject16', {
      onFail: function(img, status) {
        img.src = 'imgs/test1.png';

        if (++count == 2) {
          success();
        } else if (count >= 2) {
          fail();
        }
      }
    });

    domReady(function() {
      SVGInject16(document.querySelectorAll('#test-16 .inject'));
    });
  },

  // Test 17
  function() {
    SVGInject.create('SVGInject17', {
      onFail: fail
    });

    success();
  }
]);