var runTests = function(testFuncs, testNum) {
  var failed = false;
  var successCount = 0;
  var currentTest = 0;

  window.fail = function() {
    failed = true;
    var err = new Error();
    var stack = err.stack || '';
    var match = stack.match(/test_basic\.js[:\s]+(\d+)/);
    var line = match ? 'test_basic.js line ' + match[1] : 'unknown location';
    var el = document.getElementById('failed');
    el.style.display = 'block';
    el.innerHTML += '<div style="color:#c00;font-size:13px;margin:4px 0;font-family:monospace">' + line + '</div>';
    document.getElementById('success').style.display = 'none';
    document.getElementById('running').style.display = 'none';
  };

  window.failCallback = function() {
    return function() {
      window.fail();
    };
  };

  window.success = function() {
    successCount++;
    if (!failed && successCount == (typeof testNum !== 'undefined' ? 1 : testFuncs.length)) {
      document.getElementById('success').style.display = 'block';
      document.getElementById('running').style.display = 'none';
    }
  };

  window.testNotInjected = function(id) {};
  window.testInjected = function(id) {};

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
      if (i === testNum) {
        testFuncs[i]();
      } else {
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
