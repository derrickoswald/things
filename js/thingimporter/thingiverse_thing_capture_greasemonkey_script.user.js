// ==UserScript==
// @name        thingiverse_import
// @namespace   thingiverse_import
// @description Import thing from Thingiverse into CouchDB
// @include     http://www.thingiverse.com/*
// @include     https://www.thingiverse.com/*
// @version     1
// @grant       none
// ==/UserScript==

// In order for this to work, you need to enable CORS in CouchDB by editing /etc/couchdb/default.ini in the httpd section:
//     [httpd]
//     enable_cors = true
// specify thingiver.com as the source and also add PUT as a legal method, same file as above in the cors section:
//     [cors]
//     origins = http://www.thingiverse.com
//     methods = GET,POST,PUT
// and create a pending_things database with no authentication needed. It assumes CouchDB is at http://localhost:5984.

// import
// a little help in deciphering the code...
// code that follows immediately is imported modules from things https://github.com/derrickoswald/things
// at the bottom, starting with createCORSRequest, is the actual user script.


// module sha1

sha1 = function ()
    {

        function sha1 (msg, binary)
        {

            function rotate_left (n, s)
            {
                var t4 = (n << s) | (n >>> (32 - s));
                return t4;
            };

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
            };

            function Utf8Encode (string)
            {
                string = string.replace (/\r\n/g, "\n");
                var utftext = "";

                for ( var n = 0; n < string.length; n++)
                {

                    var c = string.charCodeAt (n);

                    if (c < 128)
                    {
                        utftext += String.fromCharCode (c);
                    }
                    else if ((c > 127) && (c < 2048))
                    {
                        utftext += String.fromCharCode ((c >> 6) | 192);
                        utftext += String.fromCharCode ((c & 63) | 128);
                    }
                    else
                    {
                        utftext += String.fromCharCode ((c >> 12) | 224);
                        utftext += String.fromCharCode (((c >> 6) & 63) | 128);
                        utftext += String.fromCharCode ((c & 63) | 128);
                    }

                }

                return utftext;
            };

            var blockstart;
            var i, j;
            var W = new Array (80);
            var H0 = 0x67452301;
            var H1 = 0xEFCDAB89;
            var H2 = 0x98BADCFE;
            var H3 = 0x10325476;
            var H4 = 0xC3D2E1F0;
            var A, B, C, D, E;
            var temp;
            var ret;

            binary = binary | false;
            var word_array = new Array ();
            var msg_len;
            if (msg instanceof ArrayBuffer)
            {
                var view = new Uint8Array (msg);
                msg_len = view.byteLength;
                temp = msg_len - 3;
                for (i = 0; i < temp; i += 4)
                {
                    j = view[i] << 24 | view[i + 1] << 16 | view[i + 2] << 8 | view[i + 3];
                    word_array.push (j);
                }

                switch (msg_len % 4)
                {
                    case 0:
                        i = 0x080000000;
                        break;
                    case 1:
                        i = view[msg_len - 1] << 24 | 0x0800000;
                        break;

                    case 2:
                        i = view[msg_len - 2] << 24 | view[msg_len - 1] << 16 | 0x08000;
                        break;

                    case 3:
                        i = view[msg_len - 3] << 24 | view[msg_len - 2] << 16 | view[msg_len - 1] << 8 | 0x80;
                        break;
                }

                word_array.push (i);
            }
            else
            {
                msg = Utf8Encode (msg);
                msg_len = msg.length;
                temp = msg_len - 3;
                for (i = 0; i < temp; i += 4)
                {
                    j = msg.charCodeAt (i) << 24 | msg.charCodeAt (i + 1) << 16 | msg.charCodeAt (i + 2) << 8 | msg.charCodeAt (i + 3);
                    word_array.push (j);
                }

                switch (msg_len % 4)
                {
                    case 0:
                        i = 0x080000000;
                        break;
                    case 1:
                        i = msg.charCodeAt (msg_len - 1) << 24 | 0x0800000;
                        break;

                    case 2:
                        i = msg.charCodeAt (msg_len - 2) << 24 | msg.charCodeAt (msg_len - 1) << 16 | 0x08000;
                        break;

                    case 3:
                        i = msg.charCodeAt (msg_len - 3) << 24 | msg.charCodeAt (msg_len - 2) << 16 | msg.charCodeAt (msg_len - 1) << 8 | 0x80;
                        break;
                }

                word_array.push (i);
            }

            while ((word_array.length % 16) != 14)
                word_array.push (0);

            word_array.push (msg_len >>> 29);
            word_array.push ((msg_len << 3) & 0x0ffffffff);

            for (blockstart = 0; blockstart < word_array.length; blockstart += 16)
            {

                for (i = 0; i < 16; i++)
                    W[i] = word_array[blockstart + i];
                for (i = 16; i <= 79; i++)
                    W[i] = rotate_left (W[i - 3] ^ W[i - 8] ^ W[i - 14] ^ W[i - 16], 1);

                A = H0;
                B = H1;
                C = H2;
                D = H3;
                E = H4;

                for (i = 0; i <= 19; i++)
                {
                    temp = (rotate_left (A, 5) + ((B & C) | (~B & D)) + E + W[i] + 0x5A827999) & 0x0ffffffff;
                    E = D;
                    D = C;
                    C = rotate_left (B, 30);
                    B = A;
                    A = temp;
                }

                for (i = 20; i <= 39; i++)
                {
                    temp = (rotate_left (A, 5) + (B ^ C ^ D) + E + W[i] + 0x6ED9EBA1) & 0x0ffffffff;
                    E = D;
                    D = C;
                    C = rotate_left (B, 30);
                    B = A;
                    A = temp;
                }

                for (i = 40; i <= 59; i++)
                {
                    temp = (rotate_left (A, 5) + ((B & C) | (B & D) | (C & D)) + E + W[i] + 0x8F1BBCDC) & 0x0ffffffff;
                    E = D;
                    D = C;
                    C = rotate_left (B, 30);
                    B = A;
                    A = temp;
                }

                for (i = 60; i <= 79; i++)
                {
                    temp = (rotate_left (A, 5) + (B ^ C ^ D) + E + W[i] + 0xCA62C1D6) & 0x0ffffffff;
                    E = D;
                    D = C;
                    C = rotate_left (B, 30);
                    B = A;
                    A = temp;
                }

                H0 = (H0 + A) & 0x0ffffffff;
                H1 = (H1 + B) & 0x0ffffffff;
                H2 = (H2 + C) & 0x0ffffffff;
                H3 = (H3 + D) & 0x0ffffffff;
                H4 = (H4 + E) & 0x0ffffffff;

            }

            if (binary)
            {
                ret = new ArrayBuffer (20);
                temp = new Uint8Array (ret);
                temp[0] = (H0 >> 24) & 0xff;
                temp[1] = (H0 >> 16) & 0xff;
                temp[2] = (H0 >>  8) & 0xff;
                temp[3] = (H0      ) & 0xff;
                temp[4] = (H1 >> 24) & 0xff;
                temp[5] = (H1 >> 16) & 0xff;
                temp[6] = (H1 >>  8) & 0xff;
                temp[7] = (H1      ) & 0xff;
                temp[8] = (H2 >> 24) & 0xff;
                temp[9] = (H2 >> 16) & 0xff;
                temp[10] = (H2 >>  8) & 0xff;
                temp[11] = (H2      ) & 0xff;
                temp[12] = (H3 >> 24) & 0xff;
                temp[13] = (H3 >> 16) & 0xff;
                temp[14] = (H3 >>  8) & 0xff;
                temp[15] = (H3      ) & 0xff;
                temp[16] = (H4 >> 24) & 0xff;
                temp[17] = (H4 >> 16) & 0xff;
                temp[18] = (H4 >>  8) & 0xff;
                temp[19] = (H4      ) & 0xff;
            }
            else
            {
                temp = cvt_hex (H0) + cvt_hex (H1) + cvt_hex (H2) + cvt_hex (H3) + cvt_hex (H4);
                ret = temp.toLowerCase ();
            }

            return (ret);
        }

    return ({
        "sha1": sha1
    });
}();

