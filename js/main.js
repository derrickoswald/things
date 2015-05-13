/*

So far, custom configuration is not needed.

requirejs.config
(
    {
        // by default load any module IDs from js/lib
        baseUrl: 'js/lib',

        // except, if the module ID starts with "app",
        // load it from the js/app directory. paths
        // config is relative to the baseUrl, and
        // never includes a ".js" extension since
        // the paths config could be for a directory.
        paths:
        {
            app: '../app'
        }
    }
);

 */

/**
 * @fileOverview Application initialization.
 * @name main
 * @author Derrick Oswald
 * @version 1.0
 */
requirejs
(
    ["configuration"],
    /**
     * @summary Main entry point for the application.
     * @description Performs application initialization as the first step in the RequireJS load sequence.
     * @see http://requirejs.org/docs/api.html#data-main
     * @name main
     * @exports main
     * @version 1.0
     */
    function (configuration)
    {
        // to support vhost systems set CouchDB jQuery module base path if main.js is not coming from localhost
        if (-1 == location.host.indexOf ("localhost"))
            $.couch.urlPrefix = '/root'; // the name must agree with the name in rewrites.json

        // ensure that configuration is loaded first, everything else depends on it
        configuration.configuration_setup
        (
            {
                success: function (data)
                {
                    // configuration loaded now, safe to do other require calls that depend on that config

                    var fn = require
                    (
                        ["login", "home", "thingimporter/importwizard", "thingmaker/thingwizard", "discover", "configurator"],
                        /**
                         * Setup index.html JavaScript.
                         * Make all the links and buttons on the static html page work, and show the first page.
                         */
                        function (login, home, importwizard, thingwizard, discover, configurator)
                        {
                            /**
                             * Page activation function generator.
                             */
                            function activate (fn)
                            {
                                return (
                                    /**
                                     * Click event handler.
                                     * @param {object} event the click event <em>not used</em>
                                     */
                                    function (event)
                                    {
                                        var link = $ (event.target); // get a jQuery element
                                        link.parent ().parent ().find ('.active').removeClass ('active');
                                        link.parent ().addClass ('active');
                                        fn ();
                                    }
                                );
                            }

                            login.build ("utility");
                            document.getElementById ("home").onclick = activate (home.initialize);
                            document.getElementById ("import_thing").onclick = activate (importwizard.initialize);
                            document.getElementById ("new_thing").onclick = activate (thingwizard.initialize);
                            document.getElementById ("discover_thing").onclick = activate (discover.initialize);
                            document.getElementById ("configurator").onclick = activate (configurator.initialize);

                            // display the home page, or the configuration page if configuration hasn't been done yet
                            configuration.configuration_exists
                            (
                                {
                                    success: function ()
                                    {
                                        document.getElementById ("home").click ();
                                    },
                                    error: function ()
                                    {
                                        document.getElementById ("configuration").click ();
                                    }
                                }
                            );
                        }
                    );
                    fn ();
                },
                error: function ()
                {
                    alert ("configuration setup failed... not much else will likely function correctly.");
                }
            }
        );
    }
);
