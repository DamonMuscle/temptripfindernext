(function()
{
	createNamespace("TF.DetailView.FieldEditor").CalculateFieldEditor = CalculateFieldEditor;

	function CalculateFieldEditor(type)
	{
		var self = this;
		TF.DetailView.FieldEditor.TextFieldEditor.call(self, type);
	}

	CalculateFieldEditor.prototype = Object.create(TF.DetailView.FieldEditor.TextFieldEditor.prototype);
	CalculateFieldEditor.prototype.constructor = CalculateFieldEditor;

	CalculateFieldEditor.prototype._initElement = function(options)
	{
		var self = this,
			$input;
		$input = $("<div class='custom-field-input calculate'><!-- ko customInput:{type:'Decimal',value:obValue,attributes:{class:'form-control item-content', name:'number', maxlength:'" +
			(options.maxLength || 19) + "',max:'" + options.maxValue + "'}} --><!-- /ko --></div>");
		ko.applyBindings(ko.observable(self), $input[0]);
		self._$element = $input;

		$input.on("keypress keyup blur", function(event)
		{
			var keyCode = event.which || event.keyCode || 0;

			if ((keyCode != 46 || $(this).val().indexOf('.') !== -1) && (keyCode != 45 || ($(this).val().indexOf('-') !== -1 ? this.selectionStart > 0 || this.selectionEnd === 0 : false) || this.selectionStart > 0) && (keyCode < 48 || keyCode > 57) && keyCode !== 37 && keyCode !== 39 && keyCode !== 9)
			{
				event.preventDefault();
				event.stopPropagation();
			}
		});
	};

	CalculateFieldEditor.prototype.editStart = function($parent, options)
	{
		var self = this;
		TF.DetailView.FieldEditor.TextFieldEditor.prototype.editStart.call(this, $parent, options);
		self._bindEvents(options);

		if (options.showWidget)
		{
			self._$parent.find(".editor-icon").click();
		}
	};

	CalculateFieldEditor.prototype._bindEvents = function(options)
	{
		var self = this,
			$editorIcon = self._$parent.find(".editor-icon");

		$editorIcon.on("click" + self._eventNamespace, function(e)
		{
			e.preventDefault();
			e.stopPropagation();
			if ($editorIcon.hasClass("loading"))
			{
				return;
			}
			$editorIcon.addClass("loading");
			var recordEntity = $.extend({}, options.recordEntity);
			for (var key in recordEntity)
			{
				if (options.editFieldList[key])
				{
					recordEntity[key] = options.editFieldList[key].value;
				}
			}

			options.calculate(recordEntity).then(function(value)
			{
				$editorIcon.removeClass("loading");
				if (value != self.obValue())
				{
					self.obValue(value);
					self.onValueChanged();
				}
			});
		});
	};

	CalculateFieldEditor.prototype.dispose = function()
	{
		this._$parent.find(".editor-icon").unbind("click" + this._eventNamespace);
		TF.DetailView.FieldEditor.TextFieldEditor.prototype.dispose.call(this);
	};

})();