// module bencoder

/**
 * @summary Functions for encoding and decoding bencoded data.
 * @name bencoder
 * @exports bencoder
 * @version 1.0
 */
bencoder = function ()
    {
        /**
         * @summary Stupid conversion of string to array buffer.
         * @description Assumes ASCII and just copies byte by byte.
         * @function str2ab
         * @memberOf module:bencoder
         * @param {string} str - the string to turn into an ArrayBuffer
         * @returns {ArrayBuffer} the string as an ArrayBuffer
         */
        function str2ab (str)
        {
            var len = str.length;
            var ret = new ArrayBuffer (str.length);
            var view = new Uint8Array (ret);
            for (var i = 0; i < len; i++)
                view[i] = (0xff & str.charCodeAt (i));

            return (ret);
        };

        /**
         * @summary Decodes bencoded data.
         *
         * @param {ArrayBuffer} buffer - the source to read the bencoded data from
         * @param {*} raw Non-null if strings should be returned as ArrayBuffer
         * @return {Object|Array|ArrayBuffer|String|Number}
         * @memberOf module:bencoder
         */
        function decode (buffer, raw)
        {
            if (!(buffer instanceof ArrayBuffer))
                throw "not an ArrayBuffer";

            decode.position = 0;
            decode.buffer = buffer;
            decode.size = buffer.byteLength;
            decode.data = new DataView (buffer);

            return (decode.next (raw));
        }

        decode.position = 0;
        decode.buffer = null;
        decode.size = 0;
        decode.data = null;
        decode.encoding_table = [];
        for (var i = 0; i < 256; i++)
            decode.encoding_table.push (encodeURIComponent (String.fromCharCode (i)));

        /**
         * Convert the next bencoded element into a property.
         * @param {*} raw Non-null if strings should be returned as ArrayBuffer
         * @return {Object|Array|ArrayBuffer|String|Number}
         * @memberOf module:bencoder.decode
         */
        decode.next = function (raw)
        {
            var ret;

            switch (decode.data.getUint8 (decode.position))
            {
                case 0x64: // 'd'
                    ret = decode.dictionary (raw);
                    break;
                case 0x6C: // 'l'
                    ret = decode.list (raw);
                    break;
                case 0x69: // 'i'
                    ret = decode.integer (raw);
                    break;
                default:
                    ret = decode.bytes (raw);
                    break;
            }

            return (ret);
        };

        /**
         * Convert the next bencoded dictionary into an object.
         * @param {*} raw Non-null if strings should be returned as ArrayBuffer
         * @return {Object}
         * @memberOf module:bencoder.decode
         */
        decode.dictionary = function (raw)
        {
            var ret;

            ret = {};

            decode.position++; // past the 'd'
            while (decode.data.getUint8 (decode.position) !== 0x65) // 'e'
                ret[decode.next (false)] = decode.next (raw); // keys must be strings
            decode.position++; // past the 'e'

            return (ret);
        };

        /**
         * Convert the next bencoded list into an array.
         * @param {*} raw Non-null if strings should be returned as ArrayBuffer
         * @return {Array}
         * @memberOf module:bencoder.decode
         */
        decode.list = function (raw)
        {
            var ret;

            ret = [];

            decode.position++; // past the 'l'
            while (decode.data.getUint8 (decode.position) !== 0x65) // 'e'
                ret.push (decode.next (raw));
            decode.position++; // past the 'e'

            return (ret);

        };

        /**
         * Convert the next bencoded integer into a number.
         * @param {*} raw Non-null if strings should be returned as ArrayBuffer <em>not used</em>
         * @return {Array}
         * @memberOf module:bencoder.decode
         */
        decode.integer = function (raw)
        {
            var i;
            var limit;
            var c;
            var sign;
            var ret;

            ret = 0;

            i = ++decode.position; // past the 'i'
            limit = decode.size;
            sign = 1;
            while (i < limit)
                if ((c = decode.data.getUint8 (i)) === 0x65) // 'e'
                    break;
                else
                {
                    if (0x2d == c)
                    {
                        if (i == decode.position)
                            sign = -1;
                        else
                            throw "minus sign found in the middle of a number at offset " + i;
                    }
                    else
                    {
                        c -= 0x30; // '0'
                        if ((c < 0) || (c > 9))
                            throw "invalid character(s) '" + String.fromCharCode (c + 0x30) + "' found in number at offset " + i;
                        ret = 10 * ret + c;
                    }
                    i++;
                }
            if (++i > limit) // past the 'e'
                throw "'e' not found at end of number at offset " + decode.position;
            decode.position = i;
            ret *= sign;

            return (ret);
        };

        /**
         * Convert the next bencoded byte array into an ArrayBuffer or a String.
         * @param {*} raw Non-null if strings should be returned as ArrayBuffer
         * @return {ArrayBuffer|String}
         * @memberOf module:bencoder.decode
         */
        decode.bytes = function (raw)
        {
            var i;
            var limit;
            var c;
            var length;
            var ret;

            ret = null;

            length = 0;
            i = decode.position;
            limit = decode.size;
            while (i < limit)
                if ((c = decode.data.getUint8 (i)) === 0x3A) // ':'
                    break;
                else
                {
                    c -= 0x30; // '0'
                    if ((c < 0) || (c > 9))
                        throw "invalid character '" + String.fromCharCode (c + 0x30) + "' found in string size at offset " + i;
                    length = 10 * length + c;
                    i++;
                }
            if (++i > limit) // past the ':'
                throw "':' not found in string size at offset " + decode.position;
            decode.position = i + length;
            ret = decode.buffer.slice (i, decode.position);
            if (!raw)
                ret = decode.stringize (ret);

            return (ret);
        };

        /**
         * Convert an ArrayBuffer, theoretically of UTF-8 encoded bytes, into a String.
         * All strings in a .torrent file that contains text must be UTF-8 encoded.
         * @param {ArrayBuffer} buffer
         * @return {String}
         * @memberOf module:bencoder.decode
        **/
        decode.stringize = function (buffer)
        {
            var data;
            var bytes;
            var i;
            var limit;
            var c;
            var str;
            var ret;

            ret = "";

            // we use the hack described here:
            // http://monsur.hossa.in/2012/07/20/utf-8-in-javascript.html
            // but the correct way is to use a reader to read the utf8 encoded bytes into a string
            // but the trouble with that is it is asynchronous:
            // nope :-( can't do this: var reader = new FileReaderSync ();
            // reference: http://ecma-international.org/ecma-262/5.1/
            data = new DataView (buffer);
            bytes = [];
            limit = buffer.byteLength;
            // ToDo: check if it's faster to concatenate directly to a string instead of making an array first
            for (i = 0; i < limit; i++)
            {
                c = data.getUint8 (i);
                bytes.push (decode.encoding_table [c]);
                ret += HexConverter.dec2hex (c); // comment out for production code
            }
            str = bytes.join ('');
            bytes = ret; // comment out for production code
            ret = decodeURIComponent (str);
            /* start: comment out for production code */
            str = "";
            limit = ret.length;
            for (i = 0; i < limit; i++)
            {
                c = ret.charCodeAt (i);
                str += HexConverter.dec2hex (c);
            }
            if (bytes != str)
                alert ("oops: converted byte data not correct, raw: " + bytes + " String: " + str);
            /* end: comment out for production code */

            return (ret);
        };

        /**
         * Encodes data in bencode.
         * @param {Array|String|ArrayBuffer|Object|Number} data
         * @return {String}
         * @memberOf module:bencoder
         */
        function encode (data)
        {
            var view;
            var limit;
            var i;
            var ret;

            ret = null;

            if (data instanceof ArrayBuffer)
            {
                ret = data.byteLength.toString () + ':';
                view = new Uint8Array (data);
                limit = data.byteLength;
                for (i = 0; i < limit; i++)
                    ret += String.fromCharCode (view[i]);
            }
            else
                switch (typeof data)
                {
                    case 'string':
                        ret = encode.string (data);
                        break;
                    case 'number':
                        ret = encode.number (data);
                        break;
                    case 'object':
                        ret = data.constructor === Array ? encode.list (data) : encode.dict (data);
                        break;
                    default:
                        alert ("oops: data type \"" + (typeof data) + "\" not encoded");
                        break;
                }

            return (ret);
        }

        /**
         * @summary Encodes bytes into a bencode string.
         * @param {Array|String|ArrayBuffer|Object|Number} data the plain javascript object to encode as bencode
         * @return {String}
         * @memberOf module:bencoder.encode
         */
        encode.string = function (data)
        {
            var str;
            var prefix;
            var ret;

            // create a UTF-8 encoded string
            str = encode.encode_utf8 (data);
            prefix = str.length.toString () + ':';
            ret = prefix + str;

            return (ret);
        };

        /**
         * Encodes a number into a bencode string.
         * @param {Number} data - the number to encode
         * @return {String}
         * @memberOf module:bencoder.encode
         */
        encode.number = function (data)
        {
            var str;
            var ret;

            str = data.toString ();
            ret = "i" + str + "e";

            return (ret);
        };

        /**
         * Encodes an object into a bencode dictionary.
         * @param {Object} data - the object to encode
         * @return {String}
         * @memberOf module:bencoder.encode
         */
        encode.dict = function (data)
        {
            var keys;
            var der;
            var limit;
            var i;
            var k;
            var ret;

            keys = [];
            for (var d in data)
                if (!('function' == typeof data[d])) // ignore functions in objects
                    keys.push (d);
            keys = keys.sort (); // Keys must be strings and appear in sorted order (sorted as raw strings, not alphanumerics).
            der = [];
            der.push ("d");
            limit = keys.length;
            for (i = 0; i < limit; i++)
            {
                k = keys[i];
                der.push (encode (k));
                der.push (encode (data[k]));
            }
            der.push ("e");
            ret = der.join ("");

            return (ret);
        };

        /**
         * Encodes an array into a bencode list.
         * @param {Array} data - the array to encode
         * @return {String}
         * @memberOf module:bencoder.encode
         */
        encode.list = function (data)
        {
            var list;
            var limit;
            var i;
            var ret;

            list = [];
            list.push ("l");
            limit = data.length;
            for (i = 0; i < limit; i++)
                list.push (encode (data[i]));
            list.push ("e");
            ret = list.join ("");

            return (ret);};

        /**
         * Convert a string into UTF-8 encoded (all high order bytes are zero) string.
         * @see {http://monsur.hossa.in/2012/07/20/utf-8-in-javascript.html}
         * @param {String} str - the string to encode
         * @returns {String} UTF-8 encoded string
         * @memberOf module:bencoder.encode
         */
        encode.encode_utf8 = function (str)
        {
            return (unescape (encodeURIComponent (str)));
        };

        /**
         * Convert to/from hexadecimal.
         * @memberOf module:bencoder.encode
         */
        var HexConverter =
        {
            hexDigits : '0123456789ABCDEF',

            /**
             * Convert a byte into hexadecmal string form.
             * @param {number} dec - the number to convert, should be in the range 0 to 255
             * @returns {String} A two character string representing the byte.
             * @memberOf module:bencoder.HexConverter
             */
            dec2hex : function (dec)
            {
                return (this.hexDigits[dec >> 4] + this.hexDigits[dec & 15]);
            },

            /**
             * Convert a two character hexadecmal string into a number.
             * @param {String} hex - the string to convert, should be two hexadecimal characters, but more will probably work
             * @returns {number} The number corresponding to the hex string
             * @memberOf module:bencoder.HexConverter
             */
            hex2dec : function (hex)
            {
                return (parseInt (hex, 16));
            }
        };

    return ({
        "str2ab": str2ab,
        "decode": decode,
        "encode": encode,
        "HexConverter": HexConverter
    });
}();

