/**
 * @fileOverview Publish step of the ThingMaker wizard.
 * @name thingmaker/publish
 * @author Derrick Oswald
 * @version 1.0
 */
define
(
    ["mustache", "../deluge", "../records", "../bencoder", "../login", "../configuration", "../discover", "../torrent"],
    /**
     * @summary Publish a thing.
     * @description Provides the functionality to publish a thing to the
     * public database, deluge and the thingtracker network.
     * @name thingmaker/publish
     * @exports thingmaker/publish
     * @version 1.0
     */
    function (mustache, deluge, records, bencoder, login, configuration, discover, torrent)
    {
        /**
         * Inner template for each tracker input field added on the form.
         * Initially there are none, but in the init() function the first empty one is added.
         */
        var tracker_template =
            "{{#announce}}" +
                "<label for='announce-list-{{index}}' data-tracker='{{index}}' class='col-sm-3 control-label'>" +
                    "{{label}}" +
                "</label>" +
                "<div class='col-sm-9' data-tracker='{{index}}'>" +
                    "<div class='input-group'>" +
                        "<span class='dropdown'>" +
                            "<input id='announce-list-{{index}}' type='text' class='form-control dropdown-toggle' data-tracker='{{index}}' data-toggle='dropdown' placeholder='udp://<tracker_url>' aria-label='tracker' value='{{url}}'>" +
                            "<ul class='dropdown-menu pull-right' role='menu' aria-labelledby='announce-list-{{index}}' >" +
                                "{{#trackers}}" +
                                "<li role='presentation'>" +
                                    "<a class='tracker' data-target='announce-list-{{index}}' role='menuitem' tabindex='-1' href='#'>{{.}}</a>" +
                                "</li>" +
                                "{{/trackers}}" +
                            "</ul>" +
                        "</span>" +
                        "<span class='input-group-addon btn btn-default {{buttonclass}}' data-tracker='{{index}}'>" +
                            "<i class='glyphicon {{glyph}}'></i>" +
                        "</span>" +
                    "</div>" +
                "</div>" +
            "{{/announce}}";

        function label ()
        {
            return (("1" == this.index) ? "Trackers" : "");
        }

        function buttonclass ()
        {
            return (("1" == this.index) ? "add_tracker" : "remove_tracker");
        }

        function glyph ()
        {
            return (("1" == this.index) ? "glyphicon-plus" : "glyphicon-minus");
        }

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
                        var comment;
                        var announce;
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
                }
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
                    data.context.announce.forEach
                    (
                        function (item)
                        {
                            if (item.url != "")
                                announce_list.push (item.url);
                        }
                    );
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

        function tracker_changed (event, data)
        {
            var index;

            // update the announce list
            index = event.target.getAttribute ("data-tracker");
            data.context.announce.forEach (function (item) { if (index == item.index) item.url = event.target.value; });
        }

        function tracker_clicked (event, data)
        {
            var link;
            var target;
            var index;

            link = event.target;

            // fill in the input field with the chosen tracker URL
            target = document.getElementById (link.getAttribute ("data-target"));
            target.value = link.innerHTML;

            // update the announce list
            index = target.getAttribute ("data-tracker");
            data.context.announce.forEach (function (item) { if (index == item.index) item.url = target.value; });
        }

        function render_trackers (data)
        {
            var list;
            var inputs;
            var trackers;
            var spans;
            var change;
            var click;
            var add;
            var remove;

            // re-render inject the new elements into the DOM
            list = document.getElementById ("tracker_list");
            list.innerHTML = mustache.render (tracker_template, data.context);

            // handle edit events
            change = function (event) { tracker_changed (event, data); };
            inputs = list.getElementsByTagName ("input");
            for (var i = 0; i < inputs.length; i++)
                inputs[i].addEventListener ("change", change);

            // handle drop down chosen events
            click = function (event) { tracker_clicked (event, data); };
            trackers = list.getElementsByTagName ("a");
            for (var i = 0; i < trackers.length; i++)
                trackers[i].addEventListener ("click", click);

            // handle add and remove tracker events on the input group addon button
            add = function (event) { add_tracker (event, data); }
            remove = function (event) { remove_tracker (event, data); }
            spans = list.getElementsByTagName ("span");
            for (var i = 0; i < spans.length; i++)
                if (spans[i].classList.contains ("input-group-addon"))
                    spans[i].addEventListener ("click", (1 == Number (spans[i].getAttribute ("data-tracker"))) ? add : remove);
        }

        function add_tracker (event, data)
        {
            var index;

            // find next index
            index = 0;
            data.context.announce.forEach (function (item) { if (item.index > index) index = item.index; });

            // add the next tracker input element
            data.context.announce.push ({ index: index + 1, url: "" });

            render_trackers (data);
        }

        function remove_tracker (event, data)
        {
            var index;
            var list;

            // get the index
            index = event.target.getAttribute ("data-tracker");
            if (null == index)
                index = event.target.parentElement.getAttribute ("data-tracker");

            // remove it from the list
            list = [];
            data.context.announce.forEach (function (item) { if (index != item.index) list.push (item); });
            data.context.announce = list;

            // delete the DOM elements - could also re-render, but at added cost
            $ ("label[data-tracker='" + index + "']").remove ();
            $ ("div[data-tracker='" + index + "']").remove ();
        }

        function init (event, data)
        {
            if ("undefined" == typeof (data.context))
            {   // first run
                data.context =
                {
                    trackers: trackers,
                    label: label,
                    buttonclass: buttonclass,
                    glyph: glyph,
                    announce: []
                }
                add_tracker (null, data);
            }
            else
                render_trackers (data)
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