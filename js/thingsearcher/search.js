/**
 * @fileOverview Search for things.
 * @name search
 * @author Derrick Oswald
 * @version 1.0
 */
define
(
    ["mustache", "../login", "../configuration", "../page", "../home"],
    /**
     * @summary Search for a Lucene expression in a database.
     * @description Allows the user to enter a Lucene search phrase and see the results.
     * @name thingsearcher/search
     * @exports thingsearcher/search
     * @version 1.0
     */
    function (mustache, login, configuration, page, home)
    {
        /**
         * @summary Search.
         * @description User input and search results.
         * @param {object} event - the button click event
         * @return <em>nothing</em>
         * @function search
         * @memberOf module:thingsearcher/search
         */
        function search (event)
        {
            var dblist;

            event.preventDefault ();

            // clear out the current contents
            document.getElementById ("search_results").innerHTML = "";

            // process each database
            dblist = page.getDatabases ();
            dblist.forEach
            (
                function (database) // { database: "public_things", name: "PlayThings", url: "public_things" },
                {
                    var db;
                    var url;
                    var xmlhttp;

                    db = database.database;
                    url = configuration.getDocumentRoot () + "/_fti/local/" + db + "/_design/" + db + "/search";
                    xmlhttp = new XMLHttpRequest ();
                    xmlhttp.open ("POST", url, true);
                    xmlhttp.setRequestHeader ("Content-Type", "application/x-www-form-urlencoded");
                    xmlhttp.setRequestHeader ("Accept", "application/json");
                    xmlhttp.onreadystatechange = function ()
                    {
                        if (4 == xmlhttp.readyState)
                            if (200 == xmlhttp.status)
                            {
                                var result = JSON.parse (xmlhttp.responseText);
                                result.database = db;
                                result.name = database.name;
                                // make it look like a view query
                                result.rows.forEach
                                (
                                    function (item)
                                    {
                                        item.value = item.doc;
                                        delete item.doc;
                                    }
                                );
                                home.draw (result, "search_results", {});
                            }
                            else
                                alert ("search error: " + xmlhttp.status);

                    };
        //            xmlhttp.timeout = 500; // half a second - the number of milliseconds a request can take before automatically being terminated. A value of 0 (which is the default) means there is no timeout.
        //            xmlhttp.ontimeout = function () // whenever the request times out
        //            {
        //                alert ("ready state = " +  xmlhttp.readyState + " status = " + xmlhttp.status);
        //            }
                    xmlhttp.send
                    (
                        "include_docs=true&q=" + document.getElementById ("search_query").value
                    );
                }
            );
        }

        return (
            {
                getStep: function ()
                {
                    return (
                        {
                            id: "search",
                            title: "Search for things",
                            template: "templates/thingsearcher/search.mst",
                            hooks:
                            [
                                { id: "search_button", event: "click", code: search }
                            ]
                        }
                    );
                }
            }
        );
    }
);
