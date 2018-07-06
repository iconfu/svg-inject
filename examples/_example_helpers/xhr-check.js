/*
 * This script is used to provide feedback if the demo is not working correctly on the local file system due to the same origin policy.
 */

(function() {
  var img = document.getElementsByTagName("img")[0];
  var messageVisible = false;
  var msg = null;

  var msgTemplate = '<div style="border: 1px solid #ff6666; background: #ffcccc; padding: 30px;">' +
                      '<h1>Demo not working correctly</h1>' +
                      '<h2>Don\'t worry: It\'s most likely because you are running the demo on your local file system.</h2>' +
                      '<p>SVGInject works very well in any browser when run with a web server.</p>' +
                      '<p>Due to the same origin policy for some browsers (Chrome, Safari), SVGs can not be loaded when run on the file system.</p>' +
                      '<p>This is why the second image in this demo is not styled in different colors.</p>' +
                      '<h2>How to get this demo to work</h2>' +
                      '<ul style="font-size: larger;">' +
                        '<li>Run the demo with a Web Server</li>' +
                        '<li>Run the demo with the Firefox browser</li>' +
                      '</ul>' +
                      '<p>There are also other possible solutions (--allow-file-access-from-files flag in Chrome) you might want to look for to run this demo on the file system.</p>' +
                    '</div>';

  var showMessage = function() {
    if (!messageVisible) {
      messageVisible = true;
      var div = document.createElement('div');
      div.innerHTML = msgTemplate;
      msg = div.childNodes[0];
      document.body.insertBefore(msg, document.body.firstChild);
    }
  };

  var hideMessage = function() {
    if (messageVisible) {
      messageVisible = false;
      msg.parentNode.removeChild(msg);
    }
  };

  var checkImgReplaced = function(delay) {
    window.setTimeout(function() {
      if (document.getElementsByTagName("svg").length == 0) {
        showMessage();
        checkImgReplaced(1000)
      } else {
        hideMessage();
      }
    }, delay);
  };

  img.addEventListener("load", function() {
    checkImgReplaced(500);
  });
})();