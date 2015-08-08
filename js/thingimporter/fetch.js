/**
 * @fileOverview Fetch thing from Thingiverse.
 * @name thingimporter/fetch
 * @author Derrick Oswald
 * @version 1.0
 */
define
(
    ["../login", "../configuration", "./userscript", "../page"],
    /**
     * @summary Load Thingiverse in an iframe and harvest the thing using a ping fetch value.
     * @name thingimporter/fetch
     * @exports thingimporter/fetch
     * @version 2.1
     */
    function (login, configuration, userscript, page)
    {
        /**
         * @summary Initialize the ping record in the pending database.
         * @description Create or update the ping record in the pending database.
         * @param {object} options - callback functions for results
         * @param {number} thing - the thing number to fetch
         * @function prepare_ping
         * @memberOf module:thingimporter/userscript
         */
        function prepare_ping (options, thing)
        {
            var pending;
            var payload;

            // set up response if none provided
            options = options || {};
            options.success = options.success || function (data) { console.log (data); };
            options.error = options.error || function (status) { console.log (status); };

            pending = configuration.getConfigurationItem ("pending_database");
            payload =
            {
                _id: "ping",
                time: (new Date ()).valueOf (),
                version: userscript.script_version,
                fetch: thing
            };
            // try to get the document
            $.couch.db (pending).openDoc
            (
                payload._id,
                {
                    success: function (doc)
                    {
                        payload._rev = doc._rev;
                        $.couch.db (pending).saveDoc
                        (
                            payload,
                            options
                        );
                    },
                    error: function ()
                    {
                        $.couch.db (pending).saveDoc
                        (
                            payload,
                            options
                        );
                    }
                }
            );
        }

        function finish ()
        {
            var pending = configuration.getConfigurationItem ("pending_database");
            $.couch.db (pending).openDoc
            (
                "ping",
                {
                    success: function (doc)
                    {
                        if (doc.fetch) // still there
                        {
                            // remove it
                            delete doc.fetch;
                            $.couch.db (pending).saveDoc (doc);
                            document.getElementById ("imported").classList.add ("hidden");
                            alert ("fetch failed, ping still had fetch:" + thing);
                        }
                        else
                        {
                            document.getElementById ("fetched").innerHTML = doc.fetched ? doc.fetched : "";
                            document.getElementById ("imported").classList.remove ("hidden");
                            page.draw ();
                        }
                    },
                    error: function ()
                    {
                        alert ("fetch failed, can't get ping document");
                    }
                }
            );
            // remove the iframe
            document.getElementById ("thingiverse_page").innerHTML = "";
            // re-enable the button
            document.getElementById ("import_thing_button").removeAttribute ("disabled");

        }

        function wait_for_ping_change (options)
        {
            var pending;
            var xmlhttp;

            // set up response if none provided
            options = options || {};
            options.success = options.success || function (data) { console.log (data); };
            options.error = options.error || function (status) { console.log (status); };

            // get the current value of the sequence
            pending = configuration.getDocumentRoot () + "/" +
                configuration.getConfigurationItem ("pending_database");
            xmlhttp = new XMLHttpRequest ();
            xmlhttp.open ("GET", pending, true);
            xmlhttp.setRequestHeader ("Accept", "application/json");
            xmlhttp.onreadystatechange = function ()
            {
                var sequence;
                var changes;
                if (4 == xmlhttp.readyState)
                {
                    if (200 == xmlhttp.status)
                    {
                        sequence = JSON.parse (xmlhttp.responseText).update_seq;
                        changes = configuration.getDocumentRoot () + "/" +
                            configuration.getConfigurationItem ("pending_database") +
                            "/_changes?heartbeat=10000&feed=longpoll&since=" + sequence + "&filter=_doc_ids";
                        xmlhttp = new XMLHttpRequest ();
                        xmlhttp.open ("POST", changes, true);
                        xmlhttp.setRequestHeader ("Content-Type", "application/json");
                        xmlhttp.setRequestHeader ("Accept", "application/json");
                        xmlhttp.onreadystatechange = function ()
                        {
                            if (4 == xmlhttp.readyState)
                            {
                                if (200 == xmlhttp.status)
                                    options.success ();
                                else
                                    options.error ();
                            }
                        };
                        xmlhttp.send (JSON.stringify ({ doc_ids: ["ping"] }));
                    }
                }
            }
            xmlhttp.send ();
        }

        /**
         * @summary Fetch the thing given by the number from http://thingiverse.com.
         * @param {object} event - the event causing the check, <em>not used</em>
         * @function fetch_thing
         * @memberOf module:thingimporter/fetch
         */
        function fetch_thing (event)
        {
            var thing;
            var iframe;

            thing = document.getElementById ("thing_number").value;
            // clean up any mess left over from a previous attempt
            document.getElementById ("thingiverse_page").innerHTML = "";
            // disable the button to prohibit another attempt while we're in process
            document.getElementById ("import_thing_button").setAttribute ("disabled", true);
            prepare_ping
            (
                {
                    success: function ()
                    {
                        // inject the iframe into the page, wait for render complete
                        iframe = document.createElement ("iframe");
                        iframe.id = "thingiverse_" + thing;
                        iframe.src = "http://www.thingiverse.com/thing:" + thing;
                        iframe.style.display = "none";
                        iframe.onload =
                            function (event)
                            {
                                // long poll the ping document
                                wait_for_ping_change
                                (
                                    {
                                        success: finish,
                                        error: finish // ToDo: error handling for long poll
                                    }
                                );
                            };
                        document.getElementById ("thingiverse_page").appendChild (iframe);
                    },
                    error: function ()
                    {
                        alert ("fetch of thing " + thing + " failed");
                    }
                },
                thing
            );
        }

        return (
            {
                getStep : function ()
                {
                   return (
                        {
                            id : "fetch",
                            title : "Fetch Things",
                            template : "templates/thingimporter/fetch.mst",
                            hooks:
                            [
                                { id: "import_thing_button", event: "click", code: fetch_thing }
                            ]
                        }
                   );
                }
            }
        );

    }
);