var runTests = function(testFuncs) {
  var failed = false;
  var successCount = 0;

  window.fail = function() {
    failed = true;
    document.getElementById('success').style.display = 'none';
    document.getElementById('failed').style.display = 'block';
    document.getElementById('running').style.display = 'none';
    console.error(new Error());
  };

  window.success = function() {
    if (!failed && ++successCount == testFuncs.length) {
      document.getElementById('success').style.display = 'block';
      document.getElementById('running').style.display = 'none';
    }
  };

  window.testNotInjected = function(id) {

  };

  window.testInjected = function(id) {

  };

  for (var i = 0; i < testFuncs.length; ++i) {
    testFuncs[i]();
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