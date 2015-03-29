define
(
    ["mustache"],
    function (mustache)
    {
        var template =
            "<ul class='thing_property_list'>" +
                "{{#.}}" +
                    "{{#value}}" +
                        "<li class='thing_list_item'>" +
                            "<div class='container-fluid'>" +
                                "<div class='row'>" +
                                    "<div class='col-xs-12 col-sm-6 col-md-8'>" +
                                        "<h2><a href='{{info.thing.URL}}'>{{info.thing.Title}}</a></h2>" +
                                    "</div>" +
                                    "<div class='col-xs-6 col-md-4'>" +
                                        "<span class='fineprint'>{{_id}}</span>" +
                                        "<input class='select_id pull-right' type='checkbox' data-id='{{_id}}' checked>" +
                                    "</div>" +
                                "</div>" +
                                "<div>" +
                                    "{{info.thing.Description}}" +
                                "</div>" +
                                "<div class='row'>" +
                                    "<div class='col-md-6'>" +
                                        "<h5>Authors</h5>" +
                                        "<ul class='thing_property_list'>" +
                                            "{{#info.thing.Authors}}<li>{{.}}</li>{{/info.thing.Authors}}" +
                                        "</ul>" +
                                    "</div>" +
                                    "<div class='col-md-6'>" +
                                        "<h5>Licenses</h5>" +
                                        "<ul class='thing_property_list'>" +
                                            "{{#info.thing.Licenses}}<li>{{.}}</li>{{/info.thing.Licenses}}" +
                                        "</ul>" +
                                    "</div>" +
                                "</div>" +
                                "<div class='row'>" +
                                    "<div class='col-md-6'>" +
                                        "<h5>Tags</h5>" +
                                        "<ul class='thing_property_list'>" +
                                            "{{#info.thing.Tags}}<li>{{.}}</li>{{/info.thing.Tags}}" +
                                        "</ul>" +
                                    "</div>" +
                                    "<div class='col-md-6'>" +
                                        "<h5>Attachments</h5>" +
                                        "<ul class='thing_property_list'>" +
                                            "{{#filelist}}<li>{{.}}</li>{{/filelist}}" +
                                        "</ul>" +
                                    "</div>" +
                                "</div>" +
                                "<div class='row'>" +
                                    "{{#info.thing.Thumbnails}}" +
                                    "<div class='col-xs-6 col-md-3'>" +
                                        "<a href='#' class='thumbnail'>" +
                                            "<img src='{{.}}'></img>" +
                                        "</a>" +
                                    "</div>" +
                                    "{{/info.thing.Thumbnails}}" +
                                "</div>" +
                            "</div>" +
                        "</li>" +
                    "{{/value}}" +
                "{{/.}}" +
            "</ul>";

        /**
         * @summary Read the database:view and render the data into html_id.
         * @description Uses mustache to display the contents of the database of <em>things</em>.
         * @function render
         * @memberOf module:home
         */
        function build (database, view, html_id)
        {
            $.couch.db (database).view (database + "/" + view,
            {
                success : function (result)
                {
                    result.rows.forEach (function (item)
                    {
                        var list = [];
                        for (var property in item.value._attachments)
                        {
                            if (item.value._attachments.hasOwnProperty (property))
                            {
                                list.push (property);
                            }
                        }
                        item.value.filelist = list;
                    });
                    var text = mustache.render (template, result.rows);
                    document.getElementById (html_id).innerHTML = text;
                },
                error : function (status)
                {
                    console.log (status);
                },
                reduce : false
            });
        };

        /**
         * Return the standard layout for the main page.
         * @return An object containing { left, middle, right } elements for
         * the left quarter, middle half and right quarter respectively.
         * @memberOf module:home
         */
        function layout ()
        {
            var main;
            var left;
            var content;
            var right;

            var template =
                "<div id='main_area' class='row'>" +
                    "<div class='col-md-3' id='left'>" +
                    "</div>" +
                    "<div class='col-md-6 tab-content' id='content'>" +
                       /* div */
                    "</div>" +
                    "<div class='col-md-3' id='right'>" +
                    "</div>" +
                "</div>";

            main = document.getElementById ("main");
            main.innerHTML = mustache.render (template);

            left = document.getElementById ("left");
            content = document.getElementById ("content");
            right = document.getElementById ("right");

            return ({ left: left, content: content, right: right });
        }

        return (
            {
                initialize: function ()
                {
                    var areas = layout ();
                    build ("things", "Things", areas.content.id);
                },
                layout: layout,
                build: build
            }
        );
    }
);
