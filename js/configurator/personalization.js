/**
 * @fileOverview System personalization step.
 * @name personalization
 * @author Derrick Oswald
 * @version 1.0
 */
define
(
    ["../configuration", "../page", "../mustache", "../login", "../database"],
    /**
     * @summary Database setup page and functions for loading and saving configuration data.
     * @description Database setup page, functions for loading and saving
     * configuration data to the configuration database and programatic
     * access to the configuration settings.
     * @name configurator
     * @exports configurator
     * @version 1.0
     */
    function (configuration, page, mustache, login, database)
    {
        /**
         * @summary Get the current proxies from the CouchDB local configuration.
         * @description Gets all options from the httpd_global_handlers section.
         * @function get_proxies
         * @memberOf module:personalization
         */
        function get_proxies ()
        {
            var keybase = document.getElementById ("keybase_proxy");
            var deluge = document.getElementById ("deluge_proxy");
            keybase.innerHTML = "";
            deluge.innerHTML = "";
            $.couch.config
            (
                {
                    success: function (data)
                    {
                        if (data.keybase)
                            keybase.innerHTML = data.keybase;
                        if (data.json)
                            deluge.innerHTML = data.json;
                    },
                },
                "httpd_global_handlers"
            );
        }

        /**
         * @summary Create proxy entries in the CouchDB local configuration event handler.
         * @description Creates http proxy entries for keybase.io and the local deluge-web.
         * @param {object} event - the create proxies button pressed event
         * @function create_proxies
         * @memberOf module:personalization
         */
        function create_proxies (event)
        {
            var options =
            {
                success: get_proxies,
                error: function () { alert ("proxy configuration failed"); get_proxies (); }
            };
            var options2 =
            {
                success: function () { create_keybase_proxy (options); },
                error: function () { alert ("proxy configuration failed"); get_proxies (); }
            };
            create_deluge_proxy (options2);
        }

        /**
         * @summary Create a proxy entry.
         * @description Creates an http proxy entry for the provided name and url.
         * @param {object} options - functions for success and error callback
         * @function create_proxy
         * @memberOf module:personalization
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
         * @memberOf module:personalization
         */
        function create_keybase_proxy (options)
        {
            create_proxy ("keybase", "https://keybase.io", options);
        }

        /**
         * @summary Create proxy entry for deluge in the CouchDB local configuration.
         * @description Creates an http proxy entry for deluge.
         * @param {object} options - functions for success and error callback
         * @function create_deluge_proxy
         * @memberOf module:personalization
         */
        function create_deluge_proxy (options)
        {
            create_proxy ("json", "http://localhost:8112", options);
        }

        /**
         * @summary Save button event handler.
         * @description Saves the form values as the current configuration document.
         * If the configuration database doesn't yet exist it is created.
         * @param {object} event - the save button press event
         * @function save
         * @memberOf module:configurator
         */
        function save (event)
        {
            event.preventDefault ();
            event.stopPropagation ();

            var cb =
            {
                success: function (data) { console.log (data); alert ("Configuration saved."); },
                error: function (status) { console.log (status); alert ("Configuration save failed."); }
            };
            configuration.setConfigurationItem ("torrent_directory", document.getElementById ("torrent_directory").value.trim ());
            configuration.setConfigurationItem ("instance_name", document.getElementById ("instance_name").value.trim ());
            configuration.setConfigurationItem ("keybase_username", document.getElementById ("keybase_username").value.trim ());

            configuration.configuration_exists
            (
                {
                    success: function ()
                    {
                        configuration.saveConfiguration (cb);
                    },
                    error: function ()
                    {
                        database.make_database
                        (
                            configuration.getConfigurationDatabase (),
                            {
                                success: function () { configuration.saveConfiguration (cb); },
                                error: cb.error
                            },
                            null,
                            database.standard_validation
                        );
                    }
                }
            );
        }

        /**
         * Fills the form with existing configuration data and attaches handlers for the
         * various operations.
         * @summary Initialize the configurator.
         * @description Fills the form with existing configuration data and attaches handlers for the
         * various operations.
         * @function init
         * @memberOf module:configurator
         */
        function init ()
        {
            document.getElementById ("torrent_directory").value = configuration.getConfigurationItem ("torrent_directory");
            document.getElementById ("instance_name").value = configuration.getConfigurationItem ("instance_name");
            document.getElementById ("keybase_username").value = configuration.getConfigurationItem ("keybase_username");
            get_proxies ();
        }

        return (
            {
                getStep: function ()
                {
                    return (
                        {
                            id: "personalize",
                            title: "Personalization",
                            template: "templates/configurator/personalization.mst",
                            hooks:
                            [
                                { id: "save_personalization", event: "click", code: save, obj: this },
                                { id: "configure_proxies", event: "click", code: create_proxies, obj: this }
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