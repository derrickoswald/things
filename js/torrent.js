define
(
    ["bencoder", "sha1"],
    function (bencoder, sha1)
    {
        /**
         * @summary Creates a function for handling the end of reading a file.
         * @description If all blobs have been read in, the function callback is called.
         * @param {Any} blobs the array to stuff the result into.
         * @param {number} index - the index at which to store the result in the blob array.
         * @param callback - the function to call when all blobs have been read in.
         * @memberOf module:torrent
         */
        function makeLoadEndFunction (blobs, index, callback)
        {
            return function (event)
            {
                var done;

                // for onloadend, we need to check that readyState = DONE == 2
                if (event.target.readyState == FileReader.DONE)
                     blobs[index] = event.target.result;
                // check if all blobs are read in
                done = true;
                for (var i = 0; done && (i < blobs.length); i++)
                    if (!blobs[i])
                        done = false;
                if (done)
                    callback ();
            };
        }

        /**
         * @summary Convert a number into an eight character hexadecimal string.
         * @description Isolates the lowest 8 nibbles of the number one by one and
         * converts them into a hex character, concatenating them into a string.
         * @param {number} val - the value to convert.
         * @returns {string} the equivalent hexadecimal string value of the number with leading zeros (always 8 characters).
         * @memberOf module:torrent
         */
        function cvt_hex (val)
        {
            var str = "";
            var i;
            var v;

            for (i = 7; i >= 0; i--)
            {
                v = (val >>> (i * 4)) & 0x0f;
                str += v.toString (16);
            }
            return str;
        }

        /**
         * @summary Compute hashes.
         * @description Performs the reading of files and the calculation of hash values.
         * Specifically it computes the SHA1 values for the pieces of the file set.
         * @param {Array} files - the list of files to compute hashes for.
         * @param piece_length - the size at which to cut up the file(s).
         * @param callback - the function(passed-hashes-array as ArrayBuffer) to call when processing is complete.
         * @memberOf module:torrent
         */
        function ComputeHashes (files, piece_length, callback)
        {
            var blobs = [];
            blobs.length = files.length;

            var afterall = function ()
            {
                // now we have our blobs, build it into one big blob
                var length = 0;
                for (var i = 0; i < blobs.length; i++)
                    length += blobs[i].byteLength;
                var blob = new ArrayBuffer (length);
                var view = new Uint8Array (blob, 0, length);
                length = 0;
                for (var i = 0; i < blobs.length; i++)
                {
                    view.set (new Uint8Array (blobs[i], 0, blobs[i].byteLength), length);
                    length += blobs[i].byteLength;
                }

                // compute the hashes
                var hashes = new ArrayBuffer (Math.ceil (length / piece_length) * 20);
                var hashview = new Uint8Array (hashes);
                var index = 0;
                for (var j = 0; j < length; j += piece_length)
                {
                    var hash = sha1.sha1 (blob.slice (j, j + piece_length), true);
                    var temp = new Uint8Array (hash);
                    for (var k = 0; k < 20; k++)
                        hashview[index++] = temp[k];
                }

                callback (hashes);
            };

            for (var i = 0; i < files.length; i++)
            {
                var reader = new FileReader ();
                reader.onloadend = makeLoadEndFunction (blobs, i, afterall);
                reader.readAsArrayBuffer (files[i]);
            }
        };

        /**
         * @summary Make a torrent object.
         * @description Create a torrent from the given files.
         * @param {Array} files - the list of files to compute hashes for.
         * @param piece_length - the size at which to cut up the file(s).
         * @param directory - the directory name for torrents with multiple files.
         * @param template - torrent object to use as a template, otherwise if null, newly generated default properties are used.
         * @param callback - the function(passed-torrent) to call when processing is complete.
         * @memberOf module:torrent
         */
        function MakeTorrent (files, piece_length, directory, template, callback)
        {
            var timestamp;
            var infohash;
            var torrent;

            // javascript date is number of millisconds since epoch
            timestamp = Math.round ((new Date ()).getTime () / 1000.0);
            if (1 == files.length)
                infohash = {
                        "length": files[0].size,
                        "name": files[0].name,
                        "piece length": piece_length,
                        "pieces": "placeholder until hashes are computed"
                    };
            else
            {
                if (null == directory)
                {
                    directory = "directory" + "_" + Math.floor ((Math.random () * 1000) + 1);
                    alert ("generating required directory " + directory);
                }
                var filedata = [];
                for (var i = 0; i < files.length; i++)
                    filedata[filedata.length] = {
                        "length": files[i].size,
                        "path" : [files[i].name]
                        };
                infohash = {
                        "files": filedata,
                        "name": directory,
                        "piece length": piece_length,
                        "pieces": "placeholder until hashes are computed"
                    };
            }
            if (null == template)
                torrent =
                {
                    "created by": "ThingMaker v2.0",
                    "creation date": timestamp,
                    "encoding": "UTF-8",
                    "info": infohash
                };
            else
            {
                torrent = template;
                var thing = ret["info"]["thing"]; // keep the thing details from the info section - if any
                torrent["creation date"] = timestamp;
                torrent["info"] = infohash;
                if (null != thing)
                    torrent["info"]["thing"] = thing;
            }

            ComputeHashes (files, piece_length,
                function (hashes)
                {
                    torrent["info"]["pieces"] = hashes;
                    callback (torrent);
                });
        }

        /**
         * @summary Bencode a torrent object.
         * @description Convert the torrent into bencoded form.
         * @param {Object} torrent - the object to bencode.
         * @return {String} bencoded torrent content.
         * @memberOf module:torrent
         */
        function Encode (torrent)
        {
            return (bencoder.encode (torrent));
        }

        /**
         * @summary Bencode a torrent object and convert to ArrayBuffer.
         * @description Convert the torrent into bencoded form and output as an unambiguous binary object rather than a String.
         * @param {Object} torrent - the object to bencode.
         * @return {ArrayBuffer} bencoded torrent content.
         * @memberOf module:torrent
         */
        function Binarize (torrent)
        {
            return (bencoder.str2ab (bencoder.encode (torrent)));
        }

        /**
         * @summary Compute the hash of the given object.
         * @description Calculate the info of the bencoded info object.
         * @param {Object} info - the object to bencode and compute hashes for - normally the info section of a torrent.
         * @memberOf module:torrent
         */
        function InfoHash (info)
        {
            return (sha1.sha1 (bencoder.str2ab (Encode (info))));
        }

        /**
         * @summary Create an object from bencoded data.
         * @description Convert the bencoded ArrayBuffer into a JavaScript object.
         * @param {ArrayBuffer} torrent_file contents of the .torrent file
         * @return {object} the JavaScript object with properties equivalent to the bencoded torrent.
         * @memberOf module:torrent
         */
        function ReadTorrent (torrent_file)
        {
            var binary_torrent;
            var ret;

            ret = bencoder.decode (torrent_file, false);

            // this would have been straight forward except
            // we need to use the binary version of the "pieces" element so that it
            // doesn't get converted to UTF-8 as required by the bencoding specification
            binary_torrent = bencoder.decode (torrent_file, true);
            if (binary_torrent.info && binary_torrent.info.pieces)
                ret.info.pieces = binary_torrent.info.pieces;

            return (ret);
        }

        /**
         * @summary Read a torrent file and create a JavaScript object.
         * @description Read the File object and convert it into an object.
         * @param {File} file the .torrent file
         * @param {object} options the options and callbacks,
         * currently only the function success (filename, javascript_object) is used.
         * @memberOf module:torrent
         */
        function ReadTorrentAsync (file, options)
        {
            var reader;

            reader = new FileReader ();
            reader.onloadend = function (event)
            {
                if (event.target.readyState == FileReader.DONE)
                    if (options.success)
                        options.success (file.name, ReadTorrent (event.target.result));
            };
            reader.readAsArrayBuffer (file);
        }

        function printCertificate (cert, tabspace)
        {
            var br;
            var ret;

            ret = "";

            for (var j = 0; j < tabspace; j++)
                ret += " ";
            ret += "-----BEGIN CERTIFICATE-----\n";

            var b64 = btoa (String.fromCharCode.apply (null, new Uint8Array (cert)));
            br = 0;
            for (var i = 0; i < b64.length; i++)
            {
                if (0 == (br % 64))
                    for (var j = 0; j < tabspace; j++)
                        ret += " ";
                ret += b64.charAt (i);
                if ((0 == (++br % 64)) && (i + 1 < b64.length))
                    ret += "\n";
            }
            ret += "\n";
            for (var j = 0; j < tabspace; j++)
                ret += " ";
            ret += "-----END CERTIFICATE-----";

            return (ret);
        }

        function printSignature (signature, tabspace)
        {
            var view;
            var br;
            var ret;

            ret = "";

            view = new Uint8Array (signature);
            br = 0;
            for (var i = 0; i < view.byteLength; i++)
            {
                if (0 == (br % 32))
                    for (var j = 0; j < tabspace; j++)
                        ret += " ";
                ret += ((view[i] >>> 4) & 0x0f).toString (16);
                ret += (view[i] & 0x0f).toString (16);
                if ((0 == (++br % 32)) && (i + 1 < view.byteLength))
                    ret += "\n";
            }

            return (ret);
        }

        function printPieces (pieces, tabspace)
        {
            var view;
            var br;
            var ret;

            ret = "";

            view = new Uint8Array (pieces);
            br = 0;
            for (var i = 0; i < view.byteLength; i++)
            {
                if (0 == (br % 20))
                    for (var j = 0; j < tabspace; j++)
                        ret += " ";
                ret += ((view[i] >>> 4) & 0x0f).toString (16);
                ret += (view[i] & 0x0f).toString (16);
                if ((0 == (++br % 20)) && (i + 1 < view.byteLength))
                    ret += "\n";
            }

            return (ret);
        }

        function PrintTorrent (torrent)
        {
            var trigger = "\"pieces\": {}";
            var cert = "\"certificate\": {}";
            var signature = "\"signature\": {}";
            var index;
            var tabspace;
            var s;
            var raw_text;
            var ret;

            ret = JSON.stringify (torrent, null, 4);
            // kludgy way to add the hash values
            index = ret.indexOf (trigger);
            if (0 < index)
            {
                tabspace = 0;
                while (" " == ret.substr (index - tabspace - 1, 1))
                    tabspace++;
                raw_text = printPieces (torrent["info"]["pieces"], tabspace + 4);
                s = "";
                for (var j = 0; j < tabspace; j++)
                    s += " ";
                ret = ret.substr (0, index) + "\"pieces\": {\n" + raw_text + "\n" + s + "}" + ret.substr (index + trigger.length);
            }
            // kludgy way to show the certificate
            index = 0;
            while (0 < (index = ret.indexOf (cert, index)))
            {
                tabspace = 0;
                while (" " == ret.substr (index - tabspace - 1, 1))
                    tabspace++;
                raw_text = printCertificate (torrent["signatures"]["net.thingtracker"]["certificate"], tabspace + 4);
                s = "";
                for (var j = 0; j < tabspace; j++)
                    s += " ";
                ret = ret.substr (0, index) + "\"certificate\": {\n" + raw_text + "\n" + s + "}" + ret.substr (index + cert.length);
                index += cert.length;
            }
            // kludgy way to show the signature
            index = 0;
            while (0 < (index = ret.indexOf (signature, index)))
            {
                tabspace = 0;
                while (" " == ret.substr (index - tabspace - 1, 1))
                    tabspace++;
                raw_text = printSignature (torrent["signatures"]["net.thingtracker"]["signature"], tabspace + 4);
                s = "";
                for (var j = 0; j < tabspace; j++)
                    s += " ";
                ret = ret.substr (0, index) + "\"signature\": {\n" + raw_text + "\n" + s + "}" + ret.substr (index + signature.length);
                index += signature.length;
            }

            return (ret);
        };

        var exported =
        {
            "ComputeHashes" : ComputeHashes,
            "MakeTorrent": MakeTorrent,
            "Encode": Encode,
            "Binarize": Binarize,
            "InfoHash": InfoHash,
            "ReadTorrentAsync": ReadTorrentAsync,
            "PrintTorrent": PrintTorrent
        };

        return (exported);
    }
);

