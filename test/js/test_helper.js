var runTests = function(testFuncs, testNum) {
  var failed = false;
  var successCount = 0;

  window.fail = function() {
    failed = true;
    document.getElementById('success').style.display = 'none';
    document.getElementById('failed').style.display = 'block';
    document.getElementById('running').style.display = 'none';
    console.error(new Error());
  };

  window.failCallback = function() {
    var err = new Error();
    return function() {
      console.error(err);
      window.fail();
    };
  };

  window.success = function() {
    if (!failed && ++successCount == (typeof testNum !== 'undefined' ? 1 : testFuncs.length)) {
      document.getElementById('success').style.display = 'block';
      document.getElementById('running').style.display = 'none';
    }
  };

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