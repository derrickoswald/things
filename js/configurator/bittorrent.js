/**
 * @fileOverview BitTorrent configuration step.
 * @name bittorrent
 * @author Derrick Oswald
 * @version 1.0
 */
define
(
    ["../configuration", "../page", "../mustache", "../login", "../database", "../restart"],
    /**
     * @summary BitTorrent setup page.
     * @description Configure download directory, host, port and password for Deluge.
     * @name bittorrent
     * @exports bittorrent
     * @version 1.0
     */
    function (configuration, page, mustache, login, database, restart)
    {
        /**
         * @summary Get the current proxy from the CouchDB local configuration.
         * @description Gets all options from the httpd_global_handlers section.
         * @function get_proxy
         * @memberOf module:configurator/bittorrent
         */
        function get_proxy ()
        {
            var deluge = document.getElementById ("deluge_proxy");
            deluge.innerHTML = "";
            $.couch.config
            (
                {
                    success: function (data)
                    {
                        if (data.json)
                            deluge.innerHTML = data.json;
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
         * @memberOf module:configurator/bittorrent
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
         * @summary Create proxy entry for deluge in the CouchDB local configuration.
         * @description Creates an http proxy entry for deluge.
         * @param {object} options - functions for success and error callback
         * @function create_deluge_proxy
         * @memberOf module:configurator/bittorrent
         */
        function create_deluge_proxy (options)
        {
            create_proxy ("json", "http://localhost:8112", options);
        }

        /**
         * @summary Create the deluge proxy and restart the CouchDB server.
         * @description Event handler for the Deluge button.
         * @param {object} event - the click event, <em>not used</em>
         * @function deluge
         * @memberOf module:configurator/bittorrent
         */
        function deluge (event)
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
         * @summary Save button event handler.
         * @description Saves the form values as the current configuration document.
         * If the configuration database doesn't yet exist it is created.
         * @param {object} event - the save button press event
         * @function save
         * @memberOf module:configurator/bittorrent
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
            configuration.setConfigurationItem ("deluge_password", document.getElementById ("deluge_password").value.trim ());
            configuration.setConfigurationItem ("torrent_directory", document.getElementById ("torrent_directory").value.trim ());

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
         * @summary Initialize the personalization page of the configurator wizard.
         * @description Fills the form with existing configuration data and attaches handlers for the
         * various operations.
         * @param {object} event - the tab being shown event, <em>not used</em>
         * @function init
         * @memberOf module:configurator/bittorrent
         */
        function init (event)
        {
            document.getElementById ("deluge_password").value = configuration.getConfigurationItem ("deluge_password");
            document.getElementById ("torrent_directory").value = configuration.getConfigurationItem ("torrent_directory");
            get_proxy ();
        }

        return (
            {
                getStep: function ()
                {
                    return (
                        {
                            id: "bittorent",
                            title: "BitTorrent",
                            template: "templates/configurator/bittorrent.mst",
                            hooks:
                            [
                                { id: "save_bittorrent", event: "click", code: save },
                                { id: "configure_deluge_proxy", event: "click", code: deluge },
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