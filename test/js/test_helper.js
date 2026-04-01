var runTests = function(testFuncs, testNum) {
  var failed = false;
  var successCount = 0;
  var currentTest = 0;

  window.fail = function() {
    failed = true;
    var err = new Error();
    var stack = err.stack || '';
    // Find the test_basic.js line that called fail()
    var match = stack.match(/test_basic\.js[:\s]+(\d+)/);
    var line = match ? 'test_basic.js line ' + match[1] : '';
    var msg = (line || 'unknown location') + ' (check browser console for full stack)';
    console.error('TEST FAILED at ' + msg, err);
    var el = document.getElementById('failed');
    el.style.display = 'block';
    el.innerHTML += '<div style="color:#c00;font-size:13px;margin:4px 0;font-family:monospace">' + msg + '</div>';
    document.getElementById('success').style.display = 'none';
    document.getElementById('running').style.display = 'none';
  };

  window.failCallback = function() {
    var err = new Error();
    return function() {
      console.error(err);
      window.fail();
    };
  };

  var passedTests = {};
  window.success = function() {
    // Use stack to find which test called success
    var err = new Error();
    var match = (err.stack || '').match(/test_basic\.js[:\s]+(\d+)/);
    var line = match ? match[1] : '?';
    successCount++;
    passedTests[line] = true;
    console.log('PASSED (line ' + line + ') — ' + successCount + '/' + testFuncs.length + ' tests done');
    if (!failed && successCount == (typeof testNum !== 'undefined' ? 1 : testFuncs.length)) {
      document.getElementById('success').style.display = 'block';
      document.getElementById('running').style.display = 'none';
    }
  };

  // After 10 seconds, report which tests haven't passed
  setTimeout(function() {
    if (!failed && successCount < testFuncs.length) {
      console.warn('TIMEOUT: ' + successCount + '/' + testFuncs.length + ' tests passed. Missing tests never called success().');
    }
  }, 10000);

  window.testNotInjected = function(id) {

  };

  window.testInjected = function(id) {

  };

  window.isEqualElseFail = function(count, num, callback) {
    if (count === num) {
      callback && callback();
      return true;
    } else if (count > num) {
      window.fail();
      return false;
    }
  };

  for (var i = 0; i < testFuncs.length; ++i) {
    currentTest = i + 1;
    if (typeof testNum !== 'undefined') {
      // testing only one test
      if (i === testNum) {
        testFuncs[i]();
      } else {
        // set dummy function
        window['SVGInject' + (i + 1)] = function() {};
        window['SVGInject' + (i + 1)].err = function() {};
      }
    } else {
      testFuncs[i]();
    }
  }
};

var domReady = function(callback) {
  var ready = false;

  var detach = function() {
    if(document.addEventListener) {
      document.removeEventListener("DOMContentLoaded", completed);
      window.removeEventListener("load", completed);
    } else {
      document.detachEvent("onreadystatechange", completed);
      window.detachEvent("onload", completed);
    }
  };

  var completed = function() {
    if(!ready && (document.addEventListener || event.type === "load" || document.readyState === "complete")) {
      ready = true;
      detach();
      callback();
    }
  };

  if(document.readyState === "complete") {
    callback();
  } else if(document.addEventListener) {
    document.addEventListener("DOMContentLoaded", completed);
    window.addEventListener("load", completed);
  } else {
    document.attachEvent("onreadystatechange", completed);
    window.attachEvent("onload", completed);

    var top = false;

    try {
      top = window.frameElement === null && document.documentElement;
    } catch(e) {}

    if(top && top.doScroll) {
      (function scrollCheck() {
        if(ready) return;

        try {
          top.doScroll("left");
        } catch(e) {
          return setTimeout(scrollCheck, 50);
        }

        ready = true;
        detach();
        callback();
      })();
    }
  }
};