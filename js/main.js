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
    ["configuration", "login", "mustache", "home", "thingimporter/importwizard", "thingmaker/thingwizard", "discover"],
    function (configuration, login, mustache, home, importwizard, thingwizard, discover)
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

        $.couch.urlPrefix = '/api';

        login.build ("utility");
        document.getElementById ("home").onclick = activate ("home", home.initialize);
        document.getElementById ("import_thing").onclick = activate ("import_thing", importwizard.initialize);
        document.getElementById ("new_thing").onclick = activate ("new_thing", thingwizard.initialize);
        document.getElementById ("discover_thing").onclick = activate ("discover_thing", discover.initialize);
        document.getElementById ("configuration").onclick = activate ("configuration", configuration.initialize);
        configuration.configuration_exists
        (
            {
                success: function ()
                {
                    document.getElementById ("home").onclick ();
                },
                error: function ()
                {
                    document.getElementById ("configuration").onclick ();
                }
            }
        );
    }
);
