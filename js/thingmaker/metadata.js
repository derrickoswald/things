/**
 * @fileOverview Torrent creation form.
 * @name thingmaker/metadata
 * @author Derrick Oswald
 * @version 1.0
 */
define
(
    [ "mustache", "../torrent", "../records", "../login", "../chooser" ],
    /**
     * @summary Create a torrent file.
     * @description Combines file, metadata and thing information into the torrent file.
     * @name thingmaker/metadata
     * @exports thingmaker/metadata
     * @version 1.0
     */
    function (mustache, torrent, records, login, chooser)
    {
        /**
         * The SHA1 hash of the currently displayed torrent file.
         */
        var form_initialized_with = null;

        /**
         * List of authors builder component.
         */
        var author_chooser = null;

        /**
         * List of licenses builder component.
         */
        var license_chooser = null;

        /**
         * Preselected list of licenses from which to choose.
         */
        var license_list = [ "Creative Commons Attribution 4.0 International License", "Open Hardware Initiative 2.0" ];

        /**
         * List of tags builder component.
         */
        var tag_chooser = null;

        /**
         * @summary Add files to the list.
         * @description Creates the file list if necessary and adds the given files to the list.
         * @param {FileList} files - the files dropped or selected by the user
         * @param {object} data - the context object for the wizard
         * @function add_files
         * @memberOf module:thingmaker/metadata
         */
        function add_files (files, data)
        {
            if (typeof (data.thumbnails) == "undefined")
                data.thumbnails = [];
            for (var i = 0; i < files.length; i++)
                data.thumbnails.push ({type: "local", url: files.item (i).name, file: files.item (i)});
        }

        /**
         * @summary Add a file to the thumbnails list.
         * @description Adds an on screen input element to accept a remote URL as a thumbnail.
         * @param  {object} data - the thingmaker data object
         * @param {object} event - the event triggering the file addition
         * @function add_file
         * @memberOf module:thingmaker/metadata
         */
        function add_file (data, event)
        {
            if (typeof (data.thumbnails) == "undefined")
                data.thumbnails = [];
            data.thumbnails.push ({type: "remote", url: "", file: null});
            update (data);
        }

        /**
         * @summary Remove a file from the list.
         * @description Alter the file list in the data element to remove the one
         *              that has a name given by the event target data-file
         *              attribute.
         * @param {object} data - the context object for the wizard
         * @param {object} event - the event that triggers this method
         * @function remove_file
         * @memberOf module:thingmaker/metadata
         */
        function remove_file (data, event)
        {
            var target;
            var name;

            // get the name
            target = event.target;
            while (target && (null === (name = target.getAttribute ("data-file"))))
                target = target.parentElement;
            // remove it from the list
            for (var i = 0; i < data.thumbnails.length; i++)
                if (data.thumbnails[i].name == name)
                {
                    data.thumbnails.splice (i, 1);
                    break;
                }
            // update the display
            update (data);
        }

        /**
         * @summary Update the file list and enable/disable the next button.
         * @function update
         * @memberOf module:thingmaker/metadata
         * @param {object} data - thingmaker data object
         * @function update
         * @memberOf module:thingmaker/metadata
         */
        function update (data)
        {
            // compute the file list
            var filelist = [];
            var label = "Thumbnail images";
            for (var i = 0; data.thumbnails && (i < data.thumbnails.length); i++)
            {
                var image =
                {
                    index : i,
                    label : label,
                    url: data.thumbnails[i].url
                };
                switch (data.thumbnails[i].type)
                {
                    case "local":
                        image.type = "Local";
                        image.filename = data.thumbnails[i].file.name;
                        image.filesize = data.thumbnails[i].file.size;
                        image.filetype = data.thumbnails[i].file.type;
                        break;
                    case "remote":
                        image.type = "Remote";
                        break;
                    case "embedded":
                        image.type = "Embedded";
                        break;
                }
                filelist.push (image);
                label = "";
            }

            // render the image list as an input element for each image plus a DnD
            // zone
            var image_elements_template =
                "{{#filelist}}" +
                    "<label class='col-sm-3 control-label' for='url{{index}}'>{{label}}</label>" +
                    "<div class='col-sm-9'>" +
                        "<div class='input-group'>" +
                            "<div class='input-group-btn'>" +
                                "<button type='button' class='btn btn-default dropdown-toggle' data-toggle='dropdown' aria-haspopup='true' aria-expanded='false'>" +
                                    "Local" +
                                    "<span class='caret marginleft'></span>" +
                                "</button>" +
                                "<ul class='dropdown-menu'>" +
                                    "<li><a href='#'>Local</a></li>" +
                                    "<li><a href='#'>Remote</a></li>" +
                                    "<li><a href='#'>Embedded</a></li>" +
                                "</ul>" +
                            "</div>" +
                            "<input id='url{{index}}' class='form-control' type='text' name='url{{index}}' placeholder='URL' value='{{filename}}'>" +
                            "<span class='input-group-addon btn btn-default remove' data-file='{{filename}}'>" +
                                "<i class='glyphicon glyphicon-minus'></i>" +
                            "</span>" +
                        "</div>" +
                    "</div>" +
                "{{/filelist}}";
            document.getElementById ("thumbnails").innerHTML = mustache.render
            (
                image_elements_template,
                {
                    filelist : filelist,
                    label : label
                }
            );

            // add delete function to each file
            var removes = document.getElementById ("thumbnails").getElementsByClassName ("remove");
            var remove = remove_file.bind (this, data);
            for (var j = 0; j < removes.length; j++)
                removes[j].addEventListener ("click", remove);

            // add element function
            document.getElementById ("add_thumbnail").addEventListener ("click", add_file.bind (this, data));

            // add file change listener
            document.getElementById ("choose_thing_thumbnails").addEventListener ("change", file_change.bind (this, data));

            // add drop zone handlers
            document.getElementById ("thumbnails_drop_zone").addEventListener ("dragover", file_drag.bind (this, data));
            document.getElementById ("thumbnails_drop_zone").addEventListener ("drop", file_drop.bind (this, data));
        }

        /**
         * @summary Handler for file change events.
         * @description Add files to the collection and update the display.
         * @param {object} data - the thingmaker wizard data object
         * @param {object} event - the file change event
         * @function file_change
         * @memberOf module:thingmaker/metadata
         */
        function file_change (data, event)
        {
            add_files (event.target.files, data);
            update (data);
        }

        /**
         * @summary Event handler for dropped files.
         * @description Attached to the drop target, this handler responds to
         *              dropped files, adding them to the list of files.
         * @see {module:thingmaker/metadata.add_files}
         * @param {object} data - the context object for the wizard
         * @param {object} event - the drop event
         * @function file_drop
         * @memberOf module:thingmaker/metadata
         */
        function file_drop (data, event)
        {
            event.stopPropagation ();
            event.preventDefault ();
            add_files (event.dataTransfer.files, data);
            update (data);
        }

        /**
         * @summary Event handler for dragging files.
         * @description Attached to the drop target, this handler simply modifies
         *              the effect to copy, (which produces the typical hand
         *              cursor).
         * @param {object} data - the context object for the wizard
         * @param {object} event - the dragover event
         * @memberOf module:thingmaker/metadata
         */
        function file_drag (data, event)
        {
            event.stopPropagation ();
            event.preventDefault ();
            event.dataTransfer.dropEffect = 'copy';
        }

        /**
         * Display a link to the torrent contents for download
         *
         * @param {object} torrent - the torrent encoded as a JavaScript object
         * @function showlink
         * @memberOf module:thingmaker/metadata
         */
        function showlink (torrent)
        {
            var a;
            var content;

            a = document.createElement ("a");
            a.setAttribute ("href", "data:application/octet-stream;base64," + btoa (torrent));
            a.setAttribute ("download", "test.torrent");
            a.appendChild (document.createTextNode ("Torrent File"));

            content = document.getElementById ('torrent_link');
            while (content.firstChild)
                content.removeChild (content.firstChild);
            content.appendChild (a);
        }

        /**
         * @summary Generate a unique name.
         * @param {string} name - the base name from which to start
         * @param {string[]} list - the list of already existing names
         * @function uniquename
         * @memberOf module:thingmaker/metadata
         */
        function uniquename (name, list)
        {
            var suffix;
            var ret;

            ret = name;

            suffix = 0;
            while (-1 != list.indexOf (ret))
                ret = name.substring (0, name.lastIndexOf (".")) + "_" + ++suffix + name.substring (name.lastIndexOf ("."));

            return (ret);
        }

        /**
         * @summary Event handler for the make button.
         * @description Creates the in memory torrent object.
         * @param {object} data - the data object for the thingmaker
         * @param {object} event - the button pressed event
         * @function make
         * @memberOf module:thingmaker/metadata
         */
        function make (data, event)
        {
            var dir;

            dir = data.directory ? data.directory : null;
            torrent.MakeTorrent
            (
                data.files,
                data.piece_length,
                dir,
                function (tor)
                {
                    var thing;
                    var authors;
                    var licenses;
                    var tags;

                    thing = {};
                    tor.info.thing = thing;
                    thing.title = document.getElementById ("title").value;
                    thing.description = document.getElementById ("description").value;
                    thing.url = document.getElementById ("url").value;
                    authors = [];
                    author_chooser.context.items.forEach (function (item)
                    {
                        if ("" !== item.value)
                            authors.push (item.value);
                    });
                    thing.authors = authors;

                    licenses = [];
                    license_chooser.context.items.forEach (function (item)
                    {
                        if ("" !== item.value)
                            licenses.push (item.value);
                    });
                    thing.licenses = licenses;

                    tags = [];
                    tag_chooser.context.items.forEach (function (item)
                    {
                        if ("" !== item.value)
                            tags.push (item.value);
                    });
                    thing.tags = tags;

                    thing.thumbnailURL = [];
                    data.images = [];
                    data.thumbnails.forEach
                    (
                        function (thumbnail) // {type: "xxx", url: "yyy", file: zzz}
                        {
                            var name;
                            switch (thumbnail.type)
                            {
                                case "local":
                                    name = thumbnail.file.name;
                                    name = uniquename (name, thing.thumbnailURL);
                                    data.images.push (thumbnail.file);
                                    break;
                                case "remote":
                                    name = thumbnail.url;
                                    break;
                                case "embedded":
                                default:
                                    name = thumbnail.url;
                                    break;
                            }
                            thing.thumbnailURL.push (name);
                        }
                    );

                    tor._id = torrent.InfoHash (tor.info);

                    data.torrent = tor;

                    form_initialized_with = null;

                    showlink (torrent.Encode (tor));
                }
            );
        }

        /**
         * Show or hide expert elements on the page.
         * @param {boolean} expert - if <code>true</> hide the elements with the expert class
         * @function show_hide_expert
         * @memberOf module:thingmaker/metadata
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
         * Form initialization function.
         *
         * @param {object} data the data object for the thingmaker
         * @param {object} event the tab being shown event
         * @function init
         * @memberOf module:thingmaker/metadata
         */
        function init (data, event)
        {
            var authors_help;
            var licenses_help;
            var tags_help;
            var thing;

            if ((null === form_initialized_with) || (data.torrent && (form_initialized_with !== data.torrent._id)))
            {
                authors_help =
                    "<span id='authors_help' class='help-block nonexpert'>" +
                        "The list of the names of the authors contributing to the <em>thing</em>." +
                    "</span>";
                author_chooser = new chooser.Chooser ("authors", "Authors", "Author", null, authors_help);
                licenses_help =
                    "<span id='licenses_help' class='help-block nonexpert'>" +
                        "The list of licenses that the <em>thing</em> is published under." +
                    "</span>";
                license_chooser = new chooser.Chooser ("licenses", "Licenses", "License", license_list, licenses_help);
                tags_help =
                    "<span id='tag_help' class='help-block nonexpert'>" +
                        "The list of keywords or phrases that describe the salient aspects of the <em>thing</em>." +
                    "</span>";
                tag_chooser = new chooser.Chooser ("tags", "Tags", "Tag", null, tags_help);
                if (data.torrent && ((null === form_initialized_with) || (form_initialized_with !== data.torrent._id)))
                {
                    form_initialized_with = data.torrent._id;
                    if (data.torrent.info && data.torrent.info.thing)
                    {
                        thing = data.torrent.info.thing;

                        if (thing.title)
                            document.getElementById ("title").value = thing.title;

                        if (thing.description)
                            document.getElementById ("description").value = thing.description;

                        if (thing.url)
                            document.getElementById ("url").value = thing.url;

                        if (thing.authors)
                            if ('[object Array]' === Object.prototype.toString.call (thing.authors))
                                for (var i = 0; i < thing.authors.length; i++)
                                    author_chooser.context.items.push (
                                    {
                                        value : thing.authors[i]
                                    });
                            else
                                author_chooser.context.items.push (
                                {
                                    value : thing.authors.toString ()
                                });
                        else if (thing.author)
                            author_chooser.context.items.push (
                            {
                                value : thing.author.toString ()
                            });

                        if (thing.licenses)
                            if ('[object Array]' === Object.prototype.toString.call (thing.licenses))
                                for (var j = 0; j < thing.licenses.length; j++)
                                    license_chooser.context.items.push (
                                    {
                                        value : thing.licenses[j]
                                    });
                            else
                                license_chooser.context.items.push (
                                {
                                    value : thing.licenses.toString ()
                                });
                        else if (thing.license)
                            license_chooser.context.items.push (
                            {
                                value : thing.license.toString ()
                            });

                        if (thing.tags)
                            if ('[object Array]' === Object.prototype.toString.call (thing.tags))
                                for (var k = 0; k < thing.tags.length; k++)
                                    tag_chooser.context.items.push (
                                    {
                                        value : thing.tags[k]
                                    });
                            else
                                tag_chooser.context.items.push (
                                {
                                    value : thing.tags.toString ()
                                });
                        else if (thing.tag)
                            tag_chooser.context.items.push (
                            {
                                value : thing.tag.toString ()
                            });

                        // ToDo: how to reconstitute the image files from the torrent
                        // just by name
                        // if (thing.thumbnailURL)
                        // {
                        // data.thumbnails = [];
                        // if ('[object Array]' === Object.prototype.toString.call
                        // (thing.thumbnailURL))
                        // for (var l = 0; l < thing.thumbnailURL.length; l++)
                        // data.thumbnails.push ({ value: thing.thumbnailURL[l] });
                        // else
                        // data.thumbnails.push ({ value: thing.thumbnailURL.toString ()
                        // });
                        // }
                    }
                }
            }
            author_chooser.render ();
            license_chooser.render ();
            tag_chooser.render ();
            update (data);
            show_hide_expert (data.expert);
        }

        return (
            {
                getStep : function ()
                {
                    return (
                    {
                        id : "enter_metadata",
                        title : "Enter metadata",
                        template : "templates/thingmaker/metadata.mst",
                        hooks :
                        [
                            {
                                id : "make_thing_button",
                                event : "click",
                                code : make,
                                obj : this
                            }
                        ],
                        transitions :
                        {
                            enter : init,
                            obj : this
                        }
                    });
                }
            }
        );
    }
);
