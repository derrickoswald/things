/**
 * @fileOverview Initial setup for importing things.
 * @name configurator/import
 * @author Derrick Oswald
 * @version 1.0
 */
define
(
    ["../configuration", "./restart"],
    /**
     * @summary Perform setup operations for the thingimporter.
     * @name configurator/import
     * @exports configurator/import
     * @version 1.0
     */
    function (configuration, restart)
    {
        /**
         * Check that CORS is set up accordingly.
         * @function check_CORS
         * @memberOf module:configurator/import
         */
        function check_CORS ()
        {
            function configuration_receiver (configuration)
            {
                var cors_enabled = configuration.httpd.enable_cors;
                var methods = configuration.cors.methods;
                var origins = configuration.cors.origins;
                var cors = (cors_enabled && (-1 != methods.indexOf ("PUT")) &&
                    ((-1 != origins.indexOf ("thingiverse.com")) || ("*" == origins)));
                document.getElementById ("cors_enabled").checked = (cors_enabled ? "true" : "false");
                document.getElementById ("cors_methods").value = methods;
                document.getElementById ("cors_origins").value = origins;
                var details = document.getElementById ("cors_configured");
                if (cors)
                    details.classList.remove ("hidden");
                else
                    details.classList.add ("hidden");
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
         * @param {object} options - object with the callback functions (success and error).
         * @memberOf module:configurator/import
         */
        function enable_cors (options)
        {
            $.couch.config
            (
                options,
                "httpd",
                "enable_cors",
                String (document.getElementById ("cors_enabled").checked)
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
                document.getElementById ("cors_methods").value
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
                document.getElementById ("cors_origins").value
            );
        }

        /**
         * Set up CORS support for http://thingiverse.com.
         * @param {object} event - the click event, <em>not used</em>
         * @memberOf module:configurator/import
         */
        function setup_cors (event)
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
                                            success: function ()
                                            {
                                                restart.inject ({ success: check_CORS });
                                            },
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
         * @param {object} event - the tab being shown event, <em>not used</em>
         * @memberOf module:configurator/import
         */
        function init (event)
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
                                { id: "configure_cors_button", event: "click", code: setup_cors }
                            ],
                            transitions:
                            {
                                enter: init
                            }
                        }
                    );
                }
            }
        );
    }
);