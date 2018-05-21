(function()
{
	createNamespace("TF.Grid").SortItem = SortItem;

	function SortItem(name, isAscending)
	{
		this.Name = name;
		this.Direction = isAscending ? 'Ascending' : 'Descending';
	}

	SortItem.prototype.isAscending = function()
	{
		return this.Direction == 'Ascending';
	}
})();