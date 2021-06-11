(function()
{
	createNamespace("TF.DetailView.DataBlockComponent").BaseDataBlock = BaseDataBlock;

	function BaseDataBlock(detailView)
	{
		this.detailView = detailView;
		this.isBlockReadOnly = ko.observable(false);
	}

	BaseDataBlock.prototype.isReadOnly = function()
	{
		if (this.isBlockReadOnly())
		{
			return true;
		}
		if (this.detailView == null)
		{
			return true;
		}
		return this.detailView.obIsReadOnly();
	}

	BaseDataBlock.prototype.isReadMode = function()
	{
		if (this.detailView == null)
		{
			return true;
		}
		return this.detailView.isReadMode();
	}

})();