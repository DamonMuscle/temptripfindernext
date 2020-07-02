(function()
{
	var namespace = window.createNamespace("TF.Input");
	namespace.ListMoverBox = ListMoverBox;

	//this is only used by grid for asthetic reason. no boolean uses <input type="text">
	function ListMoverBox(initialValue, attributes, disable)
	{
		this.dataList = attributes.dataList;
		this.title = attributes.title;
		this.obDataList = ko.observable();
		this.obTitle = ko.observable();
		this.obSelectedData = ko.observable();
		this.originDataList = [];
		this.initialValue = !initialValue ? '' : initialValue;
		if (typeof (attributes.afterRender) === "function")
		{
			this.afterRenderCallback = attributes.afterRender;
		}

		namespace.StringBox.call(this, initialValue, attributes, disable);
	}

	ListMoverBox.prototype = Object.create(namespace.StringBox.prototype);

	ListMoverBox.constructor = ListMoverBox;

	ListMoverBox.prototype.type = "ListMover";

	ListMoverBox.prototype.initialize = function()
	{
		var self = this;

		var content = '<div class="input-group">';
		content += '<div data-bind="typeahead:{source:obDataList,format:function(obj){return obj.text},drowDownShow:true,notSort:true,selectedValue:obSelectedData},disabled:disable">'
		content += '<input type="text" class="form-control" name=' + this.type + ' data-tf-input-type=' + this.type + ' data-bind="value:obRawValue,disable:disable,style:{cursor:disable()?\'\':\'pointer\',backgroundColor:disable()?\'\':\'#fff\'}" readonly />';
		content += '</div>';
		content += '<div class="input-group-btn">';
		content += '<button type="button" class="btn btn-default btn-sharp" data-bind="disabled:disable">';
		content += '<span class="glyphicon glyphicon-option-horizontal"></span>';
		content += '</button>';
		content += '</div>';
		content += '</div>';

		self.$element = $(content);

		self.$element.find("button").on("click", function(e)
		{
			if (!self.disable())
			{
				var availableSource = self.$element.data("availableSource"), selectedSource = self.$element.data("selectedSource"), options = {
					title: self.obTitle(),
					availableSource: availableSource ? availableSource : self.obDataList(),
					selectedSource: selectedSource ? selectedSource : [],
				};
				tf.modalManager.showModal(new TF.DetailView.ListMoverFieldEditorModalViewModel(options)).then(function(result)
				{
					if (result instanceof Array)
					{
						// self.obRawValue(result.toString());
						self.updateDataSource(result);
					}
					self.$element.focus();
				});
			}
		}.bind(this));

		// Prepare initial value for 'availableSource and 'selectedSource'
		var selectedKeyMap = {}, initialAvailableItems = [], initialSelectedItems = [];
		self.initialValue.split(',').forEach(function(k)
		{
			k = k.trim();
			if (!!k)
			{
				selectedKeyMap[k] = k;
			}
		});

		(Array.isArray(self.dataList) ? self.dataList : []).forEach(function(item)
		{
			if (item.text in selectedKeyMap)
			{
				initialSelectedItems.push(item);
			}
			else
			{
				initialAvailableItems.push(item);
			}
		});
		self.$element.data("availableSource", initialAvailableItems);
		self.$element.data("selectedSource", initialSelectedItems);
	};

	ListMoverBox.prototype.updateDataSource = function(results)
	{
		var self = this, selectedSource = [], originSource = $.extend([], this.originDataList), availableSource = $.extend([], this.originDataList), deleteCount = 0;
		originSource.forEach(function(item, index)
		{
			results.forEach(function(result)
			{
				if (item.value == result)
				{
					selectedSource.push(item);
					availableSource.splice(index - deleteCount, 1);
					deleteCount++;
				}
			});
		});
		self.obRawValue(selectedSource.map(function(res) { return res.text; }).join(", "));
		self.$element.data("availableSource", availableSource);
		self.$element.data("selectedSource", selectedSource);
	}

	ListMoverBox.prototype.afterRender = function()
	{
		this.originDataList = $.extend([], this.dataList);
		this.obDataList(this.dataList);
		this.obTitle(this.title);
		ko.applyBindings(this, this.$element[0]);

		if (typeof (this.afterRenderCallback) === "function")
		{
			this.afterRenderCallback();
		}
	}
})();