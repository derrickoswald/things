define
(
    {
        read_records: function (fn)
        {
            if (fn)
                $.couch.db ("things").view
                (
                    "things/OverView",
                    {
                        success: function (data)
                        {
                            var ret;

                            console.log (data);
                            ret = data.rows.map (function (element) { return (element.value); });
                            console.log (ret);
                            fn (ret);
                        },
                        error: function (status)
                        {
                            console.log (status);
                        },
                        reduce: false
                    }
                );

                
//            var url;
//            var xmlhttp;
//            var ret = "";
//
//            url = "/things/_design/things/_view/OverView";
//            xmlhttp = new XMLHttpRequest ();
//            xmlhttp.open ("GET", url, false);
//            xmlhttp.onreadystatechange = function ()
//            {
//                if ((4 == xmlhttp.readyState) && (200 == xmlhttp.status))
//                {
//                    var result = JSON.parse (xmlhttp.responseText);
//                    ret = result.rows.map (function (element) { return (element.value); });
//                }
//            };
//            xmlhttp.send ();
//            
//            return (ret);
        }
    }
);
