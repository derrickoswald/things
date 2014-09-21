//requirejs.config
//(
//    {
//        //By default load any module IDs from js/lib
//        baseUrl: 'js/lib',
//        //except, if the module ID starts with "app",
//        //load it from the js/app directory. paths
//        //config is relative to the baseUrl, and
//        //never includes a ".js" extension since
//        //the paths config could be for a directory.
//        paths:
//        {
//            app: '../app'
//        }
//    }
//);

requirejs
(
    ["home", "thingwizard"],
    function (home, thingwizard)
    {
        function activate (id, fn)
        {
            return (
                function ()
                {
                    var link = $ (document.getElementById (id));
                    link.parent ().parent ().find ('.active').removeClass ('active');
                    link.parent ().addClass ('active');
                    fn ();
                }
            );
        }
        document.getElementById ("home").onclick = activate ("home", home.initialize);
        document.getElementById ("new_thing").onclick = activate ("new_thing", thingwizard.initialize);
        //activate ("home", home.initialize) ();
        activate ("new_thing", thingwizard.initialize) ();
    }
);
