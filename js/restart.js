/**
 * @fileOverview Restart CouchDB and wait.
 * @name restart
 * @author Derrick Oswald
 * @version 1.0
 */
define
(
    ["configuration"],
    /**
     * @summary Restart CouchDB.
     * @description Display a yes/no dialog and if the user clicks yes, restart CouchDB
     * and wait on it till it comes back on line.
     * @name restart
     * @exports restart
     * @version 1.0
     */
    function (configuration)
    {
        template =
            "<div id='restart_required' class='modal fade' tabindex='-1' role='dialog' aria-labelledby='couchdb_restart' aria-hidden='true'>" +
              "<div class='modal-dialog'>" +
                "<div class='modal-content'>" +
                  "<div class='modal-header'>" +
                    "<button type='button' class='close' data-dismiss='modal' aria-label='Close'><span aria-hidden='true'>&times;</span></button>" +
                    "<h4 class='modal-title' id='couchdb_restart'>CouchDB Restart Required</h4>" +
                  "</div>" +
                  "<div class='modal-body'>" +
                  "<p>In order for changes to the configuration to take effect, CouchDB needs to be restarted.</p>" +
                  "<p>You can choose to do it later if you don't need that configuration functionality immediately. " +
                  "</div>" +
                  "<div class='modal-footer'>" +
                    "<button type='button' class='btn btn-default' data-dismiss='modal'>Later</button>" +
                    "<button id='restart' type='button' class='btn btn-primary'>Restart</button>" +
                  "</div>" +
                "</div>" +
              "</div>" +
            "</div>";

        /**
         * @summary Event handler for the restart CouchDB button.
         * @description Restarts the CouchDB server and closes the dialog box.
         * @function restart
         * @memberOf module:restart
         */
        function restart (event)
        {
            // issue the HTTP request to restart
            restart_couch
            (
                {
                    success: function ()
                    {
                        console.log ("restart successful");
                        var dialog = document.getElementById ("restart_required");
                        var title = dialog.getElementsByClassName ("modal-title")[0].innerHTML;
                        var body = dialog.getElementsByClassName ("modal-body")[0].innerHTML;
                        dialog.getElementsByClassName ("modal-footer")[0].classList.add ("hidden");
                        dialog.getElementsByClassName ("modal-title")[0].innerHTML = "CouchDB Restarted...";
                        dialog.getElementsByClassName ("modal-body")[0].innerHTML = "Waiting 25...";

                        // wait for couch to come back
                        wait_for_couch
                        (
                            {
                                count: 25,
                                success: function ()
                                {
                                    console.log ("couchdb is back");
                                    // close the modal dialog
                                    $ ("#restart_required").modal ("hide");
                                    // put it back the way it was
                                    dialog.getElementsByClassName ("modal-title")[0].innerHTML = title;
                                    dialog.getElementsByClassName ("modal-body")[0].innerHTML = body;
                                    dialog.getElementsByClassName ("modal-footer")[0].classList.remove ("hidden");
                                    // update the display
                                    get_proxy ();
                                },
                                error: function ()
                                {
                                    console.log ("couchdb is down and out");
                                    // close the modal dialog
                                    $ ("#restart_required").modal ("hide");
                                    // put it back the way it was
                                    dialog.getElementsByClassName ("modal-title")[0].innerHTML = title;
                                    dialog.getElementsByClassName ("modal-body")[0].innerHTML = body;
                                    dialog.getElementsByClassName ("modal-footer")[0].classList.remove ("hidden");
                                }
                            }
                        );
                    },
                    error: function ()
                    {
                        console.log ("restart failed");
                    }
                }
            );
        }

        /**
         * @summary Restarts the CouchDB server.
         * @description Calls the /_restart HTTP API. Assumes the user is logged in as an administrator.
         * @function restart_couch
         * @memberOf module:restart
         */
        function restart_couch (options)
        {
            var url;
            var xmlhttp;

            options = options || {};
            url = configuration.getDocumentRoot () + "/_restart";
            xmlhttp = new XMLHttpRequest ();
            xmlhttp.open ("POST", url, true);
            xmlhttp.setRequestHeader ("Content-Type", "application/json");
            xmlhttp.setRequestHeader ("Accept", "application/json");
            xmlhttp.onreadystatechange = function ()
            {
                if (4 == xmlhttp.readyState)
                    if (202 == xmlhttp.status)
                    {
                        if (options.success)
                            options.success ();
                    }
                    else
                        if (options.error)
                            options.error ();
            };
            xmlhttp.send ();
        }

        /**
         * @summary Waits for the CouchDB server.
         * @description Calls the / HTTP API until there is an answer.
         * @function wait_for_couch
         * @memberOf module:restart
         */
        function wait_for_couch (options)
        {
            var url;
            var xmlhttp;

            options = options || {};
            if ("undefined" == typeof (options.count))
                options.count = 1;
            url = configuration.getDocumentRoot () + "/";
            xmlhttp = new XMLHttpRequest ();
            xmlhttp.open ("GET", url, true);
            xmlhttp.setRequestHeader ("Content-Type", "application/json");
            xmlhttp.setRequestHeader ("Accept", "application/json");
            xmlhttp.timeout = 50;
            xmlhttp.ontimeout = function () // whenever the request times out
            {
                options.count--;
                document.getElementById ("restart_required").getElementsByClassName ("modal-body")[0].innerHTML = "Waiting " + options.count + "...";
                if (0 < options.count)
                    setTimeout (function () { wait_for_couch (options); }, 5000);
                else
                    if (options.error)
                        options.error ();
            },
            xmlhttp.onreadystatechange = function ()
            {
                if (4 == xmlhttp.readyState)
                    if (200 == xmlhttp.status)
                    {
                        if (options.success)
                            options.success ();
                    }
                    else
                    {
                        options.count--;
                        document.getElementById ("restart_required").getElementsByClassName ("modal-body")[0].innerHTML = "Waiting " + options.count + "...";
                        if (0 < options.count)
                            setTimeout (function () { wait_for_couch (options); }, 5000);
                        else
                            if (options.error)
                                options.error ();
                    }
            };
            xmlhttp.send ();
        }

        /**
         * @summary Removes the modal dialog from the DOM.
         * @description Deletes the modal dialog box element from the body of the document.
         * @function outject
         * @memberOf module:restart
         */
        function outject (event)
        {
            var modal;

            modal = document.getElementById ("restart_required");
            if (modal)
                modal.parentNode.removeChild (modal);
        }

        /**
         * @summary Injects the modal dialog into the DOM.
         * @description Adds the dialog elements and hooks up the listeners.
         * @function inject
         * @memberOf module:restart
         */
        function inject ()
        {
            var wrapper;
            var modal;

            wrapper = document.createElement ("div");
            wrapper.innerHTML = template;
            modal = wrapper.children[0];
            document.getElementsByTagName ("body")[0].appendChild (modal);
            $ (modal).on ("hidden.bs.modal", outject);
            document.getElementById ("restart").addEventListener ("click", restart);
            $ (modal).modal ();
        }

        return (
            {
                inject: inject
            }
        );
    }
);
