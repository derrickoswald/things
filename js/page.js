define
(
    ["mustache"],
    function (mustache)
    {
        /**
         * Return the standard layout for the main page.
         * @return {object} containing { left, middle, right } elements for
         * the left quarter, middle half and right quarter respectively.
         * @function layout
         * @memberOf module:page
         */
        function layout ()
        {
            var target;
            var left;
            var content;
            var right;

            var template =
                "<div id='main_area' class='row'>" +
                    "<div class='col-md-3' id='left'>" +
                    "</div>" +
                    "<div class='col-md-6 tab-content' id='content'>" +
                    "</div>" +
                    "<div class='col-md-3' id='right'>" +
                    "</div>" +
                "</div>";

            target = document.getElementById ("main");
            target.innerHTML = mustache.render (template);

            left = document.getElementById ("left");
            content = document.getElementById ("content");
            right = document.getElementById ("right");

            return ({ left: left, content: content, right: right });
        }

        return (
            {
                layout: layout
            }
        );
    }
);
