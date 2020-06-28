(function()
{
	createNamespace("TF.DetailView.DataBlockComponent").SectionHeaderBlock = SectionHeaderBlock;

	function SectionHeaderBlock(options, detailView, currentWidth, toggleSectionHeaderEvent)
	{
		var self = this;

		TF.DetailView.DataBlockComponent.BaseDataBlock.call(self, detailView);

		var detailViewHelper = tf.helpers.detailViewHelper,
			title = options.title || detailViewHelper.defaultSectionHeaderTitle,
			uniqueClassName = options.uniqueClassName || detailViewHelper.generateUniqueClassName(),
			$el = $("<div class=\"section-header-stack-item\">\
							<div class=\"grid-stack-item-content\">\
                                <input class=\"item-title\" type=\"text\" value=\"" + title + "\" " + (self.isReadMode() ? "disabled" : "") + " />\
								<div class=\"item-title-ruler\">" + title + "</div>\
								<div class=\"item-toggle\">\
									<button type=\"button\" class=\"btn btn-default\">\
										<span class=\"caret "+ (options.isCollapsed ? "up" : "") + "\"></span>\
									</button >\
								</div>\
							</div>\
						</div>").addClass(uniqueClassName);

		self.$el = $el;
		self.options = $.extend({}, detailView.options, options, { x: 0, y: options.y, h: 1, w: currentWidth });
		self.uniqueClassName = uniqueClassName;
		self.toggleSectionHeaderEvent = toggleSectionHeaderEvent;
	}

	SectionHeaderBlock.prototype = Object.create(TF.DetailView.DataBlockComponent.BaseDataBlock.prototype);

	SectionHeaderBlock.prototype.initEvents = function()
	{
		var self = this,
			detailViewHelper = tf.helpers.detailViewHelper;

		self.$el.find("input.item-title").on("blur", self.onBlur);

		self.$el.on("click", function(e)
		{
			let $target = $(e.target);
			if ($target.is(":input") && $target.hasClass("item-title") && !self.isReadMode())
			{
				return;
			}

			self.onBlur(e);
			// self.$el.find("input.item-title").trigger("blur");

			let $currentTarget = $(e.currentTarget),
				sectionHeader = $currentTarget.closest(".grid-stack-item"),
				options = {
					sectionHeader: {
						className: detailViewHelper.getDomUniqueClassName(sectionHeader),
						isCollapsed: $currentTarget.find(".up").length == 0
					}
				}

			if (self.options && self.options.mapToolOptions)
			{
				options = $.extend({ mapToolOptions: self.options.mapToolOptions }, options);
			}

			self.toggleSectionHeaderEvent.notify(options);
		});
	};

	SectionHeaderBlock.prototype.onBlur = function(e)
	{
		var $sectionHeader = $(e.currentTarget).closest(".section-header-stack-item");
		tf.helpers.detailViewHelper.updateSectionHeaderTextInputWidth($sectionHeader);
		$sectionHeader.data({ title: $(e.currentTarget).val() });
	};

	SectionHeaderBlock.prototype.dispose = function()
	{
		this.$el.off("click");
		this.$el.find("input.item-title").off("blur");
	};
})();