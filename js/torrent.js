/**
 * @fileOverview Torrent conversion to and from JavaScript objects.
 * @name torrent
 * @author Derrick Oswald
 * @version 1.0
 */
define
(
    ["bencoder", "sha1"],
    /**
     * @summary Torrent reading and writing.
     * @description Packing and unpacking between bencoded binary and JavaScript objects.
     * @name torrent
     * @exports torrent
     * @version 1.0
     */
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
                var length;
                var blob;
                var view;
                var hashes;
                var hashview;
                var index;
                var hash;
                var temp;
                var i;
                var j;

                // now we have our blobs, build it into one big blob
                length = 0;
                for (i = 0; i < blobs.length; i++)
                    length += blobs[i].byteLength;
                blob = new ArrayBuffer (length);
                view = new Uint8Array (blob, 0, length);
                length = 0;
                for (i = 0; i < blobs.length; i++)
                {
                    view.set (new Uint8Array (blobs[i], 0, blobs[i].byteLength), length);
                    length += blobs[i].byteLength;
                }

                // compute the hashes
                hashes = new ArrayBuffer (Math.ceil (length / piece_length) * 20);
                hashview = new Uint8Array (hashes);
                index = 0;
                for (i = 0; i < length; i += piece_length)
                {
                    hash = sha1.sha1 (blob.slice (i, i + piece_length), true);
                    temp = new Uint8Array (hash);
                    for (j = 0; j < 20; j++)
                        hashview[index++] = temp[j];
                }

                callback (hashes);
            };

            for (var i = 0; i < files.length; i++)
            {
                var reader = new FileReader ();
                reader.onloadend = makeLoadEndFunction (blobs, i, afterall);
                reader.readAsArrayBuffer (files[i]);
            }
        }

        /**
         * @summary Make a torrent object.
         * @description Create a torrent from the given files.
         * @param {Array} files - the list of files to compute hashes for
         * @param {number} piece_length - the size at which to cut up the file(s)
         * @param {string} directory - the directory name for torrents with multiple files
         * @param {function} callback - the function(passed-torrent) to call when processing is complete
         * @memberOf module:torrent
         */
        function MakeTorrent (files, piece_length, directory, callback)
        {
            var timestamp;
            var infohash;
            var torrent;
            var thing;

            // JavaScript date is number of milliseconds since epoch
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
                if (null === directory)
                {
                    directory = "directory" + "_" + Math.floor ((Math.random () * 1000) + 1);
                    console.log ("torrent.MakeTorrent generating required directory " + directory);
                }
                var filedata = [];
                for (var i = 0; i < files.length; i++)
                    filedata[filedata.length] =
                    {
                        length: files[i].size,
                        path : [files[i].name]
                    };
                infohash =
                {
                    files: filedata,
                    name: directory,
                    "piece length": piece_length,
                    pieces: "placeholder until hashes are computed"
                };
            }
            torrent =
            {
                "created by": "ThingMaker v2.0",
                "creation date": timestamp,
                encoding: "UTF-8",
                info: infohash
            };

            ComputeHashes
            (
                files,
                piece_length,
                function (hashes)
                {
                    torrent.info.pieces = hashes;
                    callback (torrent);
                }
            );
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

        /**
         * @summary Create an object from bencoded data.
         * @description Convert the bencoded ArrayBuffer into a JavaScript object.
         * @param {ArrayBuffer|string} torrent_file contents of the .torrent file
         * @return {object} the JavaScript object with properties equivalent to the bencoded torrent.
         * @memberOf module:torrent
         */
        function ReadTorrent (torrent_file)
        {
            var binary_torrent;
            var ret;

            if ("string" == typeof (torrent_file))
                torrent_file = bencoder.str2ab (torrent_file);
            ret = bencoder.decode (torrent_file, false);

            // this would have been straight forward except
            // we need to use the binary version of the "pieces" element so that it
            // doesn't get converted to UTF-8 as required by the bencoding specification
            binary_torrent = bencoder.decode (torrent_file, true);
            if (binary_torrent.info && binary_torrent.info.pieces)
                ret.info.pieces = binary_torrent.info.pieces;

            return (ret);
        }

        function dummy () // just here so Eclipse's brain dead outline mode works
        {
        }

        /**
         * @summary Make a string from the certificate.
         * @description Convert the certificate into readable form.
         * @param {ArrayBuffer} cert slice of the torrent containing the certificate
         * @param {number} tabspace number of spaces for a tab
         * @return {string} a string with the certificate
         * @memberOf module:torrent
         */
        function printCertificate (cert, tabspace)
        {
            var br;
            var b64;
            var i;
            var j;
            var ret;

            ret = "";

            for (i = 0; i < tabspace; i++)
                ret += " ";
            ret += "-----BEGIN CERTIFICATE-----\n";

            b64 = btoa (String.fromCharCode.apply (null, new Uint8Array (cert)));
            br = 0;
            for (i = 0; i < b64.length; i++)
            {
                if (0 === (br % 64))
                    for (j = 0; j < tabspace; j++)
                        ret += " ";
                ret += b64.charAt (i);
                if ((0 === (++br % 64)) && (i + 1 < b64.length))
                    ret += "\n";
            }
            ret += "\n";
            for (j = 0; j < tabspace; j++)
                ret += " ";
            ret += "-----END CERTIFICATE-----";

            return (ret);
        }


        /**
         * @summary Make a string from the signatures.
         * @description Convert the signatures into readable form.
         * @param {ArrayBuffer} signature slice of the torrent containing the signatures
         * @param {number} tabspace number of spaces for a tab
         * @return {string} a string with the signature
         * @memberOf module:torrent
         */
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
                if (0 === (br % 32))
                    for (var j = 0; j < tabspace; j++)
                        ret += " ";
                ret += ((view[i] >>> 4) & 0x0f).toString (16);
                ret += (view[i] & 0x0f).toString (16);
                if ((0 === (++br % 32)) && (i + 1 < view.byteLength))
                    ret += "\n";
            }

            return (ret);
        }

        /**
         * @summary Make an array from the binary pieces (block hashes).
         * @description Convert the pieces blob into an array of strings.
         * @param {ArrayBuffer} pieces slice of the torrent containing the pieces
         * @return {string[]} an array of strings representing the array of pieces hashes
         * @memberOf module:torrent
         */
        function PiecesToArray (pieces)
        {
            var view;
            var piece;
            var bytes;
            var ret;

            ret = [];

            view = new Uint8Array (pieces);
            piece = "";
            bytes = 0;
            for (var i = 0; i < view.byteLength; i++)
            {
                piece += ((view[i] >>> 4) & 0x0f).toString (16);
                piece += (view[i] & 0x0f).toString (16);
                if (0 === (++bytes % 20))
                {
                    ret.push (piece);
                    piece = "";
                    bytes = 0;
                }
            }

            return (ret);
        }

        /**
         * @summary Make a pieces blob from the array of string of pieces.
         * @description Convert the array of strings into a pieces blob.
         * @param {string[]} array the pieces as an array of strings
         * @return {ArrayBuffer} the array of pieces hashes
         * @memberOf module:torrent
         */
        function ArrayToPieces (array)
        {
            var view;
            var index;
            var ret;

            ret = new ArrayBuffer (array.length * 20);

            view = new Uint8Array (ret, 0, ret.byteLength);
            index = 0;
            for (var i = 0; i < array.length; i++)
                for (var j = 0; j < 40; j += 2)
                    view[index++] = parseInt (array[i].substring (j, j + 2), 16);

            return (ret);
        }

        /**
         * @summary Make a string for display out of a torrent.
         * @description The toString() method of the torrent object.
         * @param {object} The torrent as a JavaScript object.
         * @return {string} the string representation of the torrent
         * @memberOf module:torrent
         */
        function PrintTorrent (torrent)
        {
            var pieces;
            var cert = "\"certificate\": {}";
            var signature = "\"signature\": {}";
            var index;
            var tabspace;
            var s;
            var raw_text;
            var ret;

            pieces = torrent.info.pieces;
            torrent.info.pieces = PiecesToArray (pieces);
            ret = JSON.stringify (torrent, null, 4);
            torrent.info.pieces = pieces;

            // kludgy way to show the certificate
            index = 0;
            while (0 < (index = ret.indexOf (cert, index)))
            {
                tabspace = 0;
                while (" " == ret.substr (index - tabspace - 1, 1))
                    tabspace++;
                raw_text = printCertificate (torrent.signatures["net.thingtracker"].certificate, tabspace + 4);
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
                raw_text = printSignature (torrent.signatures["net.thingtracker"].signature, tabspace + 4);
                s = "";
                for (var k = 0; k < tabspace; k++)
                    s += " ";
                ret = ret.substr (0, index) + "\"signature\": {\n" + raw_text + "\n" + s + "}" + ret.substr (index + signature.length);
                index += signature.length;
            }

            return (ret);
        }

        var exported =
        {
            ComputeHashes : ComputeHashes,
            MakeTorrent: MakeTorrent,
            Encode: Encode,
            Binarize: Binarize,
            InfoHash: InfoHash,
            ReadTorrent: ReadTorrent,
            ReadTorrentAsync: ReadTorrentAsync,
            PrintTorrent: PrintTorrent,
            PiecesToArray: PiecesToArray,
            ArrayToPieces: ArrayToPieces
        };

        return (exported);
    }
);
