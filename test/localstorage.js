// just a test for interactive dialog in using JsTestDriver 

(function ()
    {
    // note that this shows up as the login dialog but it doesn't wait for input and the first test (I think) resets the page content so it disappears
        $.showDialog ("/_utils/dialog/_login.html", {});
    })();

//<!DOCTYPE HTML PUBLIC "-//W3C//DTD HTML 4.01 Frameset//EN" "http://www.w3.org/TR/html4/frameset.dtd">
//
//<html>
//<head>
//<title>Remote Console Runner</title>
//<link rel="stylesheet" type="text/css" href="/static/console.css" />
//</head>
//<frameset rows='80,*' border="1">
//    <frame id="heartbeat"
//        src="/slave/page/HEARTBEAT/id/1411587610407/mode/quirks/upload_size/50" />
//    <frame id="runner"
//        src="/slave/page/RUNNER/id/1411587610407/mode/quirks/upload_size/50" />
//</frameset>
//</html>