// module torrent

torrent = function ()
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
                for (var i = 0; i < blobs.length; i++)
                    if (!blobs[i])
                    {
                        done = false;
                        break;
                    }
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

        var exported =
        {
            "ComputeHashes" : ComputeHashes,
            "MakeTorrent": MakeTorrent,
            "Encode": Encode,
            "Binarize": Binarize,
            "InfoHash": InfoHash
        };

        return (exported);
    }();


    /**
     * @summary Support for packing and unpacking multipart/related (mime) data.
     * @name multipart
     * @exports multipart
     * @version 1.0
     */
    multipart = function ()
    {
        /**
         * @summary The newline string.
         * @description It is very important to use both a line feed (LF) and carriage return (CR)
         * in terminating the lines within the HTTP request body, because otherwise couchdb
         * just silently fails to work, with no error message (well the unit tests using JSTestDriver
         * return 'Bad Gateway' 503 error).
         * @see {@link https://groups.google.com/forum/#!topic/couchdb-user-archive/3vwpr2mY95c}
         * <ul>
         * <li>Make sure the line breaks in the MIME separators/headers are CRLF, not just LF!</li>
         * <li>(fixed) CouchDB crashes if a multipart body is sent in HTTP ‘chunked’ mode (COUCHDB-1403, filed by me two years ago and still unresolved. My colleague working on the Java port of my replicator just ran into this a few weeks ago.)</li>
         * <li>(no longer required) I remember there being a bug in CouchDB where it required a CRLF after the closing MIME separator, i.e. the body had to end “--separator--\r\n” not just “--separator--“) but I can’t find a reference to the bug in my source code anymore. It may have been fixed.</li>
         * <li>(not fixed) CouchDB used to ignore the headers in attachment MIME parts and assumed that the attachments appeared in the same order as in the “_attachments” object in the main JSON body. I believe this has been fixed and that it now looks at the Content-Disposition header to find the attachment’s filename, but I can’t remember for sure.</li>
         * </ul>
         * @memberOf module:multipart
         */
        var CRLF = "\r\n";

        /**
         * Pair of hypen marks.
         * @memberOf module:multipart
         */
        var HYPH = "--";

        /**
         * The content type mime header.
         * @memberOf module:multipart
         */
        var CONT = "Content-Type: application/json";

        /**
         * Convert a string into UTF-8 encoded (all high order bytes are zero) string.
         * @see {@link http://monsur.hossa.in/2012/07/20/utf-8-in-javascript.html}
         * @param {String} str - the string to encode
         * @returns {String} UTF-8 encoded string
         * @memberOf module:multipart
         */
        function encode_utf8 (str)
        {
            return (unescape (encodeURIComponent (str)));
        };

        /**
         * @summary Creates a function for handling the end of reading a file.
         * @description If all blobs have been read in, the function callback is called.
         * @param {View} view the array to stuff the result into
         * @param {number} the offset within the view to stuff the data
         * @param {Array} doneset the array of boolean values to keep track of done status
         * @param {number} index - the index at which to store the result doneset array
         * @param callback - the function to call when all blobs have been read in
         * paramater to callback
         * @memberOf module:torrent
         */
        function makeLoadEndFunction (view, offset, doneset, index, callback, array)
        {
            return function (event)
            {
                var done;

                if (event.target.readyState == FileReader.DONE)
                {
                    view.set (new Uint8Array (event.target.result), offset);
                    doneset[index] = true;
                }
                // check if all files are read in
                done = true;
                for (var i = 0; done && (i < doneset.length); i++)
                    if (!doneset[i])
                        done = false;
                if (done)
                    callback (array);
            };
        }

        /**
         * @summary Creates a single array buffer with the data for a multipart/related document insert.
         *
         * @description To force the AJAX request to send binary encoded data,
         * the data parameter must be an ArrayBuffer, File, or Blob object.
         * This function creates that data from one or more source objects.
         * An attachments entry will be created and inserted into the document.
         * The contents of the files is concatenated as unaltered binary data.
         * Because the order of the attachment entries in the doc object
         * (as serialized by JSON.stringify) cannot be guaranteed, the
         * process is done in string form.
         *
         * @function pack
         * @memberOf module:multipart
         * @param {Blob[]} files - an array of file or blob objects to be included
         * @param {object} doc - the couchdb document to which the attachments are added
         * @param {string} boundary - the boundary sentinel to use between content and files
         * @param {function} callback - the function to call back with the packed multipart mime object
         * @returns a deferred object whose single parameter is an {ArrayBuffer} containing the data from the files as a suitable object for the contents of the HTTP request
         */
        function pack (files, doc, boundary, callback)
        {
            var serialized;
            var attachments;
            var index;
            var prefix;
            var spacer;
            var suffix;
            var size;
            var array;
            var view;
            var doneset;
            var readers;

            delete (doc._attachments); // remove any existing attachments
            if (0 != files.length)
            {
                serialized = JSON.stringify (doc, null, "    ");
                attachments = "";
                for (var i = 0; i < files.length; i++)
                {
                    if (0 != i)
                        attachments += ",\n";
                    attachments +=
                        "        \"" + files[i].name + "\":\n" +
                        "        {\n" +
                        "            \"follows\": true,\n" +
                        ((files[i].type && ("" != files[i].type)) ? ("            \"content_type\": \"" + files[i].type + "\",\n") : "") +
                        "            \"length\": " + files[i].size + "\n" +
                        "        }";
                }
                attachments += "\n";
                attachments = encode_utf8 (attachments);
                index = serialized.lastIndexOf ("}") - 1; // -1 to also trim off the newline
                serialized = serialized.substring (0, index) + ",\n    \"_attachments\":\n    {\n" + attachments + "\n    }\n}";

                prefix = CRLF +
                    HYPH + boundary + CRLF +
                    CONT + CRLF + CRLF +
                    serialized + CRLF + CRLF +
                    HYPH + boundary + CRLF + CRLF;
                spacer = CRLF +
                    HYPH + boundary +
                    CRLF + CRLF;
                suffix = CRLF +
                    HYPH + boundary + HYPH +
                    CRLF + CRLF + CRLF;

                // compute the array buffer size
                size = prefix.length;
                for (var i = 0; i < files.length; i++)
                    size += files[i].size;
                size += (files.length - 1) * spacer.length;
                size += suffix.length;

                array = new ArrayBuffer (size);
                view = new Uint8Array (array);

                for (var i = 0; i < prefix.length; i++)
                    view[i] = (0xff & prefix.charCodeAt (i));
                index = prefix.length;

                // make an array of status flags
                doneset = [];
                for (var i = 0; i < files.length; i++)
                    doneset.push (false);

                var readers = [];
                for (var i = 0; i < files.length; i++)
                {   // here we add the file bytes with spacers between files
                    var reader = new FileReader ();
                    reader.onloadend = makeLoadEndFunction (view, index, doneset, i, callback, array);
                    readers.push (reader);
                    index += files[i].size;
                    for (var j = 0; j < spacer.length; j++)
                        view[index++] = (0xff & spacer.charCodeAt (j));
                }
                for (var i = 0; i < suffix.length; i++)
                    view[size - suffix.length + i] = (0xff & suffix.charCodeAt (i));

                // kick it off
                for (var i = 0; i < files.length; i++)
                    readers[i].readAsArrayBuffer (files[i]);
            }
        };

        /**
         * @summary Extracts multiple file objects.
         *
         * @function unpack
         * @memberOf module:multipart
         * @param {HTTPresponse} resp - received value from the server
         * @returns {ArrayBuffer[]} an array of byte buffers extracted from the response
         */
        function unpack (resp)
        {
            var ret = [new ArrayBuffer ()];

            return (ret);
        };

        var functions =
        {
            "pack": pack,
            "unpack": unpack
        };

        return (functions);
    }();

    /**
     * @summary Support for reading and writing things and their attachments.
     * @name records
     * @exports records
     * @version 1.0
     */
    records = function ()
    {
        /**
         * @private
         */
        function encodeDocId (docID)
        {
            var parts = docID.split ("/");
            if (parts[0] == "_design")
            {
                parts.shift ();
                return "_design/" + encodeURIComponent (parts.join ('/'));
            }
            return (encodeURIComponent (docID));
        }

        /**
         * @private
         */
        function fullCommit (options)
        {
            var options = options ||
            {};
            if (typeof (options.ensure_full_commit) !== "undefined")
            {
                var commit = options.ensure_full_commit;
                delete options.ensure_full_commit;
                return function (xhr)
                {
                    xhr.setRequestHeader ('Accept', 'application/json');
                    xhr.setRequestHeader ("X-Couch-Full-Commit", commit.toString ());
                };
            }
        };

        /**
         * @private
         */
        // Convert a options object to an url query string.
        // ex: {key:'value',key2:'value2'} becomes '?key="value"&key2="value2"'
        function encodeOptions (options)
        {
            var buf = [];
            if (typeof (options) === "object" && options !== null)
                for ( var name in options)
                    if (-1 == ([ "error", "success", "beforeSuccess", "ajaxStart" ]).indexOf (name))
                    {
                        var value = options[name];
                        if (0 <= ([ "key", "startkey", "endkey" ]).indexOf (name))
                            value = toJSON (value);
                        buf.push (encodeURIComponent (name) + "=" + encodeURIComponent (value));
                    }
            return (buf.length ? "?" + buf.join ("&") : "");
        };

        // see http://jchris.ic.ht/drl/_design/sofa/_list/post/post-page?startkey=[%22Versioning-docs-in-CouchDB%22]
        rawDocs =
        {};

        function maybeApplyVersion (doc)
        {
            if (doc._id && doc._rev && rawDocs[doc._id] && rawDocs[doc._id].rev == doc._rev)
            {
                // ToDo: can we use commonjs require here?
                if (typeof Base64 == "undefined")
                {
                    throw 'Base64 support not found.';
                }
                else
                {
                    doc._attachments = doc._attachments ||
                    {};
                    doc._attachments["rev-" + doc._rev.split ("-")[0]] =
                    {
                        content_type : "application/json",
                        data : Base64.encode (rawDocs[doc._id].raw)
                    };
                    return true;
                }
            }
        };

        /**
         * Create a new document in the specified database, using the supplied
         * JSON document structure. If the JSON structure includes the _id
         * field, then the document will be created with the specified document
         * ID. If the _id field is not specified, a new unique ID will be
         * generated.
         * @param {String} db - the database to save the document in
         * @param {String} doc - the document to save
         * @param {ajaxSettings} options - <a href="http://api.jquery.com/jQuery.ajax/#jQuery-ajax-settings">jQuery ajax settings</a>
         * @param {Blob[]} files - the list of files to attach to the document
         * @param {callback} fn - not used yet
         * @returns nothing
         * @memberOf module:records
         */
        function saveDocWithAttachments (db, doc, options, files, fn)
        {
            options = options || {};
            var beforeSend = fullCommit (options);
            if (doc._id === undefined)
            {
                var method = "POST";
                var uri = "/" + db + "/";
            }
            else
            {
                var method = "PUT";
                var uri = "/" + db + "/" + encodeDocId (doc._id);
                delete (doc._id);
            }
            if (options.CORS)
                uri = options.CORS + uri;
            var versioned = maybeApplyVersion (doc);
            function decodeUtf8 (arrayBuffer)
            {
                var result = "";
                var i = 0;
                var c = 0;
                var c1 = 0;
                var c2 = 0;
                var c3 = 0;

                var data = new Uint8Array (arrayBuffer);

                // If we have a BOM skip it
                if (data.length >= 3 && data[0] === 0xef && data[1] === 0xbb && data[2] === 0xbf)
                    i = 3;

                while (i < data.length)
                {
                    c = data[i];

                    if (c < 128)
                    {
                        result += String.fromCharCode (c);
                        i++;
                    }
                    else if (c > 191 && c < 224)
                    {
                        if (i + 1 >= data.length)
                            throw "UTF-8 Decode failed. Two byte character was truncated.";
                        c2 = data[i + 1];
                        result += String.fromCharCode (((c & 31) << 6) | (c2 & 63));
                        i += 2;
                    }
                    else
                    {
                        if (i + 2 >= data.length)
                            throw "UTF-8 Decode failed. Multi byte character was truncated.";
                        c2 = data[i + 1];
                        c3 = data[i + 2];
                        result += String.fromCharCode (((c & 15) << 12) | ((c2 & 63) << 6) | (c3 & 63));
                        i += 3;
                    }
                }
                return result;
            };

            multipart.pack (files, doc, "abc123",
                function (ab)
                {
                    var xmlhttp;
                    if (options.CORS)
                    {
                        delete options.CORS;
                        var use_put = options.USE_PUT;
                        delete options.USE_PUT;
                        xmlhttp = createCORSRequest ((use_put ? 'PUT' : 'POST'), uri + encodeOptions (options));
                    }
                    else
                    {
                        xmlhttp = new XMLHttpRequest ();
                        xmlhttp.open (method, uri + encodeOptions (options), false);
                    }
                    xmlhttp.setRequestHeader ("Content-Type", "multipart/related;boundary=\"abc123\"");
                    xmlhttp.setRequestHeader ("Accept", "application/json");
                    // beforeSend ?
                    xmlhttp.onreadystatechange = function ()
                    {
                        if (4 == xmlhttp.readyState)
                            if (200 == xmlhttp.status || 201 == xmlhttp.status || 202 == xmlhttp.status)
                            {
                                var resp = JSON.parse (xmlhttp.responseText);
                                doc._id = resp.id;
                                doc._rev = resp.rev;
                                if (options.success)
                                    options.success (resp);
                            }
                            else if (options.error)
                            {
                                var msg;
                                var reason;
                                var resp = JSON.parse (xmlhttp.responseText);
                                if (null == resp)
                                {
                                    msg = xmlhttp.responseText;
                                    reason = "unknown reason, status = " + req.status;
                                }
                                else
                                {
                                    msg = resp.error;
                                    reason = resp.reason;
                                }
                                options.error (xmlhttp.status, msg, reason);
                            }
                    }
                    xmlhttp.send (ab);
                });
        };

        var functions =
        {
            "saveDocWithAttachments" : saveDocWithAttachments,
        };

        return (functions);

    }();

