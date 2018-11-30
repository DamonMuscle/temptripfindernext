ko.bindingHandlers.htmlWithBinding = {
	'init': function()
	{
		return { 'controlsDescendantBindings': true };
	},
	'update': function(element, valueAccessor, allBindings, viewModel, bindingContext)
	{
		element.innerHTML = valueAccessor();
		ko.applyBindingsToDescendants(bindingContext, element);
	}
};