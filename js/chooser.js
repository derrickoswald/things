/**
 * @fileOverview Multi-text input field component.
 * @name chooser
 * @author Derrick Oswald
 * @version: 1.0
 */
define
(
    ["mustache"],
    function (mustache)
    {
        /**
         * Object that makes a chooser field set.
         * @param {string} target_list DOM element name to contain the input set
         * @param {string} label User visible label for the input set
         * @param {string} placeholder User visible placeholder text in an empty input field
         * @param {array} choices list of user visible items for the drop down menu
         * (if not supplied or empty, the input field is a plain text input with no dropdown)
         */
        function Chooser (target_list, label, placeholder, choices)
        {
            /**
             * Unique DOM element name for entire input set.
             * The DIV with this id is filled with the chooser from the template.
             * This is also used as an id pattern for this input set.
             * This is suffixed with the index value to create unique element ids for input elements.
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
            this.values = choices;

            /**
             * DOM element attribute name that stores the index value of the input group.
             */
            this.data_source = "data_source";

            /**
             * DOM element attribute name that stores the id of the input element.
             */
            this.data_target = "data_target";

            this.glyph = function ()
            {
                return (("1" == this.index) ? "glyphicon-plus" : "glyphicon-minus");
            }

            /**
             * Mustache template to generate the list item DOM elements.
             */
            this.template =
                 "{{#items}}" +
                    "<label class='col-sm-3 control-label chooser-label' for='" + this.list_name + "_{{index}}' " + this.data_source + "='{{index}}'>" +
                        this.input_label +
                    "</label>" +
                    "<div class='col-sm-9' " + this.data_source + "='{{index}}'>" +
                        "<div class='input-group'>" +
                            "{{#hasvalues}}" +
                                "<span class='dropdown'>" +
                                    "<input id='" + this.list_name + "_{{index}}' type='text' class='form-control dropdown-toggle' " + this.data_source + "='{{index}}' data-toggle='dropdown' placeholder='" + this.prompt + "' aria-label='" + this.input_label + "' value='{{value}}'>" +
                                    "<ul class='dropdown-menu pull-right' role='menu' aria-labelledby='" + this.list_name + "_{{index}}' >" +
                                        "{{#values}}" +
                                        "<li role='presentation'>" +
                                            "<a " + this.data_target + "='" + this.list_name + "_{{index}}' role='menuitem' tabindex='-1' href='#'>{{.}}</a>" +
                                        "</li>" +
                                        "{{/values}}" +
                                    "</ul>" +
                                "</span>" +
                            "{{/hasvalues}}" +
                            "{{^values}}" +
                                "<input id='" + this.list_name + "_{{index}}' type='text' class='form-control' " + this.data_source + "='{{index}}' placeholder='" + this.prompt + "' aria-label='" + this.input_label + "' value='{{value}}'>" +
                            "{{/values}}" +
                            "<span class='input-group-addon btn btn-default' " + this.data_source + "='{{index}}'>" +
                                "<i class='glyphicon {{glyph}}'></i>" +
                            "</span>" +
                        "</div>" +
                    "</div>" +
                "{{/items}}";

            /**
             * Context for mustache rendering.
             */
            this.context =
            {
                items: this.items, // list of user entered values
                values: this.values, // list of pre-composed values for the drop-down list
                hasvalues: ("undefined" != typeof (this.values)), // boolean to turn on values processing
                glyph: this.glyph
            };
        }

        /**
         * Event handler for user pressing Enter in an input field.
         * @param {object} event keypress event from the input element
         */
        Chooser.prototype.enter = function (event)
        {
            var keycode = (event.keyCode ? event.keyCode : event.which);
            if (keycode == '13')
            {
                this.changed (event);
                this.add (null);
            }
        }

        /**
         * Event handler for user entering a value by key entry.
         * @param {object} event change event from the input element
         */
        Chooser.prototype.changed = function (event)
        {
            var index;

            index = event.target.getAttribute (this.data_source);
            this.context.items.forEach
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
         * @param {object} event click event from the link list item
         */
        Chooser.prototype.clicked = function (event)
        {
            var link;
            var target;
            var index;

            link = event.target;

            // fill in the input field with the chosen drop-down list item
            target = document.getElementById (link.getAttribute (this.data_target));
            target.value = link.innerHTML;

            // update the value list
            index = target.getAttribute (this.data_source);
            this.context.items.forEach
            (
                function (item)
                {
                    if (index == item.index)
                        item.value = target.value;
                }
            );
        }

        /**
         * Set the focus to the given input item.
         * @param {number} index The index (data_source attribute value) of the item to focus on
         */
        Chooser.prototype.focus = function (index)
        {
            var list;
            var inputs;

            list = document.getElementById (this.list_name);
            inputs = list.getElementsByTagName ("input");
            for (var i = 0; i < inputs.length; i++)
                if (index == Number (inputs[i].getAttribute (this.data_source)))
                    inputs[i].focus ();
        }

        /**
         * Event handler for clicking the plus icon.
         * @param {object} event click event from the input group addon item
         */
        Chooser.prototype.add = function (event)
        {
            var index;

            // find next index
            index = 0;
            this.context.items.forEach
            (
                function (item)
                {
                    if (item.index > index)
                        index = item.index;
                }
            );

            // add the next input element
            this.context.items.push ({ index: index + 1, value: "" });

            // update the DOM
            this.render ();

            // set focus to the new input element
            this.focus (index + 1);
        }

        /**
         * Event handler for clicking the minus icon.
         * @param {object} event click event from the input group addon item
         */
        Chooser.prototype.remove = function (event)
        {
            var index;
            var list;

            // get the index
            index = event.target.getAttribute (this.data_source);
            if (null == index)
                index = event.target.parentElement.getAttribute (this.data_source);

            // remove it from the list
            list = [];
            this.context.items.forEach
            (
                function (item)
                {
                    if (index != item.index)
                        list.push (item);
                }
                );
                this.context.items = list;

                this.render ();
            }

        /**
         * Render the chooser field set.
         */
        Chooser.prototype.render = function ()
        {
            var list;
            var change;
            var pressed;
            var inputs;
            var click;
            var items;
            var added;
            var removed;
            var spans;

            // ensure there is at least one item to render
            if (0 == this.context.items.length)
                this.context.items.push ({ index: 1, value: "" });

            // re-render and inject the new elements into the DOM
            list = document.getElementById (this.list_name);
            list.innerHTML = mustache.render (this.template, this.context);

            // handle edit events
            change = this.changed.bind (this);
            pressed = this.enter.bind (this);
            inputs = list.getElementsByTagName ("input");
            for (var i = 0; i < inputs.length; i++)
            {
                inputs[i].addEventListener ("change", change);
                inputs[i].addEventListener ("keypress", pressed);
            }

            // handle drop down chosen events
            click = this.clicked.bind (this);
            items = list.getElementsByTagName ("a");
            for (var i = 0; i < items.length; i++)
                items[i].addEventListener ("click", click);

            // handle add and remove events on the input group addon button
            added = this.add.bind (this);
            removed = this.remove.bind (this);
            spans = list.getElementsByTagName ("span");
            for (var i = 0; i < spans.length; i++)
                if (spans[i].classList.contains ("input-group-addon"))
                    spans[i].addEventListener ("click", (1 == Number (spans[i].getAttribute (this.data_source))) ? added : removed);
        }

        return (
            {
                Chooser: Chooser
            }
        );
    }
)
