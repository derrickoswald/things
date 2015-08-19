/**
 * @fileOverview Proxy and daemon configuration step.
 * @name configurator/proxies
 * @author Derrick Oswald
 * @version 1.0
 */
define
(
    ["../configuration", "../page", "../mustache", "../login", "../database", "../restart", "../keybase", "../sha1"],
    /**
     * @summary Proxy and daemon configuration step.
     * @description Sets up proxies and daemon entries in the CouchDB configuration file.
     * @name configurator/proxies
     * @exports configurator/proxies
     * @version 1.0
     */
    function (configuration, page, mustache, login, database, restart, keybase, sha1)
    {
        /**
         * @summary Get the current proxies from the CouchDB local configuration.
         * @description Gets the httpd_global_handlers section and populates the form.
         * @function get_proxies
         * @memberOf module:configurator/proxies
         */
        function get_proxies ()
        {
            $.couch.config
            (
                {
                    success: function (data)
                    {
                        if (data.keybase)
                            document.getElementById ("keybase_proxy").value = data.keybase;
                        if (data.json)
                            document.getElementById ("deluge_proxy").value = data.json;
                        if (data.user_manager)
                            document.getElementById ("user_manager_proxy").value = data.user_manager;
                        if (data._fti)
                            document.getElementById ("fti_proxy").value = data._fti;
                    },
                },
                "httpd_global_handlers"
            );
        }

        /**
         * @summary Create a proxy entry.
         * @description Creates an http proxy entry for the provided name and url.
         * @param {object} options - functions for success and error callback
         * @function create_proxy
         * @memberOf module:configurator/proxies
         */
        function create_proxy (name, url, options)
        {
            $.couch.config
            (
                options,
                "httpd_global_handlers",
                name,
                "{couch_httpd_proxy, handle_proxy_req, <<\"" + url + "\">>}"
            );
        }

        /**
         * @summary Create proxy entry for keybase.io in the CouchDB local configuration.
         * @description Creates an http proxy entry for keybase.io.
         * @param {object} options - functions for success and error callback
         * @function create_keybase_proxy
         * @memberOf module:configurator/proxies
         */
        function create_keybase_proxy (options)
        {
            create_proxy ("keybase", "https://keybase.io", options);
        }

        /**
         * @summary Create the Keybase.io proxy and restart the CouchDB server.
         * @description Event handler for the Keybase button.
         * @param {object} event - the click event, <em>not used</em>
         * @function keybase_click
         * @memberOf module:configurator/proxies
         */
        function keybase_click (event)
        {
            create_keybase_proxy
            (
                {
                    success: function ()
                    {
                        restart.inject ();
                    }
                }
            );
        }

        /**
         * @summary Create proxy entry for deluge in the CouchDB local configuration.
         * @description Creates an http proxy entry for deluge.
         * @param {object} options - functions for success and error callback
         * @function create_deluge_proxy
         * @memberOf module:configurator/proxies
         */
        function create_deluge_proxy (options)
        {
            create_proxy ("json", "http://localhost:8112", options);
        }

        /**
         * @summary Create the deluge proxy and restart the CouchDB server.
         * @description Event handler for the Deluge button.
         * @param {object} event - the click event, <em>not used</em>
         * @function deluge_click
         * @memberOf module:configurator/proxies
         */
        function deluge_click (event)
        {
            create_deluge_proxy
            (
                {
                    success: function ()
                    {
                        restart.inject ();
                    }
                }
            );
        }

        /**
         * @summary Initialize the proxies page of the configurator wizard.
         * @description Fills the form with existing configuration data and attaches handlers for the
         * various operations.
         * @param {object} event - the tab being shown event, <em>not used</em>
         * @function init
         * @memberOf module:configurator/proxies
         */
        function init (event)
        {
            get_proxies ();
        }

        // ToDo: execute javascript from within the CouchDb:
        // $ /usr/bin/node --eval 'http = require ("http"); http.get ("http://swirl:5984/js/about.js", function (result) { result.on ("data", function (chunk) { console.log (chunk); }); });'
        // <Buffer 2f 2a 2a 0a 20 2a 20 40 66 69 6c 65 4f 76 65 72 76 69 65 77 20 54 68 69 6e 67 20 73 69 67 6e 69 6e 67 20 73 74 65 70 20 6f 66 20 74 68 65 20 54 68 69 6e ...>

        return (
            {
                getStep: function ()
                {
                    return (
                        {
                            id: "proxies",
                            title: "Proxies and Daemons",
                            template: "templates/configurator/proxies.mst",
//                            hooks:
//                            [
//                                { id: "configure_keybase_proxy", event: "click", code: keybase_click },
//                                { id: "configure_deluge_proxy", event: "click", code: deluge_click },
//                            ],
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
