define
(
    ["mustache", "../torrent", "../records", "../login"],
    function (mustache, torrent, records, login)
    {
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
                                var value = child.value;
                                if ((null != value) && ("" != value))
                                {
                                    thing[id] = value;
                                    // kludge here to handle the lists
                                    if (("authors" == id) || ("licenses" == id) || ("tags" == id))
                                        thing[id] = value.split (',');
                                }
                            }
                        }
                    }

                    var info = tor["info"];
                    var primary_key = torrent.InfoHash (info);
                    tor["_id"] = primary_key;
                    data.torrent = tor;

                    showlink (torrent.Encode (tor));
                }
            );
        };

        return (
            {
                getStep: function ()
                {
                    var make_hooks =
                        [
                            { id: "make_thing_button", event: "click", code: make, obj: this }
                        ];
                    return ({ id: "enter_metadata", title: "Enter metadata", template: "templates/metadata.mst", hooks: make_hooks });
                }
            }
        );
    }
)
