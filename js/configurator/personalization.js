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
         * @summary Create proxy entries in the CouchDB local configuration event handler.
         * @description Creates http proxy entries for keybase.io and the local deluge-web.
         * @param {object} event - the create proxies button pressed event
         * @function create_proxies
         * @memberOf module:personalization
         */
        function create_proxies (event)
        {
            $.couch.config
            (
                {
                    success: function ()
                    {
                        $.couch.config
                        (
                            {
                                success: function () { alert ("proxies configured"); },
                                error: function () { alert ("proxy configuration failed"); }
                            },
                            "httpd_global_handlers",
                            "keybase",
                            "{couch_httpd_proxy, handle_proxy_req, <<\"https://keybase.io/\">>}"
                        );
                    },
                    error: function () { alert ("proxy configuration failed"); }
                },
                "httpd_global_handlers",
                "json",
                "{couch_httpd_proxy, handle_proxy_req, <<\"http://localhost:8112\">>}"
            );
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

            login.isLoggedIn
            (
                {
                    success: function ()
                    {
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
                    },
                    error: function ()
                    {
                        alert ("You must be logged in to save the configuration.");
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