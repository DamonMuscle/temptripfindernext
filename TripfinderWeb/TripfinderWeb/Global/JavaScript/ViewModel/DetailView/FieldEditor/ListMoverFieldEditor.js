(function()
{
	createNamespace("TF.DetailView.FieldEditor").ListMoverFieldEditor = ListMoverFieldEditor;

	function ListMoverFieldEditor(type)
	{
		var self = this;

		self.onCloseListMover = new TF.Events.Event();
		TF.DetailView.FieldEditor.NonInputFieldEditor.call(self, type);
		self._currentSelectedItems = null;
	};

	ListMoverFieldEditor.prototype = Object.create(TF.DetailView.FieldEditor.NonInputFieldEditor.prototype);

	ListMoverFieldEditor.prototype.constructor = ListMoverFieldEditor;

	ListMoverFieldEditor.prototype._initElement = function(options)
	{
		this._$element = $("<div class='list-mover-editor' tabindex=0></div>");
		this._$element.css({
			"position": "absolute",
			"height": "1px",
			"width": "1px",
			"outline": "none"
		});
		this._$parent.append(this._$element);
		this._$element.focus();

		TF.DetailView.FieldEditor.NonInputFieldEditor.prototype._initElement.call(this, options);
	};

	ListMoverFieldEditor.prototype.showModal = function()
	{
		var self = this, options = self.options,
			currentSelectedItems = self._currentSelectedItems || (options.defaultValue || []);

		options.getSource().then(function(allItems)
		{
			self.allItems = self.sortByAlphaOrder(allItems, 'text');
			options.selectedSource = _.filter(allItems, function(item)
			{
				return currentSelectedItems.includes(item.value);
			});

			options.availableSource = _.filter(allItems, function(item)
			{
				return !currentSelectedItems.includes(item.value);
			});

			options.onCloseListMover = self.onCloseListMover;

			if (options.getFixedData)
			{
				options.fixedData = options.getFixedData(options.recordEntity);
			}

			tf.modalManager.showModal(new TF.DetailView.ListMoverFieldEditorModalViewModel(options)).then(function(result)
			{
				self.result = result;
				if (result instanceof Array)
				{
					self._currentSelectedItems = result;
					self.setValue(result.join(','));
					self.apply(result, self._getRecordValue());
				}
				self._$element.focus();
			});
		});
	};

	ListMoverFieldEditor.prototype.editStart = function($parent, options)
	{
		TF.DetailView.FieldEditor.NonInputFieldEditor.prototype.editStart.call(this, $parent, options);

		this.options = options;
		if (options.showWidget)
		{
			this.showModal();
		}
	}

	ListMoverFieldEditor.prototype.bindEvents = function()
	{
		var self = this;
		$(document).on("click" + self._eventNamespace, function(e)
		{
			if ($(e.target).closest(".tfmodal").length === 0)
			{
				self.editStop();
			}
		});

		self._$parent.on("click" + self._eventNamespace, function(e)
		{
			self.showModal();
			e.stopPropagation();
		});

		self._$element.on("keydown" + self._eventNamespace, function(e)
		{
			var keyCode = e.keyCode || e.which, handled = true;
			switch (keyCode)
			{
				case $.ui.keyCode.ESCAPE:
					self.cancel();
					break;
				case $.ui.keyCode.ENTER:
					self.showModal();
					break;
				default:
					handled = false;
					break;
			}

			if (handled)
			{
				e.stopPropagation();
				e.preventDefault();
			}
		});

		TF.DetailView.FieldEditor.NonInputFieldEditor.prototype.bindEvents.call(self);
	}

	ListMoverFieldEditor.prototype._updateParentContent = function()
	{
		var self = this, result = self.result;

		if (result instanceof Array)
		{
			var content = "None";

			if (result.length > 0)
			{
				content = self._getRecordValue();
			}
			self._$parent.find(".item-content").text(content);

			//remove default error message which added when create new 
			self.getContainerElement().find("small.help-block").remove();
		}
	};

	ListMoverFieldEditor.prototype.dispose = function()
	{
		$(document).off(this._eventNamespace);
		this._$parent.off(this._eventNamespace);
		TF.DetailView.FieldEditor.NonInputFieldEditor.prototype.dispose.call(this);
	};

	ListMoverFieldEditor.prototype._getRecordValue = function()
	{
		var self = this,
			allItems = self.allItems,
			result = self.result,
			content = _.filter(allItems, function(item)
			{
				return result.includes(item.value);
			}).map(function(item)
			{
				return item.text;
			}).join(", ");

		return content;
	}

	ListMoverFieldEditor.prototype._getAppliedResult = function(data, value, text)
	{
		var self = this,
			recordValue = self._getRecordValue(),
			result = TF.DetailView.FieldEditor.NonInputFieldEditor.prototype._getAppliedResult.call(self, data, value, text);

		$.extend(result, {
			selectPickListOptionIDs: value,
			recordValue: recordValue,
		});

		return result;
	};
})();