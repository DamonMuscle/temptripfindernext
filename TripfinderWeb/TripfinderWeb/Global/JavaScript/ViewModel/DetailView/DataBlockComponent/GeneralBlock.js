(function()
{
	createNamespace("TF.DetailView.DataBlockComponent").GeneralBlock = GeneralBlock;

	function GeneralBlock(content, options, dataBlockStyles, isCreateGridNewRecord)
	{
		var self = this;

		TF.DetailView.DataBlockComponent.BaseDataBlock.call(self);

		var detailViewHelper = tf.helpers.detailViewHelper,
			editable = !!options.editType
				&& (isCreateGridNewRecord || !options.editType.forCreateOnly)
				&& (typeof options.editType.allowEdit !== "function" || options.editType.allowEdit()),
			uniqueClassName = options.uniqueClassName || detailViewHelper.generateUniqueClassName(),
			title = (options.customizedTitle || options.title),
			$itemContent = detailViewHelper.getItemContent(content, dataBlockStyles),
			$wrapper = $("<div class='grid-stack-item-content general-stack-item' data-block-field-name='" + options.field + "'>\
							<input class='item-title' type='text' style='color:" + dataBlockStyles.titleColor + "' value='" + title + "' />\
							<div class='item-title' style='color:" + dataBlockStyles.titleColor + "'>" + title + (options.badgevalue ? "<span class='badge-right'>" + options.badgevalue + "</span>" : "") + "</div>\
						</div>").css({
				backgroundColor: dataBlockStyles.backgroundColor,
				borderColor: dataBlockStyles.borderColor
			});

		self.$el = $("<div></div>", { class: uniqueClassName });
		self.uniqueClassName = uniqueClassName;

		if (editable)
		{
			$wrapper.addClass('editable');
		}

		if (options.type === "String")
		{
			$wrapper.addClass("text-content")
		}

		$wrapper.append($itemContent);
		self.$el.append($wrapper);
		self.options = options;
	}
	GeneralBlock.prototype = Object.create(TF.DetailView.DataBlockComponent.BaseDataBlock.prototype);
})();