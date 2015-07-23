/**
 * @fileOverview Template selection step of the ThingMaker wizard.
 * @name thingmaker/template
 * @author Derrick Oswald
 * @version 1.0
 */
define
(
    ["mustache", "configuration", "page", "torrent", "records"],
    /**
     * @summary Allows selection of a template thing.
     * @description Allows the user to select either a torrent from the file system
     * or a thing from one of the databases.
     * The information is of two types, metadata and file information.
     * Most metadata comes from the torrent or database record. The xeception is the
     * thumbnail images, which may be excapsulated in the metadata, an external URL
     * or separately attached to the document in the database.
     *
     * @name thingmaker/template
     * @exports thingmaker/template
     * @version 1.0
     */
    function (mustache, configuration, page, torrent, records)
    {
        /**
         * Update the metadata, thumbnail and files information on screen.
         * @param {object} data - the wizard data object containing a list of files,
         * a list of thumbnails and a metadata object (torrent).
         */
        function update (data)
        {
            // torrent metadata
            if (data.torrent)
            {
                var content = document.getElementById ("torrent_content");
                content.innerHTML = torrent.PrintTorrent (data.torrent);
                content.classList.remove ("hidden");
            }
        }

        /**
         * Reads in the metadata from a torrent file.
         * @param {file[]} files - the list of files, only the first is used
         * @param data - the context object for the wizard
         * @function select_template
         * @memberOf module:thingmaker/template
         */
        function select_template (files, data)
        {
            torrent.ReadTorrentAsync
            (
                files[0],
                {
                    success: function (name, tor)
                    {
                        data.torrent = tor;
                        if (!tor._id && tor.info)
                            tor._id = torrent.InfoHash (tor.info);
                        update (data);
                    }
                }
            );
        }

        /**
         * Handles the file change event.
         * @param {event} event - the file change event
         * @param data - the context object for the wizard
         * @function file_change
         * @memberOf module:thingmaker/template
         */
        function file_change (event, data)
        {
            select_template (event.target.files, data);
        }

        /**
         * @summary Event handler for dropped files.
         * @description Attached to the drop target, this handler responds to dropped files,
         * by triggering the asynchronous reading.
         * @see {module:thingmaker/files.ReadFilesAsync}
         * @param {event} event - the drop event
         * @param data - the context object for the wizard
         * @function file_drop
         * @memberOf module:thingmaker/template
         */
        function file_drop (event, data)
        {
            event.stopPropagation ();
            event.preventDefault ();
            select_template (event.dataTransfer.files, data);
        }

        /**
         * @summary Event handler for dragging files.
         * @description Attached to the drop target, this handler simply modifies the effect to copy,
         * (which produces the typical hand cursor).
         * @param {event} event - the dragover event
         * @param data - the context object for the wizard
         * @function file_drag
         * @memberOf module:thingmaker/template
         */
        function file_drag (event, data)
        {
            event.stopPropagation ();
            event.preventDefault ();
            event.dataTransfer.dropEffect = 'copy';
        }

        /**
         * @summary Get thing details from the database.
         * @param {object} data - the thingwizard data object
         * @param {string} database - the database name
         * @param {string} id - the thing id
         * @function fetch_thing_details
         * @memberOf module:thingmaker/template
         */
        function fetch_thing_details (data, database, id)
        {
            console.log ("fetch " + database + ":" + id);

            $.couch.db (database).openDoc
            (
                id,
                {
                    attachments: true,
                    success: function (doc)
                    {
                        var directory;
                        var files;
                        var thumbnails;
                        var blob;
                        var file;

                        // get the files
                        files = [];
                        directory = null;
                        if (!doc.info.files)
                        {
                            blob = records.base64toBlob (doc._attachments[doc.info.name].data, doc._attachments[doc.info.name].content_type);
                            file = new File ([blob], doc.info.name, { type: doc._attachments[doc.info.name].content_type });
                            files.push (file);
                        }
                        else
                        {
                            directory = doc.info.name;
                            for (var i = 0; i < doc.info.files.length; i++)
                            {
                                var filename = doc.info.files[i].path[0]; // ToDo: multiple paths in name?
                                var name = directory + "/" + doc.info.files[i].path[0];
                                blob = records.base64toBlob (doc._attachments[name].data, doc._attachments[name].content_type);
                                file = new File ([blob], filename, { type: doc._attachments[name].content_type });
                                files.push (file);
                            }
                        }

                        // get the thumbnails
                        thumbnails = [];
                        if (doc.info.thing.thumbnailURL)
                            for (var k = 0; k < doc.info.thing.thumbnailURL.length; k++)
                            {
                                var url = doc.info.thing.thumbnailURL[k];
                                if ("data:" == url.substring (0, 5))
                                    thumbnails.push ({type: "embedded", url: url, file: new File ([blob], "name")});
                                else if (("http:" == url.substring (0, 5)) || ("https:" == url.substring (0, 6)))
                                    thumbnails.push ({type: "remote", url: url, file: new File ([blob], "name")});
                                else
                                {
                                    blob = records.base64toBlob (doc._attachments[url].data, doc._attachments[url].content_type);
                                    file = new File ([blob], url, { type: doc._attachments[url].content_type });
                                    thumbnails.push ({type: "local", url: url, file: file});
                                }
                            }

                        // make the pieces back into an ArrayBuffer
                        doc.info.pieces = torrent.ArrayToPieces (doc.info.pieces);

                        // remove extraneous couch stuff
                        delete doc._rev;
                        delete doc._attachments;

                        data.torrent = doc;
                        data.files = files;
                        if (null != directory)
                            data.directory = directory;
                        data.thumbnails = thumbnails;

                        update (data);
                    },
                    error: function(status)
                    {
                        console.log(status);
                    }
                }
            );
        }

        /**
         * @summary Event handler for thing chooser links.
         * @param {object} data - the thingwizard data object
         * @param {event} event - the click event
         * @function choose_thing
         * @memberOf module:thingmaker/template
         */
        function choose_thing (data, event)
        {
            event.preventDefault ();
            var id = event.target.getAttribute ("href");
            var db = document.getElementById ("source_database_name").innerHTML;
            fetch_thing_details (data, db, id);
        }

        /**
         * @summary Populate the list of databases from the results of the vie query.
         * @param {object} data - the thingwizard data object
         * @param {string} database - the database to query
         * @param {string} view - the view name to use
         * @function fill_database_list
         * @memberOf module:thingmaker/template
         */
        function fill_database_list (data, database, view)
        {
            var template =
                "<ul>" +
                    "{{#rows}}" +
                        "{{#value}}" +
                            "<li><a href='{{id}}'>{{info.name}}</a></li>" +
                        "{{/value}}" +
                    "{{/rows}}" +
                "</ul>";
            $.couch.db (database).view
            (
                database + "/" + view,
                {
                    success : function (result)
                    {
                        var chooser = document.getElementById ("source_thing_chooser");
                        chooser.innerHTML = mustache.render (template, result);

                        // hook up the links
                        var links = chooser.getElementsByTagName ("a");
                        for (var i = 0; i < links.length; i++)
                            links[i].addEventListener ("click", choose_thing.bind (this, data));
                    }
                }
            );
        }

        /**
         * @summary Event handler for database chooser button dropdown selection.
         * @param {object} data - the thingwizard data object
         * @param {event} event - the click event
         * @function choose_database
         * @memberOf module:thingmaker/template
         */
        function choose_database (data, event)
        {
            event.preventDefault ();
            var db = event.target.innerHTML;
            document.getElementById ("source_database_name").innerHTML = db;
            fill_database_list (data, db, "Things");
        }

        /**
         * Template form initialization function.
         * @param {object} event the tab being shown event
         * @param {object} data the data object for the thingmaker
         * @function init
         * @memberOf module:thingmaker/template
         */
        function init (event, data)
        {
            var template =
                "<div class='dropdown'>" +
                    "<button id='source_database' class='form-control' type='button' data-toggle='dropdown' aria-haspopup='true' aria-expanded='false'>" +
                        "<span id='source_database_name'>" +
                            "{{#.}}" +
                                "{{#current}}{{name}}{{/current}}" +
                            "{{/.}}" +
                        "</span>" +
                        "<span class='caret'></span>" +
                    "</button>" +
                    "<ul class='dropdown-menu' aria-labelledby='source_database'>" +
                        "{{#.}}" +
                            "<li><a href='{{url}}'>{{name}}</a></li>" +
                        "{{/.}}" +
                    "</ul>" +
                "</div>";
            var chooser = document.getElementById ("source_database_chooser");
            chooser.innerHTML = mustache.render (template, page.getDatabases ());
            // hook up drop down menu items
            var links = chooser.getElementsByTagName ("a");
            for (var i = 0; i < links.length; i++)
                links[i].addEventListener ("click", choose_database.bind (this, data));

            // show the initial list
            var db = "public_things";
            page.getDatabases ().forEach (function (item) { if (item.current) db = item.database; });
            fill_database_list (data, db, "Things");

            // show files and torrent
            update (data);
        }

        return (
            {
                getStep: function ()
                {
                    return (
                        {
                            id: "select_template",
                            title: "Select a template",
                            template: "templates/thingmaker/template.mst",
                            hooks:
                            [
                                { id: "thing_template", event: "change", code: file_change, obj: this },
                                // drag and drop listeners
                                { id: "template_drop_zone", event: "dragover", code: file_drag, obj: this },
                                { id: "template_drop_zone", event: "drop", code: file_drop, obj: this }
                            ],
                            transitions:
                            {
                                enter: init,
                                obj: this
                            }
                        }
                    );
                }
            }
        );
    }
);
