// ==UserScript==
// @name        thingiverse_import
// @namespace   thingiverse_import
// @description Import thing from thingiverse
// @include     http://www.thingiverse.com/*
// @version     1
// @grant       none
// ==/UserScript==

// a little help in deciphering the code...
// code that follows immediatey is imported modules from things https://github.com/derrickoswald/things
// at the bottom, starting with createCORSRequest, is the actual GreaseMonkey script.


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

// end of modules from things

function createCORSRequest(method, url)
{
  var ret;
  ret = new XMLHttpRequest();
  if ('withCredentials' in ret) // "withCredentials" only exists on XMLHTTPRequest2 objects
      ret.open(method, url, true);
  else 
      if (typeof XDomainRequest != 'undefined')
      {
          // IE
          ret = new XDomainRequest();
          ret.open(method, url);
      } 
    else
        // Otherwise, CORS is not supported by the browser.
        ret = null;
  return (ret);
}

function thing ()
{
    var tags = [];
    $(".tags a").each (function (index, tag) { tags.push (tag.innerHTML); });
    var images = [];
    $(".thing-gallery-thumb").each (function (index, image) { images.push (image.getAttribute ("data-large-url")); } );
    return (
    {
        "Title": $('.thing-header-data h1')[0].innerHTML,
        "URL": document.URL,
        "Authors": [$('.thing-header-data h2 a')[0].innerHTML],
        "Licenses": [$('.thing-license')[0].getAttribute ("title")],
        "Tags": tags,
        "Thumbnail URL": images,
        "Description": $('#description')[0].innerHTML
    });
}

function capture()
{
  var title = $('.thing-header-data h1') [0].innerHTML;
  var files = [];
  $(".thing-file-download-link").each (function (index, a) { files.push ( { name: a.getAttribute ("data-file-name"), url: a.getAttribute ("href") } ); });
  console.log(title + ' ' + JSON.stringify(files, null, 4));

  var blob = new Blob (["hello world"]);
  var files = [new File ([blob], "test.txt", { type: "text/html", lastModifiedDate: new Date () })];

  torrent.MakeTorrent (files, 16384, "directory", null, 
    function (tor)
    {
      // set the time to match the upload date
      var date = $('.thing-header-data h2 time') [0].getAttribute ("datetime");
      date = date.replace(" GMT", "Z").replace(" ", "T");

      tor["creation date"] = new Date (date).valueOf ();
      tor["info"]["thing"] = thing ();

      var xhr = createCORSRequest('POST', 'http://localhost:5984/pending_things');
      if (xhr)
      {
        xhr.onload = function ()
        {
          var responseText = xhr.responseText;
          console.log(responseText);
        };
        xhr.onerror = function ()
        {
          console.log('There was an error!');
        };
        xhr.setRequestHeader('Content-type', 'application/json');
        xhr.send(JSON.stringify(tor, null, 4));
      }
    });
}

if (!$('.thingiverse_test') [0]) // only run once
{
  var trigger = 'http://www.thingiverse.com/thing:';
  if (document.URL.substring(0, trigger.length) == trigger)
  {
    console.log('initializing thingiverse_test')
    var ff = document.createElement('div');
    ff.setAttribute('style', 'position: relative;');
    $(ff).addClass('thingiverse_test');
    var template = '<button id=\'import_thing\' type=\'button class=\'btn btn-default\' style=\'position: absolute; top: 100px; left: 20px;\'>Import to things</button>';
    ff.innerHTML = template;
    $('body').append(ff);
    $('#import_thing').on('click', capture)
  }
}


