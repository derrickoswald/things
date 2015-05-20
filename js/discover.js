/**
 * @fileOverview View of the thing tracker network.
 * @name discover
 * @author Derrick Oswald
 * @version 1.0
 */
define
(
    ["configuration", "page", "mustache", "deluge"],
    /**
     * @summary Functions for handling the discover page.
     * @name discover
     * @exports discover
     * @version 1.0
     */
    function (configuration, page, mustache, deluge)
    {
        var trackers_template =
            "<div><button id='post_my_things'>Post my things</button></div>" +
            "<button id='info_button' class='btn btn-primary publish_form_button' type='submit'>" +
                "<i class='glyphicon glyphicon-info-sign'></i>" +
                "<span>Info</span>" +
            "</button>" +
            "<button id='magnet_button' class='btn btn-primary publish_form_button' type='submit'>" +
                "<i class='glyphicon glyphicon-magnet'></i>" +
                "<span>Magnet</span>" +
            "</button>" +
            "<div id='count_of_trackers'>{{#total_rows}}{{total_rows}} trackers{{/total_rows}}{{^total_rows}}no documents{{/total_rows}}</div>" +
            "<ul class='tracker_list'>" +
                "{{#rows}}" +
                    "{{#value}}" +
                    "<div><h3>{{tracker}} ({{id}})</h3>" +
                        "<ul>" +
                            "{{#things}}" +
                            "<li>{{.}}</li>" +
                            "{{/things}}" +
                        "</ul>" +
                    "{{/value}}" +
                "{{/rows}}" +
            "</ul>";

        /**
         * @summary Push the URL and SHA1 keys in the public database to the tracker database.
         * @description Updates the document about the local public database in the tracker database.
         * @function post_my_things
         * @memberOf module:discover
         */
        function post_my_things ()
        {
            $.get
            (
                configuration.getDocumentRoot (),
                function (welcome) // {"couchdb":"Welcome","uuid":"fe736197b3e3e543fdba84b1c2385111","version":"1.6.1","vendor":{"version":"14.04","name":"Ubuntu"}}
                {
                    welcome = JSON.parse (welcome);
                    var public_name = configuration.getConfigurationItem ("public_database");
                    var tracker_name = configuration.getConfigurationItem ("tracker_database");
                    $.couch.db (public_name).allDocs
                    (
                        {
                            success: function (data)
                            {
                                var doc = { _id: welcome.uuid };
                                doc.tracker = configuration.getDocumentRoot () + "/" + public_name + "/";
                                doc.things = [];
                                data.rows.forEach
                                (
                                    function (item)
                                    {
                                        if ("_" != item.id.charAt (0))
                                            doc.things.push (item.id);
                                    }
                                );
                                // get the current post
                                var options =
                                {
                                    success: function ()
                                    {
                                        alert (tracker_name + " updated");
                                    },
                                    error: function (status)
                                    {
                                        alert (tracker_name + " update failed " + JSON.stringify (status, null, 4));
                                    }
                                };
                                $.couch.db (tracker_name).openDoc
                                (
                                    doc._id,
                                    {
                                        success: function (data)
                                        {
                                            doc._rev = data._rev;
                                            $.couch.db (tracker_name).saveDoc
                                            (
                                                doc,
                                                options
                                            );
                                        },
                                        error: function (status)
                                        {
                                            $.couch.db (tracker_name).saveDoc
                                            (
                                                doc,
                                                options
                                            );
                                        }
                                    }
                                );

                            }
                        }
                    );

                }
            );
        }

        /**
         * @summary Display the database with functions to post to the tracker database, etc.
         * @description Main screen for the discover page.
         * @function display
         * @memberOf module:discover
         */
        function display (database, view)
        {
            $.couch.db (database).view
            (
                database + "/" + view,
                {
                    success : function (result)
                    {
                        var areas = page.layout ();
                        areas.content.innerHTML = mustache.render (trackers_template, result);
                        document.getElementById ("post_my_things").onclick = post_my_things;
                        document.getElementById ("info_button").onclick = info;
                        document.getElementById ("magnet_button").onclick = magnet;
                    },
                    error : function (status)
                    {
                        console.log (status);
                    }
                }
            );
        }

        function info (event)
        {
            deluge.login (
                deluge.Password,
                {
                    success:
                        function ()
                        {
                            deluge.getTorrentInfo
                            (
                                "E5CF08EF3FDA6C8E393F5C30C10CD5718D829973",
                                {
                                    success: function (data) { alert (JSON.stringify (data, null, 4)); },
                                    error: function () { alert ("failed to get info"); }
                                }
                            );
                        },
                    error: function () { alert ("failed deluge login"); }
                }
            );
        }

        function magnet (event)
        {
            deluge.login (
                deluge.Password,
                {
                    success:
                        function ()
                        {
                            deluge.downloadTorrent (
                                "magnet:?xt=urn:btih:E5CF08EF3FDA6C8E393F5C30C10CD5718D829973", // &dn=american+sniper+2014+dvdscr+xvid+ac3+evo&tr=udp%3A%2F%2Fopen.demonii.com%3A1337%2Fannounce
                                // 32 bit encoded "magnet:?xt=urn:btih:4XHQR3Z73JWI4OJ7LQYMCDGVOGGYFGLT",
                                {
                                    success: function (data) { alert (JSON.stringify (data, null, 4)); },
                                    error: function () { alert ("failed to add magnet"); }
                                }
                            );
                        },
                    error: function () { alert ("failed deluge login"); }
                }
            );
        }

        /**
         * @summary Initialize the discover page.
         * @description Display the discover page.
         * @function init
         * @memberOf module:discover
         */
        function init ()
        {
            display (configuration.getConfigurationItem ("tracker_database"), "Trackers");
        }

        return (
            {
                initialize: init,
                post_my_things: post_my_things
            }
        );
    }
);