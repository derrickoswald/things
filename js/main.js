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
    ["home", "thingimporter/importwizard", "thingmaker/thingwizard", "configuration", "login"],
    function (home, importwizard, thingwizard, configuration, login)
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

        login.build ("utility");
        document.getElementById ("home").onclick = activate ("home", home.initialize);
        document.getElementById ("import_thing").onclick = activate ("import_thing", importwizard.initialize);
        document.getElementById ("new_thing").onclick = activate ("new_thing", thingwizard.initialize);
        document.getElementById ("configuration").onclick = activate ("configuration", configuration.initialize);
        configuration.configuration_setup
        (
            {
                success: function () { document.getElementById ("home").onclick (); },
                error: function () { document.getElementById ("configuration").onclick (); }
            }
        );

    }
);
