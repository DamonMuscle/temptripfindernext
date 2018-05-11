(function()
{
	var namespace = window.createNamespace("TF.Input");
	namespace.SelectBox = SelectBox;

	function SelectBox(initialValue, attributes, disable, events)
	{
		namespace.StringBox.call(this, initialValue, attributes, disable, undefined, undefined, events);
	};

	SelectBox.prototype = Object.create(namespace.StringBox.prototype);

	SelectBox.constructor = SelectBox;

	SelectBox.prototype.type = "Select";

	SelectBox.prototype.initialize = function()
	{
		var self = this, events = "";
		self.eventObject = {};
		for (var i in self.events)
		{
			self.eventObject[i] = self.events[i];
			events += i + ":eventObject." + i + ",";
		}
		var $input = $('<input type="text" class="form-control" name=' + self.type + ' data-tf-input-type=' + self.type + ' data-bind="value:obRawValue,disable:disable,style:{cursor:disable()?\'\':\'pointer\',backgroundColor:disable()?\'\':\'#fff\'},event:{' + events + '}" readonly />');
		self.$input = $input;
		var $element = $input;
		self.applyAttribute($element, self.attributes);
		ko.applyBindings(self, $element[0]);
		self.$element = $element;

		//dropdown-list
		self.$element.addClass("dropdown-list");

		self.$element.on("click", function(e)
		{
			if (!self.disable())
				$(e.currentTarget.parentElement).closest('.input-group').find('.caret:eq(0)').parent().click();
		});
	};

	SelectBox.prototype.dispose = function()
	{
		var self = this;
		self.$element.off("click");
		namespace.StringBox.prototype.dispose.call(self);
	};
})();