(function()
{
	createNamespace("TF.DetailView.FieldEditor").GroupDropDownFieldEditor = GroupDropDownFieldEditor;

	function GroupDropDownFieldEditor(type)
	{
		TF.DetailView.FieldEditor.DropDownFieldEditor.call(this, type);
	};

	GroupDropDownFieldEditor.prototype = Object.create(TF.DetailView.FieldEditor.DropDownFieldEditor.prototype);

	GroupDropDownFieldEditor.prototype.constructor = GroupDropDownFieldEditor;

	/**
	 * Update drop down menu position and size.
	 *
	 */
	GroupDropDownFieldEditor.prototype._updateDropDownPosition = function()
	{
		var self = this,
			$menu = self._contextMenu.$menuContainer,
			$content = self.getContentElement(),
			screenHeight = $(window).height(),
			containerWidth = Math.ceil(self._$parent.outerWidth());

		$menu.css("width", containerWidth);
		if ($content.length > 0)
		{
			$menu.css("left", self._$parent.offset().left - $content.offset().left + 1);
		}

		var bottomAvailableSpace = screenHeight - $content.offset().top - self._contextMenu.handleHeight,
			topAvailableSpace = $content.offset().top, menuHeight = $menu.outerHeight();

		if (menuHeight < bottomAvailableSpace)
		{
			$menu.css("top", self._contextMenu.handleHeight);
		}
		else if (menuHeight < topAvailableSpace)
		{
			$menu.css("top", -$menu.outerHeight());
		}
		else
		{
			if (topAvailableSpace > bottomAvailableSpace)
			{
				$menu.find("ul").css("max-height", topAvailableSpace - 20);
				$menu.css("top", -$menu.outerHeight());
			}
			else
			{
				$menu.find("ul").css("max-height", bottomAvailableSpace - 20);
				$menu.css("top", self._contextMenu.handleHeight);
			}
		}
	};

	GroupDropDownFieldEditor.prototype.getContainerElement = function()
	{
		return this._$parent;
	};

	GroupDropDownFieldEditor.prototype.getContentElement = function()
	{
		return this._$parent.find("div.editable-field-value");
	};

	GroupDropDownFieldEditor.prototype.editStart = function($parent, options)
	{
		var self = this;

		TF.DetailView.FieldEditor.DropDownFieldEditor.prototype.editStart.call(self, $parent, options);

		var $stackItem = self.getGridStackItemContentElement();
		$stackItem.addClass(self.innderFieldEditingCss);
	};

	GroupDropDownFieldEditor.prototype.hide = function()
	{
		var self = this;

		TF.DetailView.FieldEditor.DropDownFieldEditor.prototype.hide.call(self);

		var $stackItem = self.getGridStackItemContentElement();
		$stackItem.removeClass(self.innderFieldEditingCss);
	};
})();