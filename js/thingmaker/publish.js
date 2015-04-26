define
(
    ["mustache", "../deluge", "../records", "../bencoder", "../login", "../configuration", "../discover", "../torrent"],
    function (mustache, deluge, records, bencoder, login, configuration, discover, torrent)
    {
        var tracker_template =
            "<label for='announce-list' class='col-sm-3 control-label'>" +
                "Trackers" +
            "</label>" +
            "<div class='col-sm-9'>" +
                "<span class='dropdown'>" +
                    "<input id='announce-list' type='text' class='form-control dropdown-toggle' data-toggle='dropdown' placeholder='udp://tracker.openbittorrent.com:80' aria-label='trackers'>" +
                    "<ul class='dropdown-menu pull-right' role='menu'>" +
                        "{{#trackers}}" +
                        "<li role='presentation'>" +
                            "<a class='tracker' data-target='announce-list' role='menuitem' tabindex='-1' href='#'>{{.}}</a>" +
                        "</li>" +
                        "{{/trackers}}" +
                    "</ul>" +
                "</span>" +
            "</div>";

        var trackers =
            [
                "udp://tracker.openbittorrent.com:80/announce",
                "udp://open.demonii.com:1337",
                "udp://tracker.coppersurfer.tk:6969",
                "udp://exodus.desync.com:6969",
                "udp://tracker.leechers-paradise.org:6969",
                "udp://tracker.pomf.se",
                "udp://tracker.blackunicorn.xyz:6969"
            ];

//creation date   integer     The creation date and time, expressed as the number of seconds since January 1, 1970 12:00. Optional.
//comment     string
//created by  string  Application-generated string that may include its name, version, etc. Optional.

        function copy_to_public (primary_key, options)
        {
            options = options || {};

            // get the document
            $.couch.db (configuration.getConfigurationItem ("local_database")).openDoc
            (
                primary_key,
                {
                    success: function (doc)
                    {
                        var comment;
                        var announce;
                        var attachments;
                        var pieces;

                        // remove couch stuff
                        delete doc._rev;
                        delete doc._attachments;

                        // add the comment - optional
                        comment = document.getElementById ("comment").value;
                        if (comment && ("" != comment))
                            doc.comment = comment;

                        // add the announce-list - optional
                        // ToDo: multiple trackers in "announce-list": []
                        announce = document.getElementById ("announce-list").value;
                        if (announce && ("" != announce))
                            doc.announce = announce;

                        // add the webseed
                        doc["url-list"] =
                            document.location.origin + "/" + // ToDo: configure the domain name
                            configuration.getConfigurationItem ("local_database") + // the attachment only exists locally
                            "/" + primary_key + "/";
                        if (!doc.info.files)
                            doc["url-list"] += doc.info.name;

                        // make the pieces back into an ArrayBuffer just to make the torrent
                        pieces = doc.info.pieces;
                        doc.info.pieces = torrent.ArrayToPieces (pieces);

                        // make the torrent attachment
                        attachments = [new File ([bencoder.str2ab (bencoder.encode (doc))], primary_key + ".torrent", { type: "application/octet-stream" })];

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

        function post_to_deluge (primary_key, options)
        {
            deluge.login (
                deluge.Password,
                {
                    success:
                        function ()
                        {
                            deluge.addTorrent (
                                document.location.origin + "/" +
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
         */
        function announce (primary_key)
        {
            // copy the document to the public database with appropriate .torrent
            copy_to_public
            (
                primary_key,
                {
                    success: function ()
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
                    }
                }
            );
        };

        function publish_handler (event, data)
        {
            var parameters;

            event.preventDefault ();

            parameters =
            {
                success: function ()
                {
                    var primary_key;
                    if (!data.torrent)
                        primary_key = "11020459b0af49d0eb2695ffa0e98677eabf941f";
                    else
                        primary_key = data.torrent._id;
                    announce (primary_key);
                },
                error: function ()
                {
                    alert ("You must login as an admin user");
                }
            };
            login.isLoggedIn (parameters);
        }

        function tracker_clicked (event)
        {
            var link;
            var target;

            link = event.target;
            target = document.getElementById (link.getAttribute ("data-target"));
            target.value = link.innerHTML;
        }

        function init ()
        {
            var list = document.getElementById ("tracker_list");
            list.innerHTML = mustache.render (tracker_template, { trackers: trackers });
            $ (".tracker", list).on ("click", tracker_clicked);
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
)