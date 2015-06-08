/**
 * @fileOverview Initial setup for importing things.
 * @name configurator/import
 * @author Derrick Oswald
 * @version 1.0
 */
define
(
    ["../configuration"],
    /**
     * @summary Perform setup operations for the thingimporter.
     * @name configurator/import
     * @exports configurator/import
     * @version 1.0
     */
    function (configuration)
    {
        /**
         * Check that CORS is set up accordingly.
         * @memberOf module:configurator/import
         */
        function check_CORS ()
        {
            function configuration_receiver (configuration)
            {
                var cors_enabled = configuration.httpd.enable_cors;
                var methods = configuration.cors.methods;
                var origins = configuration.cors.origins;
                var cors = (cors_enabled && (-1 != methods.indexOf ("PUT")) && (-1 != origins.indexOf ("thingiverse.com")));
                document.getElementById ("cors_enabled").innerHTML = (cors_enabled ? "true" : "false");
                document.getElementById ("cors_methods").innerHTML = methods;
                document.getElementById ("cors_origins").innerHTML = origins;
                document.getElementById ("configure_cors_button").disabled = cors;
                var details = $ ("#cors_configured");
                if (cors)
                    details.removeClass ("hidden");
                else
                    details.addClass ("hidden");

            };
            function problem (status)
            {
                alert ("problem " + status);
            }
            $.couch.config
            (
                {
                    success: configuration_receiver
                }
            );
        }

        /**
         * Turn on CORS support.
         * @memberOf module:configurator/import
         */
        function enable_cors (options)
        {
            $.couch.config
            (
                options,
                "httpd",
                "enable_cors",
                "true"
            );
        }

        /**
         * Set up CORS methods.
         * @memberOf module:configurator/import
         */
        function set_methods (options)
        {
            $.couch.config
            (
                options,
                "cors",
                "methods",
                "GET,POST,PUT"
            );
        }

        /**
         * Set up CORS origins.
         * @memberOf module:configurator/import
         */
        function set_origins (options)
        {
            $.couch.config
            (
                options,
                "cors",
                "origins",
                "http://www.thingiverse.com"
            );
        }

        /**
         * Set up CORS support for http://thingiverse.com.
         * @memberOf module:configurator/import
         */
        function setup_cors ()
        {
            enable_cors
            (
                {
                    success: function ()
                    {
                        set_methods
                        (
                            {
                                success: function ()
                                {
                                    set_origins
                                    (
                                        {
                                            success: function () { alert ("Restart CouchDB for changes to take effect"); check_CORS (); },
                                            error: function () { alert ("Allowing http://www.thingiverse.com as an origin failed"); check_CORS (); }
                                        }
                                    );
                                },
                                error: function () { alert ("Setting methods failed"); check_CORS (); }
                            }
                        );
                    },
                    error: function () { alert ("Enabling CORS failed"); }
                }
            );
        }

        /**
         * Initialize the import setup page.
         * @memberOf module:configurator/import
         */
        function init (event, data)
        {
            check_CORS ();
        }

        return (
            {
                getStep: function ()
                {
                    return (
                        {
                            id: "import",
                            title: "Importing",
                            template: "templates/configurator/import.mst",
                            hooks:
                            [
                                {
                                    id: "configure_cors_button",
                                    event: "click",
                                    code: setup_cors,
                                    obj: this
                                }
                            ],
                            transitions:
                            {
                                enter: init,
                                obj: this
                            }
                        }
                    );
                }
            }
        );
    }
);