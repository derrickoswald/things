define
(
    // ToDo: check for conflicting object already uploaded
    ["mustache", "../records", "../bencoder", "../login"],
    function (mustache, records, bencoder, login)
    {
        function upload (event, data)
        {
            if (data.torrent)
            {
                if (login.isLoggedIn ())
                {
                    var primary_key = data.torrent["_id"];

                    if (typeof (data.files) == "undefined")
                        data.files = [];

                    /*
                    see: http://www.bittorrent.org/beps/bep_0019.html

                    webseeds

                    Metadata Extension

                    In the main area of the metadata file and not part of the "info" section,
                    will be a new key, "url-list". This key will refer to a one or more URLs,
                    and will contain a list of web addresses where torrent data can be retrieved.
                    This key may be safely ignored if the client is not capable of using it.

                    For example:
                        d 8:announce27:http://tracker.com/announce 8:url-list26:http://mirror.com/file.exe 4:info...

                    If the "url-list" URL ends in a slash, "/" the client must add the "name"
                    from the torrent to make the full URL. This allows .torrent generators to
                    treat this field same for single file and multi-file torrents.

                    Multi-File Torrents

                    BitTorrent clients normally use the "name" from the torrent info section
                    to make a folder, then use the "path/file" items from the info section
                    within that folder. For the case of Multi-File torrents, the "url-list"
                    must be a root folder where a client could add the same "name" and
                    "path/file" to create the URL for the request.

                    For example:

                        ... 8:url-list22:http://mirror.com/pub/ 4:infod5:filesld6:lengthi949e4:pathl10:Readme.txte e4:name7:michael

                        A client would use all that to build a url: http://mirror.com/pub/michael/Readme.txt

                    */

                    // add the webseed
                    data.torrent["url-list"] = "http://localhost:5984/things/" + primary_key + "/";
                    if (1 == data.files.length)
                        data.torrent["url-list"] += data.files[0].name;

                    // make the list of files for attachment with names adjusted for directory
                    var copy = [];
                    data.files.forEach (
                        function (item)
                        {
                            if (1 < data.files.length)
                                copy.push (new File ([item], data.torrent.info.name + "/" + item.name, { type: item.type, lastModifiedDate: item.lastModifiedDate }));
                            else
                                copy.push (item);
                        }
                    );

                    // add the torrent to a copy of the list of files to be saved
                    copy.push (new File ([bencoder.str2ab (bencoder.encode (data.torrent))], primary_key + ".torrent", { type: "application/octet-stream" }));

                    function ok (result)
                    {
                        console.log (result);
                        alert ("upload succeeded");
                        // remove added _rev field for now
                        delete data.torrent["_rev"];

                    };

                    function fail (result)
                    {
                        console.log (result);
                        alert ("upload failed");
                    };

                    if (login.isLoggedIn ())
                        records.saveDocWithAttachments.call // $.couch.db (_Db)
                        (
                            records,
                            data.database,
                            data.torrent,
                            {
                                success: ok,
                                error: fail
                            },
                            copy
                        );
                }
                else
                    alert ("You must be logged in to make a thing");
            }
            else
                alert ("You must make a thing first before uploading");

        };

        return (
            {
                getStep: function ()
                {
                    var upload_hooks =
                        [
                            { id: "upload_button", event: "click", code: upload, obj: this }
                        ];
                    return ({ id: "upload", title: "Upload the thing", template: "templates/upload.mst", hooks: upload_hooks });
                }
            }
        );
    }
)