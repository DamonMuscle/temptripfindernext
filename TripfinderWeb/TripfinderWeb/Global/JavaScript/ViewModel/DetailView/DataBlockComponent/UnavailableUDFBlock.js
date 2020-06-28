(function()
{
	createNamespace("TF.DetailView.DataBlockComponent").UnavailableUDFBlock = UnavailableUDFBlock;

	function UnavailableUDFBlock(options)
	{
		var self = this,
			detailViewHelper = tf.helpers.detailViewHelper;

		TF.DetailView.DataBlockComponent.BaseDataBlock.call(self);

		self.uniqueClassName = options.uniqueClassName || detailViewHelper.generateUniqueClassName();
		self.$el = $("<div class='general-stack-item space-stack-item'>\
						<div class='grid-stack-item-content unavailable-udf-stack-item'>\
							<div class='item-content'>Unavailable</div>\
						</div>\
					</div>").addClass(self.uniqueClassName);

		self.options = options;
	}

	UnavailableUDFBlock.prototype = Object.create(TF.DetailView.DataBlockComponent.BaseDataBlock.prototype);
})();