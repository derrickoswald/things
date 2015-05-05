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
    ["configuration"],
    function (configuration)
    {
        var options;

        if (-1 == location.host.indexOf ("localhost"))
            $.couch.urlPrefix = '/api';

        // initialize on first load if possible
        options =
        {
            success: function (data)
            {

                // configuration loaded now, safe to do other require calls that depend on that config
                var fn = require
                (
                    ["page", "login", "mustache", "home", "configurator", "thingimporter/importwizard", "thingmaker/thingwizard", "discover"],
                    function (page, login, mustache, home, configurator, importwizard, thingwizard, discover)
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
                        document.getElementById ("discover_thing").onclick = activate ("discover_thing", discover.initialize);
                        document.getElementById ("configurator").onclick = activate ("configurator", configurator.initialize);
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
                fn ();
            },
            error: function () { alert ("configuration setup failed... not much else will likely function correctly."); }
        };
        configuration.configuration_setup (options);
    }
);
