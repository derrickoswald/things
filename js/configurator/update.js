/**
 * @fileOverview Check for updates step.
 * @name configurator/update
 * @author Derrick Oswald
 * @version 1.0
 */
define
(
    ["../configuration"],
    /**
     * @summary Proxy and daemon configuration step.
     * @description Sets up proxies and daemon entries in the CouchDB configuration file.
     * @name configurator/update
     * @exports configurator/update
     * @version 1.0
     */
    function (configuration)
    {
        /**
         * @summary Trigger replication.
         * @description Replicate the things system from upstream to here.
         * @param {object} event - the button click event, <em>not used</em>
         * @function replicate
         * @memberOf module:configurator/update
         */
        function replicate (event)
        {
            var source;
            var replicate;
            var url;
            var xmlhttp;

            source = document.getElementById ("replication_source").value;
            replicate =
            {
                source: source,
                target: "things",
            };
            url = configuration.getDocumentRoot () + "/_replicate";
            xmlhttp = new XMLHttpRequest ();
            xmlhttp.open ("POST", url, true);
            xmlhttp.setRequestHeader ("Content-Type", "application/json");
            xmlhttp.setRequestHeader ("Accept", "application/json");
            xmlhttp.onreadystatechange = function ()
            {
                if (4 == xmlhttp.readyState)
                    if (200 == xmlhttp.status)
                    {
                        alert ("successfully replicated from " + source);
                        init ();
                    }
                    else
                        alert ("error: failed to replicate using " + JSON.stringify (replicate, null, 4));
            };
            xmlhttp.send (JSON.stringify (replicate, null, 4));
        }

        /**
         * @summary Check for a newer software version.
         * @description Check in the thing tracker database for the upstream system,
         * and call back with the version.
         * @param {string} upstream - the url for the upstream things version
         * @param {object} options - callbacks, success(url, version) and error
         * @function check_version
         * @memberOf module:configurator/update
         */
        function check_version (upstream, options)
        {
            var tracker;

            // set up response if none provided
            options = options || {};
            options.success = options.success || function (data) { console.log (data); };
            options.error = options.error || function (status) { console.log (status); };
            tracker = configuration.getConfigurationItem ("tracker_database");
            $.couch.db (tracker).allDocs
            (
                {
                    include_docs: true,
                    success: function (result)
                    {
                        result.rows.forEach
                        (
                            function (row)
                            {
                                // ToDo: handle another upstream things site that has a newer version
                                if ((null != row.doc.things_url) && (row.doc.things_url == upstream))
                                    options.success (row.doc.things_url, row.doc.version);
                            }
                        );
                    },
                    error: options.error
                }
            );
        }

        /**
         * @summary Handle a change event on the upstream things URL.
         * @description Check the version for the upstream site in the thing tracker database.
         * @param {object} event - the change event on the input field, <em>not used</em>
         * @function upstream_change
         * @memberOf module:configurator/update
         */
        function upstream_change (event)
        {
            var upstream;
            var version;
            var button;
            var details;

            version = configuration.getVersion ();
            upstream = document.getElementById ("replication_source").value;
            button = document.getElementById ("replicate");
            details = document.getElementById ("things_up_to_date");
            // assume it needs to be updated until proven otherwise
            button.disabled = false;
            details.classList.add ("hidden");
            check_version
            (
                upstream,
                {
                    success: function (url, ver)
                    {
                        if (ver <= version)
                        {
                            // button.disabled = true;
                            details.classList.remove ("hidden");
                        }
                    },
                    error: function ()
                    {
                    }
                }
            );
        }

        /**
         * @summary Initialize the update form.
         * @description Prepare the form for update action.
         * @function init
         * @memberOf module:configurator/update
         */
        function init ()
        {
            var upstream;

            upstream = configuration.getConfigurationItem ("upstream_things");
            document.getElementById ("replication_source").value = upstream;
            upstream_change ();
        }

        return (
            {
                getStep: function ()
                {
                    return (
                        {
                            id: "update",
                            title: "Update",
                            template: "templates/configurator/update.mst",
                            hooks:
                            [
                                { id: "replicate", event: "click", code: replicate },
                                { id: "replication_source", event: "input", code: upstream_change }
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