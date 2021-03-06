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
         * Show or hide expert elements on the page.
         * @param {boolean} expert - if <code>true</> hide the elements with the expert class
         * @function show_hide_expert
         * @memberOf module:thingmaker/template
         */
        function show_hide_expert (expert)
        {
            var elements;

            elements = document.getElementsByClassName ("expert");
            for (var i = 0; i < elements.length; i++)
                if (expert)
                    elements[i].classList.remove ("hidden");
                else
                    elements[i].classList.add ("hidden");
            elements = document.getElementsByClassName ("nonexpert");
            for (var i = 0; i < elements.length; i++)
                if (expert)
                    elements[i].classList.add ("hidden");
                else
                    elements[i].classList.remove ("hidden");
        }

        /**
         * Update the metadata, thumbnail and files information on screen.
         * @param {object} data - the wizard data object containing a list of files,
         * a list of thumbnails and a metadata object (torrent).
         * @function update
         * @memberOf module:thingmaker/template
         */
        function update (data)
        {
            // torrent metadata
            if (data && data.torrent && data.torrent.info)
            {
                var content = document.getElementById ("torrent_content");
                content.innerHTML = torrent.PrintTorrent (data.torrent);
                content.classList.remove ("hidden");
            }

            // refresh the list of things
            var db = document.getElementById ("source_database_name").getAttribute ("href");
            fill_database_list (data, db, "things");

            // expert mode
            show_hide_expert (data.expert);
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
            document.getElementById ("template_drop_zone").innerHTML = files[0].name;
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
         * @param {object} event - the file change event
         * @function file_change
         * @memberOf module:thingmaker/template
         */
        function file_change (event)
        {
            select_template (event.target.files, this);
        }

        /**
         * @summary Event handler for dropped files.
         * @description Attached to the drop target, this handler responds to dropped files,
         * by triggering the asynchronous reading.
         * @param {object} event - the drop event
         * @function file_drop
         * @memberOf module:thingmaker/template
         */
        function file_drop (event)
        {
            event.stopPropagation ();
            event.preventDefault ();
            select_template (event.dataTransfer.files, this);
        }

        /**
         * @summary Event handler for dragging files.
         * @description Attached to the drop target, this handler simply modifies the effect to copy,
         * (which produces the typical hand cursor).
         * @param {object} event - the dragover event
         * @function file_drag
         * @memberOf module:thingmaker/template
         */
        function file_drag (event)
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
            // reset the drop zone prompt
            document.getElementById ("template_drop_zone").innerHTML = "Drop template here...";
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
                                    thumbnails.push ({type: "embedded", url: url, file: new File ([blob], "name")}); // ToDo: get binary image data out of the data url
                                else if (("http:" == url.substring (0, 5)) || ("https:" == url.substring (0, 6)))
                                    thumbnails.push ({type: "remote", url: url, file: new File ([blob], "name")}); // ToDo: get the binary image from the URL using CORS
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
         * @param {event} event - the click event
         * @function choose_thing
         * @memberOf module:thingmaker/template
         */
        function choose_thing (event)
        {
            event.preventDefault ();
            var id = event.target.getAttribute ("href");
            var db = document.getElementById ("source_database_name").getAttribute ("href");
            fetch_thing_details (this, db, id);
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
                            "<li{{#current}} style='background-color: #e9f3ff;'{{/current}}><a href='{{id}}'>{{info.thing.title}}</a></li>" +
                        "{{/value}}" +
                    "{{/rows}}" +
                "</ul>";
            $.couch.db (database).view
            (
                database + "/" + view,
                {
                    success : function (result)
                    {
                        // mark the current thing if any
                        if (data.torrent)
                            result.rows.forEach
                            (
                                function (item)
                                {
                                    if (item.id == data.torrent._id)
                                        item.value.current = true;
                                }
                            );
                        var chooser = document.getElementById ("source_thing_chooser");
                        chooser.innerHTML = mustache.render (template, result);

                        // hook up the links
                        var links = chooser.getElementsByTagName ("a");
                        for (var i = 0; i < links.length; i++)
                            links[i].addEventListener ("click", choose_thing.bind (data));
                    }
                }
            );
        }

        /**
         * @summary Event handler for database chooser button dropdown selection.
         * @param {event} event - the click event
         * @function choose_database
         * @memberOf module:thingmaker/template
         */
        function choose_database (event)
        {
            event.preventDefault ();
            var db = event.target.innerHTML;
            var url = event.target.getAttribute ("href");
            // update current in databases list
            var dbs = this.databases.map
            (
                function (item)
                {
                    if (item.name == db)
                        item.current = true;
                    else
                        delete item.current;
                    return (item);
                }
            );
            this.databases = dbs;
            document.getElementById ("source_database_name").innerHTML = db;
            document.getElementById ("source_database_name").setAttribute ("href", url);
            fill_database_list (this, url, "things");
        }

        /**
         * Template form initialization function.
         * @param {object} event - the tab being shown event, <em>not used</em>
         * @function init
         * @memberOf module:thingmaker/template
         */
        function init (event)
        {
            var template =
                "<div class='dropdown'>" +
                    "<button id='source_database' class='form-control' type='button' data-toggle='dropdown' aria-haspopup='true' aria-expanded='false'>" +
                        "<span id='source_database_name' href='{{#.}}{{#current}}{{database}}{{/current}}{{/.}}'>" +
                            "{{#.}}" +
                                "{{#current}}{{name}}{{/current}}" +
                            "{{/.}}" +
                        "</span>" +
                        "<span class='caret'></span>" +
                    "</button>" +
                    "<ul class='dropdown-menu' aria-labelledby='source_database'>" +
                        "{{#.}}" +
                            "<li><a href='{{database}}'>{{name}}</a></li>" +
                        "{{/.}}" +
                    "</ul>" +
                "</div>";
            if (null == this.databases)
                this.databases = page.getDatabases ();
            var chooser = document.getElementById ("source_database_chooser");
            chooser.innerHTML = mustache.render (template, this.databases);
            // hook up drop down menu items
            var links = chooser.getElementsByTagName ("a");
            for (var i = 0; i < links.length; i++)
                links[i].addEventListener ("click", choose_database.bind (this));

            // show the initial list
            var db = configuration.getConfigurationItem ("public_database");
            this.databases.forEach (function (item) { if (item.current) db = item.database; });
            fill_database_list (this, db, "things");

            // show files and torrent
            update (this);
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
                                { id: "thing_template", event: "change", code: file_change },
                                // drag and drop listeners
                                { id: "template_drop_zone", event: "dragover", code: file_drag },
                                { id: "template_drop_zone", event: "drop", code: file_drop }
                            ],
                            transitions:
                            {
                                enter: init
                            }
                        }
                    );
                }
            }
        );
    }
);
