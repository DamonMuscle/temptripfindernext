(function()
{
	createNamespace("TF.DetailView.DataBlockComponent").HorizontalLine = HorizontalLine;

	function HorizontalLine()
	{
		TF.DetailView.DataBlockComponent.BaseDataBlock.call(this);
	}
	HorizontalLine.prototype = Object.create(TF.DetailView.DataBlockComponent.BaseDataBlock.prototype);
})();