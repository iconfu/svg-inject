runTests([
  // Test 1
  function() {
    var count = 0;

    SVGInject.create('SVGInject1', {
      afterLoad: fail,
      onFail: function(img, status) {
        if (status === 'SVG_NOT_SUPPORTED') {
          ++count;
          if (count > 9) {
            fail();
          } else if (count == 9) {
            success();
          }
        } else {
          fail();
        }
      }
    });
  },

  // Test 2
  function() {
    var count = 0;

    SVGInject.create('SVGInject2', {
      afterLoad: fail,
      onFail: function(img, status) {
        if (status === 'SVG_NOT_SUPPORTED') {
          img.src = img.src.slice(0, -4) + ".png";

          ++count;
          if (count > 9) {
            fail();
          } else if (count == 9) {
            success();
          }
        } else {
          fail();
        }
      }
    });
  },

  // Test 3
  function() {
    var count = 0;

    SVGInject.create('SVGInject3', {
      afterLoad: fail,
      onFail: function(img, status) {
        if (status === 'SVG_NOT_SUPPORTED') {
          img.src = img.src.slice(0, -4) + ".png";
          
          ++count;
          if (count > 9) {
            fail();
          } else if (count == 9) {
            success();
          }
        } else {
          fail();
        }
      }
    });

    domReady(function() {
      SVGInject3(document.getElementById('test-3').getElementsByTagName('img'));
    });
  },

  // Test 4
  function() {
    var count = 0;

    SVGInject.create('SVGInject4', {
      beforeLoad: fail,
      afterLoad: fail,
      beforeInject: fail,
      afterInject: fail,
      onFail: function(img, status) {
        if (status === 'SVG_NOT_SUPPORTED') {
          if (++count == 6) {
            success();
          } else if (count > 6) {
            fail();
          }
        } else {
          fail();
        }
      }
    });
  }
]);