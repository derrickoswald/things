/**
 * @fileOverview Publish step of the ThingMaker wizard.
 * @name thingmaker/publish
 * @author Derrick Oswald
 * @version 1.0
 */
define
(
    ["mustache", "../deluge", "../records", "../bencoder", "../login", "../configuration", "../discover", "../torrent", "../chooser", "../home", "../page"],
    /**
     * @summary Publish a thing.
     * @description Provides the functionality to publish a thing to the
     * public database, deluge and the thingtracker network.
     * <pre>
     *    webseeds
     *
     *    Metadata Extension
     *
     *    In the main area of the metadata file and not part of the "info" section,
     *    will be a new key, "url-list". This key will refer to a one or more URLs,
     *    and will contain a list of web addresses where torrent data can be retrieved.
     *    This key may be safely ignored if the client is not capable of using it.
     *
     *    For example:
     *        d 8:announce27:http://tracker.com/announce 8:url-list26:http://mirror.com/file.exe 4:info...
     *
     *    If the "url-list" URL ends in a slash, "/" the client must add the "name"
     *    from the torrent to make the full URL. This allows .torrent generators to
     *    treat this field same for single file and multi-file torrents.
     *
     *    Multi-File Torrents
     *
     *    BitTorrent clients normally use the "name" from the torrent info section
     *    to make a folder, then use the "path/file" items from the info section
     *    within that folder. For the case of Multi-File torrents, the "url-list"
     *    must be a root folder where a client could add the same "name" and
     *    "path/file" to create the URL for the request.
     *
     *    For example:
     *
     *        ... 8:url-list22:http://mirror.com/pub/ 4:infod5:filesld6:lengthi949e4:pathl10:Readme.txte e4:name7:michael
     *
     *        A client would use all that to build a url: http://mirror.com/pub/michael/Readme.txt
     * </pre>
     * @name thingmaker/publish
     * @exports thingmaker/publish
     * @version 1.0
     */
    function (mustache, deluge, records, bencoder, login, configuration, discover, torrent, chooser, home, page)
    {
        var trackers =
        [
            "udp://tracker.openbittorrent.com:80",
            "udp://open.demonii.com:1337",
            "udp://tracker.coppersurfer.tk:6969",
            "udp://exodus.desync.com:6969",
            "udp://tracker.leechers-paradise.org:6969",
            "udp://tracker.pomf.se",
            "udp://tracker.blackunicorn.xyz:6969"
        ];

        /**
         * List of trackers builder component.
         */
        var tracker_chooser = null;

//creation date   integer     The creation date and time, expressed as the number of seconds since January 1, 1970 12:00. Optional.
//comment     string
//created by  string  Application-generated string that may include its name, version, etc. Optional.

        /**
         * @summary Copy to the public database.
         * @description Copy a thing to the public database.
         * @param {string} primary_key - the SHA1 hash code of the thing to publish
         * @param {object} options - options to process the copy operation:
         * <pre>
         * success: function() to call when the document is copied
         * error: function to call when a problem occurs
         * </pre>
         * @return <em>nothing</em>
         * @function copy_to_public
         * @memberOf module:thingmaker/publish
         */
        function copy_to_public (primary_key, options)
        {
            options = options || {};

            // get the document
            $.couch.db (configuration.getConfigurationItem ("local_database")).openDoc
            (
                primary_key,
                {
                    attachments: true,
                    success: function (doc)
                    {
                        var attachments;
                        var pieces;

                        // re-hydrate the attachments
                        attachments = [];
                        for (var attachment in doc._attachments)
                        {
                            if (doc._attachments.hasOwnProperty (attachment))
                            {
                                if (attachment != primary_key + ".torrent") // skip the torrent: added later
                                {
                                    var blob = records.base64toBlob (doc._attachments[attachment].data, doc._attachments[attachment].content_type);
                                    var file = new File ([blob], attachment, { type: doc._attachments[attachment].content_type });
                                    attachments.push (file);
                                }
                            }
                        }

                        // remove couch stuff
                        delete doc._rev;
                        delete doc._attachments;

                        // add the comment - optional
                        if (options.comment)
                            doc.comment = options.comment;

                        // add the announce-list - optional
                        if (options.announce)
                            doc.announce = options.announce;
                        if (options["announce-list"])
                            doc["announce-list"] = [ options["announce-list"] ]; // ToDo: multiple tiers of trackers

                        // add the webseed
                        doc["url-list"] =
                            configuration.getConfigurationItem ("deluge_couch_url") + "/" +
                            configuration.getConfigurationItem ("public_database") +
                            "/" + primary_key + "/";
                        if (!doc.info.files)
                            doc["url-list"] += doc.info.name;

                        // make the pieces back into an ArrayBuffer just to make the torrent
                        pieces = doc.info.pieces;
                        doc.info.pieces = torrent.ArrayToPieces (pieces);

                        // make the torrent attachment
                        attachments.push (new File ([bencoder.str2ab (bencoder.encode (doc))], primary_key + ".torrent", { type: "application/octet-stream" }));

                        doc.info.pieces = pieces;

                        // save to public database
                        records.saveDocWithAttachments
                        (
                            configuration.getConfigurationItem ("public_database"),
                            doc,
                            {
                                success: function ()
                                {
                                    alert ("announce to public things database succeeded");
                                    page.draw ();
                                    if (options.success)
                                        options.success ();
                                },
                                error: function ()
                                {
                                    alert ("announce to public things database failed");
                                    if (options.error)
                                        options.error ();
                                }
                            },
                            attachments
                        );
                    },
                    error: function (status)
                    {
                        console.log (status);
                    }
                }
            );
        }

        /**
         * @summary Post the torrent to Deluge.
         * @description Add the torrent to the Deluge maintained list of torrents.
         * @param {string} primary_key - the SHA1 hash code of the thing to publish
         * @param {object} options - options to process the add operation:
         * <pre>
         * success: function() to call when the document is added
         * error: function to call when a problem occurs
         * </pre>
         * @return <em>nothing</em>
         * @function post_to_deluge
         * @memberOf module:thingmaker/publish
         */
        function post_to_deluge (primary_key, options)
        {
            deluge.login (
                configuration.getConfigurationItem ("deluge_password"),
                {
                    success:
                        function ()
                        {
                            alert ("deluge login succeeded");
                            deluge.addTorrent (
                                configuration.getConfigurationItem ("deluge_couch_url") + "/" +
                                configuration.getConfigurationItem ("public_database") +
                                "/" + primary_key + "/" + primary_key + ".torrent",
                                {
                                    success: function ()
                                    {
                                        alert ("add torrent to Deluge succeeded");
                                        if (options && options.success)
                                            options.success ();
                                    },
                                    error: function ()
                                    {
                                        alert ("add torrent to Deluge failed");
                                        if (options && options.error)
                                            options.error ();
                                    }
                                }
                            );
                        },
                    error:
                        function (result)
                        {
                            console.log (result);
                            alert ("deluge login failed");
                        }
                }
            );
        }

        /**
         * @summary Publish a thing
         * @description Posts the document to the public database,
         * posts the torrent to deluge and triggers an update of the thing tracker database.
         * @param primary_key thing id (SHA1 hash of info section)
         * @param options additional options for the torrent that is published, e.g. comment, announce or announce-list
         * @return <em>nothing</em>
         * @function announce
         * @memberOf module:thingmaker/publish
         */
        function announce (primary_key, options)
        {
            options = options || {};
            options.success =
                function ()
                {
                    all_unpublished ();
                    // post to Deluge
                    post_to_deluge
                    (
                        primary_key,
                        {
                            // update the Thing Tracker network
                            success: discover.post_my_things
                        }
                    );
                };
            // copy the document to the public database with appropriate .torrent
            copy_to_public (primary_key, options);
        }

        /**
         * @summary Publish handler
         * @description Executed when the user pushes the publish button on a listing.
         * @param {Object[]} docs - list of documents to operate on
         * @param {string} docs[].database - the name of the database the document resides in
         * @param {string} docs[]._id - the document primary key which is a SHA1 hash code
         * @param {string} docs[]._rev - the document revision (current revision when the view was queried)
         * @return <em>nothing</em>
         * @function publish_handler
         * @memberOf module:thingmaker/publish
         */
        function publish (docs)
        {
            if (docs.length != 1)
                alert ("sorry, currently only one document can be published at a time");
            login.isLoggedIn
            (
                {
                    success: function ()
                    {
                        var options;
                        var comment;
                        var announce_list;

                        options = {};

                        // add the comment - optional
                        comment = document.getElementById ("comment").value;
                        if (comment && ("" !== comment))
                            options.comment = comment;

                        // add the announce-list - optional
                        announce_list = [];
                        tracker_chooser.context.items.forEach (function (item) { if ("" !== item.value) announce_list.push (item.value); });
                        if (0 !== announce_list.length)
                        {
                            options.announce = announce_list[0];
                            if (1 < announce_list.length)
                                options["announce-list"] = announce_list;
                        }

                        announce (docs[0]._id, options);
                    },
                    error: function ()
                    {
                        alert ("You must login as an admin user");
                    }
                }
            );
        }

        /**
         * @summary Display unpublished documents
         * @description Get a list of document key for unpublished documents and pass
         * it to the home screen document renderer.
         * @function all_unpublished
         * @memberOf module:thingmaker/publish
         */
        function all_unpublished ()
        {
            var pub;

            pub = configuration.getConfigurationItem ("public_database");
            $.couch.db (pub).allDocs
            (
                {
                    success: function (result)
                    {
                        var publics;
                        var loc;

                        publics = result.rows.map ( function (item) { return (item.id); } );
                        loc = configuration.getConfigurationItem ("local_database");
                        $.couch.db (loc).allDocs
                        (
                            {
                                success: function (result)
                                {
                                    var keys;
                                    var view_name;

                                    keys = [];
                                    result.rows.forEach
                                    (
                                        function (item)
                                        {
                                            if ((-1 == publics.indexOf (item.id)) && ('_' != item.id[0]))
                                                keys.push (item.id);
                                        }
                                    );
                                    view_name = "things";
                                    home.build_content (loc, view_name, "public_listing", { del: home.delete_document, publish: publish }, keys);
                                }
                            }
                        );
                    }
                }
            );
        }

        /**
         * Initialization function.
         * @param {object} event - the tab being shown event, <em>not used</em>
         * @function init
         * @memberOf module:thingmaker/publish
         */
        function init (event)
        {
            tracker_chooser = new chooser.Chooser ("tracker_list", "Trackers", trackers[0], trackers);
            tracker_chooser.render ();
            all_unpublished ();
        }

        return (
            {
                getStep: function ()
                {
                    return (
                        {
                            id: "publish",
                            title: "Publish the thing",
                            template: "templates/thingmaker/publish.mst",
                            transitions:
                            {
                                enter: init
                            }
                        }
                    );
                },
                announce: announce
            }
        );
    }
);
