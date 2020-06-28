(function()
{
	createNamespace("TF.DetailView.DataBlockComponent").SpacerBlock = SpacerBlock;

	function SpacerBlock(options)
	{
		var self = this,
			detailViewHelper = tf.helpers.detailViewHelper;

		TF.DetailView.DataBlockComponent.BaseDataBlock.call(self);

		self.uniqueClassName = options.uniqueClassName || detailViewHelper.generateUniqueClassName();
		self.options = options;
		self.$el = $("<div class='general-stack-item space-stack-item'>\
						<div class='grid-stack-item-content'></div>\
					</div>").addClass(self.uniqueClassName);
	}

	SpacerBlock.prototype = Object.create(TF.DetailView.DataBlockComponent.BaseDataBlock.prototype);
})();