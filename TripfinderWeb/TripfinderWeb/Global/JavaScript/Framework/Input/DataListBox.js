(function()
{
	var namespace = window.createNamespace("TF.Input");
	namespace.DataListBox = DataListBox;

	//this is only used by grid for asthetic reason. no boolean uses <input type="text">
	function DataListBox(initialValue, attributes, disable)
	{
		this.dataList = attributes.dataList;
		this.obDataList = ko.observable();
		this.obSelectedData = ko.observable();

		namespace.StringBox.call(this, initialValue, attributes, disable);
	};

	DataListBox.prototype = Object.create(namespace.StringBox.prototype);

	DataListBox.constructor = DataListBox;

	DataListBox.prototype.type = "DataList";

	DataListBox.prototype.initialize = function()
	{
		var content = '<div class="input-group">';
		content += '<div data-bind="typeahead:{source:obDataList,format:function(obj){return obj.text},drowDownShow:true,notSort:true,selectedValue:obSelectedData},disabled:disable">'
		content += '<input type="text" class="form-control" name=' + this.type + ' data-tf-input-type=' + this.type + ' data-bind="value:obRawValue,disable:disable,style:{cursor:disable()?\'\':\'pointer\',backgroundColor:disable()?\'\':\'#fff\'}" readonly />';
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
			if (!this.disable())
				$(e.currentTarget.parentElement).closest('.input-group').find('.caret:eq(0)').parent().click();
		}.bind(this));
	};


	DataListBox.prototype.afterRender = function()
	{
		this.obDataList(this.dataList);
		ko.applyBindings(this, this.$element[0]);
	}

})();