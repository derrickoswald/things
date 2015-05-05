define
(
    ["mustache"],
    function (mustache)
    {
        function Chooser (target_list, label, placeholder)
        {
            /**
             * DOM element name for entire input set.
             * The DIV with this id is filled with the chooser from the template.
             */
            this.list_name = target_list;

            /**
             * Label for this input group.
             * I18N
             */
            this.input_label = label;

            /**
             * Placeholder text for each input element.
             * I18N
             */
            this.prompt = placeholder;

            /**
             * List of user entered data.
             * Each element is an object with two properties:
             * index - number - index used to differentiate input groups in the DOM
             * value - string - user enetered or chosen (via drop down) text
             * e.g.
             * { index: 1, value: "item 1"}
             * If an item's value is the empty string the placeholder text is displayed.
             */
            this.items = [];

            /**
             * List of predefined values made available in the drop-down list.
             * Each entry is a string.
             */
            this.values = [];

            /**
             * DOM element attribute name that stores the index value of the DOM set.
             */
            this.data_source = "data_source";

            /**
             * DOM element attribute name that stores the id of the input element.
             */
            this.data_target = "data_target";

            /**
             * Unique id pattern for this input set.
             * This is suffixed with the index value to create a unique element id.
             */
            this.id_pattern = "input_";

            var l = this.input_label;
            this.label = function ()
            {
                return (("1" == this.index) ? l : "");
            }

            this.buttonclass = function ()
            {
                return (("1" == this.index) ? "add_item" : "remove_item");
            }

            this.glyph = function ()
            {
                return (("1" == this.index) ? "glyphicon-plus" : "glyphicon-minus");
            }

            this.template =
                 "{{#items}}" +
                    "<label for='" + this.id_pattern + "{{index}}' " + this.data_source + "='{{index}}' class='col-sm-3 control-label'>" +
                        "{{label}}" +
                    "</label>" +
                    "<div class='col-sm-9' " + this.data_source + "='{{index}}'>" +
                        "<div class='input-group'>" +
                            "{{#values}}" +
                                "<span class='dropdown'>" +
                                    "<input id='" + this.id_pattern + "{{index}}' type='text' class='form-control dropdown-toggle' " + this.data_source + "='{{index}}' data-toggle='dropdown' placeholder='" + this.prompt + "' aria-label='" + this.input_label + "' value='{{value}}'>" +
                                    "<ul class='dropdown-menu pull-right' role='menu' aria-labelledby='" + this.id_pattern + "{{index}}' >" +
                                        "{{#values}}" +
                                        "<li role='presentation'>" +
                                            "<a " + this.data_source + "='" + this.id_pattern + "{{index}}' role='menuitem' tabindex='-1' href='#'>{{.}}</a>" +
                                        "</li>" +
                                        "{{/values}}" +
                                    "</ul>" +
                                "</span>" +
                            "{{/values}}" +
                            "{{^values}}" +
                                "<input id='" + this.id_pattern + "{{index}}' type='text' class='form-control' " + this.data_source + "='{{index}}' placeholder='" + this.prompt + "' aria-label='" + this.input_label + "' value='{{value}}'>" +
                            "{{/values}}" +
                            "<span class='input-group-addon btn btn-default {{buttonclass}}' " + this.data_source + "='{{index}}'>" +
                                "<i class='glyphicon {{glyph}}'></i>" +
                            "</span>" +
                        "</div>" +
                    "</div>" +
                "{{/items}}";

            this.context =
            {
                items: this.items, // list of user entered values
                values: [], // list of pre-composed values for the drop-down list
                label: this.label,
                buttonclass: this.buttonclass,
                glyph: this.glyph
            };
        }

        /**
         * Event handler for user entering a value by key entry.
         */
        Chooser.prototype.changed = function (context, event)
        {
            var index;

            index = event.target.getAttribute (this.data_source);
            context.items.forEach
            (
                function (item)
                {
                    if (index == item.index)
                        item.value = event.target.value;
                }
            );
        }

        /**
         * Event handler for drop-down list item selected.
         */
        Chooser.prototype.clicked = function (context, event)
        {
            var link;
            var target;
            var index;

            link = event.target;

            // fill in the input field with the chosen drop-down list item
            target = document.getElementById (link.getAttribute (data_target));
            target.value = link.innerHTML;

            // update the value list
            index = target.getAttribute (data_source);
            context.items.forEach
            (
                function (item)
                {
                    if (index == item.index)
                        item.value = target.value;
                }
            );
        }

        /**
         * Event handler for clicking the plus icon.
         */
        Chooser.prototype.add = function (context, event)
        {
            var index;

            // find next index
            index = 0;
            context.items.forEach
            (
                function (item)
                {
                    if (item.index > index)
                        index = item.index;
                }
            );

            // add the next input element
            context.items.push ({ index: index + 1, value: "" });

            this.render (context);
        }

        Chooser.prototype.remove = function (context, event)
        {
            var index;
            var list;

            // get the index
            index = event.target.getAttribute (this.data_source);
            if (null == index)
                index = event.target.parentElement.getAttribute (this.data_source);

            // remove it from the list
            list = [];
            context.items.forEach
            (
                function (item)
                {
                    if (index != item.index)
                        list.push (item);
                }
                );
                context.items = list;

                this.render (context);
            }

        Chooser.prototype.render = function (context)
        {
            var list;
            var inputs;
            var items;
            var spans;
            var change;
            var click;
            var added;
            var removed;

            // ensure there is at least one item to render
            if (0 == this.context.items.length)
                this.context.items.push ({ index: 1, value: "" });

            // re-render and inject the new elements into the DOM
            list = document.getElementById (this.list_name);
            list.innerHTML = mustache.render (this.template, this.context);

            // handle edit events
            change = this.changed.bind (this, context);
            inputs = list.getElementsByTagName ("input");
            for (var i = 0; i < inputs.length; i++)
                inputs[i].addEventListener ("change", change);

            // handle drop down chosen events
            click = this.clicked.bind (this, context);
            items = list.getElementsByTagName ("a");
            for (var i = 0; i < items.length; i++)
                items[i].addEventListener ("click", click);

            // handle add and remove events on the input group addon button
            added = this.add.bind (this, context);
            removed = this.remove.bind (this, context);
            spans = list.getElementsByTagName ("span");
            for (var i = 0; i < spans.length; i++)
                if (spans[i].classList.contains ("input-group-addon"))
                    spans[i].addEventListener ("click", (1 == Number (spans[i].getAttribute (this.data_source))) ? added : removed);
        }

        return ({Chooser: Chooser });
    }
)
