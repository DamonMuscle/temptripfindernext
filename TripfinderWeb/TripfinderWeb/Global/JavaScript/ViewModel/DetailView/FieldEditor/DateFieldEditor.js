(function()
{
	createNamespace("TF.DetailView.FieldEditor").DateFieldEditor = DateFieldEditor;

	function DateFieldEditor(type)
	{
		var self = this;
		TF.DetailView.FieldEditor.DateTimeFieldEditor.call(self, type);
		self._eventNamespaceDateKey = self._eventNamespace + "date";
	};

	DateFieldEditor.prototype = Object.create(TF.DetailView.FieldEditor.DateTimeFieldEditor.prototype);

	DateFieldEditor.prototype.constructor = DateFieldEditor;

	DateFieldEditor.prototype.validator = {};

	DateFieldEditor.prototype.type = "Date";

	DateFieldEditor.prototype.format = "MM/DD/YYYY";

	DateFieldEditor.prototype.getContentValue = function(value)
	{
		return this.momentHelper.toString(value || null, 'MM/DD/YYYY');
	};

	DateFieldEditor.prototype.getFormatedValue = function(value)
	{
		return moment(value).format("YYYY-MM-DDT00:00:00");
	};

	DateFieldEditor.prototype._bindEvents = function()
	{
		var self = this;
		TF.DetailView.FieldEditor.DateTimeFieldEditor.prototype._bindEvents.call(this);
		var dateTimePicker = this.getPicker();
		const focusClass = "k-state-selected k-state-focused";
		dateTimePicker.bind("open", function(e)
		{
			self._$element.find("input").off("keydown").on("keydown" + self._eventNamespaceDateKey, function(e)
			{
				var keyCode = e.keyCode || e.which;
				if (![$.ui.keyCode.UP, $.ui.keyCode.DOWN, $.ui.keyCode.LEFT, $.ui.keyCode.RIGHT, $.ui.keyCode.ENTER].includes(keyCode))
				{
					// run default shortcut key
					var picker = self.getPicker();
					picker._keydown(e);
					return;
				}

				var widget = self._getWidget(self._$parent.find(".editor-icon")),
					current = widget.find('.k-state-selected'),
					tdIndex = current.parent().children().index(current),
					body = current.parent().parent(),
					trIndex = body.children().index(current.parent()),
					trCount = body.children().length,
					weekDayCount = 7,
					next = null;

				if (keyCode == $.ui.keyCode.ENTER)
				{
					current.trigger("click");
					return;
				}

				e.preventDefault();
				e.stopPropagation();
				
				// find the next date by arrows keys
				if (keyCode == $.ui.keyCode.UP || keyCode == $.ui.keyCode.DOWN)
				{
					var nextTrIndex = trIndex + (keyCode == $.ui.keyCode.UP ? - 1 : 1);
					if (nextTrIndex < 0)
					{
						nextTrIndex = trCount - 1;
					}
					else if (nextTrIndex >= trCount)
					{
						nextTrIndex = 0;
					}
					next = body.children().eq(nextTrIndex).children().eq(tdIndex);
				}
				if (keyCode == $.ui.keyCode.LEFT || keyCode == $.ui.keyCode.RIGHT)
				{
					var nextTdIndex = tdIndex + (keyCode == $.ui.keyCode.LEFT ? - 1 : 1);
					if (nextTdIndex < 0)
					{
						nextTdIndex = weekDayCount - 1;
					}
					else if (nextTdIndex >= weekDayCount)
					{
						nextTdIndex = 0;
					}
					next = current.parent().children().eq(nextTdIndex);
				}
				next = [next, widget.find(".k-state-focused"), widget.find("td[role='gridcell']:eq(0)")].find(x => x && x.length > 0);
				if (next)
				{
					current.removeClass(focusClass);
					next.addClass(focusClass);
				}
			});
		});

		dateTimePicker.bind("close", function()
		{
			self._$element.find("input").off("keydown" + self._eventNamespaceDateKey);
			self._getWidget(self._$parent.find(".editor-icon")).find(".k-state-selected").removeClass(focusClass);
		})
	};

	DateFieldEditor.prototype._unbindEvents = function()
	{
		this._$element.find("input").off("keydown" + this._eventNamespaceDateKey);
		TF.DetailView.FieldEditor.DateTimeFieldEditor.prototype._unbindEvents.call(this);
	}
})();