(function()
{
	createNamespace("TF.DetailView.DataBlockComponent").BooleanBlock = BooleanBlock;

	function BooleanBlock(content, options, detailView)
	{
		var self = this,
			detailViewHelper = tf.helpers.detailViewHelper;

		TF.DetailView.DataBlockComponent.BaseDataBlock.call(self, detailView);

		if (["True", "False"].includes(content))
		{
			content = content === "True";
		}

		var valueNotSpecified = typeof content !== "boolean",
			displayLable = valueNotSpecified ?
				(options.field + "<span class='not-specified'>(Not Specified)</span>") :
				(content ? options.positiveLabel : options.negativeLabel),
			className = (self.isReadMode() ? content : ["active", "yes", "true"].indexOf((options.defaultValue || "").toString().toLowerCase()) > -1)
				? "true-item" : "false-item",
			uniqueClassName = options.uniqueClassName || detailViewHelper.generateUniqueClassName(),
			$gridStackItem = $(String.format("<div class='grid-stack-item-content boolean-stack-item {0}' data-block-field-name='{1}'>\
									<div class='item-content {2}'>{3}</div>\
								</div>", className, options.field, (valueNotSpecified && "not-specified"), displayLable)),
			$el = $("<div />", { class: uniqueClassName }),
			editable = options.editType != null;
		if (editable)
		{
			$gridStackItem.addClass('editable');
		}
		$el.append($gridStackItem);

		self.$el = $el;
		self.uniqueClassName = uniqueClassName;
		self.options = options;
	}
	BooleanBlock.prototype = Object.create(TF.DetailView.DataBlockComponent.BaseDataBlock.prototype);
})();