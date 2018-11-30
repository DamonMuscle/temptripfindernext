(function()
{
	createNamespace("TF.DetailView").EditDataBlockAppearance = EditDataBlockAppearance;

	function EditDataBlockAppearance(options)
	{
		var self = this;
		$(document).off(".remove-overlay");
		$(document).off(".edit-data-block-appearance");

		$(document).on("click.remove-overlay", '.grid-stack-item.beyond-overlay .grid-stack-item-content', function(e)
		{
			e.preventDefault();
			e.stopPropagation();
		});
		$(document).on("click.remove-overlay", '.detial-view-background', self.closeDataBlockEditMode.bind(self));
		$(document).on('detail-view-panel-resize.edit-data-block-appearance', '.detail-view-panel', function()
		{
			this.adjustPosition();
		}.bind(self));
		self.target = options.target;
		self.changeDataPointEvent = options.changeDataPointEvent;
		self.toggleResizableEvent = options.toggleResizableEvent;
		self.defaultTitle = options.defaultTitle;
		self.customizedTitle = options.customizedTitle;

		self.originalBackgroundColor = options.appearance.backgroundColor;
		self.originalBorderColor = options.appearance.borderColor;
		self.originalTitleColor = options.appearance.titleColor;
		self.originalContentColor = options.appearance.contentColor;
		self.backgroundColor = ko.observable(self.originalBackgroundColor);
		self.borderColor = ko.observable(self.originalBorderColor);
		self.titleColor = ko.observable(self.originalTitleColor);
		self.contentColor = ko.observable(self.originalContentColor);

		self.modifiedList = {};
		self.shortCutKeyHashMapKeyName = Math.random().toString(36).substring(7);
	}

	EditDataBlockAppearance.prototype.init = function()
	{
		var self = this;
		if (self.borderColor() == "transparent")
		{
			$('.data-block-appearance-menu li.border').addClass('no-border');
		}
		$(self.target).parent().draggable({
			disabled: true
		});
		self.adjustPosition();
		self.initColorPicker();
		self.initHotKey();
		self.toggleResizableEvent.notify(false);
		self.backgroundColor.subscribe(function(newColor)
		{
			$(self.target).css({ 'background-color': newColor });
		});
		self.borderColor.subscribe(function(newColor)
		{
			$(self.target).css({ 'border-color': newColor });
		});
		self.titleColor.subscribe(function(newColor)
		{
			$(self.target).find('.item-title').css({ 'color': newColor });
		});
		self.contentColor.subscribe(function(newColor)
		{
			$(self.target).find('.item-content').css({ 'color': newColor });
		});
	}

	EditDataBlockAppearance.prototype.initHotKey = function()
	{
		var self = this;
		tf.shortCutKeys.bind("enter", function()
		{
			self.saveChanges();
		}, self.shortCutKeyHashMapKeyName);

		tf.shortCutKeys.bind("esc", function()
		{
			self.closeDataBlockEditMode();
		}, self.shortCutKeyHashMapKeyName);
	}

	EditDataBlockAppearance.prototype.closeDataBlockEditMode = function(e, fromSave)
	{
		var self = this;
		tf.shortCutKeys.unbind("enter", self.shortCutKeyHashMapKeyName);
		tf.shortCutKeys.unbind("esc", self.shortCutKeyHashMapKeyName);
		$('.grid-stack-item').removeClass('beyond-overlay');
		$('.detial-view-overlay').remove();
		self.toggleResizableEvent.notify(true);
		$(self.target).parent().draggable({
			disabled: false
		});
		if (!fromSave)
		{
			$(self.target).find('.item-title').val(self.customizedTitle || self.defaultTitle);
			$(self.target).css({ 'background-color': self.originalBackgroundColor, 'border-color': self.originalBorderColor })
				.find('.item-title').css({ 'color': self.originalTitleColor })
				.siblings(".item-content").css({ 'color': self.originalContentColor });
		}
	}

	EditDataBlockAppearance.prototype.adjustPosition = function()
	{
		var self = this, left, menuWidth = 153,
			position = $(self.target).parent().offset(),
			$menu = $('.data-block-appearance-menu');
		if (window.innerWidth - position.left - $(self.target).parent().width() < menuWidth)
		{
			$menu.find('.caret').removeClass('left').addClass('right');
			left = position.left - menuWidth;
		}
		else
		{
			$menu.find('.caret').removeClass('right').addClass('left');
			left = position.left + $(self.target).parent().width() + 11;
		}

		$menu.css({
			top: position.top + $(self.target).parent().height() / 2 - 66 - 11,
			left: left
		});
	}

	EditDataBlockAppearance.prototype.saveChanges = function()
	{
		var self = this,
			data = {
				target: self.target,
				modifiedType: 'Appearance',
				appearance: self.modifiedList,
				customizedTitle: $(self.target).find('.item-title').val()
			};
		self.changeDataPointEvent.notify(data);
		self.closeDataBlockEditMode(null, true);
	}

	EditDataBlockAppearance.prototype.initColorPicker = function()
	{
		var self = this;
		$("[name='color']").each(function()
		{
			var attributeName = $(this).attr('data-type'),
				treatWhiteAsTransparent = "borderColor" === attributeName,
				options = {
					buttons: false,
					treatWhiteAsTransparent: treatWhiteAsTransparent,
					value: treatWhiteAsTransparent && self[attributeName]() == "transparent" ? "#fffffe" : self[attributeName](),
					change: function(e)
					{
						var value = e.sender.element[0].value;
						if (attributeName === "borderColor" && value === "#fffffe")
						{
							value = "transparent";
						}
						self[attributeName](value);
						self.modifiedList[attributeName] = value;
					}
				};

			if (treatWhiteAsTransparent)
			{
				options.open = function(e)
				{
					$('.k-selected-color-display input').removeClass('display-error');
				}
			}
			$(this).kendoColorPicker(options);
		});
	}

	EditDataBlockAppearance.prototype.dispose = function()
	{
	}
})();