(function()
{
	var namespace = window.createNamespace("TF.Input");
	namespace.DataListBox = DataListBox;

	//this is only used by grid for asthetic reason. no boolean uses <input type="text">
	function DataListBox(initialValue, attributes, disable, events)
	{
		this.dataList = attributes.dataList;
		this.inputEnable = attributes && attributes.inputEnable == false ? false : true;
		this.obDataList = ko.observable();
		this.obSelectedData = ko.observable();
		this.obSelectedData.subscribe(value =>
		{
			if (!this.events) return;
			if (!this.events.selectedDataChanged) return;

			this.events.selectedDataChanged.notify(value);
		});

		namespace.StringBox.call(this, initialValue, attributes, disable, null, null, events);
	};

	DataListBox.prototype = Object.create(namespace.StringBox.prototype);

	DataListBox.constructor = DataListBox;

	DataListBox.prototype.type = "DataList";

	DataListBox.prototype.initialize = function()
	{
		var content = '<div class="input-group">';
		content += '<div data-bind="typeahead:{source:obDataList,format:function(obj){return obj.text},drowDownShow:true,notSort:true,selectedValue:obSelectedData},disabled:disable">'
		content += '<input type="text" class="form-control" maxlength=' + this.maxlength + ' name=' + this.type + ' data-tf-input-type=' + this.type + ' autocomplete="new-password" data-bind="value:obRawValue,disable:disable,style:{cursor:disable()?\'\':\'pointer\',backgroundColor:disable()?\'\':\'#fff\'}" ' + (this.inputEnable ? "" : "readonly") + ' />';
		content += '</div>';
		content += '<div class="input-group-btn">';
		content += '<button type="button" class="btn btn-default btn-sharp" data-bind="disabled:disable">';
		content += '<span class="caret"></span>';
		content += '</button>';
		content += '</div>';
		content += '</div>';

		this.$element = $(content);

		this.$element.find("input").on("click", function(e)
		{
			if (!this.disable() && !this.inputEnable)
				$(e.currentTarget.parentElement).closest('.input-group').find('.caret:eq(0)').parent().click();
		}.bind(this));
	};


	DataListBox.prototype.afterRender = function()
	{
		this.obDataList(this.dataList);
		ko.applyBindings(this, this.$element[0]);
		var input = this.$element.find("input");

		if (this.editable)
		{
			input.css("cursor", "text");
			input.prop("readonly", false);
		}
		if (this.isInt)
		{
			input.on("keypress keyup blur", function(event)
			{
				var key = event.which || event.keyCode || 0;
				if ((key < 48 || key > 57) && (key !== 45 || ($(this).val().indexOf('-') !== -1 ? this.selectionStart > 0 || this.selectionEnd === 0 : false) || this.selectionStart > 0) && TF.Input.BaseBox.notSpecialKey(event))
				{
					event.preventDefault();
					event.stopPropagation();
				}
			});
		}
	}

})();