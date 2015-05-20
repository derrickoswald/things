/**
 * @fileOverview Publish step of the ThingMaker wizard.
 * @name thingmaker/publish
 * @author Derrick Oswald
 * @version 1.0
 */
define
(
    ["mustache", "../deluge", "../records", "../bencoder", "../login", "../configuration", "../discover", "../torrent", "../chooser"],
    /**
     * @summary Publish a thing.
     * @description Provides the functionality to publish a thing to the
     * public database, deluge and the thingtracker network.
     * @name thingmaker/publish
     * @exports thingmaker/publish
     * @version 1.0
     */
    function (mustache, deluge, records, bencoder, login, configuration, discover, torrent, chooser)
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

        function b64toBlob (b64Data, contentType, sliceSize)
        {
            contentType = contentType || "";
            sliceSize = sliceSize || 512;

            var byteCharacters = atob (b64Data);
            var byteArrays = [];

            for (var offset = 0; offset < byteCharacters.length; offset += sliceSize)
            {
                var slice = byteCharacters.slice (offset, offset + sliceSize);
                var byteNumbers = new Array (slice.length);
                for (var i = 0; i < slice.length; i++)
                    byteNumbers[i] = slice.charCodeAt (i);

                byteArrays.push (new Uint8Array (byteNumbers));
            }

            return (new Blob (byteArrays, { type: contentType }));
        }

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
                        for (attachment in doc._attachments)
                        {
                            if (doc._attachments.hasOwnProperty (attachment))
                            {
                                if (attachment != primary_key + ".torrent") // skip the torrent: added later
                                {
                                    var blob = b64toBlob (doc._attachments[attachment].data, doc._attachments[attachment].content_type);
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
                            configuration.getDocumentRoot () + "/" +
                            configuration.getConfigurationItem ("local_database") + // the attachment only exists locally
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
                        records.saveDocWithAttachments.call
                        (
                            records,
                            configuration.getConfigurationItem ("public_database"),
                            doc,
                            {
                                success: function ()
                                {
                                    alert ("announce to public things database succeeded");
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
                    error: function(status)
                    {
                        console.log(status);
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
                deluge.Password,
                {
                    success:
                        function ()
                        {
                            alert ("deluge login succeeded");
                            deluge.addTorrent (
                                configuration.getDocumentRoot () + "/" +
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
        };

        /**
         * Publish button pushed event handler
         * @param event the triggering event
         * @param data the ThingMaker data object.
         * @return <em>nothing</em>
         * @function publish_handler
         * @memberOf module:thingmaker/publish
         */
        function publish_handler (event, data)
        {
            var parameters;

            event.preventDefault ();

            parameters =
            {
                success: function ()
                {
                    var options;
                    var comment;
                    var announce_list;

                    options = {};

                    // add the comment - optional
                    comment = document.getElementById ("comment").value;
                    if (comment && ("" != comment))
                        options.comment = comment;

                    // add the announce-list - optional
                    announce_list = [];
                    tracker_chooser.context.items.forEach (function (item) { if ("" != item.value) announce_list.push (item.value); });
                    if (0 != announce_list.length)
                    {
                        options.announce = announce_list[0];
                        if (1 < announce_list.length)
                            options["announce-list"] = announce_list;
                    }

                    var primary_key;
                    if (!data.torrent)
                        primary_key = "c24e450a550f8a399f93092c1c6366aac5565c2e";
                    else
                        primary_key = data.torrent._id;
                    announce (primary_key, options);
                },
                error: function ()
                {
                    alert ("You must login as an admin user");
                }
            };
            login.isLoggedIn (parameters);
        }

        function init (event, data)
        {
            tracker_chooser = new chooser.Chooser ("tracker_list", "Trackers", trackers[0], trackers);
            tracker_chooser.render ();
        }

        return (
            {
                getStep: function ()
                {
                    var publish_hooks =
                    [
                        { id: "publish_button", event: "click", code: publish_handler, obj: this },
                    ];
                    return ({ id: "publish", title: "Publish the thing", template: "templates/thingmaker/publish.mst", hooks: publish_hooks, transitions: { enter: init, obj: this } } );
                },
                announce: announce
            }
        );
    }
);