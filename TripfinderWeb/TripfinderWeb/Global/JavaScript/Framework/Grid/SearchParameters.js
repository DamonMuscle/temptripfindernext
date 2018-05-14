(function()
{
	createNamespace("TF").SearchParameters = SearchParameters;

	function SearchParameters(skip, take, sortItems, filterSet, filterClause, includeIds, excludeIds, callOutFilterName)
	{
		this.paramData = {};
		this.data = {};


		if (skip)
		{
			this.paramData.skip = skip;
		}
		if (take)
		{
			this.paramData.take = take;
		}
		if (sortItems)
		{
			this.data.sortItems = sortItems;
		}
		if (filterSet)
		{
			this.data.filterSet = filterSet;
		}
		if (filterClause)
		{
			this.data.filterClause = filterClause;
		}
		if (includeIds || excludeIds)
		{
			this.data.idFilter = {
				IncludeOnly: includeIds,
				ExcludeAny: excludeIds
			}
		}
		if (callOutFilterName)
		{
			this.data.callOutFilterName = callOutFilterName;
		}
	}
})();
