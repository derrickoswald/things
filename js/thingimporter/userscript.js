/**
 * @fileOverview Install the user script in the browser.
 * @name thingimporter/userscript
 * @author Derrick Oswald
 * @version 2.1
 */
define
(
    ["../login", "../configuration"],
    /**
     * @summary Create, download (but not install) and test the user script.
     * @name thingimporter/userscript
     * @exports thingimporter/userscript
     * @version 2.1
     */
    function (login, configuration)
    {
        /**
         * Check if the user script is set up for thingiverse.com.
         * @memberOf module:thingimporter/setup
         */
        function check_thingiverse ()
        {
            var ping;
            var xmlhttp;
            var iframe;
            var scripted;
            var details;

            // get the current value of ping time
            ping = configuration.getDocumentRoot () + "/" +
                configuration.getConfigurationItem ("pending_database") +
                "/ping";
            xmlhttp = new XMLHttpRequest ();
            xmlhttp.open ("GET", ping, true);
            xmlhttp.setRequestHeader ("Accept", "application/json");
            xmlhttp.onreadystatechange = function ()
            {
                var last;

                if (4 == xmlhttp.readyState)
                    if (200 == xmlhttp.status || 201 == xmlhttp.status || 202 == xmlhttp.status  || 404 == xmlhttp.status)
                    {
                        if (404 != xmlhttp.status)
                            last = new Date (JSON.parse (xmlhttp.responseText).time);
                        else
                            last = new Date ();

                        // inject the iframe into the page, wait for render complete
                        iframe = document.createElement ("iframe");
                        iframe.id = "thingiverse";
                        iframe.src = "http://www.thingiverse.com/thing:796123";
                        iframe.style.display = "none";
                        iframe.onload =
                            function (event)
                            {
                                xmlhttp = new XMLHttpRequest ();
                                xmlhttp.open ("GET", ping, true);
                                xmlhttp.setRequestHeader ("Accept", "application/json");
                                xmlhttp.onreadystatechange = function ()
                                {
                                    var next;

                                    if (4 == xmlhttp.readyState)
                                    {
                                        scripted = false;
                                        if (200 == xmlhttp.status || 201 == xmlhttp.status || 202 == xmlhttp.status)
                                        {
                                            next = new Date (JSON.parse (xmlhttp.responseText).time);
                                            scripted = (last.valueOf () != next.valueOf ());
                                        }
                                        document.getElementById ("thingiverse_user_scripted").innerHTML = (scripted ? "true" : "false");
                                        details = $ ("#scripted");
                                        if (scripted)
                                            details.removeClass ("hidden");
                                        else
                                            details.addClass ("hidden");

                                        // remove the iframe
                                        document.getElementById ("thingiverse_section").removeChild (iframe);
                                    }
                                };
                                xmlhttp.send ();
                            };
                        document.getElementById ("thingiverse_section").appendChild (iframe);
                    }
                    else
                        document.getElementById ("thingiverse_user_scripted").innerHTML = "false";
            };
            xmlhttp.send ();
        }

        /**
         * @summary Edit the user script according to the current configuration.
         * @description Replace standard constants with instance specific values.
         * The variable declarations of the form $$XXX$$ are changed
         * to reflect the actual values for this instance of the <em>things</em> system.
         * @param {string} text - the raw user script contents to be edited
         * @param {object} subst - the object with substitution strings, name: value
         * @function customize_user_script
         * @memberOf module:thingimporter/setup
         */
        function customize_user_script (text, subst)
        {
            var regexp;
            var match;
            var variable;
            var value;
            var newtext;
            var ret;

            regexp = /(\$\$.*\$\$)/;
            match = regexp.exec (text);
            if (match)
            {
                variable = match[0].substring (2, match[0].length - 2);
                value = subst[variable] ? subst[variable] : "";
                newtext = text.replace (match[0], value);
                ret = customize_user_script (newtext, subst); // recursive
            }
            else
                ret = text;

            return (ret);
        }

        /**
         * @summary Fetch a script using ajax.
         * @description Asynchronously request the contents of the given file
         * and call the success() function with the contents.
         * @param {string} name the name of the script to retrieve (including directories)
         * @param {object} options callback functions success() and error()
         * @function get_script
         * @memberOf module:thingimporter/setup
         */
        function get_script (name, options)
        {
            var script;
            var xmlhttp;

            options = options || {};
            script = configuration.getDocumentRoot () + "/things/_design/things/" + name;
            xmlhttp = new XMLHttpRequest ();
            xmlhttp.open ("GET", script, true);
            xmlhttp.onreadystatechange = function ()
            {
                if (4 == xmlhttp.readyState)
                    if (200 == xmlhttp.status)
                    {
                        if (options.success)
                            options.success (xmlhttp.responseText);
                    }
                    else
                    {
                        if (options.error)
                            options.error ();
                    }

            };
            xmlhttp.send ();
        }

        /**
         * @summary Change patterns into fetched file contents within a string.
         * @description Replace patterns of the form "%%name%%" with the contents of file "name".
         * @param {string} text the text to replace within
         * @param {object} options callback functions for results
         * @function replace_placeholders
         * @memberOf module:thingimporter/setup
         */
        function replace_placeholders (text, options)
        {
            var regexp;
            var match;
            var javascript;

            regexp = /("%%.*%%")/;
            match = regexp.exec (text);
            if (match)
            {
                javascript = match[0].substring (3, match[0].length - 3);
                get_script
                (
                    javascript,
                    {
                        success: function (script)
                        {
                            var newtext;

                            newtext = text.replace (match[0], script);
                            replace_placeholders (newtext, options); // recursive
                        },
                        error: function ()
                        {
                            if (options.error)
                                options.error ();
                        }

                    }
                );
            }
            else
                if (options.success)
                    options.success (text);
        }

        /**
         * @summary Set up the "download user script" button.
         * @description Create a customizer user script and make it available as
         * a data URL downloaded when the button is pressed.
         * @function prepare_user_script
         * @memberOf module:thingimporter/setup
         */
        function prepare_user_script ()
        {
            var script;
            var a;
            var substitutions =
            {
                version: "2.1",
                protocol: location.protocol,
                host: location.hostname,
                port: location.port,
                prefix: $.couch.urlPrefix,
                database: configuration.getConfigurationItem ("pending_database")
            };

            // get the user script
            script = "js/thingimporter/thingiverse_import.user.js";
            get_script
            (
                script,
                {
                    success: function (text)
                    {
                        text = customize_user_script (text, substitutions);
                        replace_placeholders
                        (
                            text,
                            {
                                success: function (text)
                                {
                                    text = encodeURIComponent (text);
                                    text = unescape (text);
                                    text = btoa (text);
                                    a = document.getElementById ('script_link');
                                    a.setAttribute ("href", "data:application/octet-stream;base64," + text);
                                    a.setAttribute ("download", "thingiverse_import.user.js");
                                },
                                error: function ()
                                {
                                    alert ("failed to generate user script");
                                }
                            }
                        );
                    },
                    error: function ()
                    {
                        alert ("user script " + script + " not found");
                    }
                }
            );
        }


        /**
         * @summary Initialize the user script installation page.
         * @description Creates the download artifact and optionally tests the installation.
         * @return <em>nothing</em>
         * @function init
         * @memberOf module:thingimporter/userscript
         */
        function init ()
        {
            // set up the download script button
            prepare_user_script ();
        }

        return (
            {
                getStep : function ()
                {
                   return (
                    {
                        id : "userscript",
                        title : "Install User Script",
                        template : "templates/thingimporter/userscript.mst",
                        hooks:
                        [
                            { id: "test_user_script_button", event: "click", code: check_thingiverse, obj: this }
                        ],
                        transitions: { enter: init, obj: this }
                    });
                }
            }
        );
    }
);
