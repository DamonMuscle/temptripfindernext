ko.bindingHandlers.slideVisible = {
    init: function (element, valueAccessor, allBindingsAccessor, viewModel, bindingContext) {
        var value = ko.utils.unwrapObservable(valueAccessor()); // Get the current value of the current property we're bound to
        $(element).toggle(value); // jQuery will hide/show the element depending on whether "value" or true or false
    },
    update: function (element, valueAccessor, allBindingsAccessor, viewModel, bindingContext) {
        // console.log("slideVisible,update");
        // First get the latest data that we're bound to
        // var valueUnwrapped=ko.utils.unwrapObservable(valueAccessor());

        var value = ko.utils.unwrapObservable(valueAccessor()), allBindings = allBindingsAccessor();

        // Next, whether or not the supplied model property is observable, get its current value
        // var valueUnwrapped = ko.unwrap(value);

        // Grab some more data from another binding property
        var duration = allBindings.slideDuration || 300; // 400ms is default duration unless otherwise specified

        // Now manipulate the DOM element
        if (value == true)
            $(element).slideDown(duration); // Make the element visible
        else
            $(element).slideUp(duration);   // Make the element invisible
    }
};