/**
 * @fileOverview Torrent creation form.
 * @name thingmaker/make
 * @author Derrick Oswald
 * @version 1.0
 */
define
(
    ["mustache", "../torrent", "../records", "../login", "../chooser"],
    /**
     * @summary Create a torrent file.
     * @description Combines file, metadata and thing information into the torrent file.
     * @name thingmaker/make
     * @exports thingmaker/make
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
        var license_list =
        [
            "Creative Commons Attribution 4.0 International License",
            "Open Hardware Initiative 2.0"
        ];

        /**
         * List of tags builder component.
         */
        var tag_chooser = null;

        /**
         * Display a link to the torrent contents for download
         * @param {object} torrent the torrent encoded as a JavaScript object
         * @function showlink
         * @memberOf module:thingmaker/make
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
         * Event handler for the make button.
         * @param {object} event the button pressed event
         * @param {object} data the data object for the thingmaker
         * @function make
         * @memberOf module:thingmaker/make
         */
        function make (event, data)
        {
            var dir;

            dir = data.directory ? data.directory : null;

            torrent.MakeTorrent (data.files, data.piece_length, dir, null, // no template being used yet
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
                    author_chooser.context.items.forEach (function (item) { if ("" != item.value) authors.push (item.value); });
                    thing.authors = authors;

                    licenses = [];
                    license_chooser.context.items.forEach (function (item) { if ("" != item.value) licenses.push (item.value); });
                    thing.licenses = licenses;

                    tags = [];
                    tag_chooser.context.items.forEach (function (item) { if ("" != item.value) tags.push (item.value); });
                    thing.tags = tags;

                    thing.thumbnailURL = document.getElementById ("thumbnailURL").value;

                    tor._id = torrent.InfoHash (tor.info);

                    data.torrent = tor;

                    form_initialized_with = null;

                    showlink (torrent.Encode (tor));
                }
            );
        };

        /**
         * For initialization function.
         * @param {object} event the tab being shown event
         * @param {object} data the data object for the thingmaker
         * @function init
         * @memberOf module:thingmaker/make
         */
        function init (event, data)
        {
            var thing;

            author_chooser = new chooser.Chooser ("authors", "Authors", "Author");
            license_chooser = new chooser.Chooser ("licenses", "Licenses", "License", license_list);
            tag_chooser = new chooser.Chooser ("tags", "Tags", "Tag");
            if (data.torrent && ((null == form_initialized_with) || (form_initialized_with != data.torrent._id)))
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
                            for (var j = 0; j < thing.authors.length; j++)
                                author_chooser.context.items.push ({ value: thing.authors[j] });
                        else
                            author_chooser.context.items.push ({ value: thing.authors.toString () });
                    else if (thing.author)
                        author_chooser.context.items.push ({ value: thing.author.toString () });

                    if (thing.licenses)
                        if ('[object Array]' === Object.prototype.toString.call (thing.licenses))
                            for (var j = 0; j < thing.licenses.length; j++)
                                license_chooser.context.items.push ({ value: thing.licenses[j] });
                        else
                            license_chooser.context.items.push ({ value: thing.licenses.toString () });
                    else if (thing.license)
                        license_chooser.context.items.push ({ value: thing.license.toString () });

                    if (thing.tags)
                        if ('[object Array]' === Object.prototype.toString.call (thing.tags))
                            for (var j = 0; j < thing.tags.length; j++)
                                tag_chooser.context.items.push ({ value: thing.tags[j] });
                        else
                            tag_chooser.context.items.push ({ value: thing.tags.toString () });
                    else if (thing.tag)
                        tag_chooser.context.items.push ({ value: thing.tag.toString () });

                    if (thing.thumbnailURL)
                        document.getElementById ("thumbnailURL").value = thing.thumbnailURL;
                }
            }
            author_chooser.render ();
            license_chooser.render ();
            tag_chooser.render ();
        }

        return (
            {
                getStep: function ()
                {
                    return (
                        {
                            id: "enter_metadata",
                            title: "Enter metadata",
                            template: "templates/thingmaker/metadata.mst",
                            hooks:
                            [
                                { id: "make_thing_button", event: "click", code: make, obj: this }
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
