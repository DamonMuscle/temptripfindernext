(function()
{
	createNamespace("TF.DetailView.DataBlockComponent").BaseDataBlock = BaseDataBlock;

	function BaseDataBlock(detailView)
	{
		this.detailView = detailView;
	}

	BaseDataBlock.prototype.isReadOnly = function()
	{
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