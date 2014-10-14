/**
 * @fileOverview Bencode on the client side
 * @name bencoder
 * @author Derrick Oswald
 * @version: 1.0
 * 
 * Google search on "bencode" "javascript" yields:
 * https://github.com/themasch/node-bencode/blob/master/bencode.js
 * https://github.com/clarkf/node-bencoding/blob/master/lib/bencoding.js
 * https://github.com/deoxxa/bencode-stream/blob/master/lib/decoder.js
 * https://github.com/Sebmaster/node-libbencode/blob/master/lib/bencode.js
 * https://github.com/benjreinhart/bencode-js/blob/master/src/bencode.js
 * http://demon.tw/my-work/javascript-bencode.html
 * http://svn.mg2.org/projects/pco/browser/trunk/net/cjdns-mikey/admin/http/text/javascript/bencode.js?rev=8
 * https://code.google.com/p/jsxt/source/browse/trunk/js/Bencode.js?spec=svn491&r=491
 * 
 * All of the above either depend on the node.js Buffer class so they aren't applicable
 * to client side use (maybe lobrow could be used) or have done string
 * encoding wrong in various ways (I think).
 * None of them uses the HTML5 ArrayBuffer so they appear to be old.
 * Here then is an implementation using current HTML5 capabilities.
 */
define
(
    /**
     * @summary Functions for encoding and decoding bencoded data.
     * @name bencoder
     * @exports bencoder
     * @version 1.0
     */
    function ()
    {
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
         * @param {Array|String|ArrayBuffer|Object|Number} data he plain javascript object to encode as bencode
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
    "decode": decode,
    "encode": encode,
    "HexConverter": HexConverter
});
});
