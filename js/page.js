/**
 * @fileOverview Application layout
 * @name page
 * @author Derrick Oswald
 * @version 1.0
 */
define
(
    ["mustache"],
    /**
     * @summary Single page application layout component.
     * @description ... will eventually be used for back button history,
     * working with pushState() and onpopstate handler with context save and restore
     * @name page
     * @exports page
     * @version 1.0
     */
    function (mustache)
    {
// ToDo: media query based layout
//            // see http://www.sitepoint.com/javascript-media-queries/
//            // http://getbootstrap.com/css/#grid-media-queries
//            // http://stackoverflow.com/questions/18424798/twitter-bootstrap-3-how-to-use-media-queries
//            var mq;
//
//            mq = window.matchMedia ("(min-width: 1000px)");
//            if (mq.matches)
//                // window width is at least 1000px
//            else
//            {
//                // window width is less than 1000px
//            }

        /**
         * @summary Return the standard layout for the main page.
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
                    "<div class='col-sm-6 col-md-3' id='left'>" +
                    "</div>" +
                    "<div class='col-sm-6 col-md-3 col-md-push-6' id='right'>" +
                    "</div>" +
                    "<div class='col-md-6 col-md-pull-3 tab-content' id='content'>" +
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
