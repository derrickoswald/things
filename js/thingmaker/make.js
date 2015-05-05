define
(
    ["mustache", "../torrent", "../records", "../login", "../chooser"],
    function (mustache, torrent, records, login, chooser)
    {
        var form_initialized_with = null;

        var author_chooser = null;

        var tag_chooser = null;

        /**
         * Inner template for each license input field added on the form.
         * Initially there are none, but in the init() function the first empty one is added.
         */
        var license_template =
            "{{#licenses}}" +
                "<label for='license-list-{{index}}' data-license='{{index}}' class='col-sm-3 control-label'>" +
                    "{{label}}" +
                "</label>" +
                "<div class='col-sm-9' data-license='{{index}}'>" +
                    "<div class='input-group'>" +
                        "<span class='dropdown'>" +
                            "<input id='license-list-{{index}}' type='text' class='form-control dropdown-toggle' data-license='{{index}}' data-toggle='dropdown' placeholder='License name' aria-label='tracker' value='{{license}}'>" +
                            "<ul class='dropdown-menu pull-right' role='menu' aria-labelledby='license-list-{{index}}' >" +
                                "{{#license_list}}" +
                                "<li role='presentation'>" +
                                    "<a class='license' data-target='license-list-{{index}}' role='menuitem' tabindex='-1' href='#'>{{.}}</a>" +
                                "</li>" +
                                "{{/license_list}}" +
                            "</ul>" +
                        "</span>" +
                        "<span class='input-group-addon btn btn-default {{buttonclass}}' data-license='{{index}}'>" +
                            "<i class='glyphicon {{glyph}}'></i>" +
                        "</span>" +
                    "</div>" +
                "</div>" +
            "{{/licenses}}";

        function label ()
        {
            return (("1" == this.index) ? "Licenses" : "");
        }

        function buttonclass ()
        {
            return (("1" == this.index) ? "add_license" : "remove_license");
        }

        function glyph ()
        {
            return (("1" == this.index) ? "glyphicon-plus" : "glyphicon-minus");
        }

        var license_list =
        [
            "Creative Commons Attribution 4.0 International License",
            "Open Hardware Initiative 2.0"
        ];

        // show the contents of the encoded Thing as a link in the content area
        function showlink (torrent)
        {
            // show the torrent contents
            var a = document.createElement ("a");
            a.setAttribute ("href", "data:application/octet-stream;base64," + btoa (torrent));
            a.setAttribute ("download", "test.torrent");
            var text = document.createTextNode ("Torrent File");
            a.appendChild (text);
            var content = document.getElementById ('torrent_link');
            while (content.firstChild)
                content.removeChild (content.firstChild);
            content.appendChild (a);
        }

        function make (event, data)
        {
            event.preventDefault ();
            torrent.MakeTorrent (data.files, data.piece_length, data.directory, null, // no template yet
                function (tor)
                {
                    var thing = {};
                    tor["info"]["thing"] = thing;
                    var form = document.getElementById ("thing_form");
                    if (null != form)
                    {
                        for (var i = 0; i < form.elements.length; i++)
                        {
                            var child = form.elements[i];
                            var id = child.getAttribute ("id");
                            if (null != id)
                            {
                                if ("licenses" == id)
                                {
                                    var licenses = [];
                                    data.context.licenses.forEach (function (item) { if ("" != item.license) licenses.push (item.license); });
                                    thing[id] = licenses;
                                }
                                else
                                {
                                    var value = child.value;
                                    if ((null != value) && ("" != value))
                                    {
                                        thing[id] = value;
                                        // kludge here to handle the lists
                                        if (("authors" == id) || ("tags" == id))
                                            thing[id] = value.split (',');
                                    }
                                }
                            }
                        }
                    }

                    var info = tor["info"];
                    var primary_key = torrent.InfoHash (info);
                    tor["_id"] = primary_key;
                    data.torrent = tor;
                    form_initialized_with = null;

                    showlink (torrent.Encode (tor));
                }
            );
        };

        function license_changed (event, data)
        {
            var index;

            // update the license list
            index = event.target.getAttribute ("data-license");
            data.context.licenses.forEach (function (item) { if (index == item.index) item.license = event.target.value; });
        }

        function license_clicked (event, data)
        {
            var link;
            var target;
            var index;

            link = event.target;

            // fill in the input field with the chosen license name
            target = document.getElementById (link.getAttribute ("data-target"));
            target.value = link.innerHTML;

            // update the license list
            index = target.getAttribute ("data-license");
            data.context.licenses.forEach (function (item) { if (index == item.index) item.license = target.value; });
        }

        function render_licenses (data)
        {
            var list;
            var change;
            var inputs;
            var click;
            var licenses;
            var add;
            var remove;
            var spans;

            // re-render inject the new elements into the DOM
            list = document.getElementById ("licenses");
            list.innerHTML = mustache.render (license_template, data.context);

            // handle edit events
            change = function (event) { license_changed (event, data); };
            inputs = list.getElementsByTagName ("input");
            for (var i = 0; i < inputs.length; i++)
                inputs[i].addEventListener ("change", change);

            // handle drop down chosen events
            click = function (event) { license_clicked (event, data); };
            licenses = list.getElementsByTagName ("a");
            for (var i = 0; i < licenses.length; i++)
                licenses[i].addEventListener ("click", click);

            // handle add and remove license events on the input group addon button
            add = function (event) { add_license (event, data); }
            remove = function (event) { remove_license (event, data); }
            spans = list.getElementsByTagName ("span");
            for (var i = 0; i < spans.length; i++)
                if (spans[i].classList.contains ("input-group-addon"))
                    spans[i].addEventListener ("click", (1 == Number (spans[i].getAttribute ("data-license"))) ? add : remove);
        }

        function add_license (event, data)
        {
            var index;

            // find next index
            index = 0;
            data.context.licenses.forEach (function (item) { if (item.index > index) index = item.index; });

            // add the next license input element
            data.context.licenses.push ({ index: index + 1, license: "" });

            render_licenses (data);
        }

        function remove_license (event, data)
        {
            var index;
            var list;

            // get the index
            index = event.target.getAttribute ("data-license");
            if (null == index)
                index = event.target.parentElement.getAttribute ("data-license");

            // remove it from the list
            list = [];
            data.context.licenses.forEach (function (item) { if (index != item.index) list.push (item); });
            data.context.licenses = list;

            // delete the DOM elements - could also re-render, but at added cost
            $ ("label[data-license='" + index + "']").remove ();
            $ ("div[data-license='" + index + "']").remove ();
        }

        function init (event, data)
        {
            data.context =
            {
                licenses: [],
                license_list: license_list,
                label: label,
                buttonclass: buttonclass,
                glyph: glyph
            }
            author_chooser = new chooser.Chooser ("authors", "Authors", "Author");
            tag_chooser = new chooser.Chooser ("tags", "Tags", "Tag");
            if (data.torrent && ((null == form_initialized_with) || (form_initialized_with != data.torrent._id)))
            {
                form_initialized_with = data.torrent._id;
                if (data.torrent.info.thing)
                {
                    var thing = data.torrent.info.thing;
                    var form = document.getElementById ("thing_form");
                    if (null != form)
                    {
                        for (var i = 0; i < form.elements.length; i++)
                        {
                            var child = form.elements[i];
                            var id = child.getAttribute ("id");
                            if (null != id)
                                if (null != thing[id])
                                    if ("licenses" == id)
                                        for (var j = 0; j < thing[id].length; j++)
                                            data.context.licenses.push ({ index: j + 1, license: thing[id][j] });
                                    else if ("authors" == id)
                                        for (var j = 0; j < thing[id].length; j++)
                                            author_chooser.context.items.push ({ index: j + 1, value: thing[id][j] });
                                    else if ("tags" == id)
                                        for (var j = 0; j < thing[id].length; j++)
                                            tag_chooser.context.items.push ({ index: j + 1, value: thing[id][j] });
                                    else
                                        child.value = thing[id];
                        }
                    }
                }
            }
            if (0 == data.context.licenses.length)
                data.context.licenses.push ({ index: 1, license: "" });
            render_licenses (data);
            author_chooser.render (author_chooser.context);
            tag_chooser.render (tag_chooser.context);
        }

        return (
            {
                getStep: function ()
                {
                    var make_hooks =
                        [
                            { id: "make_thing_button", event: "click", code: make, obj: this }
                        ];
                    return ({ id: "enter_metadata", title: "Enter metadata", template: "templates/thingmaker/metadata.mst", hooks: make_hooks, transitions: { enter: init, obj: this } });
                }
            }
        );
    }
)
