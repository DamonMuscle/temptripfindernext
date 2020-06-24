(function()
{
	createNamespace("TF.DetailView.DataBlockComponent").VerticalLine = VerticalLine;

	function VerticalLine()
	{
		TF.DetailView.DataBlockComponent.BaseDataBlock.call(this);
	}
	VerticalLine.prototype = Object.create(TF.DetailView.DataBlockComponent.BaseDataBlock.prototype);
})();