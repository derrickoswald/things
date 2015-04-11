define
(
    ["deluge", "torrent", "records", "login_credentials", "configuration"],
    function (deluge, torrent, records, login_credentials, configuration)
    {
        AsyncTestCase
        (
            "DelugeTest",
            {
                _FileName: "test.txt",
                _File: null,
                _DocId: "testdoc",
                _Db: null, // 'global' variable with the name of the database under test
                _Torrent: null, // sample torrent

                // executed before each test - make a torrent, login
                setUp : function (queue)
                {
                    this._Db = "testdb" + "_" + Math.floor ((Math.random () * 1000) + 1);
                    var del = null;
                    var blob = new Blob (["hello world"]);
                    this._File = new File ([blob], this._FileName, { type: "text/html", lastModifiedDate: new Date () });

                    queue.call
                    (
                        "login couch",
                        function (callbacks)
                        {
                            var list = callbacks.add
                            (
                                function (data)
                                {
                                    console.log (data);
                                }
                            );
                            $.couch.login
                            (
                                {
                                    name: login_credentials.get ("username"),
                                    password: login_credentials.get ("password"),
                                    success: list
                                }
                            );
                        }
                    );

                    queue.call
                    (
                        "check",
                        function (callbacks)
                        {
                            var list = callbacks.add
                            (
                                function (data)
                                {
                                    console.log (data);
                                    del = -1 != data.indexOf (this._Db);
                                }
                            );
                            $.couch.allDbs
                            (
                                {
                                    success: list
                                }
                            );
                        }
                    );

                    queue.call
                    (
                        "cleanup",
                        function (callbacks)
                        {
                            if (del)
                                $.couch.db (this._Db).drop
                                (
                                    {
                                        success: callbacks.noop ()
                                    }
                                );
                        }
                    );

                    queue.call
                    (
                        "create database",
                        function (callbacks)
                        {
                            var ok = callbacks.add
                            (
                                function (data)
                                {
                                    console.log (data);
                                    jstestdriver.console.log ("setUp " + this._Db);
                                    assertTrue ("create", data.ok);
                                }
                            );
                            var fail = callbacks.addErrback ("create database");
                            $.couch.db (this._Db).create
                            (
                                {
                                    success: ok,
                                    error: fail
                                }
                            );
                        }
                    );

                    queue.call
                    (
                        "make torrent",
                        function (callbacks)
                        {
                            var ok = callbacks.add
                            (
                                function (tor)
                                {
                                    _Torrent = tor;
                                }
                            );
                            // var fail = callbacks.addErrback ("make_torrent");
                            torrent.MakeTorrent ([this._File], 16384, null, null, ok); // no directory or template
                        }
                    );

                    queue.call
                    (
                        "login deluge",
                        function (callbacks)
                        {
                            deluge.login (
                                deluge.Password,
                                {
                                    success: callbacks.noop (),
                                    error: callbacks.addErrback ("login deluge")
                                }
                            );
                        }
                    );
                },

                tearDown : function (queue)
                {
                    queue.call
                    (
                        "drop database",
                        function (callbacks)
                        {
                            var ok = callbacks.add
                            (
                                function (data)
                                {
                                    console.log (data);
                                    jstestdriver.console.log ("tearDown " + this._Db);
                                    assertTrue ("drop", data.ok);
                                }
                            );
                            var fail = callbacks.addErrback ("drop database");
                            $.couch.db (this._Db).drop
                            (
                                {
                                    success: ok,
                                    error: fail
                                }
                            );
                        }
                    );
                },

                testTorrent: function (queue)
                {
                    queue.call
                    (
                        "create document with attached torrent",
                        function (callbacks)
                        {
                            var ok = callbacks.add
                            (
                                function (data)
                                {
                                    console.log ("create document with attached torrent");
                                    console.log (data);
                                    assertTrue ("create document with attachment", data.ok);
                                }
                            );
                            var fail = callbacks.addErrback ("create document with attachment");
                            _Torrent["url-list"] = document.location.origin + "/" + this._Db + "/" + this._DocId + "/" + this._FileName;
                            var torrentfilename = this._DocId + ".torrent";
                            var torrent_attachment = new File ([torrent.Binarize (_Torrent)], torrentfilename, { type: "application/octet-stream" });
                            var doc =
                            {
                                "_id": this._DocId,
                                "payload": "test"
                            };
                            records.saveDocWithAttachments.call
                            (
                                records, // this variable
                                this._Db,
                                doc,
                                {
                                    success: ok,
                                    error: fail
                                },
                                [this._File, torrent_attachment]
                            );
                        }
                    );

                    queue.call
                    (
                        "upload torrent",
                        function (callbacks)
                        {
                            var ok = callbacks.add
                            (
                                function ()
                                {
                                    console.log ("upload torrent");
                                }
                            );
                            var fail = callbacks.addErrback ("create document with attachment");
                            deluge.addTorrent (
                                document.location.origin + "/" + this._Db + "/" + this._DocId + "/" + this._DocId + ".torrent",
                                {
                                    success: ok,
                                    error: fail
                                }
                            );
                        }
                    );

//                    queue.call
//                    (
//                        "get torrent info",
//                        function (callbacks)
//                        {
//                            var ok = callbacks.add
//                            (
//                                function (data)
//                                {
//                                    assertNotNull ("torrent info access failure", data);
//                                    console.log (data);
//                                }
//                            );
//                            var fail = callbacks.addErrback ("get torrent info");
//                            console.log ("get torrent info");
//                            var hash = torrent.InfoHash (_Torrent["info"]);
//                            console.log ("hash = " + hash);
//                            // we need to wait for a while here
//                            window.setTimeout (
//                                function ()
//                                {
//                                    deluge.getTorrentInfo (
//                                        hash,
//                                        {
//                                            success: ok,
//                                            error: fail
//                                        }
//                                    );
//                                },
//                                5000);
//                        }
//                    );

//                    queue.call
//                    (
//                        "deleteTorrent",
//                        function (callbacks)
//                        {
//                        }
//                    );

                }
            }
        );
    }
);