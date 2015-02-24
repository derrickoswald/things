define
(
    ["mustache", "../records", "../bencoder", "../sha1", "../login"],
    function (mustache, records, bencoder, sha, login)
    {
        function MakeTorrent (data, template)
        {
            var timestamp;
            var infohash;
            var ret;

            // javascript date is number of millisconds since epoch
            timestamp = Math.round ((new Date ()).getTime () / 1000.0);
            if (1 == data.files.length)
                infohash = {
                        "length": data.files[0].size,
                        "name": data.files[0].name,
                        "piece length": data.piece_length,
                        "pieces": data.Hashes
                    };
            else
            {
                if (null == data.directory)
                {
                    data.directory = "directory" + "_" + Math.floor ((Math.random () * 1000) + 1);
                    alert ("generating required directory " + data.directory);
                }
                filedata = [];
                for (var i = 0; i < data.files.length; i++)
                    filedata[filedata.length] = {
                        "length": data.files[i].size,
                        "path" : [data.files[i].name]
                        };
                infohash = {
                        "files": filedata,
                        "name": data.directory,
                        "piece length": data.piece_length,
                        "pieces": data.Hashes
                    };
            }
            if (null == template)
                ret =
                {
                    "created by": "ThingMaker v1.0",
                    "creation date": timestamp,
                    "encoding": "UTF-8",
                    "info": infohash
                };
            else
            {
                ret = template;
                var thing = ret["info"]["thing"]; // keep the thing data from the info section - if any
                ret["creation date"] = timestamp;
                ret["info"] = infohash;
                if (null != thing)
                    ret["info"]["thing"] = thing;
            }

            return (ret);
        }

        function str2ab (str)
        {
            var len = str.length;
            var ret = new ArrayBuffer (str.length);
            var view = new Uint8Array (ret);
            for (var i = 0; i < len; i++)
                view[i] = (0xff & str.charCodeAt (i));

            return (ret);
        }

        function info_hash (info)
        {
            return (sha.sha1 (str2ab (bencoder.encode (info))));
        }

        function make (event, data)
        {
            var torrent;

            torrent = MakeTorrent (data, null); // no template yet
            var thing = {};
            torrent["info"]["thing"] = thing;
            var form = document.getElementById ("thing_form");
            if (null != form)
            {
                for (i = 0; i < form.elements.length; i++)
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

            var info = torrent["info"];
            var primary_key = info_hash (info);
            torrent["_id"] = primary_key;

            function ok (data)
            {
                console.log (data);
                alert ("make succeeded");
            };
            function fail (data)
            {
                console.log (data);
                alert ("make failed");
            };
            if (login.isLoggedIn ())
                records.saveDocWithAttachments.call // $.couch.db (_Db)
                (
                    records,
                    data.database,
                    torrent,
                    {
                        success: ok,
                        error: fail
                    },
                    (data.files) ? data.files : null
                );
            else
                alert ("You must be logged in to make a thing");
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