// end of modules from things

 // Change string to be a valid filename without needing quotes.
 // Avoid using the following characters from appearing in file names:
 //
//     /
//     >
//     <
//     |
//     :
//     &
 //
 // Linux and UNIX allows white spaces, <, >, |, \, :, (, ), &, ;, as well as
 // wildcards such as ? and *, to be quoted or escaped using \ symbol.
 //
 function make_file_name (string)
 {
     var ret;

     // replace whitespace with underscore
     ret = string.replace (/\s/g, "_");
     // encode special characters
     ret = ret.replace (/\%/g, "%25"); // also convert % so decodeURIComponent should work
     ret = ret.replace (/\//g, "%2f");
     ret = ret.replace (/\>/g, "%3e");
     ret = ret.replace (/\</g, "%3c");
     ret = ret.replace (/\|/g, "%7c");
     ret = ret.replace (/\:/g, "%3a");
     ret = ret.replace (/\&/g, "%26");
     ret = ret.replace (/\\/g, "%5c");
     ret = ret.replace (/\(/g, "%28");
     ret = ret.replace (/\)/g, "%29");
     ret = ret.replace (/\;/g, "%3b");
     ret = ret.replace (/\?/g, "%3f");
     ret = ret.replace (/\*/g, "%2a");

     return (ret);
 }


/**
 * End of HTTP file fetch function generator.
 * @param files array of objects with name and URL which is to hold the results
 * @param index the integer index into the array at which to store the returned data
 * @param callback the function to call when all files are finished loading - called with files as argument
 */
function fileFinishedFunction (files, index, callback)
{
    return function (event)
    {
        var done;

        if (4 == event.target.readyState) // DONE
            files[index].data = event.target.response;
        // check if all files are downloaded
        done = true;
        for (var i = 0; done && (i < files.length); i++)
            if (!files[i].data)
                done = false;
        if (done)
            callback (files);
    };
}

function downloadAllFiles (files, callback)
{
    for (var i = 0; i < files.length; i++)
    {
        var xmlHttp = new XMLHttpRequest ();
        xmlHttp.open ('GET', files[i].url, true);
        xmlHttp.responseType = "blob";
        xmlHttp.onreadystatechange = fileFinishedFunction (files, i, callback);
        xmlHttp.send ();
    }
}

function createCORSRequest (method, url)
{
    var ret;

    ret = new XMLHttpRequest ();
    if ('withCredentials' in ret) // "withCredentials" only exists on XMLHTTPRequest2 objects
        ret.open (method, url, true);
    else if (typeof XDomainRequest != 'undefined') // IE
    {
        ret = new XDomainRequest ();
        ret.open (method, url);
    }
    else
        ret = null; // CORS is not supported by the browser

    return (ret);
}

function get_title ()
{
    return (document.getElementsByClassName ("thing-header-data")[0].getElementsByTagName ("h1")[0].innerHTML);
}

function downloadAllImages (images, done_fn)
{
    var count = images.length;
    var blobs = [];
    for (var i = 0; i < images.length; i++)
    {
        var xmlhttp = createCORSRequest ("GET", images[i]);
        if (xmlhttp)
        {
            xmlhttp.setRequestHeader ("Accept", "*/*");
            xmlhttp.responseType = "blob";
            xmlhttp.onreadystatechange = function (index)
            {
                return (function (event)
                {
                    if (4 == event.target.readyState)
                    {
                        blobs[index] = event.target.response;
                        count--;
                        if (0 == count)
                            done_fn (blobs);
                    }
                });
            }(i);
            xmlhttp.send ();
        }
    }
}

function convertImagesToDataURLs (blobs, width, height, fn)
{
    var img;
    var canvas;
    var context;
    var ret;

    var urls = [];
    var count = blobs.length;
    for (var i = 0; i < blobs.length; i++)
    {
        img = document.createElement ("img");
        img.id = "image_workspace_" + i;
        img.style.display = "none";
        document.body.appendChild (img);
        img.onload = function (index, img_element)
        {
            return (function (image)
            {
                if (!image)
                    image = this;
                canvas = document.createElement ("canvas");
                canvas.id = "canvas_workspace_" + i;
                canvas.style.display = "none";
                document.body.appendChild (canvas);
                canvas.width = img_element.width;
                canvas.height = img_element.height;
                context = canvas.getContext ("2d");
                context.drawImage (img_element, 0, 0);
                urls[index] = canvas.toDataURL ();
                document.body.removeChild (canvas);
                window.URL.revokeObjectURL (img_element.src);
                document.body.removeChild (img_element);
                count--;
                if (0 == count)
                    fn (urls);
            });
        }(i, img);
        img.src = window.URL.createObjectURL (blobs[i]);
    }
}

function thing ()
{
    var title = get_title ();

    var author = document.getElementsByClassName ("thing-header-data")[0].getElementsByTagName ("h2")[0].getElementsByTagName ("a")[0].innerHTML

    var license = document.getElementsByClassName ("thing-license")[0].getAttribute ("title");

    var tags = [];
    var tagdiv = document.getElementsByClassName ("tags")[0];
    var as = tagdiv.getElementsByTagName ("a");
    for (var i = 0; i < as.length; i++)
        tags.push (as[i].innerHTML);

    var images = [];
    var thumbs = document.getElementsByClassName ("thing-gallery-thumb");
    for (var i = 0; i < thumbs.length; i++)
        images.push (thumbs[i].getAttribute ("data-large-url"));

    var description = document.getElementById ("description").getElementsByTagName ("p")[0].innerHTML;

    return (
    {
        "Title" : title,
        "URL" : document.URL,
        "Authors" : [ author ],
        "Licenses" : [ license ],
        "Tags" : tags,
        "Thumbnail URL" : images,
        "Description" : description
    });
}

function capture ()
{
    var title = get_title ();
    var files = [];
    var links = document.getElementsByClassName ("thing-file-download-link");
    for (var i = 0; i < links.length; i++)
        files.push (
        {
            name : links[i].getAttribute ("data-file-name"),
            url : links[i].getAttribute ("href")
        });
    console.log (title + ' ' + JSON.stringify (files, null, 4));

    downloadAllFiles (files, function (files)
    {
        console.log ("files downloaded: " + files.length);

        var thing_metadata = thing ();
        var uploadfiles = [];
        files.forEach (
            function (file)
            {
                uploadfiles.push (new File ([ file.data ], file.name));
            });

        var blobs = [];
        downloadAllImages (thing_metadata["Thumbnail URL"], function (blobs)
        {
            console.log ("images downloaded: " + blobs.length);

            convertImagesToDataURLs (blobs, 512, 512, function (urls)
            {
                console.log ("images converted: " + urls.length);

                thing_metadata["Thumbnails"] = urls;
                var directory = make_file_name (get_title ());
                torrent.MakeTorrent (uploadfiles, 16384, directory, null, function (tor)
                {
                    // set the time to match the upload date
                    var header = document.getElementsByClassName ("thing-header-data")[0];
                    var subhead = header.getElementsByTagName ("h2")[0];
                    var time = subhead.getElementsByTagName ("time")[0];
                    var date = time.getAttribute ("datetime");
                    date = date.replace (" GMT", "Z").replace (" ", "T");

                    tor["creation date"] = new Date (date).valueOf ();
                    tor["info"]["thing"] = thing_metadata;
                    tor["_id"] = torrent.InfoHash (tor["info"]); // setting _id triggers the PUT method instead of POST

                    var options =
                    {
                        success: function () { alert ("thing imported"); },
                        error: function () { alert ("thing import failed"); },
                        CORS: 'http://localhost:5984',
                        USE_PUT: true
                    }
                    records.saveDocWithAttachments ("pending_things", tor, options, uploadfiles);
                });
            });
        });
    });
}

function ping ()
{
    var xmlhttp;
    var payload;

    xmlhttp = createCORSRequest ('GET', 'http://localhost:5984/pending_things/ping');
    xmlhttp.setRequestHeader ("Accept", "application/json");
    xmlhttp.onreadystatechange = function ()
    {
        if (4 == xmlhttp.readyState)
        {
            payload = { _id: "ping", time: (new Date ()).valueOf ()};
            if (200 == xmlhttp.status || 201 == xmlhttp.status || 202 == xmlhttp.status)
            {
                var resp = JSON.parse (xmlhttp.responseText);
                payload._rev = resp._rev;
            }
            xmlhttp = createCORSRequest ('PUT', 'http://localhost:5984/pending_things/ping');
            xmlhttp.setRequestHeader ("Accept", "application/json");
            xmlhttp.onreadystatechange = function ()
            {
                if (4 == xmlhttp.readyState)
                {
                    var button = document.getElementById ("import_thing_button");
                    var pinged = (200 == xmlhttp.status || 201 == xmlhttp.status || 202 == xmlhttp.status);
                    button.disabled = !pinged;
                }
            }
            xmlhttp.send (JSON.stringify (payload, null, 4));
        }
    }
    xmlhttp.send ();
}

(function initialize ()
{
    if (!document.getElementsByClassName ("thingiverse_test")[0])
    {
        var trigger1 = "http://www.thingiverse.com/thing:";
        var trigger2 = "https://www.thingiverse.com/thing:";
        if ((document.URL.substring (0, trigger1.length) == trigger1) || (document.URL.substring (0, trigger2.length) == trigger2))
        {
            console.log ("initializing thingiverse_import")
            var ff = document.createElement ("div");
            ff.setAttribute ("style", "position: relative;");
            var template = "<div style='position: absolute; top: 100px; left: 20px;'>" +
            "<button id='import_thing_button' type='button' class='btn btn-lg btn-primary' disabled>Import to things</button>" +
            "</div>";
            ff.innerHTML = template;
            var body = document.getElementsByTagName ("body")[0];
            body.appendChild (ff);
            var button = document.getElementById ("import_thing_button");
            button.addEventListener ("click", capture);
            ping ();
        }
    }
})();
