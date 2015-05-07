define
(
    ["mustache", "../torrent", "../records", "../login", "../chooser"],
    function (mustache, torrent, records, login, chooser)
    {
        var form_initialized_with = null;

        var author_chooser = null;

        var license_chooser = null;

        var license_list =
        [
            "Creative Commons Attribution 4.0 International License",
            "Open Hardware Initiative 2.0"
        ];

        var tag_chooser = null;

        // show the contents of the encoded Thing as a link in the content area
        function showlink (torrent)
        {
            // show the torrent contents
            var a = document.createElement ("a");
            a.setAttribute ("href", "data:application/octet-stream;base64," + btoa (torrent));
            a.setAttribute ("download", "test.torrent");
            var text = document.createTextNode ("Torrent File");
            a.appendChild (text);
            var content = document.getElementById ('torrent_link');
            while (content.firstChild)
                content.removeChild (content.firstChild);
            content.appendChild (a);
        }

        function make (event, data)
        {
            event.preventDefault ();
            torrent.MakeTorrent (data.files, data.piece_length, data.directory, null, // no template yet
                function (tor)
                {
                    var thing = {};
                    tor["info"]["thing"] = thing;
                    var form = document.getElementById ("thing_form");
                    if (null != form)
                    {
                        for (var i = 0; i < form.elements.length; i++)
                        {
                            var child = form.elements[i];
                            var id = child.getAttribute ("id");
                            if (null != id)
                            {
                                if ("licenses" == id)
                                {
                                    var licenses = [];
                                    data.context.licenses.forEach (function (item) { if ("" != item.license) licenses.push (item.license); });
                                    thing[id] = licenses;
                                }
                                else
                                {
                                    var value = child.value;
                                    if ((null != value) && ("" != value))
                                    {
                                        thing[id] = value;
                                        // kludge here to handle the lists
                                        if (("authors" == id) || ("tags" == id))
                                            thing[id] = value.split (',');
                                    }
                                }
                            }
                        }
                    }

                    var info = tor["info"];
                    var primary_key = torrent.InfoHash (info);
                    tor["_id"] = primary_key;
                    data.torrent = tor;
                    form_initialized_with = null;

                    showlink (torrent.Encode (tor));
                }
            );
        };

        function init (event, data)
        {
            author_chooser = new chooser.Chooser ("authors", "Authors", "Author");
            license_chooser = new chooser.Chooser ("licenses", "Licenses", "License", license_list);
            tag_chooser = new chooser.Chooser ("tags", "Tags", "Tag");
            if (data.torrent && ((null == form_initialized_with) || (form_initialized_with != data.torrent._id)))
            {
                form_initialized_with = data.torrent._id;
                if (data.torrent.info.thing)
                {
                    var thing = data.torrent.info.thing;
                    var form = document.getElementById ("thing_form");
                    if (null != form)
                    {
                        for (var i = 0; i < form.elements.length; i++)
                        {
                            var child = form.elements[i];
                            var id = child.getAttribute ("id");
                            if (null != id)
                                if (null != thing[id])
                                    if ("licenses" == id)
                                        for (var j = 0; j < thing[id].length; j++)
                                            license_chooser.context.items.push ({ index: j + 1, license: thing[id][j] });
                                    else if ("authors" == id)
                                        for (var j = 0; j < thing[id].length; j++)
                                            author_chooser.context.items.push ({ index: j + 1, value: thing[id][j] });
                                    else if ("tags" == id)
                                        for (var j = 0; j < thing[id].length; j++)
                                            tag_chooser.context.items.push ({ index: j + 1, value: thing[id][j] });
                                    else
                                        child.value = thing[id];
                        }
                    }
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
                    var make_hooks =
                        [
                            { id: "make_thing_button", event: "click", code: make, obj: this }
                        ];
                    return ({ id: "enter_metadata", title: "Enter metadata", template: "templates/thingmaker/metadata.mst", hooks: make_hooks, transitions: { enter: init, obj: this } });
                }
            }
        );
    }
)
